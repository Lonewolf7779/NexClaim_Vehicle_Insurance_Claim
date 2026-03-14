import React, { useState, useEffect } from 'react'
import { claimService, policyService } from '../services/api'

// -------------------------------------------------
// Customer Dashboard Component - Smart Insurance Claim Portal
// Improved multi-step wizard with intelligent claim intake
// -------------------------------------------------
function CustomerDashboard({ onSwitchRole }) {
  // View state: 'landing', 'form', 'success', 'tracking'
  const [view, setView] = useState('landing')
  
  // Current step in claim form (1-6)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Policy validation state
  const [policyNumber, setPolicyNumber] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  
  // Claims list for tracking
  const [claims, setClaims] = useState([])
  const [selectedClaim, setSelectedClaim] = useState(null)
  
  // File validation errors
  const [fileErrors, setFileErrors] = useState({})

  // Form data for each step
  const [formData, setFormData] = useState({
    // Incident details
    incidentDate: '',
    incidentLocation: '',
    claimType: '',
    description: '',
    anotherVehicleInvolved: 'No',
    otherVehicleNumber: '',
    otherDriverName: '',
    otherInsuranceCompany: '',
    estimatedRepairCost: '',
    policeReportFiled: 'No',
    // Policy prefilled (read-only) - these will be populated from policy
    policyHolderName: '',
    vehicleModel: '',
    aadharNumber: '',
    panNumber: '',
    drivingLicenseNumber: '',
    rcNumber: '',
    policyStartDate: '',
    policyEndDate: '',
    // Documents
    damagePhotos: [],
    accidentScenePhotos: [],
    insuranceClaimForm: null,
    repairEstimate: null,
    repairInvoice: null,
    firCopy: null,
    damagePhotosDoc: null,
    repairBills: null,
    surveyReport: null,
    firTheft: null,
    vehicleKeysPhoto: null,
    form28: null,
    form29: null,
    form30: null,
    subrogationLetter: null,
    dischargeVoucher: null,
  })
  
  // Document upload tracking for checklist
  const [uploadedDocs, setUploadedDocs] = useState({})
  
  // Submission result
  const [submittedClaim, setSubmittedClaim] = useState(null)
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Document preview modal state for tracking view
  const [customerPreviewDoc, setCustomerPreviewDoc] = useState(null)

  // Fetch claims on mount for tracking
  useEffect(() => {
    if (view === 'tracking') {
      fetchCustomerClaims()
    }
  }, [view])

  const fetchCustomerClaims = async () => {
    setLoading(true)
    try {
      const response = await claimService.getClaims()
      setClaims(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch claims')
    } finally {
      setLoading(false)
    }
  }

  // Handle API errors
  const handleApiError = (err) => {
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    setError(message)
  }

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Allowed file extensions per document type
  const allowedExtensions = {
    insuranceClaimForm: ['.pdf'],
    repairEstimate: ['.pdf'],
    repairInvoice: ['.pdf'],
    repairBills: ['.pdf'],
    damagePhotosDoc: ['.jpg', '.jpeg', '.png'],
    firCopy: ['.pdf', '.jpg', '.jpeg', '.png'],
    firTheft: ['.pdf', '.jpg', '.jpeg', '.png'],
    surveyReport: ['.pdf'],
    form28: ['.pdf'],
    form29: ['.pdf'],
    form30: ['.pdf'],
    subrogationLetter: ['.pdf'],
    dischargeVoucher: ['.pdf'],
    vehicleKeysPhoto: ['.jpg', '.jpeg', '.png'],
  }

  // Validate file extensions
  const validateFiles = (field, files) => {
    const allowed = allowedExtensions[field] || ['.pdf', '.jpg', '.jpeg', '.png']
    const invalid = []
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowed.includes(ext)) {
        invalid.push(file.name)
      }
    }
    if (invalid.length > 0) {
      setFileErrors(prev => ({ ...prev, [field]: `Invalid file type: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}` }))
      return false
    }
    setFileErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    return true
  }

  // Handle file upload with validation
  const handleFileUpload = (field, files) => {
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return

    // Feature 3: Max 5 for damage photos
    if (field === 'damagePhotosDoc' && fileArr.length > 5) {
      setFileErrors(prev => ({ ...prev, [field]: 'Maximum 5 damage photos allowed.' }))
      return
    }

    // Feature 4: Validate extensions
    if (!validateFiles(field, fileArr)) return

    updateFormData(field, fileArr)
    if (fileArr.length > 0) {
      setUploadedDocs(prev => ({ ...prev, [field]: true }))
    }
  }

  // Clear uploaded docs when claim type changes
  useEffect(() => {
    if (formData.claimType) {
      setUploadedDocs({})
    }
  }, [formData.claimType])

  // Get required documents based on claim type - FEATURE 3
  const getRequiredDocuments = () => {
    switch (formData.claimType) {
      case 'minor_damage':
        return [
          { id: 'damagePhotosDoc', label: 'Damage Photos', required: true },
          { id: 'repairEstimate', label: 'Repair Estimate', required: true },
          { id: 'insuranceClaimForm', label: 'Claim Form', required: true },
          { id: 'rcNumber', label: 'RC (Registration Certificate)', required: false },
          { id: 'drivingLicenseNumber', label: 'Driving License', required: false },
        ]
      case 'accident_major':
        return [
          { id: 'damagePhotosDoc', label: 'Damage Photos', required: true },
          { id: 'firCopy', label: 'FIR Copy', required: true },
          { id: 'repairBills', label: 'Repair Bills/Invoices', required: true },
          { id: 'surveyReport', label: 'Survey Report', required: true },
          { id: 'insuranceClaimForm', label: 'Claim Form', required: true },
        ]
      case 'theft':
        return [
          { id: 'firTheft', label: 'FIR Copy', required: true },
          { id: 'rcNumber', label: 'RC (Registration Certificate)', required: true },
          { id: 'vehicleKeysPhoto', label: 'Vehicle Keys Photo', required: true },
          { id: 'form28', label: 'Form 28', required: true },
          { id: 'form29', label: 'Form 29', required: true },
          { id: 'form30', label: 'Form 30', required: true },
          { id: 'subrogationLetter', label: 'Subrogation Letter', required: true },
          { id: 'dischargeVoucher', label: 'Discharge Voucher', required: true },
        ]
      default:
        return [
          { id: 'insuranceClaimForm', label: 'Claim Form', required: true },
          { id: 'repairEstimate', label: 'Repair Estimate/Invoice', required: true },
        ]
    }
  }

  // Get claim type display name
  const getClaimTypeDisplay = (type) => {
    switch (type) {
      case 'minor_damage': return 'Minor Damage'
      case 'accident_major': return 'Accident - Major'
      case 'theft': return 'Theft'
      default: return 'Unknown'
    }
  }

  // Check if damage photos should be shown - FEATURE 3 (Theft - NO damage photos)
  const showDamagePhotos = () => {
    return formData.claimType !== 'theft'
  }

  // Mapping from form field IDs to document type suffixes for file naming
  const docTypeMapping = {
    insuranceClaimForm: 'CLAIM_FORM',
    repairEstimate: 'REPAIR_ESTIMATE',
    repairInvoice: 'REPAIR_INVOICE',
    repairBills: 'REPAIR_BILLS',
    damagePhotosDoc: 'DAMAGE_PHOTOS',
    firCopy: 'FIR',
    firTheft: 'FIR',
    surveyReport: 'SURVEY_REPORT',
    form28: 'FORM28',
    form29: 'FORM29',
    form30: 'FORM30',
    subrogationLetter: 'SUBROGATION_LETTER',
    dischargeVoucher: 'DISCHARGE_VOUCHER',
    vehicleKeysPhoto: 'VEHICLE_KEYS',
  }

  // Submit claim
  const handleSubmitClaim = async () => {
    setLoading(true)
    setError('')

    try {
      const policyRes = await policyService.getPolicyByNumber(policyNumber)
      const response = await claimService.createClaim({
        policy_id: policyRes.data.id,
        incident_date: formData.incidentDate,
        description: formData.description
      })

      const reusedExistingClaim = response.headers?.['x-existing-claim'] === 'true'
      const claimId = response.data.id

      if (!reusedExistingClaim) {
        // Upload files only for newly-created claims.
        const uploadFields = Object.keys(docTypeMapping)
        for (const field of uploadFields) {
          const fileData = formData[field]
          if (!fileData) continue
          const files = Array.isArray(fileData) ? fileData : [fileData]
          for (const file of files) {
            if (file instanceof File) {
              try {
                await claimService.uploadFile(claimId, file, docTypeMapping[field])
              } catch (uploadErr) {
                console.error(`Failed to upload ${field}:`, uploadErr)
              }
            }
          }
        }
      }

      setSubmittedClaim({
        ...response.data,
        reused_existing_claim: reusedExistingClaim
      })
      setView('success')
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reset and start new claim
  const handleStartNewClaim = () => {
    setView('landing')
    setCurrentStep(1)
    setPolicyNumber('')
    setVehicleNumber('')
    setFileErrors({})
    setFormData({
      incidentDate: '',
      incidentLocation: '',
      claimType: '',
      description: '',
      anotherVehicleInvolved: 'No',
      otherVehicleNumber: '',
      otherDriverName: '',
      otherInsuranceCompany: '',
      estimatedRepairCost: '',
      policeReportFiled: 'No',
      policyHolderName: '',
      vehicleModel: '',
      vehicleNumber: '',
      aadharNumber: '',
      panNumber: '',
      drivingLicenseNumber: '',
      rcNumber: '',
      policyStartDate: '',
      policyEndDate: '',
      damagePhotos: [],
      accidentScenePhotos: [],
      insuranceClaimForm: null,
      repairEstimate: null,
      repairInvoice: null,
      firCopy: null,
      damagePhotosDoc: null,
      repairBills: null,
      surveyReport: null,
      firTheft: null,
      vehicleKeysPhoto: null,
      form28: null,
      form29: null,
      form30: null,
      subrogationLetter: null,
      dischargeVoucher: null,
    })
    setUploadedDocs({})
    setSubmittedClaim(null)
    setError('')
  }

  // Claim detail state for tracking portal (Feature 5)
  const [claimDetail, setClaimDetail] = useState(null)
  const [claimPolicy, setClaimPolicy] = useState(null)
  const [claimTimeline, setClaimTimeline] = useState([])
  const [claimDocuments, setClaimDocuments] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const handleViewClaimDetail = async (claim) => {
    setSelectedClaim(claim)
    setLoadingDetail(true)
    setClaimDetail(null)
    setClaimPolicy(null)
    setClaimTimeline([])
    setClaimDocuments([])
    try {
      const claimRes = await claimService.getClaim(claim.id)
      setClaimDetail(claimRes.data)
      if (claimRes.data.policy_id) {
        const policyRes = await policyService.getPolicy(claimRes.data.policy_id)
        setClaimPolicy(policyRes.data)
      }
      const historyRes = await claimService.getClaimHistory(claim.id)
      setClaimTimeline(historyRes.data)
      const docsRes = await claimService.getDocuments(claim.id)
      setClaimDocuments(docsRes.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return '#757575'
      case 'UNDER_REVIEW': return '#1976d2'
      case 'DOCUMENT_REQUIRED': return '#ff9800'
      case 'SURVEY_ASSIGNED': return '#00bcd4'
      case 'SURVEY_COMPLETED': return '#009688'
      case 'UNDER_INVESTIGATION': return '#e91e63'
      case 'APPROVED': return '#4caf50'
      case 'REJECTED': return '#f44336'
      case 'ESCALATED': return '#ff9800'
      case 'REPAIR_IN_PROGRESS': return '#ff5722'
      case 'PAYMENT_PROCESSING': return '#3f51b5'
      case 'PAID': return '#4caf50'
      case 'CLOSED': return '#607d8b'
      case 'PROCESSING': return '#2196f3'
      case 'READY_FOR_REVIEW': return '#9c27b0'
      default: return '#757575'
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Step indicator component
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'Policy Details' },
      { num: 2, label: 'Incident Info' },
      { num: 3, label: 'Documents' },
      { num: 4, label: 'Review' },
    ]

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 20px' }}>
        {steps.map((step) => (
          <div key={step.num} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
            {step.num > 1 && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '-50%',
                width: '100%',
                height: '2px',
                backgroundColor: currentStep >= step.num ? '#1976d2' : '#e0e0e0',
              }} />
            )}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: currentStep >= step.num ? '#1976d2' : '#e0e0e0',
              color: currentStep >= step.num ? 'white' : '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              fontWeight: 'bold',
              position: 'relative',
              zIndex: 1
            }}>
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <div style={{ fontSize: '12px', color: currentStep >= step.num ? '#1976d2' : '#666', fontWeight: currentStep >= step.num ? '600' : '400' }}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Render landing page
  const renderLandingPage = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', color: '#1976d2', marginBottom: '16px' }}>
          Smart Insurance Claim Portal
        </h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Submit and track your vehicle insurance claims easily.
        </p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '24px', fontSize: '20px' }}>Start Your Claim</h2>
        
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Policy Number
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g., POL-2024-001"
              style={{ 
                padding: '12px', 
                width: '100%', 
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Vehicle Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g., MH01AB1234"
              style={{ 
                padding: '12px', 
                width: '100%', 
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => { setCurrentStep(1); setView('form'); }}
            style={{ 
              padding: '14px 32px', 
              width: '100%',
              backgroundColor: '#1976d2', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Continue
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={() => setView('tracking')}
          style={{ 
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: '#1976d2',
            border: '2px solid #1976d2',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          View My Claims
        </button>
      </div>
    </div>
  )

  // Render step forms
  const renderStepForm = () => {
    const requiredDocs = getRequiredDocuments()

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => setView('landing')}
              style={{ 
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Claim Application</h2>
            <div></div>
          </div>

          {renderStepIndicator()}

          {error && (
            <div style={{ 
              color: '#f44336', 
              padding: '12px', 
              marginBottom: '20px',
              backgroundColor: '#ffebee', 
              borderRadius: '8px' 
            }}>
              {error}
            </div>
          )}

          {/* Step 1: Policy & Personal Details */}
          {currentStep === 1 && (
            <div>
              <h3 style={{ marginBottom: '24px', color: '#333' }}>Policy & Personal Details</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { label: 'Policy Holder Name', field: 'policyHolderName' },
                  { label: 'Vehicle Model', field: 'vehicleModel' },
                  { label: 'Vehicle Number', field: 'vehicleNumber' },
                  { label: 'Policy Start Date', field: 'policyStartDate', placeholder: 'YYYY-MM-DD' },
                  { label: 'Policy End Date', field: 'policyEndDate', placeholder: 'YYYY-MM-DD' },
                  { label: 'Aadhar Number', field: 'aadharNumber' },
                  { label: 'PAN Number', field: 'panNumber' },
                  { label: 'Driving License Number', field: 'drivingLicenseNumber' },
                  { label: 'RC Number', field: 'rcNumber' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field} style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px', color: '#666' }}>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={formData[field]}
                      onChange={(e) => updateFormData(field, e.target.value)}
                      placeholder={placeholder || `Enter ${label}`}
                      style={{ 
                        padding: '10px 12px', 
                        width: '100%', 
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                <h4 style={{ marginBottom: '16px', color: '#1976d2' }}>Incident Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Incident Date *</label>
                    <input
                      type="text"
                      value={formData.incidentDate}
                      onChange={(e) => updateFormData('incidentDate', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      required
                      style={{ 
                        padding: '12px', 
                        width: '100%', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Incident Location *</label>
                    <input
                      type="text"
                      value={formData.incidentLocation}
                      onChange={(e) => updateFormData('incidentLocation', e.target.value)}
                      required
                      placeholder="Enter location of incident"
                      style={{ 
                        padding: '12px', 
                        width: '100%', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Claim Type *</label>
                  <select
                    value={formData.claimType}
                    onChange={(e) => updateFormData('claimType', e.target.value)}
                    required
                    style={{ 
                      padding: '12px', 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Select claim type</option>
                    <option value="minor_damage">Minor Damage</option>
                    <option value="accident_major">Accident - Major</option>
                    <option value="theft">Theft</option>
                  </select>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description of Incident *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    required
                    rows="4"
                    placeholder="Describe what happened"
                    style={{ 
                      padding: '12px', 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Estimated Repair Cost</label>
                    <input
                      type="number"
                      value={formData.estimatedRepairCost}
                      onChange={(e) => updateFormData('estimatedRepairCost', e.target.value)}
                      placeholder="Enter estimated cost"
                      style={{ 
                        padding: '12px', 
                        width: '100%', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Was another vehicle involved? *</label>
                    <select
                      value={formData.anotherVehicleInvolved}
                      onChange={(e) => updateFormData('anotherVehicleInvolved', e.target.value)}
                      style={{ 
                        padding: '12px', 
                        width: '100%', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Feature 1: Other vehicle details */}
                {formData.anotherVehicleInvolved === 'Yes' && (
                  <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <h5 style={{ margin: '0 0 16px', color: '#333' }}>Other Vehicle Details</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>Other Vehicle Number *</label>
                        <input
                          type="text"
                          value={formData.otherVehicleNumber}
                          onChange={(e) => updateFormData('otherVehicleNumber', e.target.value)}
                          required
                          placeholder="e.g., MH02CD5678"
                          style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>Other Driver Name</label>
                        <input
                          type="text"
                          value={formData.otherDriverName}
                          onChange={(e) => updateFormData('otherDriverName', e.target.value)}
                          placeholder="Optional"
                          style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>Other Insurance Company</label>
                        <input
                          type="text"
                          value={formData.otherInsuranceCompany}
                          onChange={(e) => updateFormData('otherInsuranceCompany', e.target.value)}
                          placeholder="Optional"
                          style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature 2: Police report / FIR conditional */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Was a police complaint filed? *</label>
                    <select
                      value={formData.policeReportFiled}
                      onChange={(e) => updateFormData('policeReportFiled', e.target.value)}
                      style={{ 
                        padding: '12px', 
                        width: '100%', 
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  {formData.policeReportFiled === 'Yes' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload FIR Copy *</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('firCopy', e.target.files)}
                        style={{ padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', backgroundColor: 'white' }}
                      />
                      {fileErrors.firCopy && (
                        <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>{fileErrors.firCopy}</div>
                      )}
                      {formData.firCopy && formData.firCopy.length > 0 && (
                        <div style={{ color: '#4caf50', fontSize: '12px', marginTop: '4px' }}>✓ {formData.firCopy[0].name}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Document Upload - FEATURE 2, FEATURE 3, FEATURE 4 */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: '8px' }}>Document Upload</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                Please upload the required documents for your <strong>{getClaimTypeDisplay(formData.claimType)}</strong> claim.
              </p>

              {/* FEATURE 4: Dynamic Document Checklist */}
              {formData.claimType && (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '16px', 
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#333' }}>
                    Required Documents Checklist:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {requiredDocs.map((doc) => {
                      const isUploaded = uploadedDocs[doc.id] || formData[doc.id]
                      return (
                        <div key={doc.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '13px',
                          color: isUploaded ? '#4caf50' : '#666'
                        }}>
                          <span style={{ 
                            marginRight: '8px',
                            color: isUploaded ? '#4caf50' : '#ccc'
                          }}>
                            {isUploaded ? '✓' : '○'}
                          </span>
                          {doc.label} {doc.required && <span style={{ color: '#f44336' }}>*</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!formData.claimType ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  backgroundColor: '#fff3e0',
                  borderRadius: '8px'
                }}>
                  <p>Please select a claim type in Step 1 to see required documents.</p>
                </div>
              ) : (
                <>
                  {/* FEATURE 3: Show damage photos only for non-theft claims - multi upload with previews */}
                  {showDamagePhotos() && (
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#333' }}>Damage Evidence</h4>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                          Photos of Damaged Vehicle (max 5) {requiredDocs.find(d => d.id === 'damagePhotosDoc')?.required && <span style={{ color: '#f44336' }}>*</span>}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('damagePhotosDoc', e.target.files)}
                          style={{ 
                            padding: '12px', 
                            width: '100%', 
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Accepted: JPG, JPEG, PNG — Maximum 5 images</div>
                        {fileErrors.damagePhotosDoc && (
                          <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>{fileErrors.damagePhotosDoc}</div>
                        )}
                      </div>
                      {/* Thumbnail Previews */}
                      {formData.damagePhotosDoc && formData.damagePhotosDoc.length > 0 && (
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
                            Uploaded: {formData.damagePhotosDoc.length} / 5 photos
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {Array.from(formData.damagePhotosDoc).map((file, idx) => (
                              <div key={idx} style={{ width: '100px', height: '100px', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden', position: 'relative', backgroundColor: '#f5f5f5' }}>
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Damage ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                                  {idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FEATURE 2: Incident generated documents */}
                  <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#333' }}>Incident Documents</h4>
                    
                    {requiredDocs.map((doc) => {
                      // Skip damage photos as it's handled separately
                      if (doc.id === 'damagePhotosDoc' && showDamagePhotos()) return null
                      // Skip FIR if already uploaded in step 1 via police report conditional
                      if (doc.id === 'firCopy' && formData.policeReportFiled === 'Yes' && formData.firCopy && formData.firCopy.length > 0) return null

                      const allowed = allowedExtensions[doc.id] || ['.pdf', '.jpg', '.jpeg', '.png']
                      const acceptStr = allowed.join(',')
                      
                      return (
                        <div key={doc.id} style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                            {doc.label} {doc.required && <span style={{ color: '#f44336' }}>*</span>}
                          </label>
                          <input
                            type="file"
                            accept={acceptStr}
                            onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                            style={{ 
                              padding: '12px', 
                              width: '100%', 
                              borderRadius: '8px',
                              border: '1px solid #ddd',
                              backgroundColor: 'white',
                              boxSizing: 'border-box'
                            }}
                          />
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>Accepted: {allowed.join(', ')}</div>
                          {fileErrors[doc.id] && (
                            <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>{fileErrors[doc.id]}</div>
                          )}
                          {formData[doc.id] && formData[doc.id].length > 0 && (
                            <div style={{ color: '#4caf50', fontSize: '12px', marginTop: '4px' }}>✓ {formData[doc.id][0].name}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: '24px' }}>Review Your Claim</h3>
              
              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#1976d2' }}>Policy Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><strong>Policy Holder:</strong></div>
                  <div>{formData.policyHolderName}</div>
                  <div><strong>Vehicle Model:</strong></div>
                  <div>{formData.vehicleModel || 'N/A'}</div>
                  <div><strong>Vehicle Number:</strong></div>
                  <div>{formData.vehicleNumber}</div>
                  <div><strong>Policy Valid Till:</strong></div>
                  <div>{formatDate(formData.policyEndDate)}</div>
                </div>
              </div>

              <div style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#1976d2' }}>Incident Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><strong>Incident Date:</strong></div>
                  <div>{formData.incidentDate ? new Date(formData.incidentDate).toLocaleString() : 'Not specified'}</div>
                  <div><strong>Incident Location:</strong></div>
                  <div>{formData.incidentLocation || 'Not specified'}</div>
                  <div><strong>Claim Type:</strong></div>
                  <div>{getClaimTypeDisplay(formData.claimType)}</div>
                  <div><strong>Police Complaint Filed:</strong></div>
                  <div>{formData.policeReportFiled}</div>
                  <div><strong>Another Vehicle Involved:</strong></div>
                  <div>{formData.anotherVehicleInvolved}</div>
                  <div><strong>Estimated Repair Cost:</strong></div>
                  <div>{formData.estimatedRepairCost ? `₹ ${formData.estimatedRepairCost}` : 'Not specified'}</div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <strong>Description:</strong>
                  <p style={{ margin: '8px 0 0', fontSize: '14px' }}>{formData.description || 'No description provided'}</p>
                </div>
                {formData.anotherVehicleInvolved === 'Yes' && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                    <strong>Other Vehicle Details:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '14px' }}>
                      <div><strong>Vehicle Number:</strong></div>
                      <div>{formData.otherVehicleNumber || 'N/A'}</div>
                      <div><strong>Driver Name:</strong></div>
                      <div>{formData.otherDriverName || 'N/A'}</div>
                      <div><strong>Insurance Company:</strong></div>
                      <div>{formData.otherInsuranceCompany || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ 
                backgroundColor: '#e3f2bd', 
                padding: '20px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 12px' }}>Documents Uploaded</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  {requiredDocs.map((doc) => {
                    const isUploaded = uploadedDocs[doc.id] || formData[doc.id]
                    return (
                      <div key={doc.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: isUploaded ? '#2e7d32' : '#666'
                      }}>
                        <span style={{ marginRight: '8px' }}>{isUploaded ? '✓' : '✗'}</span>
                        {doc.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              style={{ 
                padding: '12px 24px',
                backgroundColor: currentStep === 1 ? '#e0e0e0' : 'white',
                color: currentStep === 1 ? '#999' : '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: '8px',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 1 && !formData.claimType) {
                    setError('Please select a claim type to proceed')
                    return
                  }
                  setError('')
                  setCurrentStep(prev => prev + 1)
                }}
                style={{ 
                  padding: '12px 32px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitClaim}
                disabled={loading}
                style={{ 
                  padding: '12px 32px',
                  backgroundColor: loading ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render success page
  const renderSuccessPage = () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '48px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          backgroundColor: '#4caf50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '40px',
          color: 'white'
        }}>
          ✓
        </div>

        <h2 style={{ fontSize: '28px', color: '#4caf50', marginBottom: '16px' }}>
          {submittedClaim?.reused_existing_claim ? 'Active Claim Found' : 'Claim Submitted Successfully!'}
        </h2>

        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          {submittedClaim?.reused_existing_claim
            ? 'An active claim already exists for this policy. Showing your current active claim.'
            : 'Your claim has been submitted and is now being processed.'}
        </p>

        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '24px', 
          borderRadius: '8px',
          marginBottom: '32px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ color: '#666' }}>Claim Number: </span>
            <strong style={{ fontSize: '18px' }}>{submittedClaim?.claim_number}</strong>
          </div>
          <div>
            <span style={{ color: '#666' }}>Status: </span>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '4px',
              backgroundColor: '#1976d2',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {submittedClaim?.status}
            </span>
          </div>
        </div>

        <button
          onClick={handleStartNewClaim}
          style={{ 
            padding: '14px 32px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '12px'
          }}
        >
          File Another Claim
        </button>

        <button
          onClick={() => setView('tracking')}
          style={{ 
            padding: '14px 32px',
            backgroundColor: 'white',
            color: '#1976d2',
            border: '2px solid #1976d2',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          View My Claims
        </button>
      </div>
    </div>
  )

  // Render claims tracking - ENHANCED (Feature 5)
  const renderTrackingPage = () => (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '32px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button
            onClick={() => { setView('landing'); setSelectedClaim(null); setClaimDetail(null) }}
            style={{ 
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#666',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          <h2 style={{ margin: 0 }}>My Claims</h2>
          <div></div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No claims found. Start a new claim to file your insurance claim.</p>
            <button
              onClick={() => setView('landing')}
              style={{ 
                padding: '12px 24px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Start New Claim
            </button>
          </div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Claim ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Claim Number</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Incident Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>#{claim.id}</td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{claim.claim_number}</td>
                  <td style={{ padding: '12px' }}>
                    {claim.incident_date ? formatDate(claim.incident_date) : 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(claim.status),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {claim.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleViewClaimDetail(claim)}
                      style={{ 
                        padding: '6px 16px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enhanced Claim Detail Modal (Feature 5) */}
      {selectedClaim && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Claim Details</h3>
              <button
                onClick={() => { setSelectedClaim(null); setClaimDetail(null); setClaimPolicy(null); setClaimTimeline([]) }}
                style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading claim details...</div>
            ) : (
              <>
                {/* Claim Information */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#1976d2', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Claim Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div><span style={{ color: '#666' }}>Claim ID: </span><strong>#{selectedClaim.id}</strong></div>
                    <div><span style={{ color: '#666' }}>Claim Number: </span><strong>{selectedClaim.claim_number}</strong></div>
                    <div><span style={{ color: '#666' }}>Status: </span>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', backgroundColor: getStatusColor(claimDetail?.status || selectedClaim.status), color: 'white', fontSize: '11px', fontWeight: '600' }}>
                        {claimDetail?.status || selectedClaim.status}
                      </span>
                    </div>
                    <div><span style={{ color: '#666' }}>Incident Date: </span><strong>{formatDateTime(selectedClaim.incident_date)}</strong></div>
                    {claimPolicy && (
                      <>
                        <div><span style={{ color: '#666' }}>Customer: </span><strong>{claimPolicy.policy_holder_name}</strong></div>
                        <div><span style={{ color: '#666' }}>Vehicle: </span><strong>{claimPolicy.vehicle_model} ({claimPolicy.vehicle_number})</strong></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Incident Details */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#1976d2', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Incident Details</h4>
                  <div style={{ fontSize: '14px' }}>
                    <p style={{ margin: '0 0 8px' }}><span style={{ color: '#666' }}>Description: </span>{claimDetail?.description || selectedClaim.description || 'No description'}</p>
                  </div>
                </div>

                {/* Settlement Calculation (if available) */}
                {(claimDetail?.estimated_amount || claimDetail?.final_payable) && (
                  <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #c8e6c9' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#2e7d32', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Settlement Summary</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                      {claimDetail.estimated_amount != null && (
                        <div><span style={{ color: '#666' }}>Repair Estimate: </span><strong>₹{claimDetail.estimated_amount?.toLocaleString()}</strong></div>
                      )}
                      {claimDetail.depreciation_amount != null && (
                        <div><span style={{ color: '#666' }}>Depreciation: </span><strong>₹{claimDetail.depreciation_amount?.toLocaleString()}</strong></div>
                      )}
                      {claimDetail.deductible_amount != null && (
                        <div><span style={{ color: '#666' }}>Deductible: </span><strong>₹{claimDetail.deductible_amount?.toLocaleString()}</strong></div>
                      )}
                      {claimDetail.final_payable != null && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #c8e6c9' }}>
                          <span style={{ color: '#666', fontSize: '16px' }}>Final Payable: </span>
                          <strong style={{ fontSize: '20px', color: '#2e7d32' }}>₹{claimDetail.final_payable?.toLocaleString()}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Documents */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#1976d2', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documents</h4>
                  {[
                    { type: 'CLAIM_FORM', label: 'Claim Form', icon: '📝' },
                    { type: 'REPAIR_ESTIMATE', label: 'Repair Estimate', icon: '💰' },
                    { type: 'REPAIR_INVOICE', label: 'Repair Invoice', icon: '🧾' },
                    { type: 'REPAIR_BILLS', label: 'Repair Bills', icon: '🧾' },
                    { type: 'FIR', label: 'FIR Copy', icon: '👮' },
                    { type: 'DAMAGE_PHOTOS', label: 'Damage Photos', icon: '📷' },
                    { type: 'SURVEY_REPORT', label: 'Survey Report', icon: '📋' },
                  ].map((doc) => {
                    const fileName = `ClaimID_${selectedClaim.id}_${doc.type}.pdf`
                    const url = `http://localhost:8000/rpa-data/Inbound/${fileName}?t=${Date.now()}`
                    return (
                      <div key={doc.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>{doc.icon}</span>
                          <span style={{ fontSize: '14px' }}>{doc.label}</span>
                        </div>
                        <button
                          onClick={() => setCustomerPreviewDoc({ label: doc.label, url })}
                          style={{ padding: '4px 12px', backgroundColor: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                        >View</button>
                      </div>
                    )
                  })}
                </div>

                {/* Document Preview Modal — near-fullscreen */}
                {customerPreviewDoc && customerPreviewDoc.url && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
                    onClick={() => setCustomerPreviewDoc(null)}>
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', width: '96vw', height: '94vh', display: 'flex', flexDirection: 'column' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0 }}>{customerPreviewDoc.label}</h3>
                        <button onClick={() => setCustomerPreviewDoc(null)} style={{ padding: '6px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Close</button>
                      </div>
                      <iframe
                        src={customerPreviewDoc.url}
                        style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: '6px', width: '100%' }}
                        title={customerPreviewDoc.label}
                      />
                    </div>
                  </div>
                )}

                {/* Claim Timeline */}
                {claimTimeline.length > 0 && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 12px', color: '#1976d2', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Claim Timeline</h4>
                    <div style={{ position: 'relative', paddingLeft: '24px' }}>
                      <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#e0e0e0' }} />
                      {claimTimeline.map((entry, index) => (
                        <div key={index} style={{ position: 'relative', marginBottom: '16px' }}>
                          <div style={{
                            position: 'absolute', left: '-21px', top: '4px',
                            width: '12px', height: '12px', borderRadius: '50%',
                            backgroundColor: index === claimTimeline.length - 1 ? '#4caf50' : '#1976d2',
                            border: '2px solid white', boxShadow: '0 0 0 2px #1976d2'
                          }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: getStatusColor(entry.new_status), color: 'white', fontSize: '11px' }}>
                                {entry.new_status}
                              </span>
                            </span>
                            <span style={{ fontSize: '12px', color: '#999' }}>{formatDateTime(entry.changed_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Main render
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f7fa',
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    }}>
      <header style={{ 
        backgroundColor: 'white', 
        padding: '16px 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#1976d2' }}>
          Smart Insurance Claim Portal
        </h1>
        <button 
          onClick={onSwitchRole} 
          style={{ 
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Switch Role
        </button>
      </header>

      <main style={{ padding: '24px' }}>
        {view === 'landing' && renderLandingPage()}
        {view === 'form' && renderStepForm()}
        {view === 'success' && renderSuccessPage()}
        {view === 'tracking' && renderTrackingPage()}
      </main>
    </div>
  )
}

export default CustomerDashboard

