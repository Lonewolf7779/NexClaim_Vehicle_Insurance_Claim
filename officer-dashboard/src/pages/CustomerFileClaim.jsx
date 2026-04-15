import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService, policyService } from '../services/api'

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

  const policyNumber = customerUser?.policyNumber
  const policyHolderName = customerUser?.policeholderName

  const [policy, setPolicy] = useState(null)
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [policyError, setPolicyError] = useState('')

  const [step, setStep] = useState(1) // 1: Incident, 2: Driver, 3: Evidence

  // Step 1
  const [incidentType, setIncidentType] = useState('ACCIDENT')
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [incidentLocation, setIncidentLocation] = useState('')
  const [description, setDescription] = useState('')

  // Step 2
  const [driverName, setDriverName] = useState(policyHolderName || '')
  const [driverPhone, setDriverPhone] = useState('')
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('')

  // Step 3
  const [firFile, setFirFile] = useState(null)
  const [evidenceFiles, setEvidenceFiles] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchPolicy = async () => {
      try {
        setLoadingPolicy(true)
        setPolicyError('')
        setPolicy(null)

        if (!policyNumber) {
          setPolicyError('Missing policy number in your session. Please login again.')
          return
        }

        const response = await policyService.getPolicyByNumber(policyNumber)
        if (cancelled) return
        setPolicy(response.data)
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
    return ''
  }

  const validateStep3 = () => {
    if (theftRequiresFir && !firFile) return 'FIR upload is required for theft claims.'
    return ''
  }

  const buildClaimDescription = () => {
    const lines = []
    lines.push(`Incident type: ${incidentType}`)
    if (incidentLocation?.trim()) lines.push(`Location: ${incidentLocation.trim()}`)
    lines.push(`Driver name: ${driverName?.trim() || '—'}`)
    if (driverPhone?.trim()) lines.push(`Driver phone: ${driverPhone.trim()}`)
    if (driverLicenseNumber?.trim()) lines.push(`Driver license: ${driverLicenseNumber.trim()}`)
    lines.push('')
    lines.push(String(description || '').trim())
    return lines.join('\n')
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

    let claimId = null

    try {
      const payload = {
        policy_id: policySummary.id,
        incident_date: incidentDate,
        description: buildClaimDescription()
      }

      const response = await claimService.createClaim(payload)
      claimId = response?.data?.id
      if (!claimId) throw new Error('No claim ID returned')

      const existingHeader = response?.headers?.['x-existing-claim']
      const existing = String(existingHeader || '').toLowerCase() === 'true'

      try {
        const uploads = []
        if (theftRequiresFir && firFile) uploads.push(claimService.uploadFile(claimId, firFile, 'FIR'))
        evidenceFiles.forEach((f) => {
          if (f) uploads.push(claimService.uploadFile(claimId, f, 'DAMAGE_PHOTOS'))
        })
        if (uploads.length > 0) await Promise.all(uploads)
      } catch (uploadErr) {
        setSubmitError(`Claim submitted${existing ? ' (existing claim reused)' : ''}, but document upload failed: ${toReadableError(uploadErr)}`)
        navigate('/track', { state: { claimId } })
        return
      }

      navigate('/track', { state: { claimId } })
    } catch (err) {
      setSubmitError(toReadableError(err, 'Failed to submit claim.'))
      if (!claimId) return
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
              Policy: {policyNumber || '—'}
            </p>
          </div>

          <button type="button" className="water-btn water-btn--sm back-btn-cs" onClick={() => navigate('/customer-dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div style={{ marginTop: 56 }}>
          {loadingPolicy && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading your policy…</div>}
          {!loadingPolicy && policyError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{policyError}</div>}

          {!loadingPolicy && !policyError && policySummary && (
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
                  </>
                )}

                {step === 3 && (
                  <>
                    {theftRequiresFir && (
                      <div>
                        <label className="nx-label">FIR Upload (Required for Theft)</label>
                        <input type="file" accept=".pdf,image/*" onChange={(e) => setFirFile(e.target.files?.[0] || null)} className="nx-file-input" />
                        {firFile && <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>Selected: {firFile.name}</div>}
                      </div>
                    )}

                    <div>
                      <label className="nx-label">Additional Evidence (Optional)</label>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                        className="nx-file-input"
                      />
                      {evidenceFiles.length > 0 && (
                        <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>
                          Selected: {evidenceFiles.map(f => f.name).join(', ')}
                        </div>
                      )}
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.98rem', lineHeight: 1.6 }}>
                      Documents upload after claim submission.
                    </div>
                  </>
                )}

                {submitError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{submitError}</div>}

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    disabled={step === 1 || nextButtonDisabled}
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
                      disabled={nextButtonDisabled}
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
