import React, { useState, useEffect } from 'react'
import { claimService, policyService } from '../services/api'

// Section Card wrapper for workflow sections
const SectionCard = ({ number, title, children, color = '#1976d2' }) => (
  <div style={{ marginBottom: '20px', border: '1px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
    <div style={{ padding: '14px 20px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ backgroundColor: color, color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{number}</span>
      <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>{title}</h4>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
)

function OfficerDashboard({ onSwitchRole }) {
  // Claims queue state
  const [claims, setClaims] = useState([])
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [queueSearch, setQueueSearch] = useState('')
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL')

  // Selected claim state
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [policy, setPolicy] = useState(null)
  const [claimHistory, setClaimHistory] = useState([])
  const [surveyReports, setSurveyReports] = useState([])

  // Validation & Risk
  const [validationResults, setValidationResults] = useState(null)
  const [riskEvaluation, setRiskEvaluation] = useState(null)

  // Local verification states (UI-only for demo)
  const [identityStatus, setIdentityStatus] = useState({ aadhar: null, pan: null, dl: null })
  const [vehicleDocsStatus, setVehicleDocsStatus] = useState({ rc: null, policy_doc: null })
  const [incidentStatus, setIncidentStatus] = useState(null)
  const [selectedClaimType, setSelectedClaimType] = useState('minor_damage')

  // Settlement calculator (Section 10)
  const [calcRepairEstimate, setCalcRepairEstimate] = useState('')
  const [calcDepreciation, setCalcDepreciation] = useState('')
  const [calcDeductible, setCalcDeductible] = useState('')

  // Approval form (Section 11)
  const [vehicleAgeYears, setVehicleAgeYears] = useState('')
  const [parts, setParts] = useState([{ type: '', amount: '' }])
  const [deductibleAmount, setDeductibleAmount] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [reinspectionReason, setReinspectionReason] = useState('')
  const [surveyorAssignment, setSurveyorAssignment] = useState({
    surveyor_id: 'SURVEYOR001',
    surveyor_name: 'Field Surveyor',
    notes: 'Assigned for vehicle inspection'
  })

  // Results
  const [settlementResult, setSettlementResult] = useState(null)

  // Settlement processing (Section 12)
  const [settlementType, setSettlementType] = useState('cashless')

  // Loading
  const [loading, setLoading] = useState(false)

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState(null)

  // Extracted documents from backend
  const [claimDocuments, setClaimDocuments] = useState([])

  useEffect(() => { fetchClaims() }, [])

  // -----------------------------------------------
  // Data Fetching
  // -----------------------------------------------
  const fetchClaims = async () => {
    setLoadingClaims(true)
    setError(null)
    try {
      const response = await claimService.getClaims()
      setClaims(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoadingClaims(false)
    }
  }

  const handleApiError = (err) => {
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    setError(message)
  }

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const hydrateSurveyContext = (claimData, reports = []) => {
    const latestReport = reports[0] || claimData?.latest_survey_report
    if (!latestReport) {
      setSurveyorAssignment({
        surveyor_id: 'SURVEYOR001',
        surveyor_name: 'Field Surveyor',
        notes: 'Assigned for vehicle inspection'
      })
      return
    }

    setSurveyorAssignment({
      surveyor_id: latestReport.surveyor_id || 'SURVEYOR001',
      surveyor_name: latestReport.surveyor_name || 'Field Surveyor',
      notes: latestReport.assignment_notes || latestReport.officer_review_notes || 'Assigned for vehicle inspection'
    })

    if (latestReport.estimated_repair_cost) {
      setCalcRepairEstimate(String(latestReport.estimated_repair_cost))
    }
  }

  const loadSurveyReports = async (claimId, claimData = null) => {
    const response = await claimService.getSurveyReports(claimId)
    const reports = Array.isArray(response.data) ? response.data : []
    setSurveyReports(reports)
    hydrateSurveyContext(claimData || selectedClaim, reports)
    return reports
  }

  const refreshClaimData = async (claimId) => {
    try {
      const claimResponse = await claimService.getClaim(claimId)
      setSelectedClaim(claimResponse.data)
      const historyResponse = await claimService.getClaimHistory(claimId)
      setClaimHistory(historyResponse.data)
      await loadSurveyReports(claimId, claimResponse.data)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleOpenClaim = async (claim) => {
    setSelectedClaim(claim)
    setPolicy(null)
    setClaimHistory([])
    setSurveyReports([])
    setValidationResults(null)
    setRiskEvaluation(null)
    setSettlementResult(null)
    setError(null)
    setSuccessMessage(null)
    setIdentityStatus({ aadhar: null, pan: null, dl: null })
    setVehicleDocsStatus({ rc: null, policy_doc: null })
    setIncidentStatus(null)
    setSelectedClaimType('minor_damage')
    setCalcRepairEstimate('')
    setCalcDepreciation('')
    setCalcDeductible('')
    setVehicleAgeYears('')
    setParts([{ type: '', amount: '' }])
    setDeductibleAmount('')
    setRejectionReason('')
    setEscalationReason('')
    setReinspectionReason('')
    setSurveyorAssignment({
      surveyor_id: 'SURVEYOR001',
      surveyor_name: 'Field Surveyor',
      notes: 'Assigned for vehicle inspection'
    })
    setSettlementType('cashless')
    setPreviewDoc(null)
    setClaimDocuments([])

    try {
      const claimResponse = await claimService.getClaim(claim.id)
      setSelectedClaim(claimResponse.data)
      if (claimResponse.data.policy_id) {
        const policyResponse = await policyService.getPolicy(claimResponse.data.policy_id)
        setPolicy(policyResponse.data)
      }
      const historyResponse = await claimService.getClaimHistory(claim.id)
      setClaimHistory(historyResponse.data)
      await loadSurveyReports(claim.id, claimResponse.data)
      const docsResponse = await claimService.getDocuments(claim.id)
      setClaimDocuments(docsResponse.data)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleBackToQueue = () => {
    setSelectedClaim(null)
    setPolicy(null)
    setClaimHistory([])
    setSurveyReports([])
    fetchClaims()
  }

  // -----------------------------------------------
  // Action Handlers
  // -----------------------------------------------

  // Section 2: Policy Validation → SUBMITTED → UNDER_REVIEW
  const handleValidatePolicy = async () => {
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.assignClaim(selectedClaim.id, { officer_id: '1' })
      showSuccess('Policy validated successfully. Claim moved to Under Review.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 2: Quick Reject from policy validation
  const handleQuickReject = async () => {
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.updateStatus(selectedClaim.id, 'REJECTED')
      showSuccess('Claim rejected due to policy validation failure.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 8: Flag for Investigation
  const handleFlagInvestigation = async () => {
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.flagInvestigation(selectedClaim.id, 'Suspicious activity detected during fraud review')
      showSuccess('Claim flagged for investigation.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSurveyAssignmentChange = (field, value) => {
    setSurveyorAssignment(prev => ({ ...prev, [field]: value }))
  }

  // Section 9: Assign Surveyor → UNDER_REVIEW → SURVEY_ASSIGNED
  const handleAssignSurveyor = async () => {
    if (!selectedClaim) return
    if (!surveyorAssignment.surveyor_id || !surveyorAssignment.surveyor_name) {
      setError('Provide both surveyor ID and surveyor name before assigning.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await claimService.assignSurveyor(selectedClaim.id, {
        surveyor_id: surveyorAssignment.surveyor_id,
        surveyor_name: surveyorAssignment.surveyor_name,
        notes: surveyorAssignment.notes
      })
      showSuccess('Surveyor assigned successfully.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReopenSurvey = async () => {
    if (!selectedClaim) return
    if (!reinspectionReason.trim()) {
      setError('Enter a reason before requesting reinspection.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await claimService.reopenSurvey(selectedClaim.id, {
        surveyor_id: surveyorAssignment.surveyor_id,
        surveyor_name: surveyorAssignment.surveyor_name,
        reason: reinspectionReason.trim()
      })
      showSuccess('Survey reopened and reassigned to the surveyor.')
      setReinspectionReason('')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 11: Approve Claim
  const handleApprove = async (e) => {
    e.preventDefault()
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      const response = await claimService.approveClaim(selectedClaim.id, {
        vehicle_age_years: parseFloat(vehicleAgeYears),
        parts: parts.map(p => ({ type: p.type, amount: parseFloat(p.amount) })).filter(p => p.type && !isNaN(p.amount)),
        deductible_amount: parseFloat(deductibleAmount)
      })
      setSettlementResult(response.data)
      showSuccess('Claim approved successfully!')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 11: Reject Claim
  const handleReject = async (e) => {
    e.preventDefault()
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.rejectClaim(selectedClaim.id, { rejection_reason: rejectionReason })
      showSuccess('Claim rejected.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 11: Escalate Claim
  const handleEscalate = async (e) => {
    e.preventDefault()
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.escalateClaim(selectedClaim.id, { officer_id: '1', reason: escalationReason })
      showSuccess('Claim escalated to senior officer.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 12: Update settlement status
  const handleUpdateSettlementStatus = async (newStatus) => {
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.updateClaimStatus(selectedClaim.id, { status: newStatus })
      showSuccess(`Status updated to ${newStatus}.`)
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Section 13: Close Claim
  const handleCloseClaimFinal = async () => {
    if (!selectedClaim) return
    setLoading(true)
    setError(null)
    try {
      await claimService.closeClaim(selectedClaim.id, {
        final_notes: 'Claim processing completed and closed.',
        settlement_mode: settlementType === 'cashless' ? 'CASHLESS' : 'REIMBURSEMENT'
      })
      showSuccess('Claim closed successfully.')
      await refreshClaimData(selectedClaim.id)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Parts management
  const addPart = () => setParts([...parts, { type: '', amount: '' }])
  const updatePart = (index, field, value) => {
    const newParts = [...parts]
    newParts[index][field] = value
    setParts(newParts)
  }
  const removePart = (index) => setParts(parts.filter((_, i) => i !== index))

  // -----------------------------------------------
  // Computed Values
  // -----------------------------------------------

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(value))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return '#757575'
      case 'UNDER_REVIEW': return '#1976d2'
      case 'DOCUMENT_REQUIRED': return '#ff9800'
      case 'SURVEY_ASSIGNED': return '#00bcd4'
      case 'SURVEY_COMPLETED': return '#009688'
      case 'UNDER_INVESTIGATION': return '#e91e63'
      case 'PROCESSING': return '#2196f3'
      case 'READY_FOR_REVIEW': return '#9c27b0'
      case 'APPROVED': return '#4caf50'
      case 'REJECTED': return '#f44336'
      case 'ESCALATED': return '#ff9800'
      case 'REPAIR_IN_PROGRESS': return '#ff5722'
      case 'PAYMENT_PROCESSING': return '#3f51b5'
      case 'PAID': return '#4caf50'
      case 'CLOSED': return '#607d8b'
      default: return '#757575'
    }
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

  // Status filters
  const terminalStatuses = ['REJECTED', 'CLOSED', 'PAID']
  const filteredClaims = claims.filter(claim => {
    const matchesStatus = queueStatusFilter === 'ALL' || claim.status === queueStatusFilter
    const query = queueSearch.trim().toLowerCase()
    const matchesSearch = !query || [
      claim.claim_number,
      String(claim.policy_id),
      claim.status,
      claim.latest_survey_report?.surveyor_name,
      claim.latest_survey_report?.surveyor_id
    ].filter(Boolean).some(value => String(value).toLowerCase().includes(query))
    return matchesStatus && matchesSearch
  })
  const activeClaims = filteredClaims.filter(c => !terminalStatuses.includes(c.status))
  const processedClaims = filteredClaims.filter(c => terminalStatuses.includes(c.status))
  const latestSurveyReport = surveyReports[0] || selectedClaim?.latest_survey_report || null
  const latestSubmittedSurveyReport = surveyReports.find(report => report.submitted_at) || (selectedClaim?.latest_survey_report?.submitted_at ? selectedClaim.latest_survey_report : null)

  // Policy validation checks (Section 2)
  const policyChecks = policy ? {
    exists: true,
    active: policy.is_active,
    coverageValid: selectedClaim && policy.policy_start_date && policy.policy_end_date
      ? new Date(policy.policy_start_date) <= new Date(selectedClaim.incident_date) && new Date(selectedClaim.incident_date) <= new Date(policy.policy_end_date)
      : false,
    vehicleMatch: !!policy.vehicle_number
  } : { exists: false, active: false, coverageValid: false, vehicleMatch: false }

  const allPolicyChecksPass = policyChecks.exists && policyChecks.active && policyChecks.coverageValid && policyChecks.vehicleMatch

  // Fraud risk computation (Section 8)
  const computeFraudRisk = () => {
    if (!selectedClaim || !policy) return { score: 'LOW', signals: [] }
    const signals = []
    const policyStart = new Date(policy.policy_start_date)
    const claimCreated = new Date(selectedClaim.created_at)
    const daysSincePolicyStart = (claimCreated - policyStart) / (1000 * 60 * 60 * 24)
    if (daysSincePolicyStart < 30) {
      signals.push({ text: 'Claim filed within 30 days of policy purchase', level: 'HIGH' })
    } else if (daysSincePolicyStart < 90) {
      signals.push({ text: 'Claim filed within 90 days of policy purchase', level: 'MEDIUM' })
    }
    signals.push({ text: 'Multiple claims for same vehicle — manual verification required', level: 'INFO' })
    if (selectedClaim.estimated_amount && policy.idv_amount && selectedClaim.estimated_amount > policy.idv_amount * 0.8) {
      signals.push({ text: 'Repair estimate exceeds 80% of IDV', level: 'HIGH' })
    }
    let score = 'LOW'
    const highCount = signals.filter(s => s.level === 'HIGH').length
    if (highCount >= 2) score = 'HIGH'
    else if (highCount >= 1) score = 'MEDIUM'
    return { score, signals }
  }
  const fraudRisk = computeFraudRisk()

  // Document checklists by claim type (Section 7)
  const documentChecklists = {
    minor_damage: ['Policy Document', 'RC Book', 'Driving License', 'Damage Photos', 'Repair Estimate'],
    accident_major: ['Damage Photos', 'FIR Copy', 'Repair Estimate', 'Survey Report'],
    theft: ['FIR Copy', 'RC Book', 'Vehicle Keys Receipt', 'Form 28', 'Form 29', 'Form 30', 'Subrogation Letter', 'Discharge Voucher']
  }

  // Calculator result (Section 10)
  const calculatedPayable = Math.max(0, (parseFloat(calcRepairEstimate) || 0) - (parseFloat(calcDepreciation) || 0) - (parseFloat(calcDeductible) || 0))

  // Status helpers
  const status = selectedClaim?.status
  const isTerminal = status === 'REJECTED' || status === 'CLOSED'
  const canReview = ['UNDER_REVIEW', 'SURVEY_COMPLETED', 'READY_FOR_REVIEW'].includes(status)
  const canDecide = ['UNDER_REVIEW', 'SURVEY_COMPLETED', 'READY_FOR_REVIEW'].includes(status)

  // Reusable styles
  const btnPrimary = { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }
  const btnSuccess = { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }
  const btnDanger = { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }
  const btnWarning = { padding: '10px 20px', cursor: 'pointer', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500' }
  const btnOutline = { padding: '10px 20px', cursor: 'pointer', backgroundColor: 'white', color: '#1976d2', border: '1px solid #1976d2', borderRadius: '6px', fontWeight: '500' }
  const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }
  const infoItem = { padding: '6px 0' }
  const infoLabel = { color: '#666' }

  // -----------------------------------------------
  // Render: Statistics
  // -----------------------------------------------
  const renderStatistics = () => {
    const today = new Date().toDateString()
    const todayClaims = claims.filter(c => new Date(c.created_at).toDateString() === today)
    const underReview = claims.filter(c => c.status === 'UNDER_REVIEW').length
    const surveyPending = claims.filter(c => c.status === 'SURVEY_ASSIGNED').length
    const escalated = claims.filter(c => c.status === 'ESCALATED' || c.status === 'UNDER_INVESTIGATION').length

    const cardStyle = (color) => ({
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)', borderRadius: '16px', padding: '20px',
      boxShadow: '0 14px 34px rgba(15,35,75,0.08)', flex: '1', textAlign: 'center',
      border: '1px solid #dbe5ef', borderTop: `4px solid ${color}`
    })

    return (
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle('#1976d2')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{todayClaims.length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Claims Today</div>
        </div>
        <div style={cardStyle('#757575')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#757575' }}>{claims.filter(c => c.status === 'SUBMITTED').length}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Submitted</div>
        </div>
        <div style={cardStyle('#1976d2')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>{underReview}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Under Review</div>
        </div>
        <div style={cardStyle('#009688')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#009688' }}>{surveyPending}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Survey Pending</div>
        </div>
        <div style={cardStyle('#ff9800')}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>{escalated}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Escalated / Investigating</div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------
  // Render: Claims Queue Table
  // -----------------------------------------------
  const renderClaimsQueue = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '26px', color: '#17324d' }}>Claims Queue</h2>
          <p style={{ margin: '6px 0 0', color: '#587087' }}>Search faster, spot survey bottlenecks, and open the full review workspace in one step.</p>
        </div>
        <button onClick={fetchClaims} disabled={loadingClaims}
          style={{ ...btnPrimary, borderRadius: '999px', opacity: loadingClaims ? 0.6 : 1, cursor: loadingClaims ? 'not-allowed' : 'pointer' }}>
          {loadingClaims ? 'Loading...' : 'Refresh Queue'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#f44336', padding: '12px', marginBottom: '20px', backgroundColor: '#ffebee', borderRadius: '6px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {renderStatistics()}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '16px', marginBottom: '24px' }}>
        <input
          type="text"
          value={queueSearch}
          onChange={e => setQueueSearch(e.target.value)}
          placeholder="Search by claim number, policy ID, status, or surveyor"
          style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #d0dce8', fontSize: '14px' }}
        />
        <select
          value={queueStatusFilter}
          onChange={e => setQueueStatusFilter(e.target.value)}
          style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #d0dce8', fontSize: '14px', backgroundColor: 'white' }}
        >
          <option value="ALL">All Statuses</option>
          {['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_REQUIRED', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED', 'UNDER_INVESTIGATION', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Active Claims */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '16px' }}>Active Claims ({activeClaims.length})</h3>
        {activeClaims.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <p style={{ color: '#666', margin: 0 }}>No active claims in queue.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {['Claim ID', 'Claim Number', 'Policy ID', 'Survey', 'Incident Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px', textAlign: h === 'Action' ? 'center' : 'left', fontWeight: '600', color: '#333', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeClaims.map((claim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '14px' }}>#{claim.id}</td>
                    <td style={{ padding: '14px', fontWeight: '500' }}>{claim.claim_number}</td>
                    <td style={{ padding: '14px' }}>{claim.policy_id}</td>
                    <td style={{ padding: '14px' }}>
                      {claim.latest_survey_report ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#17324d' }}>{claim.latest_survey_report.surveyor_name || claim.latest_survey_report.surveyor_id}</div>
                          <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{claim.latest_survey_report.submitted_at ? 'Report submitted' : 'Awaiting report'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#8a94a6', fontSize: '13px' }}>Not assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>{claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: getStatusColor(claim.status), color: 'white', fontSize: '12px', fontWeight: '600' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button onClick={() => handleOpenClaim(claim)} style={{ ...btnPrimary, padding: '6px 16px', fontSize: '13px' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Processed Claims */}
      {processedClaims.length > 0 && (
        <div>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>Processed Claims ({processedClaims.length})</h3>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  {['Claim ID', 'Claim Number', 'Policy ID', 'Survey', 'Incident Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px', textAlign: h === 'Action' ? 'center' : 'left', fontWeight: '600', color: '#666', borderBottom: '2px solid #e0e0e0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedClaims.map((claim) => (
                  <tr key={claim.id} style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '14px' }}>#{claim.id}</td>
                    <td style={{ padding: '14px', fontWeight: '500' }}>{claim.claim_number}</td>
                    <td style={{ padding: '14px' }}>{claim.policy_id}</td>
                    <td style={{ padding: '14px' }}>
                      {claim.latest_survey_report ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#17324d' }}>{claim.latest_survey_report.surveyor_name || claim.latest_survey_report.surveyor_id}</div>
                          <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{claim.latest_survey_report.recommendation || 'No recommendation'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#8a94a6', fontSize: '13px' }}>No survey used</span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>{claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: getStatusColor(claim.status), color: 'white', fontSize: '12px', fontWeight: '600' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button onClick={() => handleOpenClaim(claim)} style={{ padding: '6px 16px', cursor: 'pointer', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  // -----------------------------------------------
  // Render: Timeline
  // -----------------------------------------------
  const renderTimeline = () => {
    if (claimHistory.length === 0) return null
    return (
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ marginBottom: '12px', color: '#333' }}>Claim Timeline</h4>
        <div style={{ position: 'relative', paddingLeft: '20px' }}>
          <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#e0e0e0' }} />
          {claimHistory.map((history, index) => (
            <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ position: 'absolute', left: '-17px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: index === claimHistory.length - 1 ? '#4caf50' : '#1976d2', border: '2px solid white', boxShadow: '0 0 0 2px #1976d2' }} />
              <div style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{history.new_status}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(history.changed_at)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // -----------------------------------------------
  // SECTION 1 — Claim Summary
  // -----------------------------------------------
  const renderSection1 = () => (
    <SectionCard number="1" title="Claim Summary">
      <div style={infoGrid}>
        <div style={infoItem}><span style={infoLabel}>Claim ID: </span><strong>#{selectedClaim.id}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Number: </span><strong>{selectedClaim.claim_number}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Customer Name: </span><strong>{policy?.policy_holder_name || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Policy Number: </span><strong>{policy?.policy_number || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Vehicle Number: </span><strong>{policy?.vehicle_number || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Vehicle Model: </span><strong>{policy?.vehicle_model || 'N/A'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Type: </span><strong>{selectedClaim.claim_type || 'Not specified'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Incident Date: </span><strong>{formatDateTime(selectedClaim.incident_date)}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Current Status: </span>
          <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: getStatusColor(selectedClaim.status), color: 'white', fontSize: '12px', fontWeight: '600' }}>
            {selectedClaim.status}
          </span>
        </div>
        <div style={infoItem}><span style={infoLabel}>IDV Amount: </span><strong>{policy?.idv_amount ? formatCurrency(policy.idv_amount) : 'N/A'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Survey Reports: </span><strong>{surveyReports.length}</strong></div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <span style={infoLabel}>Incident Description: </span>
        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#333', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
          {selectedClaim.description || 'No description provided'}
        </p>
      </div>
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 2 — Policy Validation
  // -----------------------------------------------
  const renderSection2 = () => {
    const checks = [
      { label: 'Policy Exists', pass: policyChecks.exists },
      { label: 'Policy Active', pass: policyChecks.active },
      { label: 'Coverage Valid (Incident within policy period)', pass: policyChecks.coverageValid },
      { label: 'Vehicle Match', pass: policyChecks.vehicleMatch },
    ]

    return (
      <SectionCard number="2" title="Policy Validation">
        <div style={{ marginBottom: '16px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: c.pass ? '#4caf50' : '#f44336', fontSize: '18px', fontWeight: 'bold' }}>{c.pass ? '✔' : '✘'}</span>
              <span style={{ color: c.pass ? '#333' : '#f44336', fontWeight: '500' }}>{c.label}</span>
            </div>
          ))}
        </div>
        {policy && (
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
            Policy Period: {formatDate(policy.policy_start_date)} — {formatDate(policy.policy_end_date)}
          </div>
        )}
        {status === 'SUBMITTED' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleValidatePolicy} disabled={loading || !allPolicyChecksPass}
              style={{ ...btnSuccess, opacity: (loading || !allPolicyChecksPass) ? 0.6 : 1, cursor: (loading || !allPolicyChecksPass) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Validating...' : 'Validate Policy'}
            </button>
            <button onClick={handleQuickReject} disabled={loading}
              style={{ ...btnDanger, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Reject Claim
            </button>
          </div>
        )}
        {status !== 'SUBMITTED' && (
          <div style={{ padding: '10px 16px', backgroundColor: '#e8f5e9', borderRadius: '6px', color: '#2e7d32', fontWeight: '500' }}>
            ✔ Policy validation completed
          </div>
        )}
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 3 — Customer Identity Verification
  // -----------------------------------------------
  const renderSection3 = () => {
    const documents = [
      { key: 'aadhar', label: 'Aadhaar Number', value: policy?.aadhar_number },
      { key: 'pan', label: 'PAN Number', value: policy?.pan_number },
      { key: 'dl', label: 'Driving License', value: policy?.driving_license_number },
    ]

    return (
      <SectionCard number="3" title="Customer Identity Verification">
        <div style={{ display: 'grid', gap: '12px' }}>
          {documents.map(doc => (
            <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#666' }}>{doc.label}</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginTop: '2px' }}>{doc.value || 'Not available'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {identityStatus[doc.key] === 'verified' && <span style={{ color: '#4caf50', fontWeight: '600', fontSize: '13px' }}>✔ Verified</span>}
                {identityStatus[doc.key] === 'reupload' && <span style={{ color: '#ff9800', fontWeight: '600', fontSize: '13px' }}>⟳ Reupload Requested</span>}
                {identityStatus[doc.key] === 'rejected' && <span style={{ color: '#f44336', fontWeight: '600', fontSize: '13px' }}>✘ Rejected</span>}
                {canReview && (
                  <>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                      style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Verify</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                      style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reupload</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'rejected' }))}
                      style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 4 — Vehicle Document Verification
  // -----------------------------------------------
  const renderSection4 = () => {
    const vehicleDocs = [
      { key: 'rc', label: 'RC Number', value: policy?.rc_number, check: 'Vehicle number matches RC' },
      { key: 'policy_doc', label: 'Policy Document', value: policy?.policy_number, check: 'Owner matches policy holder' },
    ]

    return (
      <SectionCard number="4" title="Vehicle Document Verification">
        <div style={{ display: 'grid', gap: '12px' }}>
          {vehicleDocs.map(doc => (
            <div key={doc.key} style={{ padding: '12px 16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{doc.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginTop: '2px' }}>{doc.value || 'Not available'}</div>
                  <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>✔ {doc.check}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {vehicleDocsStatus[doc.key] === 'verified' && <span style={{ color: '#4caf50', fontWeight: '600', fontSize: '13px' }}>✔ Verified</span>}
                  {vehicleDocsStatus[doc.key] === 'reupload' && <span style={{ color: '#ff9800', fontWeight: '600', fontSize: '13px' }}>⟳ Reupload Requested</span>}
                  {canReview && (
                    <>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Verify RC</button>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                        style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#fff3e0', color: '#e65100', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Request Reupload</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 5 — Incident Review
  // -----------------------------------------------
  const renderSection5 = () => (
    <SectionCard number="5" title="Incident Review">
      <div style={infoGrid}>
        <div style={infoItem}><span style={infoLabel}>Incident Date: </span><strong>{formatDateTime(selectedClaim.incident_date)}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Type: </span><strong>{selectedClaim.claim_type || 'Not specified'}</strong></div>
      </div>
      <div style={{ marginTop: '12px', marginBottom: '16px' }}>
        <span style={infoLabel}>Incident Description:</span>
        <p style={{ margin: '8px 0 0', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '14px' }}>
          {selectedClaim.description || 'No description provided'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {incidentStatus === 'valid' && <span style={{ color: '#4caf50', fontWeight: '600' }}>✔ Marked as Valid</span>}
        {incidentStatus === 'suspicious' && <span style={{ color: '#f44336', fontWeight: '600' }}>⚠ Flagged as Suspicious</span>}
        {canReview && (
          <>
            <button onClick={() => setIncidentStatus('valid')}
              style={{ ...btnSuccess, padding: '8px 16px', fontSize: '13px' }}>Mark Valid</button>
            <button onClick={() => setIncidentStatus('suspicious')}
              style={{ ...btnWarning, padding: '8px 16px', fontSize: '13px' }}>Flag Suspicious</button>
          </>
        )}
      </div>
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 6 — Customer Document Review
  // -----------------------------------------------
  const handleViewDocument = (documentType) => {
    const fileName = `ClaimID_${selectedClaim.id}_${documentType}.pdf`
    const url = `http://localhost:8000/rpa-data/Inbound/${fileName}?t=${Date.now()}`
    setPreviewDoc({ label: documentType.replace(/_/g, ' '), url })
  }

  const renderSection6 = () => {
    const expectedDocuments = [
      { type: 'CLAIM_FORM', label: 'Claim Form', icon: '📝' },
      { type: 'REPAIR_ESTIMATE', label: 'Repair Estimate', icon: '💰' },
      { type: 'REPAIR_INVOICE', label: 'Repair Invoice', icon: '🧾' },
      { type: 'REPAIR_BILLS', label: 'Repair Bills', icon: '🧾' },
      { type: 'FIR', label: 'FIR Copy', icon: '👮' },
      { type: 'DAMAGE_PHOTOS', label: 'Damage Photos', icon: '📷' },
      { type: 'SURVEY_REPORT', label: 'Survey Report', icon: '📋' },
    ]

    const actualDocuments = claimDocuments.map(doc => ({
      type: doc.document_type,
      label: String(doc.document_type || '').replace(/_/g, ' '),
      icon: '📄',
      extracted_at: doc.extracted_at,
      fieldCount: Array.isArray(doc.fields) ? doc.fields.length : 0
    }))

    const documents = actualDocuments.length > 0 ? actualDocuments : expectedDocuments

    return (
      <SectionCard number="6" title="Customer Document Review">
        {actualDocuments.length > 0 && (
          <div style={{ marginBottom: '14px', padding: '12px 14px', backgroundColor: '#eef6ff', borderRadius: '10px', color: '#21507a', fontSize: '13px' }}>
            {actualDocuments.length} extracted document(s) available for officer review.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {documents.map(doc => (
            <div key={doc.type} style={{ backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{doc.icon}</span>
                <div>
                  <div style={{ fontWeight: '500', color: '#333' }}>{doc.label}</div>
                  {doc.extracted_at && <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>Extracted {formatDateTime(doc.extracted_at)}</div>}
                  {typeof doc.fieldCount === 'number' && doc.fieldCount > 0 && <div style={{ fontSize: '12px', color: '#587087', marginTop: '4px' }}>{doc.fieldCount} extracted fields</div>}
                </div>
              </div>
              <button onClick={() => handleViewDocument(doc.type)}
                style={{ padding: '6px 14px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>View</button>
            </div>
          ))}
        </div>
        {/* Document Preview Modal — near-fullscreen */}
        {previewDoc && previewDoc.url && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setPreviewDoc(null)}>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', width: '96vw', height: '94vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>{previewDoc.label}</h3>
                <button onClick={() => setPreviewDoc(null)} style={{ padding: '6px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Close</button>
              </div>
              <iframe
                src={previewDoc.url}
                style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '6px', width: '100%' }}
                title={previewDoc.label}
              />
            </div>
          </div>
        )}
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 7 — Claim Type Document Checklist
  // -----------------------------------------------
  const renderSection7 = () => {
    const checklist = documentChecklists[selectedClaimType] || []

    return (
      <SectionCard number="7" title="Claim Type Document Checklist">
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px' }}>Claim Type:</label>
          <select value={selectedClaimType} onChange={e => setSelectedClaimType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="minor_damage">Minor Damage</option>
            <option value="accident_major">Accident Major</option>
            <option value="theft">Theft</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e8e8e8' }}>
              <span style={{ color: '#ff9800', fontSize: '16px' }}>○</span>
              <span style={{ fontSize: '14px', color: '#333' }}>{item}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 8 — Fraud Risk Review
  // -----------------------------------------------
  const renderSection8 = () => {
    const scoreColor = fraudRisk.score === 'HIGH' ? '#f44336' : fraudRisk.score === 'MEDIUM' ? '#ff9800' : '#4caf50'
    const canAct = ['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)

    return (
      <SectionCard number="8" title="Fraud Risk Review" color={scoreColor}>
        {/* Risk Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Fraud Risk Score:</div>
          <span style={{ padding: '6px 20px', borderRadius: '20px', backgroundColor: scoreColor, color: 'white', fontWeight: '700', fontSize: '16px' }}>
            {fraudRisk.score}
          </span>
        </div>

        {/* Risk Signals */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>Risk Signals</div>
          {fraudRisk.signals.map((signal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '6px', backgroundColor: signal.level === 'HIGH' ? '#ffebee' : signal.level === 'MEDIUM' ? '#fff3e0' : '#f5f5f5', borderRadius: '6px' }}>
              <span style={{ fontSize: '14px' }}>{signal.level === 'HIGH' ? '🔴' : signal.level === 'MEDIUM' ? '🟡' : 'ℹ️'}</span>
              <span style={{ fontSize: '13px', color: '#333' }}>{signal.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {canAct && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => showSuccess('Continuing processing — no fraud concerns.')} disabled={loading}
              style={{ ...btnSuccess, padding: '8px 16px', fontSize: '13px' }}>Continue Processing</button>
            <button onClick={() => showSuccess('Additional verification requested.')} disabled={loading}
              style={{ ...btnWarning, padding: '8px 16px', fontSize: '13px' }}>Request Additional Verification</button>
            <button onClick={handleFlagInvestigation} disabled={loading}
              style={{ ...btnDanger, padding: '8px 16px', fontSize: '13px' }}>
              {loading ? 'Flagging...' : 'Flag Investigation'}
            </button>
          </div>
        )}
        {status === 'UNDER_INVESTIGATION' && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fce4ec', borderRadius: '6px', color: '#c62828', fontWeight: '500' }}>
            ⚠ Claim is currently under investigation
          </div>
        )}
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 9 — Surveyor Assignment
  // -----------------------------------------------
  const renderSection9 = () => (
    <SectionCard number="9" title="Survey Workflow">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Surveyor ID</label>
          <input
            type="text"
            value={surveyorAssignment.surveyor_id}
            onChange={e => handleSurveyAssignmentChange('surveyor_id', e.target.value)}
            disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
            style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Surveyor Name</label>
          <input
            type="text"
            value={surveyorAssignment.surveyor_name}
            onChange={e => handleSurveyAssignmentChange('surveyor_name', e.target.value)}
            disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
            style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Officer Notes to Surveyor</label>
        <textarea
          value={surveyorAssignment.notes}
          onChange={e => handleSurveyAssignmentChange('notes', e.target.value)}
          rows="3"
          disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
          style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical' }}
        />
      </div>

      {status === 'UNDER_REVIEW' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Assign a field surveyor to inspect the vehicle and assess damage.</p>
          <button onClick={handleAssignSurveyor} disabled={loading}
            style={{ ...btnPrimary, borderRadius: '999px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Assigning...' : 'Assign Surveyor'}
          </button>
        </div>
      )}

      {status === 'SURVEY_ASSIGNED' && (
        <div style={{ padding: '12px 16px', backgroundColor: '#e0f7fa', borderRadius: '8px', color: '#006064', fontWeight: '500', marginBottom: '18px' }}>
          ✔ Surveyor assigned — awaiting survey completion
        </div>
      )}

      {latestSurveyReport && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px', marginBottom: '18px' }}>
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <h5 style={{ margin: 0, color: '#17324d', fontSize: '15px' }}>Latest Survey Snapshot</h5>
              <span style={{ padding: '5px 10px', borderRadius: '999px', ...(latestSubmittedSurveyReport ? getRecommendationTone(latestSubmittedSurveyReport.recommendation) : { backgroundColor: '#fff4df', color: '#8a5200' }), fontWeight: '700', fontSize: '11px' }}>
                {latestSubmittedSurveyReport ? latestSubmittedSurveyReport.recommendation : 'Awaiting report'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><span style={infoLabel}>Version: </span><strong>{latestSurveyReport.version_number}</strong></div>
              <div><span style={infoLabel}>Assigned: </span><strong>{formatDateTime(latestSurveyReport.assigned_at)}</strong></div>
              <div><span style={infoLabel}>Surveyor: </span><strong>{latestSurveyReport.surveyor_name || latestSurveyReport.surveyor_id}</strong></div>
              <div><span style={infoLabel}>Submitted: </span><strong>{formatDateTime(latestSubmittedSurveyReport?.submitted_at)}</strong></div>
            </div>

            {latestSubmittedSurveyReport && (
              <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#587087', marginBottom: '4px' }}>Damage Description</div>
                  <div style={{ color: '#17324d', lineHeight: '1.5' }}>{latestSubmittedSurveyReport.damage_description || 'No description provided'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '12px', color: '#587087', marginBottom: '4px' }}>Vehicle Condition</div><div style={{ color: '#17324d', fontWeight: '600' }}>{latestSubmittedSurveyReport.vehicle_condition || 'N/A'}</div></div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '12px', color: '#587087', marginBottom: '4px' }}>Estimated Cost</div><div style={{ color: '#17324d', fontWeight: '600' }}>{formatCurrency(latestSubmittedSurveyReport.estimated_repair_cost)}</div></div>
                  <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '12px', color: '#587087', marginBottom: '4px' }}>Parts Damaged</div><div style={{ color: '#17324d', fontWeight: '600' }}>{latestSubmittedSurveyReport.parts_damaged || 'N/A'}</div></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#fffaf1', border: '1px solid #f1dfb5', borderRadius: '10px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px', color: '#8a5200', fontSize: '15px' }}>Report History</h5>
            {surveyReports.length === 0 ? (
              <div style={{ color: '#8a5200', fontSize: '13px' }}>No survey activity recorded yet.</div>
            ) : (
              surveyReports.map(report => (
                <div key={report.id} style={{ padding: '10px 0', borderBottom: '1px solid #f3e6c7' }}>
                  <div style={{ fontWeight: '600', color: '#8a5200' }}>Version {report.version_number}</div>
                  <div style={{ fontSize: '12px', color: '#8a5200', marginTop: '4px' }}>{report.submitted_at ? `Submitted ${formatDateTime(report.submitted_at)}` : `Assigned ${formatDateTime(report.assigned_at)}`}</div>
                  {report.officer_review_notes && <div style={{ fontSize: '12px', color: '#8a5200', marginTop: '4px' }}>Note: {report.officer_review_notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {status === 'SURVEY_COMPLETED' && (
        <div style={{ borderTop: '1px solid #e8edf3', paddingTop: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#333' }}>Request Re-inspection</label>
          <textarea
            value={reinspectionReason}
            onChange={e => setReinspectionReason(e.target.value)}
            rows="3"
            placeholder="Describe what needs to be rechecked by the surveyor"
            style={{ padding: '10px', width: '100%', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical', marginBottom: '12px' }}
          />
          <button onClick={handleReopenSurvey} disabled={loading}
            style={{ ...btnWarning, borderRadius: '999px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Reassigning...' : 'Send Back For Re-inspection'}
          </button>
        </div>
      )}

      {!['UNDER_REVIEW', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED'].includes(status) && (
        <div style={{ color: '#999', fontSize: '14px' }}>
          {['SUBMITTED'].includes(status) ? 'Complete policy validation first.' : 'Survey workflow is not active for the current status.'}
        </div>
      )}
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 10 — Claim Amount Evaluation (Calculator)
  // -----------------------------------------------
  const renderSection10 = () => (
    <SectionCard number="10" title="Claim Amount Evaluation">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Repair Estimate (₹)</label>
          <input type="number" value={calcRepairEstimate} onChange={e => setCalcRepairEstimate(e.target.value)}
            style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Depreciation (₹)</label>
          <input type="number" value={calcDepreciation} onChange={e => setCalcDepreciation(e.target.value)}
            style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>Deductible (₹)</label>
          <input type="number" value={calcDeductible} onChange={e => setCalcDeductible(e.target.value)}
            style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} placeholder="0" />
        </div>
      </div>
      <div style={{ padding: '16px 20px', backgroundColor: '#e3f2fd', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1976d2' }}>Final Payable Amount</span>
        <span style={{ fontSize: '24px', fontWeight: '700', color: '#1976d2' }}>₹{calculatedPayable.toLocaleString()}</span>
      </div>
      {policy?.idv_amount && calculatedPayable > policy.idv_amount && (
        <div style={{ marginTop: '10px', padding: '10px 16px', backgroundColor: '#fff3e0', borderRadius: '6px', color: '#e65100', fontSize: '13px' }}>
          ⚠ Calculated amount exceeds IDV (₹{policy.idv_amount.toLocaleString()}). Settlement will be capped at IDV.
        </div>
      )}
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 11 — Decision Panel
  // -----------------------------------------------
  const renderSection11 = () => {
    if (isTerminal || status === 'APPROVED') {
      return (
        <SectionCard number="11" title="Decision Panel">
          <div style={{ padding: '16px', backgroundColor: status === 'APPROVED' ? '#e8f5e9' : '#ffebee', borderRadius: '8px' }}>
            <strong style={{ color: status === 'APPROVED' ? '#2e7d32' : '#c62828' }}>
              {status === 'APPROVED' ? '✔ Claim Approved' : status === 'REJECTED' ? '✘ Claim Rejected' : `Claim ${status}`}
            </strong>
            {settlementResult?.settlement && (
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Final Payable: <strong>₹{settlementResult.settlement.final_payable?.toLocaleString()}</strong>
                {settlementResult.settlement.idv_capped && <span style={{ color: '#ff9800', marginLeft: '8px' }}>*IDV Cap Applied</span>}
              </div>
            )}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="11" title="Decision Panel">
        {!canDecide && (
          <div style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
            Complete previous review steps before making a decision. Current status: {status}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {/* Approve */}
          <div style={{ border: '1px solid #4caf50', borderRadius: '8px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px', color: '#2e7d32' }}>Approve Claim</h5>
            <form onSubmit={handleApprove}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Vehicle Age (Years):</label>
                <input type="number" step="0.1" value={vehicleAgeYears} onChange={e => setVehicleAgeYears(e.target.value)} required
                  style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Parts:</label>
                {parts.map((part, index) => (
                  <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input type="text" placeholder="Type" value={part.type} onChange={e => updatePart(index, 'type', e.target.value)}
                      style={{ padding: '6px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }} />
                    <input type="number" placeholder="₹" value={part.amount} onChange={e => updatePart(index, 'amount', e.target.value)}
                      style={{ padding: '6px', width: '80px', borderRadius: '4px', border: '1px solid #ddd' }} />
                    {parts.length > 1 && (
                      <button type="button" onClick={() => removePart(index)}
                        style={{ padding: '6px', cursor: 'pointer', backgroundColor: '#ffebee', border: 'none', borderRadius: '4px', color: '#c62828' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPart}
                  style={{ padding: '6px', cursor: 'pointer', fontSize: '12px', backgroundColor: '#e3f2fd', border: 'none', borderRadius: '4px', color: '#1976d2' }}>+ Add Part</button>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Deductible (₹):</label>
                <input type="number" step="0.01" value={deductibleAmount} onChange={e => setDeductibleAmount(e.target.value)} required
                  style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                style={{ ...btnSuccess, width: '100%', padding: '10px', opacity: (loading || !canDecide) ? 0.6 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </form>
          </div>

          {/* Reject */}
          <div style={{ border: '1px solid #f44336', borderRadius: '8px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px', color: '#c62828' }}>Reject Claim</h5>
            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Rejection Reason:</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} required rows="5"
                  style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                style={{ ...btnDanger, width: '100%', padding: '10px', opacity: (loading || !canDecide) ? 0.6 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </form>
          </div>

          {/* Escalate */}
          <div style={{ border: '1px solid #ff9800', borderRadius: '8px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px', color: '#e65100' }}>Escalate Claim</h5>
            <form onSubmit={handleEscalate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500' }}>Escalation Reason:</label>
                <textarea value={escalationReason} onChange={e => setEscalationReason(e.target.value)} required rows="5"
                  style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                style={{ ...btnWarning, width: '100%', padding: '10px', opacity: (loading || !canDecide) ? 0.6 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Escalate'}
              </button>
            </form>
          </div>
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 12 — Settlement Processing
  // -----------------------------------------------
  const renderSection12 = () => {
    const isApproved = status === 'APPROVED'
    const isRepair = status === 'REPAIR_IN_PROGRESS'
    const isPaymentProcessing = status === 'PAYMENT_PROCESSING'
    const isPaid = status === 'PAID'

    if (!isApproved && !isRepair && !isPaymentProcessing && !isPaid) {
      return (
        <SectionCard number="12" title="Settlement Processing">
          <div style={{ color: '#999', fontSize: '14px' }}>
            {isTerminal ? 'Settlement processing not applicable.' : 'Claim must be approved before settlement processing.'}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="12" title="Settlement Processing">
        {/* Settlement Type Selection */}
        {isApproved && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '12px' }}>Settlement Type:</label>
            <select value={settlementType} onChange={e => setSettlementType(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}>
              <option value="cashless">Cashless Repair</option>
              <option value="reimbursement">Reimbursement</option>
            </select>
          </div>
        )}

        {/* Status Progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {settlementType === 'cashless' ? (
            <>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isApproved ? '#4caf50' : '#e0e0e0', color: isApproved ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>APPROVED</span>
              <span style={{ color: '#ccc' }}>→</span>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isRepair ? '#ff5722' : '#e0e0e0', color: isRepair ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>REPAIR_IN_PROGRESS</span>
              <span style={{ color: '#ccc' }}>→</span>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isPaid ? '#4caf50' : '#e0e0e0', color: isPaid ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>PAID</span>
            </>
          ) : (
            <>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isApproved ? '#4caf50' : '#e0e0e0', color: isApproved ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>APPROVED</span>
              <span style={{ color: '#ccc' }}>→</span>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isPaymentProcessing ? '#3f51b5' : '#e0e0e0', color: isPaymentProcessing ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>PAYMENT_PROCESSING</span>
              <span style={{ color: '#ccc' }}>→</span>
              <span style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: isPaid ? '#4caf50' : '#e0e0e0', color: isPaid ? 'white' : '#999', fontWeight: '600', fontSize: '13px' }}>PAID</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isApproved && settlementType === 'cashless' && (
            <button onClick={() => handleUpdateSettlementStatus('REPAIR_IN_PROGRESS')} disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Start Repair</button>
          )}
          {isApproved && settlementType === 'reimbursement' && (
            <button onClick={() => handleUpdateSettlementStatus('PAYMENT_PROCESSING')} disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Start Payment Processing</button>
          )}
          {isRepair && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Mark Repair Complete & Paid</button>
          )}
          {isPaymentProcessing && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Mark as Paid</button>
          )}
          {isPaid && (
            <div style={{ padding: '12px 16px', backgroundColor: '#e8f5e9', borderRadius: '6px', color: '#2e7d32', fontWeight: '500' }}>
              ✔ Payment completed — proceed to claim closure
            </div>
          )}
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 13 — Claim Closure
  // -----------------------------------------------
  const renderSection13 = () => {
    const canClose = ['PAID', 'APPROVED'].includes(status)

    return (
      <SectionCard number="13" title="Claim Closure">
        {status === 'CLOSED' ? (
          <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px' }}>✔</span>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2e7d32', marginTop: '8px' }}>Claim Closed</div>
          </div>
        ) : canClose ? (
          <div>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
              Close this claim to complete the processing workflow.
            </p>
            <button onClick={handleCloseClaimFinal} disabled={loading}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Closing...' : 'Close Claim'}
            </button>
          </div>
        ) : (
          <div style={{ color: '#999', fontSize: '14px' }}>
            {isTerminal ? 'Claim is already in a terminal state.' : 'Claim must be approved and payment completed before closure.'}
          </div>
        )}
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // Render: Workflow Panel (all 13 sections)
  // -----------------------------------------------
  const renderWorkflowPanel = () => {
    if (!selectedClaim) return null

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Claim #{selectedClaim.id}</h2>
            <p style={{ margin: '4px 0 0', color: '#666' }}>{selectedClaim.claim_number}</p>
          </div>
          <button onClick={handleBackToQueue}
            style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#666', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Back to Queue
          </button>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div style={{ color: '#f44336', padding: '12px', marginBottom: '16px', backgroundColor: '#ffebee', borderRadius: '6px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {successMessage && (
          <div style={{ color: '#2e7d32', padding: '12px', marginBottom: '16px', backgroundColor: '#e8f5e9', borderRadius: '6px' }}>
            <strong>✔</strong> {successMessage}
          </div>
        )}

        {/* Escalation Notice */}
        {status === 'ESCALATED' && (
          <div style={{ backgroundColor: '#fff3e0', border: '1px solid #ff9800', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ fontSize: '20px', marginRight: '10px' }}>⚠️</span>
            <span style={{ color: '#e65100', fontWeight: '600' }}>Claim escalated to senior officer for review.</span>
          </div>
        )}

        {/* All 13 Sections */}
        {renderSection1()}
        {renderSection2()}
        {renderSection3()}
        {renderSection4()}
        {renderSection5()}
        {renderSection6()}
        {renderSection7()}
        {renderSection8()}
        {renderSection9()}
        {renderSection10()}
        {renderSection11()}
        {renderSection12()}
        {renderSection13()}

        {/* Timeline */}
        {renderTimeline()}
      </div>
    )
  }

  // -----------------------------------------------
  // Main Render
  // -----------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      <header style={{ backgroundColor: 'white', padding: '16px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#1976d2' }}>Claims Officer Console</h1>
        <button onClick={onSwitchRole}
          style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#666', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
          Switch Role
        </button>
      </header>
      <main style={{ padding: '24px 32px' }}>
        {selectedClaim ? renderWorkflowPanel() : renderClaimsQueue()}
      </main>
    </div>
  )
}

export default OfficerDashboard
