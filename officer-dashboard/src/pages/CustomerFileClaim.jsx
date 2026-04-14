import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService, policyService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const toReadableError = (err) => {
  const detail = err?.response?.data?.detail ?? err?.response?.data
  if (!detail) return err?.message || 'Request failed'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(d => {
      if (typeof d === 'string') return d
      const loc = Array.isArray(d.loc) ? d.loc.join('.') : d.loc
      const msg = d.msg ?? JSON.stringify(d)
      return loc ? `${loc}: ${msg}` : msg
    }).join(' | ')
  }
  if (typeof detail === 'object') return detail.msg || JSON.stringify(detail)
  return String(detail)
}

function CustomerFileClaim() {
  const navigate = useNavigate()
  const { customerUser } = useAuth()
  const policyNumber = customerUser?.policyNumber

  const [policy, setPolicy] = useState(null)
  const [loadingPolicy, setLoadingPolicy] = useState(true)
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchPolicy = async () => {
      try {
        setLoadingPolicy(true)
        setError('')

        if (!policyNumber) {
          setPolicy(null)
          setError('Missing policy number in your session. Please login again.')
          return
        }

        const res = await policyService.getPolicyByNumber(policyNumber)
        if (cancelled) return
        setPolicy(res.data)
      } catch (err) {
        if (cancelled) return
        setPolicy(null)
        setError(toReadableError(err))
      } finally {
        if (!cancelled) setLoadingPolicy(false)
      }
    }

    fetchPolicy()

    return () => {
      cancelled = true
    }
  }, [policyNumber])

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#050505',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    padding: '10vh 6vw'
  }

  const buttonStyle = {
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: '999px',
    fontFamily: FONT_STACK,
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer'
  }

  const primaryButtonStyle = {
    border: 'none',
    background: '#ffffff',
    color: '#050505',
    padding: '14px 22px',
    borderRadius: '999px',
    fontFamily: FONT_STACK,
    fontSize: '0.95rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    opacity: submitting ? 0.7 : 1
  }

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.25)',
    padding: '12px 0',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    fontSize: '1.1rem',
    outline: 'none'
  }

  const textareaStyle = {
    ...inputStyle,
    minHeight: 120,
    resize: 'vertical'
  }

  const labelStyle = {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10
  }

  const panelStyle = {
    marginTop: 40,
    padding: '28px 26px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const policyId = Number(policy?.id)
    if (!Number.isInteger(policyId)) {
      setError('Unable to resolve policy id. Please check your policy number and try again.')
      return
    }

    if (!incidentDate) {
      setError('Incident date is required.')
      return
    }

    if (!description.trim()) {
      setError('Description is required.')
      return
    }

    setSubmitting(true)
    try {
      const response = await claimService.createClaim({
        policy_id: policyId,
        incident_date: `${incidentDate}T00:00:00`,
        description: description.trim()
      })

      const claimId = response?.data?.id
      if (claimId === undefined || claimId === null) {
        throw new Error('Claim created but no id was returned by the server.')
      }

      // If the backend reused an existing active claim, still route to its details.
      navigate(`/my-claims/${claimId}`)
    } catch (err) {
      setError(toReadableError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            File a New Claim
          </h1>
          <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
            Policy: {policyNumber || '—'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => navigate('/track')}>Track Claims</button>
          <button type="button" style={buttonStyle} onClick={() => navigate('/customer-dashboard')}>Back to Dashboard</button>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
          <div>
            <div style={labelStyle}>Policy Holder</div>
            <div style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)' }}>{loadingPolicy ? 'Loading…' : (policy?.policy_holder_name || customerUser?.policeholderName || '—')}</div>
          </div>
          <div>
            <div style={labelStyle}>Vehicle</div>
            <div style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)' }}>{loadingPolicy ? 'Loading…' : (policy?.vehicle_number ? `${policy.vehicle_number}${policy.vehicle_model ? ` • ${policy.vehicle_model}` : ''}` : '—')}</div>
          </div>
          <div>
            <div style={labelStyle}>Coverage</div>
            <div style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)' }}>{loadingPolicy ? 'Loading…' : (policy?.policy_type || '—')}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 32, display: 'grid', gap: 26, maxWidth: 760 }}>
          <div>
            <div style={labelStyle}>Incident Date</div>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <div style={labelStyle}>Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={textareaStyle}
              placeholder="Describe what happened…"
              required
            />
          </div>

          {error && (
            <div style={{ color: 'rgba(255,120,120,0.95)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="submit" style={primaryButtonStyle} disabled={submitting || loadingPolicy}>
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              After submission, you can upload documents in the claim details view.
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerFileClaim
