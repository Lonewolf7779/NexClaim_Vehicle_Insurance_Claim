import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { policyService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

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

function CustomerPolicyLocker() {
  const navigate = useNavigate()
  const { customerUser } = useAuth()
  const policyNumber = customerUser?.policyNumber

  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchPolicy = async () => {
      try {
        setLoading(true)
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
        if (!cancelled) setLoading(false)
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

  const panelStyle = {
    marginTop: 40,
    padding: '28px 26px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)'
  }

  const labelStyle = {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 10
  }

  const valueStyle = {
    fontSize: '1.15rem',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.45
  }

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            Digital Policy Locker
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
        {loading && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading policy…</div>}
        {!loading && error && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{error}</div>}

        {!loading && !error && policy && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22 }}>
            <div>
              <div style={labelStyle}>Policy Holder</div>
              <div style={valueStyle}>{policy.policy_holder_name || customerUser?.policeholderName || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Vehicle</div>
              <div style={valueStyle}>{policy.vehicle_number ? `${policy.vehicle_number}${policy.vehicle_model ? ` • ${policy.vehicle_model}` : ''}` : '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Policy Type</div>
              <div style={valueStyle}>{policy.policy_type || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Active</div>
              <div style={valueStyle}>{typeof policy.is_active === 'boolean' ? (policy.is_active ? 'Yes' : 'No') : '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Start Date</div>
              <div style={valueStyle}>{formatDate(policy.policy_start_date)}</div>
            </div>
            <div>
              <div style={labelStyle}>End Date</div>
              <div style={valueStyle}>{formatDate(policy.policy_end_date)}</div>
            </div>
            <div>
              <div style={labelStyle}>IDV Amount</div>
              <div style={valueStyle}>{policy.idv_amount !== undefined && policy.idv_amount !== null ? String(policy.idv_amount) : '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Zero Depreciation</div>
              <div style={valueStyle}>{typeof policy.has_zero_depreciation === 'boolean' ? (policy.has_zero_depreciation ? 'Yes' : 'No') : '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>RC Number</div>
              <div style={valueStyle}>{policy.rc_number || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Chassis Number</div>
              <div style={valueStyle}>{policy.chassis_number || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Engine Number</div>
              <div style={valueStyle}>{policy.engine_number || '—'}</div>
            </div>
          </div>
        )}

        {!loading && !error && !policy && (
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>No policy found.</div>
        )}
      </div>
    </div>
  )
}

export default CustomerPolicyLocker
