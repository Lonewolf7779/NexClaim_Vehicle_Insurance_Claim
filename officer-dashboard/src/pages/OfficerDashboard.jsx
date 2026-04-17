import React, { useState, useEffect, useRef } from 'react'
import { claimService, policyService } from '../services/api'
import gsap from 'gsap'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Arial, sans-serif'

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCUMENT_REQUIRED: 'Documents Required',
  SURVEY_ASSIGNED: 'Survey Assigned',
  SURVEY_COMPLETED: 'Survey Completed',
  UNDER_INVESTIGATION: 'Under Investigation',
  PROCESSING: 'Processing',
  READY_FOR_REVIEW: 'Ready For Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  REPAIR_IN_PROGRESS: 'Repair In Progress',
  PAYMENT_PROCESSING: 'Payment Processing',
  PAID: 'Paid',
  CLOSED: 'Closed'
}

const REQUEST_DOCUMENT_TYPE_OPTIONS = [
  'DRIVING_LICENSE',
  'RC_BOOK',
  'BANK_DETAILS',
  'FIR',
  'REPAIR_ESTIMATE',
  'DAMAGE_PHOTOS'
]

const PREFILL_FIELD_ALIASES = {
  repairEstimate: [
    'estimated repair cost',
    'estimated_repair_cost',
    'repair estimate',
    'repair_estimate',
    'estimate amount',
    'estimated amount',
    'total repair cost',
    'invoice amount',
    'invoice total',
    'total amount',
    'total_amount'
  ],
  depreciation: [
    'depreciation',
    'depreciation amount',
    'depreciation_amount'
  ],
  deductible: [
    'deductible',
    'deductible amount',
    'deductible_amount',
    'policy deductible'
  ],
  vehicleAge: [
    'vehicle age',
    'vehicle_age',
    'vehicle age years',
    'vehicle_age_years',
    'age of vehicle'
  ],
  partsDamaged: [
    'parts damaged',
    'parts_damaged',
    'damaged parts',
    'parts',
    'damaged_part',
    'description'
  ],
  partAmount: [
    'parts amount',
    'parts_amount',
    'part amount',
    'part_amount',
    'parts cost',
    'parts_cost',
    'part cost',
    'part_cost'
  ]
}

const createDefaultPrefillTouched = () => ({
  calcRepairEstimate: false,
  calcDepreciation: false,
  calcDeductible: false,
  vehicleAgeYears: false,
  deductibleAmount: false,
  parts: false
})

const normalizeExtractionFieldName = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

const parseNumericValue = (value) => {
  if (value === null || value === undefined) return null
  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
    .trim()

  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const splitPartsList = (value) => {
  if (value === null || value === undefined) return []
  return String(value)
    .split(/[\n,;|/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const splitNarrativeLines = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ['No description provided']

  const newlineParts = raw
    .split(/\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (newlineParts.length > 1) return newlineParts

  const sentenceParts = raw
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean)

  return sentenceParts.length > 1 ? sentenceParts : [raw]
}

const SECTION_SHAPE_PALETTES = [
  {
    primary: 'rgba(142, 184, 255, 0.95)',
    secondary: 'rgba(122, 238, 206, 0.9)',
    soft: 'rgba(132, 185, 255, 0.2)',
    stroke: 'rgba(184, 206, 255, 0.82)'
  },
  {
    primary: 'rgba(255, 187, 122, 0.95)',
    secondary: 'rgba(255, 132, 154, 0.9)',
    soft: 'rgba(255, 182, 124, 0.2)',
    stroke: 'rgba(255, 216, 168, 0.8)'
  },
  {
    primary: 'rgba(158, 245, 210, 0.94)',
    secondary: 'rgba(123, 191, 255, 0.9)',
    soft: 'rgba(154, 242, 211, 0.2)',
    stroke: 'rgba(187, 248, 226, 0.82)'
  },
  {
    primary: 'rgba(214, 176, 255, 0.94)',
    secondary: 'rgba(151, 226, 255, 0.9)',
    soft: 'rgba(210, 170, 255, 0.2)',
    stroke: 'rgba(229, 211, 255, 0.84)'
  }
]

// Section Card wrapper for workflow sections
const SectionCard = ({ number, title, children }) => {
  const parsedNumber = Number.parseInt(String(number), 10)
  const safeIndex = Number.isNaN(parsedNumber) ? 0 : Math.abs(parsedNumber)
  const palette = SECTION_SHAPE_PALETTES[safeIndex % SECTION_SHAPE_PALETTES.length]

  return (
    <section
      className="od-section-card od-anim-item"
      style={{
        marginBottom: 0,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '22px',
        overflow: 'hidden',
        background: 'linear-gradient(170deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.36)',
        width: '100%',
        minHeight: '220px',
        position: 'relative'
      }}
    >
      <div
        style={{
          padding: '16px 22px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.09)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.94), rgba(255,255,255,0.68))',
            color: '#111111',
            minWidth: '32px',
            height: '32px',
            padding: '0 10px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'none',
            flexShrink: 0
          }}
        >
          {number}
        </span>
        <h4 style={{ margin: 0, fontSize: '1.08rem', color: 'rgba(255,255,255,0.96)', fontWeight: 520, letterSpacing: '-0.01em' }}>
          {title}
        </h4>
        <div
          aria-hidden
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.95
          }}
        >
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: palette.primary, boxShadow: `0 0 0 3px ${palette.soft}` }} />
          <span style={{ width: '11px', height: '11px', borderRadius: '3px', transform: 'rotate(45deg)', background: palette.secondary, boxShadow: `0 0 0 3px ${palette.soft}` }} />
          <span style={{ width: '18px', height: '4px', borderRadius: '999px', background: palette.stroke }} />
        </div>
      </div>
      <div style={{ padding: '18px', color: 'rgba(255,255,255,0.84)', position: 'relative', zIndex: 1 }}>{children}</div>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: '68px',
          height: '68px',
          borderRadius: '18px',
          border: `1px solid ${palette.soft}`,
          right: '14px',
          bottom: '10px',
          transform: 'rotate(14deg)',
          opacity: 0.38,
          pointerEvents: 'none'
        }}
      />
    </section>
  )
}

