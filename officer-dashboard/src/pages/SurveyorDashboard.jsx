import React, { useEffect, useMemo, useState } from 'react'
import { claimService, policyService } from '../services/api'

function SurveyorDashboard({ onSwitchRole }) {
  const [view, setView] = useState('queue')
  const [surveyClaims, setSurveyClaims] = useState([])
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [surveyReports, setSurveyReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const [surveyForm, setSurveyForm] = useState({
    surveyor_id: 'SURVEYOR001',
    surveyor_name: 'Field Surveyor',
    damage_description: '',
    vehicle_condition: '',
    parts_damaged: '',
    estimated_repair_cost: '',
    recommendation: 'Repair'
  })

  useEffect(() => {
    loadSurveyClaims()
  }, [])

  const latestSurveyReport = useMemo(() => {
    return surveyReports[0] || selectedClaim?.latest_survey_report || null
  }, [selectedClaim, surveyReports])

  const pendingAssignment = useMemo(() => {
    return surveyReports.find(report => !report.submitted_at) || latestSurveyReport
  }, [latestSurveyReport, surveyReports])

  const queueStats = useMemo(() => {
    const overdueCount = surveyClaims.filter(claim => {
      const assignedAt = claim.latest_survey_report?.assigned_at
      if (!assignedAt) return false
      return Date.now() - new Date(assignedAt).getTime() > 48 * 60 * 60 * 1000
    }).length

    const highValueCount = surveyClaims.filter(claim => {
      const estimate = claim.latest_survey_report?.estimated_repair_cost || 0
      return estimate >= 100000
    }).length

    return {
      assigned: surveyClaims.length,
      overdue: overdueCount,
      highValue: highValueCount
    }
  }, [surveyClaims])

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const colors = {
      SURVEY_ASSIGNED: { backgroundColor: '#fff4df', color: '#8a5200' },
      SURVEY_COMPLETED: { backgroundColor: '#ddf7ea', color: '#11663c' }
    }
    return colors[status] || { backgroundColor: '#eceff3', color: '#44546a' }
  }

  const getRecommendationTone = (recommendation) => {
    switch (recommendation) {
      case 'Total Loss':
        return { backgroundColor: '#ffe3e1', color: '#b42318' }
      case 'Further Investigation':
        return { backgroundColor: '#fff3d6', color: '#b54708' }
      case 'Reject':
        return { backgroundColor: '#ffe1e7', color: '#c01048' }
      case 'Partial Claim':
        return { backgroundColor: '#dcecff', color: '#175cd3' }
      default:
        return { backgroundColor: '#ddf7ea', color: '#11663c' }
    }
  }

  const loadSurveyClaims = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await claimService.getSurveyClaims()
      setSurveyClaims(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error loading survey claims:', err)
      setError('Failed to load survey assignments')
      setSurveyClaims([])
    } finally {
      setLoading(false)
    }
  }

  const hydrateClaimContext = async (claimId, claimData = null) => {
    const claimResponse = claimData ? { data: claimData } : await claimService.getClaim(claimId)
    const reportsResponse = await claimService.getSurveyReports(claimId)

    setSelectedClaim(claimResponse.data)
    setSurveyReports(Array.isArray(reportsResponse.data) ? reportsResponse.data : [])

    if (claimResponse.data.policy_id) {
      const raw = claimResponse.data.policy_id
      const pid = Number(raw)
      if (Number.isInteger(pid)) {
        try {
          const policyResponse = await policyService.getPolicy(pid)
          setSelectedPolicy(policyResponse.data)
        } catch (e) {
          console.error('Failed to fetch policy by id', pid, e)
          setSelectedPolicy(null)
        }
      } else if (typeof raw === 'string' && raw.trim()) {
        try {
          const policyResponse = await policyService.getPolicyByNumber(raw)
          setSelectedPolicy(policyResponse.data)
        } catch (e) {
          console.error('Failed to fetch policy by policy_number fallback', raw, e)
          setSelectedPolicy(null)
        }
      } else {
        console.warn('Claim has invalid policy_id value:', raw)
        setSelectedPolicy(null)
      }
    } else {
      setSelectedPolicy(null)
    }

    const activeReport = (reportsResponse.data || []).find(report => !report.submitted_at) || claimResponse.data.latest_survey_report
    setSurveyForm(prev => ({
      ...prev,
      surveyor_id: activeReport?.surveyor_id || 'SURVEYOR001',
      surveyor_name: activeReport?.surveyor_name || 'Field Surveyor',
      damage_description: '',
      vehicle_condition: '',
      parts_damaged: '',
      estimated_repair_cost: '',
      recommendation: 'Repair'
    }))
  }

  const handleInspectClaim = async (claim) => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await hydrateClaimContext(claim.id)
      setView('inspect')
    } catch (err) {
      console.error('Error loading claim details:', err)
      setError('Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setSurveyForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitSurvey = async (e) => {
    e.preventDefault()
    if (!selectedClaim) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const payload = {
        surveyor_id: surveyForm.surveyor_id,
        surveyor_name: pendingAssignment?.surveyor_name || surveyForm.surveyor_name,
        damage_description: surveyForm.damage_description,
        vehicle_condition: surveyForm.vehicle_condition,
        parts_damaged: surveyForm.parts_damaged,
        estimated_repair_cost: parseFloat(surveyForm.estimated_repair_cost) || 0,
        recommendation: surveyForm.recommendation
      }

      await claimService.submitSurveyReport(selectedClaim.id, payload)
      await hydrateClaimContext(selectedClaim.id)
      setSuccessMessage('Survey report submitted successfully and shared with the officer console.')

      setTimeout(() => {
        setSelectedClaim(null)
        setSelectedPolicy(null)
        setSurveyReports([])
        setView('queue')
        loadSurveyClaims()
      }, 1600)
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to submit survey report'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToQueue = () => {
    setSelectedClaim(null)
    setSelectedPolicy(null)
    setSurveyReports([])
    setView('queue')
    setError(null)
    setSuccessMessage(null)
  }

  const renderQueue = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '26px', color: '#17324d' }}>Survey Assignments</h2>
          <p style={{ margin: '6px 0 0', color: '#587087' }}>Your queue now shows real assignment data, timing, and the latest workflow state.</p>
        </div>
        <button
          onClick={loadSurveyClaims}
          disabled={loading}
          style={{
            padding: '10px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: '#0f6cbd',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            fontWeight: '600',
            boxShadow: '0 10px 24px rgba(15,108,189,0.18)'
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Queue'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Assigned Today', value: queueStats.assigned, accent: '#0f6cbd' },
          { label: 'Overdue Follow-Ups', value: queueStats.overdue, accent: '#d97706' },
          { label: 'High-Value Reviews', value: queueStats.highValue, accent: '#047857' }
        ].map(card => (
          <div key={card.label} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)', border: '1px solid #d9e6f2', borderRadius: '18px', padding: '18px 20px', boxShadow: '0 12px 30px rgba(15,35,75,0.06)' }}>
            <div style={{ fontSize: '13px', color: '#587087', marginBottom: '10px' }}>{card.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: card.accent }}>{card.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color: '#b42318', padding: '12px 14px', marginBottom: '20px', backgroundColor: '#ffe9e7', borderRadius: '12px', border: '1px solid #f7c1b8' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {surveyClaims.length === 0 ? (
        <div style={{ padding: '44px', textAlign: 'center', background: 'linear-gradient(135deg, #f6f8fb 0%, #eef4f9 100%)', borderRadius: '18px', border: '1px dashed #bfd2e3' }}>
          <p style={{ color: '#587087', margin: 0 }}>No claims are currently assigned for survey.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 18px 40px rgba(15,35,75,0.08)', border: '1px solid #dfe8f0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #17324d 0%, #21507a 100%)' }}>
                {['Claim', 'Policy / Vehicle', 'Assigned', 'Surveyor', 'Status', 'Action'].map((heading) => (
                  <th key={heading} style={{ padding: '16px', textAlign: heading === 'Action' ? 'center' : 'left', fontWeight: '600', color: 'white', fontSize: '13px', letterSpacing: '0.2px' }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {surveyClaims.map((claim) => {
                const assignment = claim.latest_survey_report
                return (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '700', color: '#17324d' }}>{claim.claim_number}</div>
                      <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>Incident: {formatDate(claim.incident_date)}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#17324d', fontWeight: '600' }}>Policy ID #{claim.policy_id}</div>
                      <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{assignment?.vehicle_condition || 'Awaiting field inspection'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#17324d', fontWeight: '600' }}>{formatDateTime(assignment?.assigned_at)}</div>
                      <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{assignment?.assignment_notes || 'Standard inspection assignment'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: '#17324d', fontWeight: '600' }}>{assignment?.surveyor_name || 'Field Surveyor'}</div>
                      <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{assignment?.surveyor_id || 'SURVEYOR001'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '999px', ...getStatusBadge(claim.status), fontSize: '12px', fontWeight: '700' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleInspectClaim(claim)}
                        disabled={loading}
                        style={{
                          padding: '8px 18px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          backgroundColor: '#0f6cbd',
                          color: 'white',
                          border: 'none',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderInspectionPanel = () => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button
            onClick={handleBackToQueue}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f6f9fc',
              color: '#45617d',
              border: '1px solid #d9e6f2',
              borderRadius: '999px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            ← Back to Queue
          </button>
          <h2 style={{ margin: 0, fontSize: '28px', color: '#17324d' }}>Vehicle Inspection Workspace</h2>
          <p style={{ margin: '6px 0 0', color: '#587087' }}>Capture inspection details once; the officer dashboard will now read them directly.</p>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: '18px', background: 'linear-gradient(135deg, #edf6ff 0%, #f7fbff 100%)', border: '1px solid #d9e6f2', minWidth: '220px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#587087', marginBottom: '6px' }}>Current Assignment</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#17324d' }}>{pendingAssignment?.surveyor_name || surveyForm.surveyor_name}</div>
          <div style={{ fontSize: '13px', color: '#587087', marginTop: '4px' }}>{pendingAssignment?.surveyor_id || surveyForm.surveyor_id}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.9fr', gap: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 16px 36px rgba(15,35,75,0.08)', border: '1px solid #dfe8f0' }}>
          <h3 style={{ margin: '0 0 20px', color: '#0f6cbd', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Claim Context</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Claim Number</div><div style={{ marginTop: '6px', color: '#17324d', fontWeight: '700' }}>{selectedClaim?.claim_number}</div></div>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Policy Number</div><div style={{ marginTop: '6px', color: '#17324d' }}>{selectedPolicy?.policy_number || `Policy ID #${selectedClaim?.policy_id}`}</div></div>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Incident Date</div><div style={{ marginTop: '6px', color: '#17324d' }}>{formatDate(selectedClaim?.incident_date)}</div></div>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Vehicle Number</div><div style={{ marginTop: '6px', color: '#17324d' }}>{selectedPolicy?.vehicle_number || 'N/A'}</div></div>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Vehicle Model</div><div style={{ marginTop: '6px', color: '#17324d' }}>{selectedPolicy?.vehicle_model || 'N/A'}</div></div>
            <div><div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Assigned At</div><div style={{ marginTop: '6px', color: '#17324d' }}>{formatDateTime(pendingAssignment?.assigned_at)}</div></div>
          </div>

          <div style={{ backgroundColor: '#f6f9fc', padding: '16px', borderRadius: '14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#587087', textTransform: 'uppercase', fontWeight: '700' }}>Incident Description</div>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#17324d', lineHeight: '1.6' }}>{selectedClaim?.description || 'No description provided'}</p>
          </div>

          <div style={{ backgroundColor: '#fff7e8', padding: '16px', borderRadius: '14px', border: '1px solid #f3d9a6' }}>
            <div style={{ fontSize: '12px', color: '#8a5200', textTransform: 'uppercase', fontWeight: '700' }}>Officer Notes</div>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#8a5200', lineHeight: '1.6' }}>{pendingAssignment?.assignment_notes || 'No special instruction added for this inspection.'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '22px', borderRadius: '20px', boxShadow: '0 16px 36px rgba(15,35,75,0.08)', border: '1px solid #dfe8f0' }}>
            <h3 style={{ margin: '0 0 16px', color: '#17324d', fontSize: '16px' }}>Inspection Checklist</h3>
            {['Verify visible damage against customer description', 'Capture affected parts clearly', 'Estimate realistic repair cost', 'Flag mismatch or fraud risk early'].map(item => (
              <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px', color: '#45617d', fontSize: '14px' }}>
                <span style={{ color: '#0f6cbd', fontWeight: '700' }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: 'white', padding: '22px', borderRadius: '20px', boxShadow: '0 16px 36px rgba(15,35,75,0.08)', border: '1px solid #dfe8f0' }}>
            <h3 style={{ margin: '0 0 16px', color: '#17324d', fontSize: '16px' }}>Survey History</h3>
            {surveyReports.length === 0 ? (
              <div style={{ color: '#587087', fontSize: '14px' }}>No previous survey attempts yet.</div>
            ) : (
              surveyReports.map(report => (
                <div key={report.id} style={{ padding: '12px 0', borderBottom: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#17324d' }}>Version {report.version_number}</div>
                    <span style={{ padding: '4px 10px', borderRadius: '999px', ...(report.submitted_at ? { backgroundColor: '#ddf7ea', color: '#11663c' } : { backgroundColor: '#fff4df', color: '#8a5200' }), fontSize: '11px', fontWeight: '700' }}>
                      {report.submitted_at ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#587087', marginTop: '6px' }}>Assigned: {formatDateTime(report.assigned_at)}</div>
                  {report.submitted_at && <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>Submitted: {formatDateTime(report.submitted_at)}</div>}
                  {report.officer_review_notes && <div style={{ fontSize: '12px', color: '#8a5200', marginTop: '4px' }}>Officer note: {report.officer_review_notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderDamageAssessment = () => (
    <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', boxShadow: '0 16px 36px rgba(15,35,75,0.08)', border: '1px solid #dfe8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#17324d', fontSize: '22px' }}>Damage Assessment Form</h3>
          <p style={{ margin: '6px 0 0', color: '#587087' }}>The officer console now reads these fields directly after submission.</p>
        </div>
        {latestSurveyReport?.submitted_at && (
          <span style={{ padding: '8px 14px', borderRadius: '999px', ...getRecommendationTone(latestSurveyReport.recommendation), fontWeight: '700', fontSize: '12px' }}>
            Last Recommendation: {latestSurveyReport.recommendation}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmitSurvey}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Surveyor ID</label>
            <input
              type="text"
              name="surveyor_id"
              value={surveyForm.surveyor_id}
              onChange={handleFormChange}
              required
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Surveyor Name</label>
            <input
              type="text"
              name="surveyor_name"
              value={surveyForm.surveyor_name}
              onChange={handleFormChange}
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Damage Description</label>
          <textarea
            name="damage_description"
            value={surveyForm.damage_description}
            onChange={handleFormChange}
            required
            rows="4"
            placeholder="Describe the damage observed during inspection..."
            style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Vehicle Condition</label>
            <select
              name="vehicle_condition"
              value={surveyForm.vehicle_condition}
              onChange={handleFormChange}
              required
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="">Select condition</option>
              <option value="Minor Damage">Minor Damage</option>
              <option value="Moderate Damage">Moderate Damage</option>
              <option value="Severe Damage">Severe Damage</option>
              <option value="Total Loss">Total Loss</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Recommendation</label>
            <select
              name="recommendation"
              value={surveyForm.recommendation}
              onChange={handleFormChange}
              required
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px', backgroundColor: 'white' }}
            >
              <option value="Repair">Approve for Repair</option>
              <option value="Partial Claim">Partial Claim</option>
              <option value="Total Loss">Total Loss</option>
              <option value="Reject">Reject Claim</option>
              <option value="Further Investigation">Further Investigation Required</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '18px', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Parts Damaged</label>
            <input
              type="text"
              name="parts_damaged"
              value={surveyForm.parts_damaged}
              onChange={handleFormChange}
              placeholder="Front bumper, bonnet, left headlamp..."
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#17324d' }}>Estimated Repair Cost</label>
            <input
              type="number"
              name="estimated_repair_cost"
              value={surveyForm.estimated_repair_cost}
              onChange={handleFormChange}
              required
              min="0"
              step="0.01"
              placeholder="0"
              style={{ padding: '12px', width: '100%', borderRadius: '12px', border: '1px solid #d0dce8', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>
        </div>

        {selectedPolicy?.idv_amount && surveyForm.estimated_repair_cost && (
          <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', backgroundColor: '#f6f9fc', color: '#45617d', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span>Policy IDV: <strong>{formatCurrency(selectedPolicy.idv_amount)}</strong></span>
            <span>Survey Estimate: <strong>{formatCurrency(surveyForm.estimated_repair_cost)}</strong></span>
          </div>
        )}

        {error && (
          <div style={{ color: '#b42318', padding: '12px 14px', marginBottom: '18px', backgroundColor: '#ffe9e7', borderRadius: '12px', border: '1px solid #f7c1b8' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div style={{ color: '#11663c', padding: '12px 14px', marginBottom: '18px', backgroundColor: '#ddf7ea', borderRadius: '12px', border: '1px solid #abe6c4' }}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ color: '#587087', fontSize: '13px' }}>Tip: be specific on damaged parts and recommendation so the officer can act without calling back.</div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              backgroundColor: '#0f6cbd',
              color: 'white',
              border: 'none',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 12px 24px rgba(15,108,189,0.18)'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Survey Report'}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eef5fb 0%, #f7fafc 100%)', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      <header style={{ background: 'linear-gradient(135deg, #17324d 0%, #21507a 100%)', padding: '18px 32px', boxShadow: '0 12px 30px rgba(15,35,75,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>Surveyor Dashboard</h1>
          <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.72)', fontSize: '13px' }}>Assignment-aware field inspection workspace</div>
        </div>
        <button
          onClick={onSwitchRole}
          style={{
            padding: '9px 16px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.24)',
            borderRadius: '999px',
            cursor: 'pointer'
          }}
        >
          Switch Role
        </button>
      </header>

      <main style={{ padding: '28px 32px' }}>
        {view === 'queue' && renderQueue()}
        {view === 'inspect' && selectedClaim && (
          <>
            {renderInspectionPanel()}
            {renderDamageAssessment()}
          </>
        )}
      </main>
    </div>
  )
}

export default SurveyorDashboard

