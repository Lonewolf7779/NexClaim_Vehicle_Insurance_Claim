import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

const toReadableError = (err, fallback = 'Request failed. Please try again.') => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  return err?.message || fallback
}

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

const formatAmount = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return n.toLocaleString()
}

const fileNameFromPath = (path) => {
  if (!path || typeof path !== 'string') return '—'
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

function CustomerClaimDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth, customerUser } = useAuth()

  const policyNumber = customerUser?.policyNumber

  const claimId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) ? n : null
  }, [id])

  const [claim, setClaim] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth.customer) return

    let cancelled = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        setClaim(null)
        setDocuments([])

        if (!claimId) {
          setError('Invalid claim id.')
          return
        }

        const [claimRes, docsRes] = await Promise.all([
          claimService.getClaim(claimId),
          claimService.getDocuments(claimId).catch(() => ({ data: [] }))
        ])

        if (cancelled) return
        setClaim(claimRes.data)
        setDocuments(Array.isArray(docsRes?.data) ? docsRes.data : [])
      } catch (err) {
        if (cancelled) return
        setError(toReadableError(err, 'Failed to load claim details.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [auth.customer, claimId])

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
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.05)'
  }

  if (!auth.customer) return null

  return (
    <div style={pageStyle}>
      <div className="nx-noise-overlay" />
      <div style={glowStyle} />

      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(3rem, 7vw, 7rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
              Claim #{claim?.claim_number || claimId || '—'}
            </h1>
            <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Policy: {policyNumber || '—'}
            </p>
          </div>

          <button type="button" className="water-btn water-btn--sm back-btn-cs" onClick={() => navigate('/track')}>
            Back to Tracking
          </button>
        </div>

        <div style={{ marginTop: 56 }}>
          {loading && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading claim details…</div>}
          {!loading && error && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{error}</div>}

          {!loading && !error && claim && (
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                <div style={cardStyle}>
                  <div className="nx-label">Status</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
                    {String(claim.status || '—')}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Incident Date</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                    {formatDate(claim.incident_date)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Submitted</div>
                  <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    {formatDateTime(claim.created_at)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Last Updated</div>
                  <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                    {formatDateTime(claim.updated_at)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Estimated Amount</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                    {formatAmount(claim.estimated_amount)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Depreciation</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                    {formatAmount(claim.depreciation_amount)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Deductible</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                    {formatAmount(claim.deductible_amount)}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div className="nx-label">Final Payable</div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 650, letterSpacing: '-0.02em' }}>
                    {formatAmount(claim.final_payable)}
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div className="nx-label">Description</div>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {claim.description || '—'}
                </div>
              </div>

              {String(claim.status) === 'REJECTED' && (
                <div style={{ ...cardStyle, border: '1px solid rgba(255,120,120,0.45)' }}>
                  <div className="nx-label">Rejection Reason</div>
                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {claim.rejection_reason || '—'}
                  </div>
                </div>
              )}

              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666666' }}>
                      Documents
                    </div>
                    <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)' }}>
                      {documents.length > 0 ? `${documents.length} uploaded` : 'No documents uploaded yet'}
                    </div>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                    {documents.map((doc) => (
                      <div
                        key={doc?.id || `${doc?.document_type}-${doc?.file_path}`}
                        style={{
                          padding: '18px 18px',
                          borderRadius: '14px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        <div className="nx-label">{doc?.document_type || 'DOCUMENT'}</div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                          {fileNameFromPath(doc?.file_path)}
                        </div>
                        <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
                          {formatDateTime(doc?.extracted_at)}
                        </div>

                        {doc?.file_path && (
                          <div style={{ marginTop: 14 }}>
                            <a
                              className="water-btn water-btn--sm"
                              href={`http://localhost:8000${doc.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerClaimDetailPage
