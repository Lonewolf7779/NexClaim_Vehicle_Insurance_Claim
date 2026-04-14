import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function CustomerTrack() {
  const navigate = useNavigate()
  const { customerUser } = useAuth()
  const policyNumber = customerUser?.policyNumber

  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchClaims = async () => {
      try {
        setLoading(true)
        setError('')

        if (!policyNumber) {
          setClaims([])
          setError('Missing policy number in your session. Please login again.')
          return
        }

        const response = await claimService.getClaims({ policy_number: policyNumber })
        if (cancelled) return
        setClaims(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        if (cancelled) return
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Failed to load your claims. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchClaims()

    return () => {
      cancelled = true
    }
  }, [policyNumber])

  const activeClaims = useMemo(() => {
    const terminal = new Set(['APPROVED', 'REJECTED', 'CLOSED'])
    return claims.filter(c => !terminal.has(String(c?.status)))
  }, [claims])

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#050505',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    padding: '10vh 6vw'
  }

  const cardStyle = {
    padding: '28px 26px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer'
  }

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
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

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            Track Active Claim
          </h1>
          <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
            Policy: {policyNumber || '—'}
          </p>
        </div>

        <button type="button" style={buttonStyle} onClick={() => navigate('/customer-dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div style={{ marginTop: 56 }}>
        {loading && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading your claims…</div>}
        {!loading && error && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{error}</div>}

        {!loading && !error && (
          <>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              {activeClaims.length > 0
                ? `Active claims: ${activeClaims.length}`
                : 'No active claims found.'}
            </div>

            <div style={{ display: 'grid', gap: 18, marginTop: 28 }}>
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  style={cardStyle}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/my-claims/${claim.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') navigate(`/my-claims/${claim.id}`)
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em' }}>
                        {claim.claim_number || `Claim #${claim.id}`}
                      </div>
                      <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                        Incident: {formatDate(claim.incident_date)} • Updated: {formatDateTime(claim.updated_at)}
                      </div>
                    </div>
                    <div style={badgeStyle}>{String(claim.status || '—')}</div>
                  </div>

                  <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.72)', fontSize: '1.02rem', lineHeight: 1.6 }}>
                    {claim.description || '—'}
                  </div>
                </div>
              ))}

              {claims.length === 0 && (
                <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.65)' }}>
                  No claims yet. Use “File a New Claim” from the dashboard.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CustomerTrack