function OfficerDashboard({ onSwitchRole }) {
  const dashboardRef = useRef(null)
  const queueViewRef = useRef(null)
  const workflowViewRef = useRef(null)
  const sectionStageRef = useRef(null)
  const ambientOrbRefs = useRef([])

  // Claims queue state
  const [claims, setClaims] = useState([])
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [queueSearch, setQueueSearch] = useState('')
  const [queueStatusFilter, setQueueStatusFilter] = useState('ALL')

  // Selected claim state
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [workflowPage, setWorkflowPage] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440))
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
  const [daExtractedDocuments, setDaExtractedDocuments] = useState([])
  const [daFetchLoading, setDaFetchLoading] = useState(false)
  const [daFetchError, setDaFetchError] = useState(null)
  const [daFetchInfo, setDaFetchInfo] = useState('')
  const [daLastSyncAt, setDaLastSyncAt] = useState(null)
  const [prefillTouched, setPrefillTouched] = useState(createDefaultPrefillTouched)
  const [prefillSources, setPrefillSources] = useState({})

  useEffect(() => {
    fetchClaims()
    const ctx = gsap.context(() => {
      gsap.fromTo(
        dashboardRef.current,
        { autoAlpha: 0, y: 28, filter: 'blur(10px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out', delay: 0.12 }
      )

      const orbNodes = ambientOrbRefs.current.filter(Boolean)
      if (orbNodes.length) {
        gsap.fromTo(
          orbNodes,
          { autoAlpha: 0, scale: 0.92 },
          { autoAlpha: 0.9, scale: 1, duration: 1.15, stagger: 0.16, ease: 'power3.out', delay: 0.18 }
        )

        orbNodes.forEach((node, idx) => {
          gsap.to(node, {
            y: idx % 2 === 0 ? -20 : 24,
            x: idx % 2 === 0 ? 16 : -14,
            duration: 3.6 + idx,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          })
        })
      }
    }, dashboardRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  const getApiErrorMessage = (err) => err.response?.data?.detail || err.message || 'An error occurred'

  const handleApiError = (err) => {
    const message = getApiErrorMessage(err)
    setError(message)
  }

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const markFieldTouched = (fieldName) => {
    setPrefillTouched((prev) => (prev[fieldName] ? prev : { ...prev, [fieldName]: true }))
  }

  const buildDocumentUrl = (filePath) => {
    if (!filePath || typeof filePath !== 'string') return ''

    const rawPath = filePath.trim()
    if (!rawPath) return ''

    if (/^https?:\/\//i.test(rawPath)) {
      try {
        const absolute = new URL(rawPath)
        absolute.pathname = absolute.pathname.replace(/\/+/g, '/')
        return absolute.toString()
      } catch {
        return rawPath
      }
    }

    const normalizedPath = `/${rawPath.replace(/^\/+/, '').replace(/\\/g, '/')}`.replace(/\/+/g, '/')
    return `http://localhost:8000${normalizedPath}`
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

  const fetchDaDocumentsForClaim = async (claimId, options = {}) => {
    if (!claimId) return

    const showLoader = options.showLoader !== false

    if (showLoader) {
      setDaFetchLoading(true)
    }
    setDaFetchError(null)
    setDaFetchInfo('')

    try {
      const docsResponse = await claimService.getDocuments(claimId)
      const docs = Array.isArray(docsResponse.data) ? docsResponse.data : []
      setClaimDocuments(docs)

      const extractedDocs = docs.filter((doc) => Array.isArray(doc?.fields) && doc.fields.length > 0)
      setDaExtractedDocuments(extractedDocs)

      if (docs.length === 0) {
        setDaFetchInfo('No documents are linked to this claim yet.')
      } else if (extractedDocs.length === 0) {
        setDaFetchInfo('Documents are present, but DA has not extracted any fields yet.')
      } else {
        const totalFields = extractedDocs.reduce((sum, doc) => sum + (Array.isArray(doc.fields) ? doc.fields.length : 0), 0)
        setDaFetchInfo(`Loaded ${totalFields} extracted field(s) from ${extractedDocs.length} document(s).`)
      }
      setDaLastSyncAt(new Date().toISOString())
    } catch (err) {
      const message = getApiErrorMessage(err)
      setClaimDocuments([])
      setDaExtractedDocuments([])
      setDaFetchError(message)
      setDaFetchInfo('Could not fetch DA extraction results from backend.')
      setDaLastSyncAt(new Date().toISOString())
    } finally {
      if (showLoader) {
        setDaFetchLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!selectedClaim?.id) return undefined

    const intervalId = setInterval(() => {
      fetchDaDocumentsForClaim(selectedClaim.id, { showLoader: false })
    }, 7000)

    return () => clearInterval(intervalId)
  }, [selectedClaim?.id])

  useEffect(() => {
    if (!selectedClaim?.id || !Array.isArray(daExtractedDocuments) || daExtractedDocuments.length === 0) {
      return
    }

    const fieldValueByName = new Map()
    const fieldSourceByName = new Map()

    daExtractedDocuments.forEach((doc) => {
      const fields = Array.isArray(doc?.fields) ? doc.fields : []
      fields.forEach((field) => {
        const normalizedName = normalizeExtractionFieldName(field?.field_name)
        const value = String(field?.field_value ?? '').trim()
        if (!normalizedName || !value || fieldValueByName.has(normalizedName)) {
          return
        }

        fieldValueByName.set(normalizedName, value)
        fieldSourceByName.set(normalizedName, {
          fieldName: String(field?.field_name || normalizedName),
          documentType: String(doc?.document_type || 'DOCUMENT')
        })
      })
    })

    if (fieldValueByName.size === 0) {
      return
    }

    const findFirstMatch = (aliases) => {
      for (const alias of aliases) {
        const normalizedAlias = normalizeExtractionFieldName(alias)
        if (fieldValueByName.has(normalizedAlias)) {
          return {
            value: fieldValueByName.get(normalizedAlias),
            source: fieldSourceByName.get(normalizedAlias)
          }
        }
      }
      return null
    }

    const toSourceLabel = (match) => {
      const fieldName = match?.source?.fieldName || 'Unknown field'
      const docType = String(match?.source?.documentType || 'DOCUMENT').replace(/_/g, ' ')
      return `${fieldName} (${docType})`
    }

    const sourceUpdates = {}
    let hasPrefillUpdate = false

    const repairEstimateMatch = findFirstMatch(PREFILL_FIELD_ALIASES.repairEstimate)
    if (!prefillTouched.calcRepairEstimate && repairEstimateMatch) {
      const numeric = parseNumericValue(repairEstimateMatch.value)
      setCalcRepairEstimate(numeric === null ? repairEstimateMatch.value : String(numeric))
      sourceUpdates.calcRepairEstimate = toSourceLabel(repairEstimateMatch)
      hasPrefillUpdate = true
    }

    const depreciationMatch = findFirstMatch(PREFILL_FIELD_ALIASES.depreciation)
    if (!prefillTouched.calcDepreciation && depreciationMatch) {
      const numeric = parseNumericValue(depreciationMatch.value)
      setCalcDepreciation(numeric === null ? depreciationMatch.value : String(numeric))
      sourceUpdates.calcDepreciation = toSourceLabel(depreciationMatch)
      hasPrefillUpdate = true
    }

    const deductibleMatch = findFirstMatch(PREFILL_FIELD_ALIASES.deductible)
    if (deductibleMatch) {
      const numeric = parseNumericValue(deductibleMatch.value)
      const normalizedValue = numeric === null ? deductibleMatch.value : String(numeric)

      if (!prefillTouched.calcDeductible) {
        setCalcDeductible(normalizedValue)
        sourceUpdates.calcDeductible = toSourceLabel(deductibleMatch)
        hasPrefillUpdate = true
      }

      if (!prefillTouched.deductibleAmount) {
        setDeductibleAmount(normalizedValue)
        sourceUpdates.deductibleAmount = toSourceLabel(deductibleMatch)
        hasPrefillUpdate = true
      }
    }

    const vehicleAgeMatch = findFirstMatch(PREFILL_FIELD_ALIASES.vehicleAge)
    if (!prefillTouched.vehicleAgeYears && vehicleAgeMatch) {
      const numeric = parseNumericValue(vehicleAgeMatch.value)
      setVehicleAgeYears(numeric === null ? vehicleAgeMatch.value : String(numeric))
      sourceUpdates.vehicleAgeYears = toSourceLabel(vehicleAgeMatch)
      hasPrefillUpdate = true
    }

    const partsMatch = findFirstMatch(PREFILL_FIELD_ALIASES.partsDamaged)
    const partAmountMatch = findFirstMatch(PREFILL_FIELD_ALIASES.partAmount)
    if (!prefillTouched.parts && partsMatch) {
      const partNames = splitPartsList(partsMatch.value)
      const parsedPartAmount = partAmountMatch ? parseNumericValue(partAmountMatch.value) : null

      if (partNames.length > 0) {
        setParts(
          partNames.map((partName, index) => ({
            type: partName,
            amount: index === 0 && parsedPartAmount !== null ? String(parsedPartAmount) : ''
          }))
        )
      } else {
        setParts([
          {
            type: String(partsMatch.value),
            amount: parsedPartAmount !== null ? String(parsedPartAmount) : ''
          }
        ])
      }

      sourceUpdates.parts = toSourceLabel(partsMatch)
      hasPrefillUpdate = true
    }

    if (Object.keys(sourceUpdates).length > 0) {
      setPrefillSources((prev) => ({ ...prev, ...sourceUpdates }))
    }

    if (!hasPrefillUpdate) {
      return
    }
  }, [daExtractedDocuments, prefillTouched, selectedClaim?.id])

  const refreshClaimData = async (claimId) => {
    try {
      const claimResponse = await claimService.getClaim(claimId)
      setSelectedClaim(claimResponse.data)
      const historyResponse = await claimService.getClaimHistory(claimId)
      setClaimHistory(historyResponse.data)
      await loadSurveyReports(claimId, claimResponse.data)
      await fetchDaDocumentsForClaim(claimId)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleOpenClaim = async (claim) => {
    setSelectedClaim(claim)
    setWorkflowPage(0)
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
    setPrefillTouched(createDefaultPrefillTouched())
    setPrefillSources({})
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
    setDaExtractedDocuments([])
    setDaFetchLoading(false)
    setDaFetchError(null)
    setDaFetchInfo('')
    setDaLastSyncAt(null)
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
      await fetchDaDocumentsForClaim(claim.id)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleBackToQueue = () => {
    setSelectedClaim(null)
    setWorkflowPage(0)
    setPolicy(null)
    setClaimHistory([])
    setSurveyReports([])
    setClaimDocuments([])
    setDaExtractedDocuments([])
    setDaFetchLoading(false)
    setDaFetchError(null)
    setDaFetchInfo('')
    setDaLastSyncAt(null)
    setPrefillTouched(createDefaultPrefillTouched())
    setPrefillSources({})
    fetchClaims()
  }

  const handleExitRole = () => {
    if (typeof onSwitchRole === 'function') {
      onSwitchRole()
    }
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
  const addPart = () => {
    markFieldTouched('parts')
    setParts((prev) => [...prev, { type: '', amount: '' }])
  }
  const updatePart = (index, field, value) => {
    markFieldTouched('parts')
    setParts((prev) =>
      prev.map((part, partIndex) =>
        partIndex === index ? { ...part, [field]: value } : part
      )
    )
  }
  const removePart = (index) => {
    markFieldTouched('parts')
    setParts((prev) => prev.filter((_, i) => i !== index))
  }

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

  const getStatusLabel = (value) => STATUS_LABELS[value] || value || 'Unknown'

  const toReadableLabel = (value) => {
    if (!value) return ''

    return String(value)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\bRc\b/g, 'RC')
      .replace(/\bIdv\b/g, 'IDV')
      .replace(/\bFir\b/g, 'FIR')
      .replace(/\bPan\b/g, 'PAN')
      .replace(/\bAi\b/g, 'AI')
      .trim()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return '#a3a3a3'
      case 'UNDER_REVIEW': return '#60a5fa'
      case 'DOCUMENT_REQUIRED': return '#fbbf24'
      case 'SURVEY_ASSIGNED': return '#38bdf8'
      case 'SURVEY_COMPLETED': return '#2dd4bf'
      case 'UNDER_INVESTIGATION': return '#f472b6'
      case 'PROCESSING': return '#60a5fa'
      case 'READY_FOR_REVIEW': return '#c084fc'
      case 'APPROVED': return '#34d399'
      case 'REJECTED': return '#f87171'
      case 'ESCALATED': return '#f59e0b'
      case 'REPAIR_IN_PROGRESS': return '#fb923c'
      case 'PAYMENT_PROCESSING': return '#818cf8'
      case 'PAID': return '#22c55e'
      case 'CLOSED': return '#94a3b8'
      default: return '#a3a3a3'
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

  // Reusable styles aligned with customer portal aesthetic
  const baseButton = {
    padding: '11px 20px',
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '999px',
    fontWeight: '600',
    letterSpacing: '0.04em',
    fontSize: '0.78rem',
    textTransform: 'none',
    color: '#f6f7f8',
    fontFamily: FONT_STACK,
    transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.24s ease, background-color 0.24s ease',
    backdropFilter: 'blur(10px)'
  }

  const btnPrimary = {
    ...baseButton,
    background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(241,241,241,0.85))',
    color: '#121316',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '0 10px 24px rgba(255,255,255,0.1)'
  }

  const btnSuccess = {
    ...baseButton,
    background: 'linear-gradient(145deg, rgba(16,185,129,0.96), rgba(16,185,129,0.64))',
    border: '1px solid rgba(16,185,129,0.52)',
    color: '#f6fffb',
    boxShadow: '0 14px 30px rgba(16,185,129,0.24)'
  }

  const btnDanger = {
    ...baseButton,
    background: 'linear-gradient(145deg, rgba(239,68,68,0.96), rgba(239,68,68,0.62))',
    border: '1px solid rgba(239,68,68,0.52)',
    color: '#fff5f5',
    boxShadow: '0 14px 30px rgba(239,68,68,0.2)'
  }

  const btnWarning = {
    ...baseButton,
    background: 'linear-gradient(145deg, rgba(245,158,11,0.94), rgba(245,158,11,0.62))',
    border: '1px solid rgba(245,158,11,0.5)',
    color: '#111111',
    boxShadow: '0 14px 30px rgba(245,158,11,0.2)'
  }

  const btnOutline = {
    ...baseButton,
    background: 'rgba(255,255,255,0.02)',
    color: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(255,255,255,0.18)'
  }

  const infoGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', fontSize: '0.95rem' }
  const infoItem = { padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }
  const infoLabel = {
    color: 'rgba(255,255,255,0.56)',
    textTransform: 'none',
    fontSize: '0.66rem',
    letterSpacing: '0.09em',
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600'
  }

  const brutalInput = {
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '14px',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.25s ease',
    outline: 'none'
  }

  const sectionPill = {
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.82)',
    fontSize: '0.68rem',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'none'
  }

  const queueCardGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
    gap: '14px',
    alignItems: 'start'
  }

  const queueCardItem = {
    width: '100%',
    minWidth: 0,
    alignSelf: 'start'
  }

  const workflowSectionGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
    gap: '14px',
    alignItems: 'stretch'
  }

  const workflowSectionItem = {
    display: 'block',
    width: '100%',
    position: 'relative',
    minWidth: 0
  }

  const hoverEffect = (e) => {
    e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'
    e.currentTarget.style.boxShadow = '0 16px 30px rgba(0,0,0,0.28)'
  }

  const leaveEffect = (e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)'
    e.currentTarget.style.boxShadow = 'none'
  }

  useEffect(() => {
    if (!dashboardRef.current || selectedClaim || !queueViewRef.current) return undefined

    const ctx = gsap.context(() => {
      const nodes = queueViewRef.current.querySelectorAll('.od-queue-head, .od-queue-panel, .od-queue-stat, .od-queue-row')
      if (!nodes.length) return

      gsap.fromTo(
        nodes,
        { autoAlpha: 0, y: 18, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.66, ease: 'power3.out', stagger: 0.05 }
      )
    }, dashboardRef)

    return () => ctx.revert()
  }, [selectedClaim, loadingClaims, queueSearch, queueStatusFilter, claims.length])

  useEffect(() => {
    if (!dashboardRef.current || !selectedClaim || !sectionStageRef.current) return undefined

    const ctx = gsap.context(() => {
      const cards = sectionStageRef.current.querySelectorAll('.od-section-card, .od-anim-item, .od-page-nav')
      if (!cards.length) return

      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 24, rotateX: -4 },
        { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.72, ease: 'power3.out', stagger: 0.07 }
      )
    }, dashboardRef)

    return () => ctx.revert()
  }, [selectedClaim?.id, workflowPage, claimHistory.length, surveyReports.length, daExtractedDocuments.length])

  // -----------------------------------------------
  // Render: Statistics
  // -----------------------------------------------
  const renderStatistics = () => {
    const today = new Date().toDateString()
    const todayClaims = claims.filter(c => new Date(c.created_at).toDateString() === today)
    const underReview = claims.filter((c) => c.status === 'UNDER_REVIEW').length
    const surveyPending = claims.filter((c) => c.status === 'SURVEY_ASSIGNED').length
    const escalated = claims.filter((c) => c.status === 'ESCALATED' || c.status === 'UNDER_INVESTIGATION').length

    const stats = [
      { key: 'today', label: 'Claims Today', value: todayClaims.length, color: 'rgba(255,255,255,0.95)' },
      { key: 'submitted', label: 'Submitted', value: claims.filter((c) => c.status === 'SUBMITTED').length, color: '#d1d5db' },
      { key: 'review', label: 'Under Review', value: underReview, color: '#93c5fd' },
      { key: 'survey', label: 'Survey Pending', value: surveyPending, color: '#6ee7b7' },
      { key: 'escalated', label: 'Escalated', value: escalated, color: '#fdba74' }
    ]

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="od-queue-stat"
            style={{
              borderRadius: '20px',
              padding: '22px 20px',
              border: '1px solid rgba(255,255,255,0.11)',
              background: 'linear-gradient(155deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
              boxShadow: '0 18px 34px rgba(0,0,0,0.28)'
            }}
          >
            <div style={{ fontSize: '2.2rem', lineHeight: 1, color: stat.color, fontWeight: 520, letterSpacing: '-0.04em' }}>{stat.value}</div>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.62)', letterSpacing: '0.08em', textTransform: 'none', fontWeight: 560 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    )
  }

  // -----------------------------------------------
  // Render: Claims Queue Table
  // -----------------------------------------------
  const renderQueueClaimCard = (claim, isProcessed = false) => {
    const latestSurvey = claim.latest_survey_report

    return (
      <article
        key={`${isProcessed ? 'processed' : 'active'}-${claim.id}`}
        className="od-queue-row"
        style={{
          ...queueCardItem,
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.09)',
          background: 'linear-gradient(162deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
          padding: '18px',
          boxShadow: '0 16px 34px rgba(0,0,0,0.24)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
          <div>
            <div style={{ ...infoLabel, marginBottom: '6px' }}>Claim #{claim.id}</div>
            <div style={{ color: '#fff', fontWeight: 620, fontSize: '1.02rem', letterSpacing: '-0.01em' }}>{claim.claim_number}</div>
          </div>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              color: getStatusColor(claim.status),
              fontSize: '0.68rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              border: '1px solid rgba(255,255,255,0.14)',
              textTransform: 'none'
            }}
          >
            {getStatusLabel(claim.status)}
          </span>
        </div>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '14px' }}>
          <div style={{ ...infoItem, padding: '0 0 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={infoLabel}>Policy ID</span>
            <strong style={{ color: '#f3f6ff' }}>{claim.policy_id || 'N/A'}</strong>
          </div>
          <div style={{ ...infoItem, padding: '0 0 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={infoLabel}>Incident Date</span>
            <strong style={{ color: '#f3f6ff' }}>{claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}</strong>
          </div>
          <div style={{ ...infoItem, padding: '0 0 8px', borderBottom: 'none' }}>
            <span style={infoLabel}>Survey</span>
            {latestSurvey ? (
              <div>
                <strong style={{ color: '#f3f6ff' }}>{latestSurvey.surveyor_name || latestSurvey.surveyor_id || 'Assigned'}</strong>
                <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.56)', fontSize: '0.78rem' }}>
                  {latestSurvey.submitted_at ? `Submitted ${formatDateTime(latestSurvey.submitted_at)}` : 'Awaiting report'}
                </div>
                {latestSurvey.recommendation && (
                  <div style={{ marginTop: '5px', color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem' }}>
                    Recommendation: {toReadableLabel(latestSurvey.recommendation)}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.46)', fontSize: '0.82rem' }}>Not assigned</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleOpenClaim(claim)}
            onMouseEnter={hoverEffect}
            onMouseLeave={leaveEffect}
            style={{ ...(isProcessed ? btnOutline : btnPrimary), padding: '8px 14px', fontSize: '0.66rem' }}
          >
            {isProcessed ? 'View' : 'Open'}
          </button>
        </div>
      </article>
    )
  }

  const renderClaimsQueue = () => (
    <div ref={queueViewRef} className="od-queue-view" style={{ animation: 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="od-queue-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '680px' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(2.2rem, 5vw, 4.4rem)', color: '#ffffff', lineHeight: 0.94, letterSpacing: '-0.03em', fontWeight: 520 }}>
            Claims Queue Dashboard
          </h2>
          <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '1.02rem', lineHeight: 1.55 }}>
            Review incoming claims and move each case through policy validation, document checks, and final settlement.
          </p>
        </div>
        <button onClick={fetchClaims} disabled={loadingClaims} onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
          style={{ ...btnOutline, opacity: loadingClaims ? 0.55 : 1, cursor: loadingClaims ? 'not-allowed' : 'pointer' }}>
          {loadingClaims ? 'Syncing' : 'Refresh Queue'}
        </button>
      </div>

      {error && (
        <div className="od-queue-panel" style={{ color: '#fca5a5', padding: '16px', marginBottom: '20px', backgroundColor: 'rgba(239, 68, 68, 0.09)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.24)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {renderStatistics()}

      <div className="od-queue-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <input
          type="text"
          value={queueSearch}
          onChange={e => setQueueSearch(e.target.value)}
          placeholder="Search by claim number, policy id, surveyor..."
          style={brutalInput}
        />
        <select
          value={queueStatusFilter}
          onChange={e => setQueueStatusFilter(e.target.value)}
          style={{ ...brutalInput, cursor: 'pointer' }}
        >
          <option value="ALL">All Statuses</option>
          {['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENT_REQUIRED', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED', 'UNDER_INVESTIGATION', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED'].map(option => (
            <option key={option} value={option}>{getStatusLabel(option)}</option>
          ))}
        </select>
      </div>

      {/* Active Claims */}
      <div style={{ marginBottom: '44px' }}>
        <h3 style={{ color: '#fff', marginBottom: '16px', fontSize: '1.5rem', letterSpacing: '-0.02em', fontWeight: 520 }}>
          Active Claims ({activeClaims.length})
        </h3>
        {activeClaims.length === 0 ? (
          <div className="od-queue-panel" style={{ padding: '42px', textAlign: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '0.04em' }}>No active claims found.</p>
          </div>
        ) : (
          <div className="od-queue-panel" style={{ background: 'rgba(255,255,255,0.014)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
            <div style={queueCardGrid}>
              {activeClaims.map((claim) => renderQueueClaimCard(claim, false))}
            </div>
          </div>
        )}
      </div>

      {/* Processed Claims */}
      {processedClaims.length > 0 && (
        <div style={{ marginBottom: '44px' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.82)', marginBottom: '16px', fontSize: '1.34rem', letterSpacing: '-0.02em', fontWeight: 520 }}>
            Processed Claims ({processedClaims.length})
          </h3>
          <div className="od-queue-panel" style={{ background: 'rgba(255,255,255,0.012)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
            <div style={queueCardGrid}>
              {processedClaims.map((claim) => renderQueueClaimCard(claim, true))}
            </div>
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
      <SectionCard number="T" title="Claim Timeline">
        <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '6px' }}>
          <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(250px, 1fr)', gap: '14px' }}>
            {claimHistory.map((history, index) => (
              <div key={index} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', minHeight: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: index === claimHistory.length - 1 ? 1 : 0.78 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: index === claimHistory.length - 1 ? '#10b981' : '#e5e7eb', boxShadow: '0 0 0 2px rgba(255,255,255,0.14)' }} />
                  <div style={{ fontSize: '0.96rem', color: '#fff', fontWeight: '600', letterSpacing: '-0.01em' }}>{getStatusLabel(history.new_status)}</div>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.58)', marginTop: '10px', letterSpacing: '0.05em', textTransform: 'none' }}>{formatDateTime(history.changed_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 1 — Claim Summary
  // -----------------------------------------------
  const renderSection1 = () => {
    const incidentMeta = [
      { label: 'Incident Date', value: selectedClaim.incident_date ? formatDate(selectedClaim.incident_date) : 'Not available' },
      { label: 'Incident Time', value: selectedClaim.incident_date ? new Date(selectedClaim.incident_date).toLocaleTimeString() : 'Not available' },
      { label: 'Incident Type', value: selectedClaim.incident_type || selectedClaim.claim_type || 'Not specified' },
      { label: 'Location', value: selectedClaim.incident_location || selectedClaim.location || 'Not provided' },
      { label: 'Reported On', value: selectedClaim.created_at ? formatDateTime(selectedClaim.created_at) : 'Not available' }
    ]

    const incidentNarrativeLines = splitNarrativeLines(selectedClaim.description)

    return (
      <SectionCard number="1" title="Claim Summary">
        <div style={infoGrid}>
          <div style={infoItem}><span style={infoLabel}>Claim ID: </span><strong style={{ color: '#fff' }}>#{selectedClaim.id}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Claim Number: </span><strong style={{ color: '#fff' }}>{selectedClaim.claim_number}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Customer Name: </span><strong style={{ color: '#fff' }}>{policy?.policy_holder_name || 'Loading...'}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Policy Number: </span><strong style={{ color: '#fff' }}>{policy?.policy_number || 'Loading...'}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Vehicle Number: </span><strong style={{ color: '#fff' }}>{policy?.vehicle_number || 'Loading...'}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Vehicle Model: </span><strong style={{ color: '#fff' }}>{policy?.vehicle_model || 'N/A'}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Current Status: </span>
            <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: getStatusColor(selectedClaim.status), color: '#000', fontSize: '11px', fontWeight: '800', letterSpacing: '0.05em' }}>
              {getStatusLabel(selectedClaim.status)}
            </span>
          </div>
          <div style={infoItem}><span style={infoLabel}>IDV Amount: </span><strong style={{ color: '#fff' }}>{policy?.idv_amount ? formatCurrency(policy.idv_amount) : 'N/A'}</strong></div>
          <div style={infoItem}><span style={infoLabel}>Survey Reports: </span><strong style={{ color: '#fff' }}>{surveyReports.length}</strong></div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <span style={infoLabel}>Incident Details</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {incidentMeta.map((item) => (
              <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.66rem', letterSpacing: '0.09em', marginBottom: '6px', fontWeight: '600' }}>{item.label}</div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.4 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <span style={infoLabel}>Incident Description</span>
          <div style={{ marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {incidentNarrativeLines.map((line, idx) => (
                <div key={`summary-incident-line-${idx}`} style={{ fontSize: '14px', color: '#e0e0e0', backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.6 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    )
  }

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
        <div style={{ marginBottom: '24px' }}>
          {checks.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: c.pass ? '#10b981' : '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>{c.pass ? '✔' : '✘'}</span>
              <span style={{ color: c.pass ? '#fff' : '#ef4444', fontWeight: '600', fontSize: '15px', letterSpacing: '0.02em', textTransform: 'none' }}>{c.label}</span>
            </div>
          ))}
        </div>
        {policy && (
          <div style={{ fontSize: '13px', color: '#a3a3a3', marginBottom: '24px', letterSpacing: '0.05em', textTransform: 'none' }}>
            Policy period: <span style={{ color: '#fff' }}>{formatDate(policy.policy_start_date)} — {formatDate(policy.policy_end_date)}</span>
          </div>
        )}
        {status === 'SUBMITTED' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={handleValidatePolicy} disabled={loading || !allPolicyChecksPass}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: (loading || !allPolicyChecksPass) ? 0.6 : 1, cursor: (loading || !allPolicyChecksPass) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Validating...' : 'Validate policy'}
            </button>
            <button onClick={handleQuickReject} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnDanger, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Reject claim
            </button>
          </div>
        )}
        {status !== 'SUBMITTED' && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
      <SectionCard number="3" title="Identity Verification">
        <div style={{ display: 'grid', gap: '16px' }}>
          {documents.map(doc => (
            <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '4px' }}>{doc.label}</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' }}>{doc.value || 'Not available'}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {identityStatus[doc.key] === 'verified' && <span style={{ color: '#10b981', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✔ Verified</span>}
                {identityStatus[doc.key] === 'reupload' && <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>⟳ Reupload requested</span>}
                {identityStatus[doc.key] === 'rejected' && <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✘ Rejected</span>}
                {canReview && (
                  <>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>Verify</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>Reupload</button>
                    <button onClick={() => setIdentityStatus(prev => ({ ...prev, [doc.key]: 'rejected' }))}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>Reject</button>
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
      <SectionCard number="4" title="Vehicle Documents">
        <div style={{ display: 'grid', gap: '16px' }}>
          {vehicleDocs.map(doc => (
            <div key={doc.key} style={{ padding: '20px 24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '4px' }}>{doc.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' }}>{doc.value || 'Not available'}</div>
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>✔ {doc.check}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {vehicleDocsStatus[doc.key] === 'verified' && <span style={{ color: '#10b981', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>✔ Verified</span>}
                  {vehicleDocsStatus[doc.key] === 'reupload' && <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>⟳ Reupload requested</span>}
                  {canReview && (
                    <>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'verified' }))}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>Verify RC</button>
                      <button onClick={() => setVehicleDocsStatus(prev => ({ ...prev, [doc.key]: 'reupload' }))}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.2)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        style={{ padding: '8px 16px', fontSize: '11px', backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '999px', cursor: 'pointer', fontWeight: '800', letterSpacing: '0.05em', transition: 'all 0.2s' }}>Request reupload</button>
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
  const renderSection5 = () => {
    const incidentMeta = [
      { label: 'Incident Date', value: selectedClaim.incident_date ? formatDate(selectedClaim.incident_date) : 'Not available' },
      { label: 'Incident Time', value: selectedClaim.incident_date ? new Date(selectedClaim.incident_date).toLocaleTimeString() : 'Not available' },
      { label: 'Claim Type', value: selectedClaim.claim_type || 'Not specified' },
      { label: 'Incident Type', value: selectedClaim.incident_type || selectedClaim.claim_type || 'Not specified' },
      { label: 'Location', value: selectedClaim.incident_location || selectedClaim.location || 'Not provided' },
      { label: 'Reported On', value: selectedClaim.created_at ? formatDateTime(selectedClaim.created_at) : 'Not available' }
    ]

    const incidentNarrativeLines = splitNarrativeLines(selectedClaim.description)

    return (
      <SectionCard number="5" title="Incident Review">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {incidentMeta.map((item) => (
            <div key={item.label} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: '0.66rem', letterSpacing: '0.09em', marginBottom: '6px', fontWeight: '600' }}>{item.label}</div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', lineHeight: 1.4 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '28px' }}>
          <span style={infoLabel}>Incident Description</span>
          <div style={{ marginTop: '8px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {incidentNarrativeLines.map((line, idx) => (
                <div key={`incident-review-line-${idx}`} style={{ fontSize: '14px', color: '#e0e0e0', backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 12px', lineHeight: 1.6 }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {incidentStatus === 'valid' && <span style={{ color: '#10b981', fontWeight: '800', letterSpacing: '0.05em' }}>✔ Validated</span>}
          {incidentStatus === 'suspicious' && <span style={{ color: '#ef4444', fontWeight: '800', letterSpacing: '0.05em' }}>⚠ Flagged suspicious</span>}
          {canReview && (
            <>
              <button onClick={() => setIncidentStatus('valid')}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnSuccess, padding: '12px 24px', fontSize: '12px' }}>Mark valid</button>
              <button onClick={() => setIncidentStatus('suspicious')}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnWarning, padding: '12px 24px', fontSize: '12px' }}>Flag suspicious</button>
            </>
          )}
        </div>
      </SectionCard>
    )
  }

  // -----------------------------------------------
  // SECTION 6 — Customer Document Review
  // -----------------------------------------------
  const handleViewDocument = (doc) => {
    const docType = String(doc?.document_type || doc?.type || 'DOCUMENT')
    const label = toReadableLabel(String(doc?.label || docType))
    const filePath = doc?.file_path
    if (!filePath) return

    const baseUrl = buildDocumentUrl(filePath)
    if (!baseUrl) return

    const separator = baseUrl.includes('?') ? '&' : '?'
    const url = `${baseUrl}${separator}t=${Date.now()}`
    setPreviewDoc({ label, url })
  }

  const renderSection6 = () => {
    const documents = Array.isArray(claimDocuments) ? claimDocuments : []

    return (
      <SectionCard number="6" title="Document Review">
        {documents.length === 0 ? (
          <div style={{ color: '#666', fontSize: '15px', letterSpacing: '0.05em', textTransform: 'none' }}>No documents uploaded.</div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#a3a3a3', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'none' }}>
              {documents.length} document(s) available for review.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {documents.map(doc => {
                const docType = String(doc?.document_type || 'DOCUMENT')
                const label = toReadableLabel(docType)
                const canView = Boolean(doc?.file_path)

                return (
                  <React.Fragment key={doc?.id ?? `${docType}-${doc?.extracted_at ?? ''}`}>
                  <div style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', transition: 'border-color 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '28px', opacity: 0.8 }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'none', fontSize: '14px' }}>{label}</div>
                        {doc?.extracted_at && <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.05em' }}>Uploaded {formatDateTime(doc.extracted_at)}</div>}
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
                      View
                      </button>
                    </div>

                  </div>
                  </React.Fragment>
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
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.85rem', letterSpacing: '-0.02em', fontWeight: 520 }}>{previewDoc.label}</h3>
                <button onClick={() => setPreviewDoc(null)} onMouseEnter={hoverEffect} onMouseLeave={leaveEffect} style={{ ...btnOutline, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>Close Preview</button>
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
  // SECTION 14 — DA Extraction Results
  // -----------------------------------------------
  const renderSection14 = () => {
    const extractedDocCount = daExtractedDocuments.length
    const totalExtractedFields = daExtractedDocuments.reduce((sum, doc) => sum + (Array.isArray(doc?.fields) ? doc.fields.length : 0), 0)

    return (
      <SectionCard number="14" title="Document AI Extraction">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ color: '#a3a3a3', fontSize: '12px', letterSpacing: '0.05em', textTransform: 'none', fontWeight: '600' }}>
            Backend source: /claims/{selectedClaim.id}/documents
          </div>
          <button
            onClick={() => fetchDaDocumentsForClaim(selectedClaim.id)}
            disabled={daFetchLoading}
            onMouseEnter={daFetchLoading ? null : hoverEffect}
            onMouseLeave={daFetchLoading ? null : leaveEffect}
            style={{
              ...btnOutline,
              padding: '10px 16px',
              fontSize: '11px',
              opacity: daFetchLoading ? 0.5 : 1,
              cursor: daFetchLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {daFetchLoading ? 'Fetching Data...' : 'Refresh Data'}
          </button>
        </div>

        {daLastSyncAt && (
          <div style={{ marginBottom: '14px', color: '#666', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'none' }}>
            Last Sync: {formatDateTime(daLastSyncAt)}
          </div>
        )}

        {daFetchLoading && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)', backgroundColor: 'rgba(56, 189, 248, 0.08)', color: '#38bdf8', fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'none' }}>
            Fetching extracted data from document automation...
          </div>
        )}

        {!daFetchLoading && daFetchError && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '13px', letterSpacing: '0.04em' }}>
            <strong>Fetch Failed:</strong> {daFetchError}
          </div>
        )}

        {!daFetchLoading && !daFetchError && extractedDocCount === 0 && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '13px', letterSpacing: '0.04em' }}>
            <strong>No Extraction Visible:</strong> {daFetchInfo || 'No extracted field data returned yet.'}
          </div>
        )}

        {!daFetchLoading && !daFetchError && extractedDocCount > 0 && (
          <>
            <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'none' }}>
              {extractedDocCount} document(s) with extraction data and {totalExtractedFields} field(s)
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {daExtractedDocuments.map((doc) => {
                const docType = String(doc?.document_type || 'DOCUMENT').replace(/_/g, ' ')
                const fields = Array.isArray(doc?.fields) ? doc.fields : []
                const canView = Boolean(doc?.file_path)

                return (
                  <div key={doc?.id ?? `${docType}-${doc?.extracted_at ?? ''}`} style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'none', fontSize: '14px' }}>{toReadableLabel(docType)}</div>
                        <div style={{ color: '#666', fontSize: '11px', letterSpacing: '0.05em', marginTop: '4px' }}>
                          Extracted {formatDateTime(doc?.extracted_at)} and {fields.length} field(s)
                        </div>
                      </div>
                      <button
                        onClick={() => canView && handleViewDocument(doc)}
                        disabled={!canView}
                        onMouseEnter={canView ? hoverEffect : null}
                        onMouseLeave={canView ? leaveEffect : null}
                        style={{
                          ...btnOutline,
                          padding: '8px 14px',
                          fontSize: '11px',
                          opacity: canView ? 1 : 0.35,
                          cursor: canView ? 'pointer' : 'not-allowed',
                        }}
                      >
                        View Source
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {fields.map((field, index) => {
                        const fieldName = toReadableLabel(String(field?.field_name || 'unknown_field'))
                        const fieldValue = field?.field_value === null || field?.field_value === undefined || String(field.field_value).trim() === '' ? 'N/A' : String(field.field_value)
                        const confidence = typeof field?.confidence_score === 'number' ? `${Math.round(field.confidence_score * 100)}%` : null

                        return (
                          <div key={`${fieldName}-${index}`} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                            <div style={{ color: '#10b981', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'none', fontWeight: '700', marginBottom: '6px' }}>{fieldName}</div>
                            <div style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: '500', wordBreak: 'break-word', marginBottom: confidence ? '8px' : 0 }}>{fieldValue}</div>
                            {confidence && <div style={{ color: '#a3a3a3', fontSize: '11px', letterSpacing: '0.04em' }}>Confidence: {confidence}</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
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
      <SectionCard number="7" title="Document Checklist">
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em', marginBottom: '8px' }}>Claim Type</label>
          <select value={selectedClaimType} onChange={e => setSelectedClaimType(e.target.value)}
            style={{ ...brutalInput, maxWidth: '300px' }}>
            <option value="minor_damage" style={{ backgroundColor: '#111' }}>Minor Damage</option>
            <option value="accident_major" style={{ backgroundColor: '#111' }}>Major Accident</option>
            <option value="theft" style={{ backgroundColor: '#111' }}>Theft</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '800' }}>—</span>
              <span style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500', letterSpacing: '0.02em', textTransform: 'none' }}>{item}</span>
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
      <SectionCard number="8" title="Fraud Risk Review">
        {/* Risk Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#a3a3a3', letterSpacing: '0.1em', fontWeight: '600' }}>Risk Score</div>
          <span style={{ padding: '8px 24px', borderRadius: '999px', backgroundColor: 'transparent', color: scoreColor, border: `1px solid ${scoreColor}`, fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em' }}>
            {fraudRisk.score}
          </span>
        </div>

        {/* Risk Signals */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '16px', color: '#a3a3a3', letterSpacing: '0.1em' }}>Detected Signals</div>
          {fraudRisk.signals.map((signal, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', marginBottom: '12px', backgroundColor: signal.level === 'HIGH' ? 'rgba(239, 68, 68, 0.05)' : signal.level === 'MEDIUM' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '12px', border: `1px solid ${signal.level === 'HIGH' ? 'rgba(239,68,68,0.2)' : signal.level === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              <span style={{ fontSize: '14px', color: signal.level === 'HIGH' ? '#ef4444' : signal.level === 'MEDIUM' ? '#f59e0b' : '#9ca3af' }}>
                {signal.level === 'HIGH' ? 'High' : signal.level === 'MEDIUM' ? 'Medium' : 'Info'}
              </span>
              <span style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: '500', letterSpacing: '0.02em' }}>{signal.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {canAct && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => showSuccess('Continuing processing — no fraud concerns.')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, padding: '12px 24px', fontSize: '12px' }}>Continue Processing</button>
            <button onClick={() => showSuccess('Additional verification requested.')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnWarning, padding: '12px 24px', fontSize: '12px' }}>Request Verification</button>
            <button onClick={handleFlagInvestigation} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnDanger, padding: '12px 24px', fontSize: '12px' }}>
              {loading ? 'Flagging...' : 'Flag Investigation'}
            </button>
          </div>
        )}
        {status === 'UNDER_INVESTIGATION' && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: '700', letterSpacing: '0.05em', fontSize: '13px' }}>
            Claim currently under investigation.
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Surveyor ID</label>
          <input
            type="text"
            value={surveyorAssignment.surveyor_id}
            onChange={e => handleSurveyAssignmentChange('surveyor_id', e.target.value)}
            disabled={loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)}
            style={{ ...brutalInput, opacity: (loading || !['UNDER_REVIEW', 'SURVEY_COMPLETED'].includes(status)) ? 0.3 : 1 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Surveyor Name</label>
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
        <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Officer Notes To Surveyor</label>
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
          <p style={{ color: '#a3a3a3', fontSize: '13px', margin: 0, letterSpacing: '0.03em', maxWidth: '400px', lineHeight: '1.6' }}>Assign a field surveyor to inspect the vehicle and assess damage.</p>
          <button onClick={handleAssignSurveyor} disabled={loading}
            onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
            style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Assigning...' : 'Assign Surveyor'}
          </button>
        </div>
      )}

      {status === 'SURVEY_ASSIGNED' && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', color: '#38bdf8', fontWeight: '700', marginBottom: '24px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '13px', letterSpacing: '0.05em' }}>
          Surveyor assigned. Waiting for survey completion.
        </div>
      )}

      {latestSurveyReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <h5 style={{ margin: 0, color: '#fff', fontSize: '18px', letterSpacing: '-0.01em' }}>Latest Snapshot</h5>
              <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: latestSubmittedSurveyReport ? getRecommendationTone(latestSubmittedSurveyReport.recommendation).backgroundColor : 'rgba(255,255,255,0.1)', color: latestSubmittedSurveyReport ? getRecommendationTone(latestSubmittedSurveyReport.recommendation).color : '#fff', fontWeight: '800', fontSize: '11px', letterSpacing: '0.05em', textTransform: 'none' }}>
                {latestSubmittedSurveyReport ? latestSubmittedSurveyReport.recommendation : 'Awaiting Report'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>Version: </span><strong style={{ color: '#fff' }}>{latestSurveyReport.version_number}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>Assigned: </span><strong style={{ color: '#fff' }}>{formatDateTime(latestSurveyReport.assigned_at)}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>Surveyor: </span><strong style={{ color: '#fff' }}>{latestSurveyReport.surveyor_name || latestSurveyReport.surveyor_id}</strong></div>
              <div><span style={{ color: '#666', letterSpacing: '0.05em' }}>Submitted: </span><strong style={{ color: '#fff' }}>{formatDateTime(latestSubmittedSurveyReport?.submitted_at)}</strong></div>
            </div>

            {latestSubmittedSurveyReport && (
              <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em', fontWeight: '600' }}>Damage Description</div>
                  <div style={{ color: '#e0e0e0', lineHeight: '1.6', fontSize: '14px' }}>{latestSubmittedSurveyReport.damage_description || 'No description provided'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>Condition</div><div style={{ color: '#fff', fontWeight: '700' }}>{latestSubmittedSurveyReport.vehicle_condition || 'N/A'}</div></div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>Estimate</div><div style={{ color: '#10b981', fontWeight: '700' }}>{formatCurrency(latestSubmittedSurveyReport.estimated_repair_cost)}</div></div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', letterSpacing: '0.1em' }}>Parts Damaged</div><div style={{ color: '#fff', fontWeight: '700' }}>{latestSubmittedSurveyReport.parts_damaged || 'N/A'}</div></div>
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
            <h5 style={{ margin: '0 0 20px', color: '#fff', fontSize: '18px', letterSpacing: '-0.01em' }}>Report History</h5>
            {surveyReports.length === 0 ? (
              <div style={{ color: '#666', fontSize: '13px', letterSpacing: '0.03em' }}>No survey activity yet.</div>
            ) : (
              surveyReports.map(report => (
                <div key={report.id} style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'opacity 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.7} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  <div style={{ fontWeight: '700', color: '#fff', letterSpacing: '0.03em' }}>Version {report.version_number}</div>
                  <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '6px', letterSpacing: '0.03em' }}>{report.submitted_at ? `Submitted ${formatDateTime(report.submitted_at)}` : `Assigned ${formatDateTime(report.assigned_at)}`}</div>
                  {report.officer_review_notes && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '8px', fontStyle: 'italic' }}>Note: {report.officer_review_notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {status === 'SURVEY_COMPLETED' && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Request Reinspection</label>
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
            {loading ? 'Reassigning...' : 'Send For Reinspection'}
          </button>
        </div>
      )}

      {!['UNDER_REVIEW', 'SURVEY_ASSIGNED', 'SURVEY_COMPLETED'].includes(status) && (
        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'none' }}>
          {['SUBMITTED'].includes(status) ? 'Complete policy validation first.' : 'Survey workflow is inactive for the current status.'}
        </div>
      )}
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 10 — Claim Amount Evaluation (Calculator)
  // -----------------------------------------------
  const renderSection10 = () => (
    <SectionCard number="10" title="Amount Evaluation">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Repair Estimate (INR)</label>
          <input type="number" value={calcRepairEstimate} onChange={e => { markFieldTouched('calcRepairEstimate'); setCalcRepairEstimate(e.target.value) }}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Depreciation (INR)</label>
          <input type="number" value={calcDepreciation} onChange={e => { markFieldTouched('calcDepreciation'); setCalcDepreciation(e.target.value) }}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Deductible (INR)</label>
          <input type="number" value={calcDeductible} onChange={e => { markFieldTouched('calcDeductible'); setCalcDeductible(e.target.value) }}
            style={{ ...brutalInput, fontSize: '18px', fontWeight: '700' }} placeholder="0" />
        </div>
      </div>
      <div style={{ padding: '24px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Final Payable Amount</span>
        <span style={{ fontSize: '36px', fontWeight: '800', color: '#10b981', letterSpacing: '-0.02em' }}>₹{calculatedPayable.toLocaleString()}</span>
      </div>
      {policy?.idv_amount && calculatedPayable > policy.idv_amount && (
        <div style={{ marginTop: '16px', padding: '16px 20px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em' }}>
          Calculated amount exceeds IDV (INR {policy.idv_amount.toLocaleString()}). Settlement is capped at IDV.
        </div>
      )}
    </SectionCard>
  )

  // -----------------------------------------------
  // SECTION 11 — Decision Panel
  // -----------------------------------------------
  const renderSection11 = () => {
    const verificationDoc =
      daExtractedDocuments.find((doc) => Boolean(doc?.file_path)) ||
      claimDocuments.find((doc) => Boolean(doc?.file_path)) ||
      null

    const partsPreviewValue = parts
      .map((part) => String(part?.type || '').trim())
      .filter(Boolean)
      .join(', ')

    const prefillSummary = [
      { key: 'calcRepairEstimate', label: 'Repair Estimate', value: calcRepairEstimate, source: prefillSources.calcRepairEstimate },
      { key: 'calcDepreciation', label: 'Depreciation', value: calcDepreciation, source: prefillSources.calcDepreciation },
      { key: 'calcDeductible', label: 'Deductible (Calculator)', value: calcDeductible, source: prefillSources.calcDeductible },
      { key: 'vehicleAgeYears', label: 'Vehicle Age', value: vehicleAgeYears, source: prefillSources.vehicleAgeYears },
      { key: 'parts', label: 'Parts Damaged', value: partsPreviewValue, source: prefillSources.parts },
      { key: 'deductibleAmount', label: 'Deductible (Approval)', value: deductibleAmount, source: prefillSources.deductibleAmount }
    ].filter((item) => item.source)

    if (isTerminal || status === 'APPROVED') {
      return (
        <SectionCard number="11" title="Decision Panel">
          <div style={{ padding: '24px', backgroundColor: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: `1px solid ${status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
            <strong style={{ color: status === 'APPROVED' ? '#10b981' : '#ef4444', fontSize: '18px', letterSpacing: '0.05em' }}>
              {status === 'APPROVED' ? 'Claim approved' : status === 'REJECTED' ? 'Claim rejected' : `Claim ${getStatusLabel(status)}`}
            </strong>
            {settlementResult?.settlement && (
              <div style={{ marginTop: '16px', fontSize: '15px', color: '#e0e0e0', letterSpacing: '0.02em' }}>
                Final payable: <strong style={{ color: '#10b981', fontSize: '20px' }}>₹{settlementResult.settlement.final_payable?.toLocaleString()}</strong>
                {settlementResult.settlement.idv_capped && <span style={{ color: '#f59e0b', marginLeft: '12px', fontSize: '12px', fontWeight: '800' }}>IDV capped</span>}
              </div>
            )}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="11" title="Decision Panel">
        {!canDecide && (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', marginBottom: '32px', letterSpacing: '0.05em', textTransform: 'none' }}>
            Complete previous review steps before making a decision. Current status: {getStatusLabel(status)}
          </div>
        )}

        <div style={{ marginBottom: '24px', padding: '18px 20px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#38bdf8', fontSize: '12px', letterSpacing: '0.08em', fontWeight: '800', textTransform: 'none' }}>
                Prefilled From Extraction
              </div>
              <div style={{ color: '#a3a3a3', fontSize: '12px', marginTop: '6px', letterSpacing: '0.03em' }}>
                Review values against the raw document before approving, rejecting, or escalating.
              </div>
            </div>
            <button
              type="button"
              onClick={() => verificationDoc && handleViewDocument(verificationDoc)}
              disabled={!verificationDoc}
              onMouseEnter={verificationDoc ? hoverEffect : null}
              onMouseLeave={verificationDoc ? leaveEffect : null}
              style={{
                ...btnOutline,
                padding: '9px 14px',
                fontSize: '11px',
                opacity: verificationDoc ? 1 : 0.35,
                cursor: verificationDoc ? 'pointer' : 'not-allowed'
              }}
            >
              View Raw Document
            </button>
          </div>

          {prefillSummary.length > 0 ? (
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {prefillSummary.map((item) => (
                <div key={item.key} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ color: '#fff', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'none', fontWeight: '700' }}>{item.label}</div>
                  <div style={{ color: '#e0e0e0', fontSize: '13px', marginTop: '6px', wordBreak: 'break-word' }}>{item.value || 'N/A'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '6px', letterSpacing: '0.03em' }}>{item.source}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: '12px', color: '#a3a3a3', fontSize: '12px', letterSpacing: '0.03em' }}>
              No field mapping has been applied yet. Use Refresh Data in section 14 to pull extracted fields.
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Approve */}
          <div style={{ border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#10b981', fontSize: '18px', letterSpacing: '-0.01em' }}>Approve Claim</h5>
            <form onSubmit={handleApprove}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Vehicle Age (Years)</label>
                <input type="number" step="0.1" value={vehicleAgeYears} onChange={e => { markFieldTouched('vehicleAgeYears'); setVehicleAgeYears(e.target.value) }} required
                  style={brutalInput} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Parts</label>
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
                  style={{ ...btnOutline, width: '100%', marginTop: '8px', borderColor: 'rgba(255,255,255,0.1)' }}>Add Part</button>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Deductible (INR)</label>
                <input type="number" step="0.01" value={deductibleAmount} onChange={e => { markFieldTouched('deductibleAmount'); setDeductibleAmount(e.target.value) }} required
                  style={brutalInput} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnSuccess, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Approve Claim'}
              </button>
            </form>
          </div>

          {/* Reject */}
          <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#ef4444', fontSize: '18px', letterSpacing: '-0.01em' }}>Reject Claim</h5>
            <form onSubmit={handleReject}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Rejection Reason</label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} required rows="8"
                  style={{ ...brutalInput, resize: 'none', minHeight: '260px' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnDanger, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Reject Claim'}
              </button>
            </form>
          </div>

          {/* Escalate */}
          <div style={{ border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '16px', padding: '24px', backgroundColor: 'rgba(245, 158, 11, 0.02)' }}>
            <h5 style={{ margin: '0 0 24px', color: '#f59e0b', fontSize: '18px', letterSpacing: '-0.01em' }}>Escalate Claim</h5>
            <form onSubmit={handleEscalate}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Escalation Reason</label>
                <textarea value={escalationReason} onChange={e => setEscalationReason(e.target.value)} required rows="8"
                  style={{ ...brutalInput, resize: 'none', minHeight: '260px' }} />
              </div>
              <button type="submit" disabled={loading || !canDecide}
                onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
                style={{ ...btnWarning, width: '100%', opacity: (loading || !canDecide) ? 0.3 : 1, cursor: (loading || !canDecide) ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processing...' : 'Escalate Claim'}
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
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'none' }}>
            {isTerminal ? 'Settlement processing not applicable.' : 'Claim must be approved before settlement processing.'}
          </div>
        </SectionCard>
      )
    }

    return (
      <SectionCard number="12" title="Settlement Processing">
        {/* Settlement Type Selection */}
        {isApproved && (
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Settlement Type</label>
            <select value={settlementType} onChange={e => setSettlementType(e.target.value)}
              style={{ ...brutalInput, maxWidth: '400px' }}>
              <option value="cashless" style={{ backgroundColor: '#111' }}>Cashless Repair</option>
              <option value="reimbursement" style={{ backgroundColor: '#111' }}>Reimbursement</option>
            </select>
          </div>
        )}

        {/* Status Progression */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {settlementType === 'cashless' ? (
            <>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isApproved ? '#10b981' : 'rgba(255,255,255,0.05)', color: isApproved ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Approved</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isRepair ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: isRepair ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Repairing</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaid ? '#10b981' : 'rgba(255,255,255,0.05)', color: isPaid ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Paid and Settled</span>
            </>
          ) : (
            <>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isApproved ? '#10b981' : 'rgba(255,255,255,0.05)', color: isApproved ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Approved</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaymentProcessing ? '#38bdf8' : 'rgba(255,255,255,0.05)', color: isPaymentProcessing ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Processing Payment</span>
              <span style={{ color: '#444' }}>→</span>
              <span style={{ padding: '10px 20px', borderRadius: '999px', backgroundColor: isPaid ? '#10b981' : 'rgba(255,255,255,0.05)', color: isPaid ? '#000' : '#666', fontWeight: '800', fontSize: '12px', letterSpacing: '0.05em' }}>Paid and Settled</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {isApproved && settlementType === 'cashless' && (
            <button onClick={() => handleUpdateSettlementStatus('REPAIR_IN_PROGRESS')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Start Repair
            </button>
          )}
          {isApproved && settlementType === 'reimbursement' && (
            <button onClick={() => handleUpdateSettlementStatus('PAYMENT_PROCESSING')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Start Payment
            </button>
          )}
          {isRepair && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Mark Repair Completed and Paid
            </button>
          )}
          {isPaymentProcessing && (
            <button onClick={() => handleUpdateSettlementStatus('PAID')} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnSuccess, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              Mark Paid
            </button>
          )}
          {isPaid && (
            <div style={{ padding: '16px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981', fontWeight: '800', border: '1px solid rgba(16, 185, 129, 0.2)', letterSpacing: '0.05em' }}>
              Payment completed. You can proceed to closure.
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
          <div style={{ padding: '32px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: '#10b981', marginBottom: '16px' }}>✔</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>Claim successfully closed</div>
          </div>
        ) : canClose ? (
          <div>
            <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '24px', letterSpacing: '0.05em', lineHeight: '1.6' }}>
              Initiate final closure protocol. This action will archive the claim.
            </p>
            <button onClick={handleCloseClaimFinal} disabled={loading}
              onMouseEnter={hoverEffect} onMouseLeave={leaveEffect}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Archiving...' : 'Close and Archive Claim'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#666', fontSize: '13px', letterSpacing: '0.05em', textTransform: 'none' }}>
            {isTerminal ? 'Claim is already in terminal state.' : 'Claim must be approved or paid before closure.'}
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

    const sectionNodeMap = {
      'section-1': renderSection1(),
      'section-2': renderSection2(),
      'section-3': renderSection3(),
      'section-4': renderSection4(),
      'section-5': renderSection5(),
      'section-6': renderSection6(),
      'section-14': renderSection14(),
      'section-7': renderSection7(),
      'section-8': renderSection8(),
      'section-9': renderSection9(),
      'section-10': renderSection10(),
      'section-11': renderSection11(),
      'section-12': renderSection12(),
      'section-13': renderSection13(),
      timeline: renderTimeline()
    }

    const sectionPages = [
      ['section-1', 'section-2', 'section-3'],
      ['section-4', 'section-5', 'section-6'],
      ['section-14', 'section-7', 'section-8'],
      ['section-9', 'section-10', 'section-11'],
      ['section-12', 'section-13', 'timeline']
    ]

    const sectionEntriesById = Object.fromEntries(
      Object.entries(sectionNodeMap)
        .filter(([, node]) => Boolean(node))
        .map(([id, node]) => [id, { id, node }])
    )

    const availablePageIds = sectionPages.map((pageIds) => pageIds.filter((id) => Boolean(sectionEntriesById[id])))

    const totalPages = sectionPages.length
    const safePage = Math.max(0, Math.min(workflowPage, totalPages - 1))
    const activePageIds = availablePageIds[safePage] || []
    const visibleSections = activePageIds.map((id) => sectionEntriesById[id]).filter(Boolean)

    const visibleCountByPage = availablePageIds.map((ids) => ids.length)
    const startIndex = visibleCountByPage.slice(0, safePage).reduce((sum, count) => sum + count, 0)
    const totalVisibleCards = visibleCountByPage.reduce((sum, count) => sum + count, 0)
    const endIndex = Math.min(startIndex + visibleSections.length, totalVisibleCards)

    const useStructuredDesktopLayout = viewportWidth >= 1120

    const pageLayoutRules = [
      {
        container: {
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: '14px',
          alignItems: 'start'
        },
        items: {
          'section-1': { gridColumn: '1 / -1' },
          'section-2': { gridColumn: '1 / span 6' },
          'section-3': { gridColumn: '7 / span 6' }
        }
      },
      {
        container: {
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 0.92fr) minmax(420px, 1.08fr)',
          gridTemplateRows: 'auto auto',
          gap: '14px',
          alignItems: 'stretch'
        },
        items: {
          'section-4': { gridColumn: '1', gridRow: '1' },
          'section-6': { gridColumn: '1', gridRow: '2' },
          'section-5': { gridColumn: '2', gridRow: '1 / span 2', alignSelf: 'stretch' }
        }
      },
      {
        container: {
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: '14px',
          alignItems: 'start'
        },
        items: {
          'section-14': { gridColumn: '1 / -1' },
          'section-7': { gridColumn: '1 / span 6' },
          'section-8': { gridColumn: '7 / span 6' }
        }
      },
      {
        container: {
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gap: '14px',
          alignItems: 'start'
        },
        items: {
          'section-11': { gridColumn: '1 / -1' },
          'section-9': { gridColumn: '1 / span 6' },
          'section-10': { gridColumn: '7 / span 6' }
        }
      },
      {
        container: {
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 0.92fr) minmax(420px, 1.08fr)',
          gridTemplateRows: 'auto auto',
          gap: '14px',
          alignItems: 'stretch'
        },
        items: {
          'section-12': { gridColumn: '1', gridRow: '1' },
          timeline: { gridColumn: '1', gridRow: '2' },
          'section-13': { gridColumn: '2', gridRow: '1 / span 2', alignSelf: 'stretch' }
        }
      }
    ]

    const activeLayout = pageLayoutRules[safePage] || null

    const currentWorkflowGridStyle = useStructuredDesktopLayout && activeLayout
      ? activeLayout.container
      : workflowSectionGrid

    const getWorkflowItemStyle = (entryId) => {
      if (!useStructuredDesktopLayout || !activeLayout || !activeLayout.items?.[entryId]) {
        return workflowSectionItem
      }

      return {
        ...workflowSectionItem,
        ...activeLayout.items[entryId]
      }
    }

    return (
      <div ref={workflowViewRef} style={{ animation: 'fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '26px', paddingBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 4.2vw, 3.8rem)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.96, fontWeight: 520 }}>
              Claim {selectedClaim.id}
            </h2>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.58)', fontSize: '1rem', letterSpacing: '0.02em' }}>{selectedClaim.claim_number}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleBackToQueue}
              onMouseEnter={hoverEffect}
              onMouseLeave={leaveEffect}
              style={{ ...btnOutline }}>
              Back To Queue
            </button>
          </div>
        </div>

        <div className="od-page-nav" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={sectionPill}>Page {safePage + 1} of {totalPages} · {visibleSections.length} cards</div>
          <div />
        </div>

        {/* Error/Success messages */}
        {error && (
          <div style={{ color: '#fca5a5', padding: '16px', marginBottom: '18px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {successMessage && (
          <div style={{ color: '#6ee7b7', padding: '16px', marginBottom: '18px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {/* DOCUMENT_REQUIRED Banner */}
        {status === 'DOCUMENT_REQUIRED' && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '18px 20px', borderRadius: '16px', marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'none' }}>
              Waiting for customer documents.
            </span>
          </div>
        )}

        {/* Escalation Notice */}
        {status === 'ESCALATED' && (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '18px 20px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center' }}>
            <span style={{ color: '#fcd34d', fontWeight: '700', letterSpacing: '0.03em' }}>Claim escalated to senior officer for review.</span>
          </div>
        )}

        <div ref={sectionStageRef} style={currentWorkflowGridStyle}>
          {visibleSections.map((entry) => (
            <div
              key={entry.id}
              className="od-anim-item"
              style={getWorkflowItemStyle(entry.id)}
            >
              {entry.node}
            </div>
          ))}
        </div>

        <div className="od-page-nav" style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={sectionPill}>Showing cards {totalVisibleCards === 0 ? 0 : startIndex + 1} to {endIndex} of {totalVisibleCards}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setWorkflowPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              onMouseEnter={safePage === 0 ? null : hoverEffect}
              onMouseLeave={safePage === 0 ? null : leaveEffect}
              className="water-btn water-btn--sm back-btn-cs"
              style={{ opacity: safePage === 0 ? 0.45 : 1, cursor: safePage === 0 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setWorkflowPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              onMouseEnter={safePage >= totalPages - 1 ? null : hoverEffect}
              onMouseLeave={safePage >= totalPages - 1 ? null : leaveEffect}
              className="water-btn water-btn--sm"
              style={{ opacity: safePage >= totalPages - 1 ? 0.45 : 1, cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>

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
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', letterSpacing: '-0.02em', fontWeight: 520 }}>Request Documents</h3>
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
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitRequestDocs}>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Missing Document Types</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
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
                          <span style={{ color: '#fff', fontWeight: '800', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'none' }}>{toReadableLabel(docType)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.1em' }}>Reason</label>
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
                    <strong>Error:</strong> {requestDocsError}
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
                    {requestDocsSubmitting ? 'Requesting...' : 'Send Request'}
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
    <div
      ref={dashboardRef}
      className="officer-dashboard-page"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(125% 110% at 10% 0%, rgba(84,110,255,0.24), transparent 44%), radial-gradient(120% 115% at 92% 8%, rgba(16,185,129,0.2), transparent 48%), linear-gradient(180deg, #0b0d14 0%, #10151f 50%, #0a0d15 100%)',
        color: '#fff',
        fontFamily: FONT_STACK,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .officer-dashboard-page,
        .officer-dashboard-page * {
          font-family: ${FONT_STACK} !important;
        }
        .officer-dashboard-page button {
          position: relative;
          overflow: hidden;
          background: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.28) !important;
          color: #ffffff !important;
          border-radius: 999px !important;
          transition: color 0.4s ease, border-color 0.4s ease, transform 0.3s ease, box-shadow 0.3s ease !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }
        .officer-dashboard-page button::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0%;
          background: #ffffff;
          border-radius: 50% 50% 0 0;
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease;
          z-index: -1;
        }
        .officer-dashboard-page button:hover::before {
          height: 100%;
          border-radius: 0;
        }
        .officer-dashboard-page button:hover:not(:disabled) {
          color: #1c1d20 !important;
          border-color: #ffffff !important;
        }
        .officer-dashboard-page button:disabled {
          opacity: 0.5;
          cursor: not-allowed !important;
        }
        .officer-dashboard-page input:focus,
        .officer-dashboard-page select:focus,
        .officer-dashboard-page textarea:focus {
          border-color: rgba(255, 255, 255, 0.28) !important;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06) !important;
        }
      `}</style>

      <div className="nx-noise-overlay" />
      <div
        ref={(el) => {
          ambientOrbRefs.current[0] = el
        }}
        style={{
          position: 'absolute',
          right: '-18%',
          top: '-24%',
          width: '62%',
          height: '62%',
          background: 'radial-gradient(circle at center, rgba(16,185,129,0.22) 0%, transparent 62%)',
          filter: 'blur(88px)',
          opacity: 0.88,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <div
        ref={(el) => {
          ambientOrbRefs.current[1] = el
        }}
        style={{
          position: 'absolute',
          left: '-20%',
          bottom: '-30%',
          width: '56%',
          height: '56%',
          background: 'radial-gradient(circle at center, rgba(59,130,246,0.16) 0%, transparent 60%)',
          filter: 'blur(96px)',
          opacity: 0.72,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <header style={{ padding: '24px clamp(18px, 3vw, 34px) 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))', backdropFilter: 'blur(10px)', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.6vw, 3rem)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.98, fontWeight: 520 }}>
              Officer Dashboard
            </h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.58)', fontSize: '0.96rem' }}>
              Manage claims with the same visual language as the customer journey.
            </p>
          </div>
          <button onClick={handleExitRole} onMouseEnter={hoverEffect} onMouseLeave={leaveEffect} className="water-btn water-btn--sm back-btn-cs">
            Exit Role
          </button>
        </header>

        <main style={{ padding: '22px clamp(16px, 2.6vw, 28px) 32px', maxWidth: '1500px', margin: '0 auto' }}>
          {selectedClaim ? renderWorkflowPanel() : renderClaimsQueue()}
        </main>
      </div>

      <div
        ref={(el) => {
          ambientOrbRefs.current[2] = el
        }}
        style={{
          position: 'absolute',
          left: '22%',
          top: '-16%',
          width: '38%',
          height: '38%',
          background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, transparent 62%)',
          filter: 'blur(84px)',
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
    </div>
  )
}

export default OfficerDashboard
