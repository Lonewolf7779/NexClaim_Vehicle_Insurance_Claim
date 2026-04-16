import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService, policyService } from '../services/api'
import CustomerAvatarLogout from '../components/CustomerAvatarLogout'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const toReadableError = (err, fallback = 'Something went wrong. Please try again.') => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const msg = detail
      .map(d => (typeof d?.msg === 'string' ? d.msg : ''))
      .filter(Boolean)
      .join(', ')
    if (msg) return msg
  }
  return err?.message || fallback
}

const safeParseDate = (value) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
}

const isDateWithinInclusive = (date, start, end) => {
  if (!date || !start || !end) return false
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function CustomerFileClaim() {
  const navigate = useNavigate()
  const { customerUser } = useAuth()

  const defaultPolicyNumber = customerUser?.policyNumber || ''
  const defaultHolderName = customerUser?.policeholderName || ''

  const [step, setStep] = useState(0) // 0: Verify Policy, 1: Incident, 2: Driver, 3: Evidence

  const [authPolicyNumber, setAuthPolicyNumber] = useState(defaultPolicyNumber)
  const [authPassword, setAuthPassword] = useState('')
  const [verifyingPolicy, setVerifyingPolicy] = useState(false)
  const [verifyError, setVerifyError] = useState('')

  const [policyNumber, setPolicyNumber] = useState('') // Set after step 0 is passed
  const [policyHolderName, setPolicyHolderName] = useState('')

  const [policy, setPolicy] = useState(null)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [policyError, setPolicyError] = useState('')

  // Step 1
  const [incidentType, setIncidentType] = useState('ACCIDENT')
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [thirdPartyInvolved, setThirdPartyInvolved] = useState('NO') // YES | NO
  const [incidentLocation, setIncidentLocation] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [driverName, setDriverName] = useState(policyHolderName || '')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('')
  const [firFiled, setFirFiled] = useState('NO') // YES | NO
  const [policeStationName, setPoliceStationName] = useState('')

  // Step 3
  const [firFile, setFirFile] = useState(null)
  const [repairEstimateFile, setRepairEstimateFile] = useState(null)
  const [damagePhotoFiles, setDamagePhotoFiles] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdClaimId, setCreatedClaimId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetchPolicy = async () => {
      try {
        setLoadingPolicy(true)
        setPolicyError('')
        setPolicy(null)

        if (!policyNumber) {
          setLoadingPolicy(false)
          return
        }

        const response = await policyService.getPolicyByNumber(policyNumber)
        if (cancelled) return
        setPolicy(response.data)
        setPolicyHolderName(response.data.policy_holder_name)
      } catch (err) {
        if (cancelled) return
        setPolicyError(toReadableError(err, 'Failed to load policy details.'))
      } finally {
        if (!cancelled) setLoadingPolicy(false)
      }
    }

    fetchPolicy()
    return () => {
      cancelled = true
    }
  }, [policyNumber])

  useEffect(() => {
    setDriverName((prev) => (prev ? prev : (policyHolderName || '')))
  }, [policyHolderName])

  const policySummary = useMemo(() => {
    if (!policy) return null
    const start = policy.policy_start_date ? new Date(policy.policy_start_date) : null
    const end = policy.policy_end_date ? new Date(policy.policy_end_date) : null
    const startDate = start && !Number.isNaN(start.getTime()) ? start : null
    const endDate = end && !Number.isNaN(end.getTime()) ? end : null
    return {
      id: policy.id,
      policyNumber: policy.policy_number,
      policyHolderName: policy.policy_holder_name,
      vehicleNumber: policy.vehicle_number,
      vehicleModel: policy.vehicle_model,
      policyType: policy.policy_type,
      idvAmount: policy.idv_amount,
      rcNumber: policy.rc_number,
      hasZeroDep: policy.has_zero_depreciation,
      isActive: policy.is_active,
      startLabel: startDate ? startDate.toLocaleDateString() : '—',
      endLabel: endDate ? endDate.toLocaleDateString() : '—',
      startDate,
      endDate
    }
  }, [policy])

  const incidentDateObj = useMemo(() => safeParseDate(incidentDate), [incidentDate])
  const coverageOk = useMemo(() => {
    if (!policySummary?.startDate || !policySummary?.endDate || !incidentDateObj) return null
    return isDateWithinInclusive(incidentDateObj, policySummary.startDate, policySummary.endDate)
  }, [incidentDateObj, policySummary?.startDate, policySummary?.endDate])

  const theftRequiresFir = incidentType === 'THEFT'

  const validateStep1 = () => {
    if (!policySummary?.id) return 'Missing policy details. Please refresh and try again.'
    if (!incidentType) return 'Please select an incident type.'
    if (!incidentDateObj) return 'Please enter a valid incident date.'
    if (coverageOk === false) return 'Incident date is outside your policy coverage period.'
    if (!String(description || '').trim()) return 'Please enter a short incident description.'
    return ''
  }

  const validateStep2 = () => {
    if (!String(driverName || '').trim()) return 'Please enter the driver name.'
    if (!String(driverPhone || '').trim()) return 'Please enter the driver phone number.'
    if (!String(driverLicenseNumber || '').trim()) return 'Please enter the driver license number.'
    if (firFiled === 'YES' && !String(policeStationName || '').trim()) return 'Please enter the police station name.'
    return ''
  }

  const validateStep3 = () => {
    if (!repairEstimateFile) return 'Repair estimate / invoice upload is required.'
    if (!Array.isArray(damagePhotoFiles) || damagePhotoFiles.length === 0) return 'Please upload at least one damage photo.'
    if (theftRequiresFir && !firFile) return 'FIR upload is required for theft claims.'
    return ''
  }

  const buildClaimDescription = () => {
    const lines = []
    lines.push(`Incident type: ${incidentType}`)
    lines.push(`Third-party involved: ${thirdPartyInvolved === 'YES' ? 'Yes' : 'No'}`)
    lines.push(`FIR filed: ${firFiled === 'YES' ? 'Yes' : 'No'}`)
    if (firFiled === 'YES' && policeStationName?.trim()) lines.push(`Police station: ${policeStationName.trim()}`)
    if (incidentLocation?.trim()) lines.push(`Location: ${incidentLocation.trim()}`)
    lines.push(`Driver name: ${driverName?.trim() || '—'}`)
    if (driverPhone?.trim()) lines.push(`Driver phone: ${driverPhone.trim()}`)
    if (driverLicenseNumber?.trim()) lines.push(`Driver license: ${driverLicenseNumber.trim()}`)
    lines.push('')
    lines.push(String(description || '').trim())
    return lines.join('\n')
  }

  const handleVerifyPolicy = async (e) => {
    e.preventDefault()
    setVerifyError('')

    const pn = authPolicyNumber.trim().toUpperCase()
    const pwd = authPassword

    if (!pn) return setVerifyError('Policy number is required.')
    if (!pwd) return setVerifyError('Password is required.')
    if (pwd !== 'admin') return setVerifyError('Invalid credentials.')

    setVerifyingPolicy(true)
    try {
      const res = await policyService.getPolicyByNumber(pn)
      if (!res.data) throw new Error('Policy not found.')
      
      setPolicyNumber(pn)
      setPolicyHolderName(res.data.policy_holder_name)
      setStep(1)
    } catch (err) {
      setVerifyError(toReadableError(err, 'Failed to verify policy.'))
    } finally {
      setVerifyingPolicy(false)
    }
  }

  const handleNext = () => {
    setSubmitError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) return setSubmitError(err)
      setStep(2)
      return
    }
    if (step === 2) {
      const err = validateStep2()
      if (err) return setSubmitError(err)
      setStep(3)
    }
  }

  const handleBack = () => {
    setSubmitError('')
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const err1 = validateStep1()
    if (err1) {
      setSubmitError(err1)
      setStep(1)
      return
    }
    const err2 = validateStep2()
    if (err2) {
      setSubmitError(err2)
      setStep(2)
      return
    }
    const err3 = validateStep3()
    if (err3) {
      setSubmitError(err3)
      setStep(3)
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      let claimId = createdClaimId

      if (!claimId) {
        const payload = {
          policy_id: policySummary.id,
          incident_date: incidentDate,
          description: buildClaimDescription()
        }

        const response = await claimService.createClaim(payload)
        claimId = response?.data?.id
        if (!claimId) throw new Error('No claim ID returned')
        setCreatedClaimId(claimId)
      }

      try {
        const uploads = []

        if (repairEstimateFile) uploads.push(claimService.uploadFile(claimId, repairEstimateFile, 'REPAIR_ESTIMATE'))

        ;(damagePhotoFiles || []).forEach((f) => {
          if (f) uploads.push(claimService.uploadFile(claimId, f, 'DAMAGE_PHOTOS'))
        })

        if (firFile) uploads.push(claimService.uploadFile(claimId, firFile, 'FIR'))

        const results = await Promise.all(uploads)
        const anyNon200 = results.some((r) => r?.status !== 200)
        if (anyNon200) throw new Error('One or more uploads returned a non-200 response.')
      } catch (uploadErr) {
        setSubmitError(`Claim created, but document upload failed: ${toReadableError(uploadErr)}`)
        return
      }

      navigate('/track', { state: { claimId } })
    } catch (err) {
      if (err?.response?.status === 409) {
        setSubmitError(err?.response?.data?.detail || 'A claim for this incident date already exists.')
        return
      }
      setSubmitError(toReadableError(err, 'Failed to submit claim.'))
    } finally {
      setSubmitting(false)
    }
  }

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#1c1d20',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    padding: '10vh 6vw',
    position: 'relative',
    overflow: 'hidden'
  }

  const contentStyle = {
    position: 'relative',
    zIndex: 1
  }

  const glowStyle = {
    position: 'absolute',
    right: '-20%',
    top: '-30%',
    width: '70%',
    height: '70%',
    background: 'radial-gradient(circle at center, rgba(16,185,129,0.18) 0%, transparent 60%)',
    opacity: 0.9,
    filter: 'blur(80px)',
    pointerEvents: 'none',
    zIndex: 0
  }

  const cardStyle = {
    padding: '28px 26px',
    borderRadius: '24px',
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.05)'
  }

  const stepPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  }

  const nextButtonDisabled = submitting || loadingPolicy

  const submitBlockedByRequiredUploads =
    step === 3 &&
    (
      !repairEstimateFile ||
      !Array.isArray(damagePhotoFiles) ||
      damagePhotoFiles.length === 0 ||
      (theftRequiresFir && !firFile)
    )

  return (
    <div style={pageStyle}>
      <div className="nx-noise-overlay" />
      <div style={glowStyle} />

      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
              File a New Claim
            </h1>
            <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
              {policyNumber ? `Policy: ${policyNumber}` : 'Verify your policy to proceed'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="water-btn water-btn--sm back-btn-cs" onClick={() => navigate('/customer-dashboard')}>
              Back to Dashboard
            </button>
            <CustomerAvatarLogout />
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          {step === 0 && (
            <div style={{ maxWidth: 400, ...cardStyle }}>
              <form onSubmit={handleVerifyPolicy} style={{ display: 'grid', gap: 20 }}>
                <div>
                  <label className="nx-label">Policy Number</label>
                  <input 
                    type="text" 
                    value={authPolicyNumber} 
                    onChange={e => setAuthPolicyNumber(e.target.value)} 
                    placeholder="e.g. POL1005"
                    className="nx-input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="nx-label">Password</label>
                  <input 
                    type="password" 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)} 
                    placeholder="Enter policy password"
                    className="nx-input"
                  />
                </div>
                {verifyError && <div style={{ color: '#ff4d4d', fontSize: '0.9rem' }}>{verifyError}</div>}
                <button 
                  type="submit" 
                  disabled={verifyingPolicy}
                  className="water-btn" 
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {verifyingPolicy ? 'Verifying...' : 'Verify Policy'}
                </button>
              </form>
            </div>
          )}

          {step > 0 && loadingPolicy && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading your policy…</div>}
          {step > 0 && !loadingPolicy && policyError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{policyError}</div>}

          {step > 0 && !loadingPolicy && !policyError && policySummary && (
            <div className="nx-split-3-1">
              <form onSubmit={handleSubmit} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={stepPillStyle}>Step {step} / 3</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>FNOL Wizard</div>
                </div>

                <div style={{ marginTop: 18, display: 'grid', gap: 16 }}>
                {step === 1 && (
                  <>
                    <div>
                      <label className="nx-label">Incident Type</label>
                      <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className="nx-select">
                        <option value="ACCIDENT">Accident</option>
                        <option value="THEFT">Theft</option>
                        <option value="FIRE">Fire</option>
                        <option value="FLOOD">Flood</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="nx-label">Incident Date</label>
                      <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className="nx-input" />
                      {coverageOk === false && (
                        <div style={{ marginTop: 10, color: 'rgba(255,120,120,0.95)' }}>
                          Incident date is outside your policy coverage period.
                        </div>
                      )}
                      {coverageOk === true && (
                        <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)' }}>
                          Coverage check passed.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="nx-label">Was a Third-Party involved?</label>
                      <select value={thirdPartyInvolved} onChange={(e) => setThirdPartyInvolved(e.target.value)} className="nx-select">
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>

                    <div>
                      <label className="nx-label">Location (Optional)</label>
                      <input type="text" value={incidentLocation} onChange={(e) => setIncidentLocation(e.target.value)} className="nx-input" placeholder="City / Area" />
                    </div>

                    <div>
                      <label className="nx-label">Incident Description</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="nx-textarea" placeholder="Briefly describe what happened…" />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label className="nx-label">Driver Name</label>
                      <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="nx-input" placeholder="Full name" />
                    </div>

                    <div>
                      <label className="nx-label">Driver Phone</label>
                      <input type="tel" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="nx-input" placeholder="e.g., +91 98xxxxxxx" />
                    </div>

                    <div>
                      <label className="nx-label">Driver License Number</label>
                      <input type="text" value={driverLicenseNumber} onChange={(e) => setDriverLicenseNumber(e.target.value)} className="nx-input" placeholder="DL number" />
                    </div>

                    <div>
                      <label className="nx-label">Was an FIR filed?</label>
                      <select value={firFiled} onChange={(e) => setFirFiled(e.target.value)} className="nx-select">
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>

                    {firFiled === 'YES' && (
                      <div>
                        <label className="nx-label">Police Station Name</label>
                        <input
                          type="text"
                          value={policeStationName}
                          onChange={(e) => setPoliceStationName(e.target.value)}
                          className="nx-input"
                          placeholder="e.g., Jubilee Hills PS"
                        />
                      </div>
                    )}
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <label className="nx-label">Repair Estimate / Invoice (Required)</label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setRepairEstimateFile(e.target.files?.[0] || null)}
                        className="nx-file-input"
                      />
                      {repairEstimateFile && <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>Selected: {repairEstimateFile.name}</div>}
                    </div>

                    <div>
                      <label className="nx-label">Damage Photos (Required)</label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={(e) => setDamagePhotoFiles(Array.from(e.target.files || []))}
                        className="nx-file-input"
                      />
                      {damagePhotoFiles.length > 0 && (
                        <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>
                          Selected: {damagePhotoFiles.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>

                    {(theftRequiresFir || firFiled === 'YES') && (
                      <div>
                        <label className="nx-label">FIR Upload {theftRequiresFir ? '(Required for Theft)' : '(Optional)'}</label>
                        <input type="file" accept=".pdf,image/*" onChange={(e) => setFirFile(e.target.files?.[0] || null)} className="nx-file-input" />
                        {firFile && <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>Selected: {firFile.name}</div>}
                      </div>
                    )}

                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.98rem', lineHeight: 1.6 }}>
                      Claim will be submitted first, then documents are uploaded.
                    </div>
                  </>
                )}

                {submitError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{submitError}</div>}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    disabled={step === 1 || nextButtonDisabled || (step === 3 && !!createdClaimId)}
                    onClick={handleBack}
                    className="water-btn water-btn--sm back-btn-cs"
                  >
                    Back
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      disabled={nextButtonDisabled}
                      onClick={handleNext}
                      className="water-btn water-btn--sm"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={nextButtonDisabled || submitBlockedByRequiredUploads}
                      className="water-btn water-btn--sm"
                    >
                      {submitting ? 'Submitting…' : 'Submit Claim'}
                    </button>
                  )}
                </div>
                </div>
              </form>

              <div style={cardStyle}>
                <div style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666666' }}>
                  Policy Snapshot
                </div>

                <div style={{ marginTop: 18, display: 'grid', gap: 16 }}>
                  <div>
                    <div className="nx-label">Policy Holder</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                      <span className="nx-name-gradient">{policySummary.policyHolderName || policyHolderName || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="nx-label">Policy Number</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)' }}>{policySummary.policyNumber || policyNumber || '—'}</div>
                  </div>

                  <div>
                    <div className="nx-label">Vehicle</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                      {policySummary.vehicleModel || '—'}
                      {policySummary.vehicleNumber ? ` • ${policySummary.vehicleNumber}` : ''}
                    </div>
                  </div>

                  <div>
                    <div className="nx-label">Coverage</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                      {policySummary.startLabel} → {policySummary.endLabel}
                    </div>
                  </div>

                  <div>
                    <div className="nx-label">Policy Type</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)' }}>{policySummary.policyType || '—'}</div>
                  </div>

                  <div>
                    <div className="nx-label">IDV Amount</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {policySummary.idvAmount !== undefined && policySummary.idvAmount !== null ? String(policySummary.idvAmount) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerFileClaim
