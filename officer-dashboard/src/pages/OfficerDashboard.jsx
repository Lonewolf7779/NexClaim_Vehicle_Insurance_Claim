import React, { useState, useEffect, useRef } from 'react'
import { claimService, policyService } from '../services/api'
import gsap from 'gsap'

const REQUEST_DOCUMENT_TYPE_OPTIONS = [
  'DRIVING_LICENSE',
  'RC_BOOK',
  'BANK_DETAILS',
  'FIR',
  'REPAIR_ESTIMATE',
  'DAMAGE_PHOTOS'
]

// Section Card wrapper for workflow sections
const SectionCard = ({ number, title, children, color = '#ffffff' }) => (
  <div style={{ marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
    <div style={{ padding: '16px 24px', backgroundColor: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ backgroundColor: '#fff', color: '#000', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', flexShrink: 0 }}>{number}</span>
      <h4 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '600', letterSpacing: '-0.5px' }}>{title}</h4>
    </div>
    <div style={{ padding: '24px', color: '#e0e0e0' }}>{children}</div>
  </div>
)

function OfficerDashboard({ onSwitchRole }) {
  const dashboardRef = useRef(null)

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

  // Request Additional Documents modal
  const [requestDocsOpen, setRequestDocsOpen] = useState(false)
  const [requestDocsTypes, setRequestDocsTypes] = useState([])
  const [requestDocsReason, setRequestDocsReason] = useState('')
  const [requestDocsSubmitting, setRequestDocsSubmitting] = useState(false)
  const [requestDocsError, setRequestDocsError] = useState(null)

  // Extracted documents from backend
  const [claimDocuments, setClaimDocuments] = useState([])

  useEffect(() => {
    fetchClaims()
    const ctx = gsap.context(() => {
      gsap.fromTo(dashboardRef.current, 
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: 0.2 }
      )
    }, dashboardRef)
    return () => ctx.revert()
  }, [])

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
    setRequestDocsOpen(false)
    setRequestDocsTypes([])
    setRequestDocsReason('')
    setRequestDocsSubmitting(false)
    setRequestDocsError(null)

    try {
      const claimResponse = await claimService.getClaim(claim.id)
      setSelectedClaim(claimResponse.data)
      if (claimResponse.data.policy_id) {
        const raw = claimResponse.data.policy_id
        const pid = Number(raw)
        if (Number.isInteger(pid)) {
          try {
            const policyResponse = await policyService.getPolicy(pid)
            setPolicy(policyResponse.data)
          } catch (e) {
            console.error('Failed to fetch policy by id', pid, e)
          }
        } else if (typeof raw === 'string' && raw.trim()) {
          try {
            const policyResponse = await policyService.getPolicyByNumber(raw)
            setPolicy(policyResponse.data)
          } catch (e) {
            console.error('Failed to fetch policy by policy_number fallback', raw, e)
          }
        } else {
          console.warn('Claim has invalid policy_id value:', raw)
        }
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

  const handleToggleRequestDocType = (docType) => {
    setRequestDocsTypes((prev) => {
      if (prev.includes(docType)) return prev.filter((t) => t !== docType)
      return [...prev, docType]
    })
  }

  const openRequestDocsModal = () => {
    setRequestDocsError(null)
    setRequestDocsOpen(true)
  }

  const closeRequestDocsModal = () => {
    if (requestDocsSubmitting) return
    setRequestDocsOpen(false)
    setRequestDocsError(null)
  }

  const handleSubmitRequestDocs = async (e) => {
    e.preventDefault()
    if (!selectedClaim) return

    const reason = requestDocsReason.trim()
    if (requestDocsTypes.length === 0) {
      setRequestDocsError('Select at least one missing document type.')
      return
    }
    if (!reason) {
      setRequestDocsError('Provide a reason for the customer.')
      return
    }

    setRequestDocsSubmitting(true)
    setRequestDocsError(null)
    try {
      const payload = { document_types: requestDocsTypes, reason }
      await claimService.requestDocuments(selectedClaim.id, payload)
      await refreshClaimData(selectedClaim.id)
      setRequestDocsOpen(false)
      setRequestDocsTypes([])
      setRequestDocsReason('')
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to request documents.'
      setRequestDocsError(message)
    } finally {
      setRequestDocsSubmitting(false)
    }
  }

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
  const canRequestDocuments = ['UNDER_REVIEW', 'SUBMITTED'].includes(status)

  // Reusable styles for dark brutalist aesthetic
  const btnPrimary = { padding: '12px 24px', cursor: 'pointer', backgroundColor: '#fff', color: '#0d0d0d', border: 'none', borderRadius: '999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease' }
  const btnSuccess = { padding: '12px 24px', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease' }
  const btnDanger = { padding: '12px 24px', cursor: 'pointer', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease' }
  const btnWarning = { padding: '12px 24px', cursor: 'pointer', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '999px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease' }
  const btnOutline = { padding: '12px 24px', cursor: 'pointer', backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease' }
  
  const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '15px' }
  const infoItem = { padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }
  const infoLabel = { color: '#a3a3a3', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em', display: 'block', marginBottom: '8px', fontWeight: '600' }

  const brutalInput = {
    padding: '16px 20px',
    backgroundColor: '#111',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease, background-color 0.3s ease',
    outline: 'none'
  }

  const sectionPill = {
    padding: '8px 16px',
    borderRadius: '999px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.05em'
  }

  const hoverEffect = (e) => { e.currentTarget.style.transform = 'scale(1.02)' }
  const leaveEffect = (e) => { e.currentTarget.style.transform = 'scale(1)' }

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
      background: 'transparent',
      borderRadius: '24px', 
      padding: '32px 24px',
      border: '1px solid rgba(255,255,255,0.1)', 
      borderTop: `4px solid ${color}`,
      flex: '1', 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    })

    return (
      <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', flexWrap: 'wrap' }}>
        <div style={cardStyle('#ffffff')}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#fff', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 1 }}>{todayClaims.length}</div>
          <div style={{ fontSize: '13px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Claims Today</div>
        </div>
        <div style={cardStyle('#666666')}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#a3a3a3', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 1 }}>{claims.filter(c => c.status === 'SUBMITTED').length}</div>
          <div style={{ fontSize: '13px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Submitted</div>
        </div>
        <div style={cardStyle('#3b82f6')}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#3b82f6', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 1 }}>{underReview}</div>
          <div style={{ fontSize: '13px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Under Review</div>
        </div>
        <div style={cardStyle('#10b981')}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#10b981', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 1 }}>{surveyPending}</div>
          <div style={{ fontSize: '13px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Survey Pending</div>
        </div>
        <div style={cardStyle('#f59e0b')}>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#f59e0b', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 1 }}>{escalated}</div>
          <div style={{ fontSize: '13px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Escalated</div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------
  // Render: Claims Queue Table
  // -----------------------------------------------
  const renderClaimsQueue = () => (
    <div style={{ animation: 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ margin: 0, fontSize: '5vw', color: '#ffffff', fontFamily: "'Bebas Neue', 'Oswald', sans-serif", lineHeight: 0.9, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>CLAIMS_QUEUE</h2>
          <p style={{ margin: '16px 0 0', color: '#a3a3a3', fontSize: '18px', letterSpacing: '-0.01em' }}>Monitor and orchestrate global operations.</p>
        </div>
        <button onClick={fetchClaims} disabled={loadingClaims}
          style={{ ...btnPrimary, backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', opacity: loadingClaims ? 0.6 : 1, cursor: loadingClaims ? 'not-allowed' : 'pointer' }}>
          {loadingClaims ? 'SYNCING...' : 'REFRESH QUEUE'}
        </button>
      </div>

      {error && (
        <div style={{ color: '#ef4444', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}

      {renderStatistics()}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '16px', marginBottom: '40px' }}>
        <input
          type="text"
          value={queueSearch}
          onChange={e => setQueueSearch(e.target.value)}
          placeholder="SEARCH BY CLAIM NUMBER, POLICY ID..."
          style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', backgroundColor: '#111', color: '#fff', letterSpacing: '0.05em' }}
        />
        <select
          value={queueStatusFilter}
          onChange={e => setQueueStatusFilter(e.target.value)}
          style={{ padding: '20px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', backgroundColor: '#111', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}
        >
          <option value="ALL">ALL STATUSES</option>
          {['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_REQUIRED', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED', 'UNDER_INVESTIGATION', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      {/* Active Claims */}
      <div style={{ marginBottom: '60px' }}>
        <h3 style={{ color: '#fff', marginBottom: '24px', fontFamily: "'Bebas Neue', Oswald, sans-serif", fontSize: '2.5rem', letterSpacing: '-0.02em' }}>ACTIVE_ ({activeClaims.length})</h3>
        {activeClaims.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>NO ACTIVE CLAIMS DETECTED.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#111', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ backgroundColor: '#0d0d0d' }}>
                  {['Claim ID', 'Claim Number', 'Policy ID', 'Survey', 'Incident Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '20px', textAlign: h === 'Action' ? 'center' : 'left', fontWeight: '800', color: '#666', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeClaims.map((claim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s ease', cursor: 'grab' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '20px', color: '#a3a3a3' }}>#{claim.id}</td>
                    <td style={{ padding: '20px', fontWeight: '700', color: '#fff' }}>{claim.claim_number}</td>
                    <td style={{ padding: '20px', color: '#a3a3a3' }}>{claim.policy_id}</td>
                    <td style={{ padding: '20px' }}>
                      {claim.latest_survey_report ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{claim.latest_survey_report.surveyor_name || claim.latest_survey_report.surveyor_id}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textTransform: 'uppercase' }}>{claim.latest_survey_report.submitted_at ? 'Report submitted' : 'Awaiting report'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#444', fontSize: '13px', textTransform: 'uppercase' }}>Not assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '20px', color: '#a3a3a3' }}>{claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: getStatusColor(claim.status), color: '#000', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <button onClick={() => handleOpenClaim(claim)} style={{ ...btnOutline, padding: '8px 20px', fontSize: '11px', backgroundColor: '#fff', color: '#000' }}>
                        INSPECT
                      </button>
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
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{ color: '#666', marginBottom: '24px', fontFamily: "'Bebas Neue', Oswald, sans-serif", fontSize: '2.5rem', letterSpacing: '-0.02em' }}>PROCESSED_ ({processedClaims.length})</h3>
          <div style={{ backgroundColor: '#111', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', opacity: 0.7 }}>
              <thead>
                <tr style={{ backgroundColor: '#0d0d0d' }}>
                  {['Claim ID', 'Claim Number', 'Policy ID', 'Survey', 'Incident Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '20px', textAlign: h === 'Action' ? 'center' : 'left', fontWeight: '800', color: '#666', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedClaims.map((claim) => (
                  <tr key={claim.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'transparent' }}>
                    <td style={{ padding: '20px', color: '#a3a3a3' }}>#{claim.id}</td>
                    <td style={{ padding: '20px', fontWeight: '700', color: '#fff' }}>{claim.claim_number}</td>
                    <td style={{ padding: '20px', color: '#666' }}>{claim.policy_id}</td>
                    <td style={{ padding: '20px' }}>
                      {claim.latest_survey_report ? (
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{claim.latest_survey_report.surveyor_name || claim.latest_survey_report.surveyor_id}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textTransform: 'uppercase' }}>{claim.latest_survey_report.recommendation || 'No recommendation'}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#444', fontSize: '13px', textTransform: 'uppercase' }}>No survey used</span>
                      )}
                    </td>
                    <td style={{ padding: '20px', color: '#666' }}>{claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}</td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {claim.status}
                      </span>
                    </td>
                    <td style={{ padding: '20px', textAlign: 'center' }}>
                      <button onClick={() => handleOpenClaim(claim)} style={{ padding: '8px 20px', cursor: 'pointer', backgroundColor: 'transparent', color: '#666', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>VIEW ARCHIVE</button>
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
      <div style={{ marginTop: '40px', padding: '40px 32px', backgroundColor: '#111', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ marginBottom: '40px', color: '#fff', fontSize: '2.5rem', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>CLAIM_TIMELINE</h4>
        <div style={{ position: 'relative', paddingLeft: '32px' }}>
          <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          {claimHistory.map((history, index) => (
            <div key={index} style={{ position: 'relative', marginBottom: '32px', opacity: index === claimHistory.length - 1 ? 1 : 0.6 }}>
              <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: index === claimHistory.length - 1 ? '#10b981' : '#fff', border: '2px solid #111', boxShadow: '0 0 0 2px rgba(255,255,255,0.2)' }} />
              <div style={{ fontSize: '15px', color: '#fff', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{history.new_status}</div>
              <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '6px', letterSpacing: '0.05em' }}>{formatDateTime(history.changed_at)}</div>
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
    <SectionCard number="1" title="CLAIM_SUMMARY">
      <div style={infoGrid}>
        <div style={infoItem}><span style={infoLabel}>Claim ID: </span><strong style={{ color: '#fff' }}>#{selectedClaim.id}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Number: </span><strong style={{ color: '#fff' }}>{selectedClaim.claim_number}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Customer Name: </span><strong style={{ color: '#fff' }}>{policy?.policy_holder_name || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Policy Number: </span><strong style={{ color: '#fff' }}>{policy?.policy_number || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Vehicle Number: </span><strong style={{ color: '#fff' }}>{policy?.vehicle_number || 'Loading...'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Vehicle Model: </span><strong style={{ color: '#fff' }}>{policy?.vehicle_model || 'N/A'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Type: </span><strong style={{ color: '#fff' }}>{selectedClaim.claim_type || 'Not specified'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Incident Date: </span><strong style={{ color: '#fff' }}>{formatDateTime(selectedClaim.incident_date)}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Current Status: </span>
          <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: getStatusColor(selectedClaim.status), color: '#000', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>
            {selectedClaim.status}
          </span>
        </div>
        <div style={infoItem}><span style={infoLabel}>IDV Amount: </span><strong style={{ color: '#fff' }}>{policy?.idv_amount ? formatCurrency(policy.idv_amount) : 'N/A'}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Survey Reports: </span><strong style={{ color: '#fff' }}>{surveyReports.length}</strong></div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <span style={infoLabel}>Incident Description: </span>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#e0e0e0', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
      <SectionCard number="2" title="POLICY_VALIDATION">
        <div style={{ marginBottom: '24px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: c.pass ? '#10b981' : '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>{c.pass ? '✔' : '✘'}</span>
              <span style={{ color: c.pass ? '#fff' : '#ef4444', fontWeight: '600', fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{c.label}</span>
            </div>
          ))}
        </div>
        {policy && (
          <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            PERIOD: <span style={{ color: '#fff' }}>{formatDate(policy.policy_start_date)} — {formatDate(policy.policy_end_date)}</span>
          </div>
        )}
        {status === 'SUBMITTED' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={handleValidatePolicy} disabled={loading || !allPolicyChecksPass}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: (loading || !allPolicyChecksPass) ? 0.6 : 1, cursor: (loading || !allPolicyChecksPass) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'VALIDATING...' : 'VALIDATE POLICY'}
            </button>
            <button onClick={handleQuickReject} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnDanger, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              REJECT CLAIM
            </button>
          </div>
        )}
        {status !== 'SUBMITTED' && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            ✔ POLICY VALIDATION COMPLETED
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
      { key: 'aadhar', label: 'AADHAAR NUMBER', value: policy?.aadhar_number },
      { key: 'pan', label: 'PAN NUMBER', value: policy?.pan_number },
      { key: 'dl', label: 'DRIVING LICENSE', value: policy?.driving_license_number },
    ]

    return (
      <SectionCard number="3" title="IDENTITY_VERIFICATION">
        <div style={{ display: 'grid', gap: '16px' }}>
          {documents.map(doc => (
            <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '4px' }}>{doc.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' }}>{doc.value || 'NOT AVAILABLE'}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {identityStatus[doc.key] === 'verified' && <span style={{ color: '#10b981', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✔ VERIFIED</span>}
                {identityStatus[doc.key] === 'reupload' && <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>⟳ REUPLOAD REQUESTED</span>}
                {identityStatus[doc.key] === 'rejected' && <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✘ REJECTED</span>}
                {canReview && (
                  <>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>VERIFY</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>REUPLOAD</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'rejected' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>REJECT</button>
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
      { key: 'rc', label: 'RC NUMBER', value: policy?.rc_number, check: 'Vehicle number matches RC' },
      { key: 'policy_doc', label: 'POLICY DOCUMENT', value: policy?.policy_number, check: 'Owner matches policy holder' },
    ]

    return (
      <SectionCard number="4" title="VEHICLE_DOCUMENTS">
        <div style={{ display: 'grid', gap: '16px' }}>
          {vehicleDocs.map(doc => (
            <div key={doc.key} style={{ padding: '20px 24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '4px' }}>{doc.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' }}>{doc.value || 'NOT AVAILABLE'}</div>
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>✔ {doc.check}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {vehicleDocsStatus[doc.key] === 'verified' && <span style={{ color: '#10b981', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✔ VERIFIED</span>}
                  {vehicleDocsStatus[doc.key] === 'reupload' && <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>⟳ REUPLOAD REQUESTED</span>}
                  {canReview && (
                    <>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>VERIFY RC</button>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>REQUEST REUPLOAD</button>
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
    <SectionCard number="5" title="INCIDENT_REVIEW">
      <div style={infoGrid}>
        <div style={infoItem}><span style={infoLabel}>Incident Date: </span><strong style={{ color: '#fff' }}>{formatDateTime(selectedClaim.incident_date)}</strong></div>
        <div style={infoItem}><span style={infoLabel}>Claim Type: </span><strong style={{ color: '#fff' }}>{selectedClaim.claim_type || 'Not specified'}</strong></div>
      </div>
      <div style={{ marginTop: '24px', marginBottom: '32px' }}>
        <span style={infoLabel}>Incident Description:</span>
        <p style={{ margin: '8px 0 0', padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '15px', color: '#e0e0e0' }}>
          {selectedClaim.description || 'No description provided'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {incidentStatus === 'valid' && <span style={{ color: '#10b981', fontWeight: '800', letterSpacing: '0.05em' }}>✔ VALIDATED</span>}
        {incidentStatus === 'suspicious' && <span style={{ color: '#ef4444', fontWeight: '800', letterSpacing: '0.05em' }}>⚠ FLAGGED SUSPICIOUS</span>}
        {canReview && (
          <>
            <button onClick={() => setIncidentStatus('valid')}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, padding: '12px 24px', fontSize: '12px' }}>MARK VALID</button>
            <button onClick={() => setIncidentStatus('suspicious')}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnWarning, padding: '12px 24px', fontSize: '12px' }}>FLAG SUSPICIOUS</button>
          </>
        )}
      </div>
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 6 — Customer Document Review
  // -----------------------------------------------
  const handleViewDocument = (doc) => {
    const docType = String(doc?.document_type || doc?.type || 'DOCUMENT')
    const label = String(doc?.label || docType).replace(/_/g, ' ')
    const filePath = doc?.file_path
    if (!filePath) return

    const separator = filePath.includes('?') ? '&' : '?'
    const url = `http://localhost:8000${filePath}${separator}t=${Date.now()}`
    setPreviewDoc({ label, url })
  }

  const renderSection6 = () => {
    const documents = Array.isArray(claimDocuments) ? claimDocuments : []

    return (
      <SectionCard number="6" title="DOCUMENT_REVIEW">
        {documents.length === 0 ? (
          <div style={{ color: '#666', fontSize: '15px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>NO DOCUMENTS UPLOADED.</div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#a3a3a3', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {documents.length} DOCUMENT(S) AVAILABLE FOR REVIEW.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {documents.map(doc => {
                const docType = String(doc?.document_type || 'DOCUMENT')
                const label = docType.replace(/_/g, ' ')
                const fieldCount = Array.isArray(doc?.fields) ? doc.fields.length : 0
                const canView = Boolean(doc?.file_path)

                return (
                  <div key={doc?.id ?? `${docType}-${doc?.extracted_at ?? ''}`} style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '28px', opacity: 0.8 }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '14px' }}>{label}</div>
                        {doc?.extracted_at && <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.05em' }}>UPLOADED {formatDateTime(doc.extracted_at)}</div>}
                        {fieldCount > 0 && <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>{fieldCount} EXTRACTED FIELDS</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => canView && handleViewDocument(doc)}
                      disabled={!canView}
                      onMouseEnter={canView ? hoverEffect : null}
                      onMouseLeave={canView ? leaveEffect : null}
                      style={{
                        ...btnOutline,
                        padding: '10px 20px',
                        fontSize: '11px',
                        opacity: canView ? 1 : 0.3,
                        cursor: canView ? 'pointer' : 'not-allowed',
                      }}
                    >
                      VIEW
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Document Preview Modal */}
        {previewDoc && previewDoc.url && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}
            onClick={() => setPreviewDoc(null)}>
            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '32px', width: '96vw', height: '94vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontFamily: "'Bebas Neue', Oswald, sans-serif", fontSize: '2rem', letterSpacing: '0.05em' }}>{previewDoc.label}</h3>
                <button onClick={() => setPreviewDoc(null)} onMouseEnter={hoverEffect} onMouseLeave={leaveEffect} style={{ ...btnOutline, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>CLOSE PREVIEW</button>
              </div>
              <iframe
                src={previewDoc.url}
                style={{ flex: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', width: '100%', backgroundColor: '#fff' }}
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
      <SectionCard number="7" title="DOCUMENT_CHECKLIST">
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em', marginBottom: '8px' }}>CLAIM TYPE:</label>
          <select value={selectedClaimType} onChange={e => setSelectedClaimType(e.target.value)}
            style={{ ...brutalInput, maxWidth: '300px' }}>
            <option value="minor_damage" style={{ backgroundColor: '#111' }}>MINOR DAMAGE</option>
            <option value="accident_major" style={{ backgroundColor: '#111' }}>ACCIDENT MAJOR</option>
            <option value="theft" style={{ backgroundColor: '#111' }}>THEFT</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '800' }}>—</span>
              <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{item}</span>
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
    const scoreColor = fraudRisk.score === 'HIGH' ? '#ef4444' : fraudRisk.score === 'MEDIUM' ? '#f59e0b' : '#10b981'
    const canAct = ['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)

    return (
      <SectionCard number="8" title="FRAUD_RISK_REVIEW">
        {/* Risk Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600' }}>RISK SCORE:</div>
          <span style={{ padding: '8px 24px', borderRadius: '999px', backgroundColor: 'transparent', color: scoreColor, border: `1px solid ${scoreColor}`, fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em' }}>
            {fraudRisk.score}
          </span>
        </div>

        {/* Risk Signals */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '16px', color: '#a3a3a3', letterSpacing: '0.1em' }}>DETECTED SIGNALS</div>
          {fraudRisk.signals.map((signal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '12px', backgroundColor: signal.level === 'HIGH' ? 'rgba(239, 68, 68, 0.05)' : signal.level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${signal.level === 'HIGH' ? 'rgba(239,68,68,0.2)' : signal.level === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              <span style={{ fontSize: '14px' }}>{signal.level === 'HIGH' ? '🔴' : signal.level === 'MEDIUM' ? '🟡' : 'ℹ️'}</span>
              <span style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '500', letterSpacing: '0.02em' }}>{signal.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {canAct && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => showSuccess('Continuing processing — no fraud concerns.')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, padding: '12px 24px', fontSize: '12px' }}>CONTINUE PROCESSING</button>
            <button onClick={() => showSuccess('Additional verification requested.')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnWarning, padding: '12px 24px', fontSize: '12px' }}>REQUEST VERIFICATION</button>
            <button onClick={handleFlagInvestigation} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnDanger, padding: '12px 24px', fontSize: '12px' }}>
              {loading ? 'FLAGGING...' : 'FLAG INVESTIGATION'}
            </button>
          </div>
        )}
        {status === 'UNDER_INVESTIGATION' && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: '700', letterSpacing: '0.05em', fontSize: '13px' }}>
            ⚠ CLAIM CURRENTLY UNDER INVESTIGATION.
          </div>
        )}
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 9 — Surveyor Assignment
  // -----------------------------------------------
  const renderSection9 = () => (
    <SectionCard number="9" title="SURVEY_WORKFLOW">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>SURVEYOR ID</label>
          <input
            type="text"
            value={surveyorAssignment.surveyor_id}
            onChange={e => handleSurveyAssignmentChange('surveyor_id', e.target.value)}
            disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
            style={{ ...brutalInput, opacity: (loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)) ? 0.3 : 1 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>SURVEYOR NAME</label>
          <input
            type="text"
            value={surveyorAssignment.surveyor_name}
            onChange={e => handleSurveyAssignmentChange('surveyor_name', e.target.value)}
            disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
            style={{ ...brutalInput, opacity: (loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)) ? 0.3 : 1 }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>OFFICER NOTES TO SURVEYOR</label>
        <textarea
          value={surveyorAssignment.notes}
          onChange={e => handleSurveyAssignmentChange('notes', e.target.value)}
          rows="4"
          disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
          style={{ ...brutalInput, resize: 'vertical', minHeight: '100px', opacity: (loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)) ? 0.3 : 1 }}
        />
      </div>

      {status === 'UNDER_REVIEW' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#a3a3a3', fontSize: '13px', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', maxWidth: '400px', lineHeight: '1.6' }}>ASSIGN A FIELD SURVEYOR TO INSPECT THE VEHICLE AND ASSESS DAMAGE.</p>
          <button onClick={handleAssignSurveyor} disabled={loading}
            onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
            style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'ASSIGNING...' : 'ASSIGN SURVEYOR'}
          </button>
        </div>
      )}

      {status === 'SURVEY_ASSIGNED' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', color: '#38bdf8', fontWeight: '700', marginBottom: '24px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '13px', letterSpacing: '0.05em' }}>
          ✔ SURVEYOR ASSIGNED — AWAITING SURVEY COMPLETION
        </div>
      )}

      {latestSurveyReport && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <h5 style={{ margin: 0, color: '#fff', fontSize: '18px', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>LATEST SNAPSHOT</h5>
              <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: latestSubmittedSurveyReport ? getRecommendationTone(latestSubmittedSurveyReport.recommendation).backgroundColor : 'rgba(255,255,255,0.1)', color: latestSubmittedSurveyReport ? getRecommendationTone(latestSubmittedSurveyReport.recommendation).color : '#fff', fontWeight: '800', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {latestSubmittedSurveyReport ? latestSubmittedSurveyReport.recommendation : 'AWAITING REPORT'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>VERSION: </span><strong style={{ color: '#fff' }}>{latestSurveyReport.version_number}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>ASSIGNED: </span><strong style={{ color: '#fff' }}>{formatDateTime(latestSurveyReport.assigned_at)}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>SURVEYOR: </span><strong style={{ color: '#fff' }}>{latestSurveyReport.surveyor_name || latestSurveyReport.surveyor_id}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>SUBMITTED: </span><strong style={{ color: '#fff' }}>{formatDateTime(latestSubmittedSurveyReport?.submitted_at)}</strong></div>
            </div>

            {latestSubmittedSurveyReport && (
              <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: '600' }}>DAMAGE DESCRIPTION</div>
                  <div style={{ color: '#e0e0e0', lineHeight: '1.6', fontSize: '14px' }}>{latestSubmittedSurveyReport.damage_description || 'No description provided'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>CONDITION</div><div style={{ color: '#fff', fontWeight: '700' }}>{latestSubmittedSurveyReport.vehicle_condition || 'N/A'}</div></div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>ESTIMATE</div><div style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(latestSubmittedSurveyReport.estimated_repair_cost)}</div></div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>PARTS DAMAGED</div><div style={{ color: '#fff', fontWeight: '700' }}>{latestSubmittedSurveyReport.parts_damaged || 'N/A'}</div></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
            <h5 style={{ margin: '0 0 20px', color: '#fff', fontSize: '18px', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>REPORT HISTORY</h5>
            {surveyReports.length === 0 ? (
              <div style={{ color: '#666', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NO SURVEY ACTIVITY YET.</div>
            ) : (
              surveyReports.map(report => (
                <div key={report.id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em' }}>VERSION {report.version_number}</div>
                  <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '6px', letterSpacing: '0.05em' }}>{report.submitted_at ? `SUBMITTED ${formatDateTime(report.submitted_at)}` : `ASSIGNED ${formatDateTime(report.assigned_at)}`}</div>
                  {report.officer_review_notes && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px', fontStyle: 'italic' }}>NOTE: {report.officer_review_notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {status === 'SURVEY_COMPLETED' && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>REQUEST RE-INSPECTION</label>
          <textarea
            value={reinspectionReason}
            onChange={e => setReinspectionReason(e.target.value)}
            rows="3"
            placeholder="Describe what needs to be rechecked..."
            style={{ ...brutalInput, marginBottom: '24px', resize: 'vertical' }}
          />
          <button onClick={handleReopenSurvey} disabled={loading}
            onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
            style={{ ...btnWarning, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'REASSIGNING...' : 'SEND BACK FOR RE-INSPECTION'}
          </button>
        </div>
      )}

      {!['UNDER_REVIEW', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED'].includes(status) && (
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {['SUBMITTED'].includes(status) ? 'COMPLETE POLICY VALIDATION FIRST.' : 'SURVEY WORKFLOW INACTIVE FOR CURRENT STATUS.'}
        </div>
      )}
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 10 — Claim Amount Evaluation (Calculator)
  // -----------------------------------------------
  const renderSection10 = () => (
    <SectionCard number="10" title="AMOUNT_EVALUATION">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>REPAIR ESTIMATE (₹)</label>
          <input type="number" value={calcRepairEstimate} onChange={e => setCalcRepairEstimate(e.target.value)}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>DEPRECIATION (₹)</label>
          <input type="number" value={calcDepreciation} onChange={e => setCalcDepreciation(e.target.value)}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>DEDUCTIBLE (₹)</label>
          <input type="number" value={calcDeductible} onChange={e => setCalcDeductible(e.target.value)}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
      </div>
      <div style={{ padding: '24px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>FINAL PAYABLE AMOUNT</span>
        <span style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', letterSpacing: '-0.02em' }}>₹{calculatedPayable.toLocaleString()}</span>
      </div>
      {policy?.idv_amount && calculatedPayable > policy.idv_amount && (
        <div style={{ marginTop: '16px', padding: '16px 20px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em' }}>
          ⚠ CALCULATED AMOUNT EXCEEDS IDV (₹{policy.idv_amount.toLocaleString()}). SETTLEMENT CAPPED AT IDV.
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
        <SectionCard number="11" title="DECISION_PANEL">
          <div style={{ padding: '24px', backgroundColor: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: `1px solid ${status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
            <strong style={{ color: status === 'APPROVED' ? '#10b981' : '#ef4444', fontSize: '18px', letterSpacing: '0.05em' }}>
              {status === 'APPROVED' ? '✔ CLAIM APPROVED' : status === 'REJECTED' ? '✘ CLAIM REJECTED' : `CLAIM ${status}`}
            </strong>
            {settlementResult?.settlement && (
              <div style={{ marginTop: '16px', fontSize: '15px', color: '#e0e0e0', letterSpacing: '0.02em' }}>
                FINAL PAYABLE: <strong style={{ color: '#10b981', fontSize: '20px' }}>₹{settlementResult.settlement.final_payable?.toLocaleString()}</strong>
                {settlementResult.settlement.idv_capped && <span style={{ color: '#f59e0b', marginLeft: '12px', fontSize: '12px', fontWeight: '800' }}>*IDV CAPPED</span>}
              </div>
            )}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="11" title="DECISION_PANEL">
        {!canDecide && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', marginBottom: '32px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            COMPLETE PREVIOUS REVIEW STEPS BEFORE MAKING A DECISION. CURRENT STATUS: {status}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {/* Approve */}
          <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#10b981', fontSize: '18px', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>APPROVE CLAIM</h5>
            <form onSubmit={handleApprove}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>VEHICLE AGE (YRS)</label>
                <input type="number" step="0.1" value={vehicleAgeYears} onChange={e => setVehicleAgeYears(e.target.value)} required
                  style={brutalInput} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>PARTS</label>
                {parts.map((part, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Type" value={part.type} onChange={e => updatePart(index, 'type', e.target.value)}
                      style={{ ...brutalInput, flex: 1, padding: '12px' }} />
                    <input type="number" placeholder="₹" value={part.amount} onChange={e => updatePart(index, 'amount', e.target.value)}
                      style={{ ...brutalInput, width: '100px', padding: '12px' }} />
                    {parts.length > 1 && (
                      <button type="button" onClick={() => removePart(index)}
                        style={{ ...btnDanger, padding: '12px 16px', minWidth: 'auto' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPart}
                  onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                  style={{ ...btnOutline, width: '100%', marginTop: '8px', borderColor: 'rgba(255,255,255,0.1)' }}>+ ADD PART</button>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>DEDUCTIBLE (₹)</label>
                <input type="number" step="0.01" value={deductibleAmount} onChange={e => setDeductibleAmount(e.target.value)} required
                  style={brutalInput} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnSuccess, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'PROCESSING...' : 'APPROVE FULLY'}
              </button>
            </form>
          </div>

          {/* Reject */}
          <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#ef4444', fontSize: '18px', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>REJECT CLAIM</h5>
            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>REJECTION REASON</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} required rows="8"
                  style={{ ...brutalInput, resize: 'none', minHeight: '260px' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnDanger, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'PROCESSING...' : 'CONFIRM REJECT'}
              </button>
            </form>
          </div>

          {/* Escalate */}
          <div style={{ border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(245, 158, 11, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#f59e0b', fontSize: '18px', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '0.05em' }}>ESCALATE CLAIM</h5>
            <form onSubmit={handleEscalate}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>ESCALATION REASON</label>
                <textarea value={escalationReason} onChange={e => setEscalationReason(e.target.value)} required rows="8"
                  style={{ ...brutalInput, resize: 'none', minHeight: '260px' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnWarning, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'PROCESSING...' : 'ESCALATE TO SUPREME'}
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
        <SectionCard number="12" title="SETTLEMENT_PROCESSING">
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isTerminal ? 'SETTLEMENT PROCESSING NOT APPLICABLE.' : 'CLAIM MUST BE APPROVED BEFORE SETTLEMENT PROCESSING.'}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="12" title="SETTLEMENT_PROCESSING">
        {/* Settlement Type Selection */}
        {isApproved && (
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>SETTLEMENT TYPE</label>
            <select value={settlementType} onChange={e => setSettlementType(e.target.value)}
              style={{ ...brutalInput, maxWidth: '400px' }}>
              <option value="cashless" style={{ backgroundColor: '#111' }}>CASHLESS REPAIR</option>
              <option value="reimbursement" style={{ backgroundColor: '#111' }}>REIMBURSEMENT</option>
            </select>
          </div>
        )}

        {/* Status Progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {settlementType === 'cashless' ? (
            <>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isApproved ? '#10b981' : 'rgba(255,255,255,0.05)', color: isApproved ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>APPROVED</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isRepair ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: isRepair ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>REPAIRING</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaid ? '#10b981' : 'rgba(255,255,255,0.05)', color: isPaid ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>PAID & SETTLED</span>
            </>
          ) : (
            <>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isApproved ? '#10b981' : 'rgba(255,255,255,0.05)', color: isApproved ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>APPROVED</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaymentProcessing ? '#38bdf8' : 'rgba(255,255,255,0.05)', color: isPaymentProcessing ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>PROCESSING PAYMENT</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaid ? '#10b981' : 'rgba(255,255,255,0.05)', color: isPaid ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>PAID & SETTLED</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {isApproved && settlementType === 'cashless' && (
            <button onClick={() => handleUpdateSettlementStatus('REPAIR_IN_PROGRESS')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              START REPAIR
            </button>
          )}
          {isApproved && settlementType === 'reimbursement' && (
            <button onClick={() => handleUpdateSettlementStatus('PAYMENT_PROCESSING')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              START PAYMENT
            </button>
          )}
          {isRepair && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              MARK REPAIR COMPLETED & PAID
            </button>
          )}
          {isPaymentProcessing && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              MARK PAID
            </button>
          )}
          {isPaid && (
            <div style={{ padding: '16px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981', fontWeight: '800', border: '1px solid rgba(16, 185, 129, 0.2)', letterSpacing: '0.05em' }}>
              ✔ PAYMENT COMPLETED — PROCEED TO CLOSURE
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
      <SectionCard number="13" title="CLAIM_CLOSURE">
        {status === 'CLOSED' ? (
          <div style={{ padding: '32px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px' }}>✔</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', letterSpacing: '0.1em', fontFamily: "'Bebas Neue', Oswald, sans-serif" }}>CLAIM SUCCESSFULLY CLOSED</div>
          </div>
        ) : canClose ? (
          <div>
            <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '24px', letterSpacing: '0.05em', lineHeight: '1.6' }}>
              INITIATE FINAL CLOSURE PROTOCOL. THIS ACTION WILL ARCHIVE THE CLAIM.
            </p>
            <button onClick={handleCloseClaimFinal} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'ARCHIVING...' : 'CLOSE & ARCHIVE CLAIM'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {isTerminal ? 'CLAIM IS ALREADY IN TERMINAL STATE.' : 'CLAIM MUST BE APPROVED/PAID BEFORE CLOSURE.'}
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
      <div style={{ animation: 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '4vw', color: '#fff', fontFamily: "'Bebas Neue', Oswald, sans-serif", letterSpacing: '-0.02em', lineHeight: 0.9 }}>
              CLAIM_#{selectedClaim.id}
            </h2>
            <p style={{ margin: '16px 0 0', color: '#a3a3a3', fontSize: '18px', letterSpacing: '0.05em' }}>{selectedClaim.claim_number}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canRequestDocuments && (
              <button
                onClick={openRequestDocsModal}
                disabled={loading}
                onMouseEnter={hoverEffect}
                onMouseLeave={leaveEffect}
                style={{ ...btnWarning, padding: '12px 20px', fontSize: '12px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                REQUEST DOCUMENTS
              </button>
            )}
            <button onClick={handleBackToQueue}
              style={{ ...btnOutline }}>
              RETURN TO QUEUE
            </button>
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div style={{ color: '#ef4444', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <strong>ERROR:</strong> {error}
          </div>
        )}
        {successMessage && (
          <div style={{ color: '#10b981', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <strong>SUCCESS /</strong> {successMessage}
          </div>
        )}

        {/* DOCUMENT_REQUIRED Banner */}
        {status === 'DOCUMENT_REQUIRED' && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '18px 20px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Waiting on Customer: Documents Requested.
            </span>
          </div>
        )}

        {/* Escalation Notice */}
        {status === 'ESCALATED' && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '16px' }}>⚠️</span>
            <span style={{ color: '#fcd34d', fontWeight: '800', letterSpacing: '0.05em' }}>CLAIM ESCALATED TO SENIOR OFFICER FOR REVIEW.</span>
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

        {/* Request Additional Documents Modal */}
        {requestDocsOpen && (
          <div
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(10px)', padding: '24px' }}
            onClick={closeRequestDocsModal}
            role="dialog"
            aria-modal="true"
            aria-label="Request Additional Documents"
          >
            <div
              style={{ backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '28px', width: 'min(860px, 96vw)', maxHeight: '90vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontFamily: "'Bebas Neue', Oswald, sans-serif", fontSize: '2rem', letterSpacing: '0.06em' }}>REQUEST_DOCUMENTS</h3>
                  <p style={{ margin: '10px 0 0', color: '#a3a3a3', fontSize: '14px', letterSpacing: '0.04em' }}>Select missing document types and provide a clear reason.</p>
                </div>
                <button
                  type="button"
                  onClick={closeRequestDocsModal}
                  disabled={requestDocsSubmitting}
                  onMouseEnter={hoverEffect}
                  onMouseLeave={leaveEffect}
                  style={{ ...btnOutline, opacity: requestDocsSubmitting ? 0.4 : 1, cursor: requestDocsSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  CANCEL
                </button>
              </div>

              <form onSubmit={handleSubmitRequestDocs}>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>MISSING DOCUMENT TYPES</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {REQUEST_DOCUMENT_TYPE_OPTIONS.map((docType) => {
                      const checked = requestDocsTypes.includes(docType)
                      return (
                        <label
                          key={docType}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: checked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', cursor: requestDocsSubmitting ? 'not-allowed' : 'pointer', opacity: requestDocsSubmitting ? 0.6 : 1 }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleRequestDocType(docType)}
                            disabled={requestDocsSubmitting}
                            style={{ width: '18px', height: '18px', accentColor: '#ffffff' }}
                          />
                          <span style={{ color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{docType.replace(/_/g, ' ')}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>REASON</label>
                  <textarea
                    value={requestDocsReason}
                    onChange={(e) => setRequestDocsReason(e.target.value)}
                    rows={5}
                    placeholder='E.g., "Please provide a clear picture of your Driving License and a cancelled cheque for NEFT transfer."'
                    disabled={requestDocsSubmitting}
                    style={{ ...brutalInput, resize: 'vertical', minHeight: '130px', opacity: requestDocsSubmitting ? 0.6 : 1 }}
                  />
                </div>

                {requestDocsError && (
                  <div style={{ color: '#ef4444', padding: '16px', marginBottom: '18px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <strong>ERROR:</strong> {requestDocsError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={requestDocsSubmitting}
                    onMouseEnter={!requestDocsSubmitting ? hoverEffect : null}
                    onMouseLeave={!requestDocsSubmitting ? leaveEffect : null}
                    style={{ ...btnPrimary, opacity: requestDocsSubmitting ? 0.4 : 1, cursor: requestDocsSubmitting ? 'not-allowed' : 'pointer' }}
                  >
                    {requestDocsSubmitting ? 'REQUESTING...' : 'SEND REQUEST'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // -----------------------------------------------
  // Main Render
  // -----------------------------------------------
  return (
    <div ref={dashboardRef} style={{ minHeight: '100vh', backgroundColor: '#0d0d0d', color: '#fff', fontFamily: "'Bebas Neue', 'Oswald', sans-serif" }}>
      <header style={{ 
        padding: '30px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '3vw', 
          color: '#fff',
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          lineHeight: '1'
        }}>OFFICER DB°</h1>
        <button onClick={onSwitchRole}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#ffffff', 
            color: '#0d0d0d', 
            border: 'none', 
            borderRadius: '999px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          Exit Role
        </button>
      </header>
      <main style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
        {selectedClaim ? renderWorkflowPanel() : renderClaimsQueue()}
      </main>
    </div>
  )
}

export default OfficerDashboard
