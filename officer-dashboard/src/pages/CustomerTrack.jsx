import React, { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { claimService } from '../services/api'
import CustomerAvatarLogout from '../components/CustomerAvatarLogout'

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

const normalizeStatus = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (typeof value.value === 'string') return value.value
    if (typeof value.name === 'string') return value.name
  }
  return String(value)
}

const STATUS_LABELS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCUMENT_REQUIRED: 'Documents Required',
  SURVEY_ASSIGNED: 'Survey Assigned',
  SURVEY_COMPLETED: 'Survey Completed',
  UNDER_INVESTIGATION: 'Under Investigation',
  PROCESSING: 'Processing',
  READY_FOR_REVIEW: 'Ready for Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  REPAIR_IN_PROGRESS: 'Repair In Progress',
  PAYMENT_PROCESSING: 'Payment Processing',
  PAID: 'Paid',
  CLOSED: 'Closed'
}

const statusLabel = (status) => STATUS_LABELS[status] || status || '—'

const DOMINO_STEPS = [
  { key: 'REGISTERED', label: 'Registered' },
  { key: 'SURVEY_ASSIGNED', label: 'Survey Assigned' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAID', label: 'Paid' }
]

const dominoKeyForStatus = (status) => {
  const st = String(status || '').trim().toUpperCase()
  if (!st) return ''
  if (st === 'REJECTED') return 'REJECTED'
  if (st === 'PAID' || st === 'CLOSED') return 'PAID'
  if (st === 'APPROVED' || st === 'PAYMENT_PROCESSING') return 'APPROVED'
  if (st === 'PROCESSING' || st === 'READY_FOR_REVIEW' || st === 'REPAIR_IN_PROGRESS') return 'PROCESSING'
  if (st === 'SURVEY_ASSIGNED' || st === 'SURVEY_COMPLETED') return 'SURVEY_ASSIGNED'
  // Everything else is part of the initial registered/review stage.
  return 'REGISTERED'
}

function CustomerTrack() {
  const navigate = useNavigate()
  const location = useLocation()
  const { customerUser } = useAuth()
  const policyNumber = customerUser?.policyNumber

  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedClaimId, setSelectedClaimId] = useState(null)
  const [claimDetail, setClaimDetail] = useState(null)
  const [claimHistory, setClaimHistory] = useState([])
  const [loadingSelected, setLoadingSelected] = useState(false)
  const [selectedError, setSelectedError] = useState('')

  const [uploadDocumentType, setUploadDocumentType] = useState('DAMAGE_PHOTOS')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [hoveredTimelineKey, setHoveredTimelineKey] = useState(null)
  const timelineNodeRefs = useRef([])

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

  const initialClaimIdFromNav = useMemo(() => {
    const fromState = location?.state?.claimId
    const asNumber = Number(fromState)
    return Number.isFinite(asNumber) ? asNumber : null
  }, [location?.state?.claimId])

  useEffect(() => {
    if (selectedClaimId) return
    if (!claims || claims.length === 0) return

    if (initialClaimIdFromNav && claims.some(c => Number(c?.id) === initialClaimIdFromNav)) {
      setSelectedClaimId(initialClaimIdFromNav)
      return
    }

    setSelectedClaimId(Number(claims[0]?.id) || null)
  }, [claims, initialClaimIdFromNav, selectedClaimId])

  const refreshSelectedClaim = async (claimId, cancelledRef) => {
    setLoadingSelected(true)
    setSelectedError('')

    try {
      const [claimRes, historyRes] = await Promise.all([
        claimService.getClaim(claimId),
        claimService.getClaimHistory(claimId)
      ])
      if (cancelledRef?.current) return
      setClaimDetail(claimRes.data)
      setClaimHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
    } catch (err) {
      if (cancelledRef?.current) return
      const detail = err?.response?.data?.detail
      setSelectedError(typeof detail === 'string' ? detail : 'Failed to load claim details.')
      setClaimDetail(null)
      setClaimHistory([])
    } finally {
      if (!cancelledRef?.current) setLoadingSelected(false)
    }
  }

  useEffect(() => {
    const cancelledRef = { current: false }

    if (!selectedClaimId) {
      setClaimDetail(null)
      setClaimHistory([])
      setSelectedError('')
      return () => {
        cancelledRef.current = true
      }
    }

    refreshSelectedClaim(selectedClaimId, cancelledRef)

    return () => {
      cancelledRef.current = true
    }
  }, [selectedClaimId])

  const activeClaims = useMemo(() => {
    const terminal = new Set(['APPROVED', 'REJECTED', 'CLOSED'])
    return claims.filter(c => !terminal.has(String(c?.status)))
  }, [claims])

  const currentStatus = useMemo(() => normalizeStatus(claimDetail?.status), [claimDetail?.status])

  const currentDominoKey = useMemo(() => dominoKeyForStatus(currentStatus), [currentStatus])

  const timelineEvents = useMemo(() => {
    if (!claimDetail) return []

    const createdAt = claimDetail.created_at || claimDetail.incident_date

    const times = {
      REGISTERED: createdAt
    }

    const sorted = Array.isArray(claimHistory)
      ? [...claimHistory].sort((a, b) => {
        const da = new Date(a?.changed_at).getTime()
        const db = new Date(b?.changed_at).getTime()
        return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db)
      })
      : []

    sorted.forEach((h) => {
      const st = normalizeStatus(h?.new_status)
      if (!st) return
      const key = dominoKeyForStatus(st)
      if (!key) return
      if (!times[key]) times[key] = h?.changed_at
    })

    const currentKey = currentDominoKey
    const processingIndex = DOMINO_STEPS.findIndex(s => s.key === 'PROCESSING')
    const currentIndex = DOMINO_STEPS.findIndex(s => s.key === currentKey)
    const effectiveIndex = currentKey === 'REJECTED'
      ? processingIndex
      : currentIndex

    const events = DOMINO_STEPS.map((step, idx) => ({
      key: step.key,
      status: step.key,
      label: step.label,
      at: times[step.key] || null,
      done: effectiveIndex >= 0 ? idx <= effectiveIndex : idx === 0
    }))

    if (currentKey === 'REJECTED') {
      events.push({
        key: 'REJECTED',
        status: 'REJECTED',
        label: 'Rejected',
        at: times.REJECTED || claimDetail.updated_at,
        done: true
      })
    }

    return events
  }, [claimDetail, claimHistory, currentDominoKey])

  useEffect(() => {
    timelineNodeRefs.current = timelineNodeRefs.current.slice(0, timelineEvents.length)
    const nodes = timelineNodeRefs.current.filter(Boolean)

    if (!nodes.length) return

    gsap.fromTo(
      nodes,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' }
    )

    const cleanups = []
    nodes.forEach((node) => {
      const onEnter = () => {
        gsap.to(node, {
          scale: 1.025,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.24), 0 18px 34px rgba(0,0,0,0.38)',
          duration: 0.28,
          ease: 'power2.out'
        })
      }

      const onLeave = () => {
        gsap.to(node, {
          scale: 1,
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 rgba(0,0,0,0)',
          duration: 0.35,
          ease: 'power2.out'
        })
      }

      node.addEventListener('mouseenter', onEnter)
      node.addEventListener('mouseleave', onLeave)

      cleanups.push(() => {
        node.removeEventListener('mouseenter', onEnter)
        node.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [timelineEvents])

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
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer'
  }

  const selectedCardStyle = {
    ...cardStyle,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.03)'
  }

  const panelStyle = {
    padding: '28px 26px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.05)'
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

  const alertStyle = {
    padding: '18px 18px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.02)'
  }

  const handleUpload = async () => {
    if (!selectedClaimId) return
    if (!uploadFile) {
      setUploadError('Please choose a file to upload.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadMessage('')

    try {
      const res = await claimService.uploadFile(selectedClaimId, uploadFile, uploadDocumentType)
      const count = Array.isArray(res?.data?.files) ? res.data.files.length : 0
      setUploadMessage(count > 0 ? `Uploaded ${count} file(s) successfully.` : 'Uploaded successfully.')
      setUploadFile(null)
      await refreshSelectedClaim(selectedClaimId, { current: false })
    } catch (err) {
      const detail = err?.response?.data?.detail
      setUploadError(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div className="nx-noise-overlay" />
      <div style={glowStyle} />

      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
              Track Claim
            </h1>
            <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Policy: {policyNumber || '—'}
            </p>

            <button
              type="button"
              className="water-btn water-btn--sm back-btn-cs"
              onClick={() => navigate('/')}
              style={{ marginTop: 20 }}
            >
              ← Back to Main Landing Page
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="water-btn water-btn--sm back-btn-cs" onClick={() => navigate('/customer-dashboard')}>
              Back to Dashboard
            </button>
            <CustomerAvatarLogout />
          </div>
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

              <div
                style={{
                  marginTop: 28,
                  display: 'grid',
                  gridTemplateColumns: selectedClaimId ? 'minmax(300px, 420px) minmax(0, 1fr)' : '1fr',
                  gap: 22,
                  alignItems: 'start'
                }}
              >
                <div style={{ display: 'grid', gap: 18 }}>
                  {claims.map((claim) => {
                    const id = Number(claim?.id)
                    const isSelected = selectedClaimId && id === Number(selectedClaimId)
                    return (
                      <div
                        key={claim.id}
                        style={isSelected ? selectedCardStyle : cardStyle}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedClaimId(id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelectedClaimId(id)
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 500, letterSpacing: '-0.02em' }}>
                              {claim.claim_number || `Claim #${claim.id}`}
                            </div>
                            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.55)', fontSize: '0.96rem' }}>
                              Incident: {formatDate(claim.incident_date)} • Updated: {formatDateTime(claim.updated_at)}
                            </div>
                          </div>
                          <div style={badgeStyle}>{statusLabel(String(claim.status || ''))}</div>
                        </div>

                        <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.76)', fontSize: '1.06rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                          {claim.description || '—'}
                        </div>
                      </div>
                    )
                  })}

                  {claims.length === 0 && (
                    <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.65)' }}>
                      No claims yet. Use “File a New Claim” from the dashboard.
                    </div>
                  )}
                </div>

                {selectedClaimId && (
                  <div style={{ ...panelStyle, minHeight: '100%' }}>
                    {loadingSelected && <div style={{ color: 'rgba(255,255,255,0.7)' }}>Loading claim timeline…</div>}
                    {!loadingSelected && selectedError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{selectedError}</div>}

                    {!loadingSelected && !selectedError && claimDetail && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '1.55rem', fontWeight: 560, letterSpacing: '-0.02em' }}>
                              {claimDetail.claim_number || `Claim #${claimDetail.id}`}
                            </div>
                            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.58)', fontSize: '0.98rem' }}>
                              Incident: {formatDate(claimDetail.incident_date)} • Updated: {formatDateTime(claimDetail.updated_at)}
                            </div>
                          </div>
                          <div style={badgeStyle}>{statusLabel(currentStatus)}</div>
                        </div>

                        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.78)', fontSize: '1.1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {claimDetail.description || '—'}
                        </div>

                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="water-btn water-btn--sm" onClick={() => navigate(`/my-claims/${selectedClaimId}`)}>
                            Open Detailed Breakdown
                          </button>
                        </div>

                        {currentStatus === 'DOCUMENT_REQUIRED' && (
                          <div style={{ ...alertStyle, marginTop: 20 }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
                              Action Required: Documents Needed
                            </div>
                            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                              Upload the requested documents to continue processing.
                            </div>

                            <div style={{ marginTop: 16, display: 'grid', gap: 14, maxWidth: 680 }}>
                              <div>
                                <div className="nx-label">Document Type</div>
                                <select value={uploadDocumentType} onChange={(e) => setUploadDocumentType(e.target.value)} className="nx-select">
                                  <option value="DAMAGE_PHOTOS">DAMAGE_PHOTOS</option>
                                  <option value="FIR">FIR</option>
                                  <option value="DRIVING_LICENSE">DRIVING_LICENSE</option>
                                  <option value="RC_BOOK">RC_BOOK</option>
                                  <option value="REPAIR_ESTIMATE">REPAIR_ESTIMATE</option>
                                  <option value="INVOICE">INVOICE</option>
                                </select>
                              </div>

                              <div>
                                <div className="nx-label">File</div>
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                  className="nx-file-input"
                                />
                                {uploadFile && (
                                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem' }}>
                                    Selected: {uploadFile.name}
                                  </div>
                                )}
                              </div>

                              {uploadError && <div style={{ color: 'rgba(255,120,120,0.95)' }}>{uploadError}</div>}
                              {uploadMessage && <div style={{ color: 'rgba(255,255,255,0.7)' }}>{uploadMessage}</div>}

                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  disabled={uploading}
                                  onClick={handleUpload}
                                  className="water-btn water-btn--sm"
                                >
                                  {uploading ? 'Uploading…' : 'Upload'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentStatus === 'REJECTED' && (
                          <div style={{ ...alertStyle, marginTop: 20, border: '1px solid rgba(255,120,120,0.45)' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'rgba(255,120,120,0.95)' }}>
                              Claim Rejected
                            </div>
                            <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                              Reason: {claimDetail?.rejection_reason || '—'}
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: 24 }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 540, letterSpacing: '-0.02em' }}>
                            Interactive Timeline
                          </div>

                          <div style={{ marginTop: 14, display: 'grid', gap: 14 }}>
                            {timelineEvents.map((ev, idx) => {
                              const isRejected = ev.status === 'REJECTED'
                              const isCurrent = ev.key === currentDominoKey
                              const isDone = Boolean(ev.done)
                              const tooltipVisible = hoveredTimelineKey === ev.key

                              const dominoStyle = {
                                padding: '20px 20px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.02)',
                                border: isRejected
                                  ? '1px solid rgba(255,120,120,0.45)'
                                  : isCurrent
                                    ? '1px solid rgba(255,255,255,0.22)'
                                    : isDone
                                      ? '1px solid rgba(255,255,255,0.14)'
                                      : '1px solid rgba(255,255,255,0.1)',
                                transformOrigin: 'left center',
                                cursor: 'pointer',
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 0 0 rgba(0,0,0,0)'
                              }

                              const dotStyle = {
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                background: isRejected
                                  ? 'rgba(255,120,120,0.95)'
                                  : isDone || isCurrent
                                    ? 'rgba(255,255,255,0.86)'
                                    : 'rgba(255,255,255,0.35)',
                                boxShadow: isCurrent
                                  ? '0 0 0 6px rgba(255,255,255,0.08), 0 0 18px rgba(255,255,255,0.45)'
                                  : 'none'
                              }

                              return (
                                <div key={ev.key} style={{ display: 'grid', gridTemplateColumns: '26px 1fr', gap: 14, alignItems: 'start' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6, position: 'relative' }}>
                                    <div style={dotStyle} />
                                    {tooltipVisible && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          left: 20,
                                          top: -6,
                                          padding: '6px 10px',
                                          borderRadius: 999,
                                          border: '1px solid rgba(255,255,255,0.14)',
                                          background: 'rgba(15,15,15,0.92)',
                                          color: 'rgba(255,255,255,0.86)',
                                          fontSize: '0.72rem',
                                          letterSpacing: '0.08em',
                                          textTransform: 'uppercase',
                                          whiteSpace: 'nowrap',
                                          zIndex: 3
                                        }}
                                      >
                                        Stage {idx + 1}/{timelineEvents.length}
                                      </div>
                                    )}
                                  </div>

                                  <div
                                    ref={(el) => {
                                      timelineNodeRefs.current[idx] = el
                                    }}
                                    style={dominoStyle}
                                    onMouseEnter={() => setHoveredTimelineKey(ev.key)}
                                    onMouseLeave={() => setHoveredTimelineKey(null)}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                      <div style={{ fontSize: '1.08rem', fontWeight: 600, letterSpacing: '-0.01em', color: isRejected ? 'rgba(255,120,120,0.95)' : 'rgba(255,255,255,0.92)' }}>
                                        {ev.label}
                                      </div>
                                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.94rem' }}>
                                        {formatDateTime(ev.at)}
                                      </div>
                                    </div>

                                    <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.62)', fontSize: '0.92rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                      {isCurrent ? 'Current Stage' : isDone ? 'Completed Stage' : 'Pending Stage'}
                                    </div>

                                    {ev.status === 'REJECTED' && (
                                      <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                                        Reason: {claimDetail?.rejection_reason || '—'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}

                            {timelineEvents.length === 0 && (
                              <div style={{ color: 'rgba(255,255,255,0.65)' }}>
                                No timeline events available.
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerTrack
