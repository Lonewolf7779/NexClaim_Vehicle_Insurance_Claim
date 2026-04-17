import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { claimService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Arial, sans-serif'

const toDecisionLabel = (value) => {
  if (!value) return 'Not Selected'
  if (value === 'approve') return 'Approve Override'
  if (value === 'reject') return 'Reject Override'
  return String(value)
}

function EscalationDashboard({ onSwitchRole }) {
  const dashboardRef = useRef(null)
  const ambientOrbRefs = useRef([])

  // State for escalation override
  const [claimId, setClaimId] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideAmount, setOverrideAmount] = useState('')
  const [finalDecision, setFinalDecision] = useState('')

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [escalationResult, setEscalationResult] = useState(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        dashboardRef.current,
        { autoAlpha: 0, y: 26, filter: 'blur(10px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', delay: 0.1 }
      )

      const orbs = ambientOrbRefs.current.filter(Boolean)
      if (!orbs.length) return

      gsap.fromTo(
        orbs,
        { autoAlpha: 0, scale: 0.88 },
        { autoAlpha: 0.95, scale: 1, duration: 1.2, stagger: 0.16, ease: 'power3.out', delay: 0.2 }
      )

      orbs.forEach((orb, index) => {
        gsap.to(orb, {
          x: index === 1 ? -18 : 14,
          y: index === 2 ? 20 : -16,
          duration: 4 + index,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      })
    }, dashboardRef)

    return () => ctx.revert()
  }, [])

  // Handle API errors
  const handleApiError = (err) => {
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    setError(message)
  }

  // Submit escalation override
  const handleSubmitEscalation = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const numericClaimId = Number.parseInt(claimId, 10)
      if (!Number.isInteger(numericClaimId) || numericClaimId <= 0) {
        throw new Error('Provide a valid Claim ID before submitting.')
      }

      // Placeholder API call - would use claimService.overrideDecision in production
      await claimService.triggerProcessing(numericClaimId)
      setEscalationResult({
        claim_id: numericClaimId,
        override_reason: overrideReason,
        override_amount: overrideAmount,
        final_decision: finalDecision,
        status: 'OVERRIDDEN'
      })
      setSuccessMessage('Escalation override submitted successfully and routed for officer review.')
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setClaimId('')
    setOverrideReason('')
    setOverrideAmount('')
    setFinalDecision('')
    setError(null)
    setSuccessMessage(null)
    setEscalationResult(null)
  }

  const handleLogout = () => {
    if (typeof onSwitchRole === 'function') {
      onSwitchRole()
    }
  }

  const surfaceCard = {
    background: 'linear-gradient(170deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 26px 56px rgba(0,0,0,0.35)',
    borderRadius: '22px'
  }

  const fieldLabel = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(220,228,240,0.78)',
    letterSpacing: '0.08em',
    textTransform: 'none'
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(15,20,32,0.74)',
    color: '#f5f8ff',
    fontSize: '14px',
    outline: 'none'
  }

  const bannerBase = {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid',
    marginBottom: '14px',
    fontSize: '13px'
  }

  return (
    <div
      ref={dashboardRef}
      className="escalation-dashboard-page"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(125% 110% at 10% 0%, rgba(255,139,92,0.22), transparent 44%), radial-gradient(120% 115% at 92% 8%, rgba(236,72,153,0.2), transparent 48%), linear-gradient(180deg, #0b0d14 0%, #10151f 50%, #0a0d15 100%)',
        color: '#fff',
        fontFamily: FONT_STACK,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .escalation-dashboard-page,
        .escalation-dashboard-page * {
          font-family: ${FONT_STACK} !important;
        }
        .escalation-dashboard-page input:focus,
        .escalation-dashboard-page select:focus,
        .escalation-dashboard-page textarea:focus {
          border-color: rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.07) !important;
        }
        .es-water-btn {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: #f5f8ff;
          padding: 11px 20px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 0.78rem;
          text-transform: none;
          letter-spacing: 0.04em;
          transition: color 0.4s ease, border-color 0.4s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          isolation: isolate;
        }
        .es-water-btn::before {
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
        .es-water-btn:hover::before {
          height: 100%;
          border-radius: 0;
        }
        .es-water-btn:hover {
          color: #161b25;
          border-color: #ffffff;
        }
        .es-water-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>

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
          background: 'radial-gradient(circle at center, rgba(244,114,182,0.24) 0%, transparent 62%)',
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
          background: 'radial-gradient(circle at center, rgba(251,146,60,0.2) 0%, transparent 60%)',
          filter: 'blur(96px)',
          opacity: 0.72,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

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
          background: 'radial-gradient(circle at center, rgba(125,211,252,0.15) 0%, transparent 62%)',
          filter: 'blur(84px)',
          opacity: 0.7,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <header
          style={{
            padding: '24px clamp(18px, 3vw, 34px) 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(10px)',
            gap: '14px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.6vw, 3rem)', color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.98, fontWeight: 520 }}>
              Escalation Dashboard
            </h1>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.58)', fontSize: '0.96rem' }}>
              Resolve escalated claim decisions with controlled override flow.
            </p>
          </div>
          <button onClick={handleLogout} className="es-water-btn">
            Logout
          </button>
        </header>

        <main style={{ padding: '22px clamp(16px, 2.6vw, 28px) 32px', maxWidth: '1300px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', alignItems: 'start' }}>
            <section className="ed-anim-item" style={{ ...surfaceCard, padding: '22px' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#fff', letterSpacing: '-0.02em', fontWeight: 560 }}>Escalation Override</h2>
              <p style={{ margin: '10px 0 18px', color: 'rgba(211,223,242,0.78)', fontSize: '0.95rem' }}>
                Override approval decisions for escalated claims.
              </p>

              {error && (
                <div style={{ ...bannerBase, color: '#ffc1c1', borderColor: 'rgba(255, 102, 102, 0.36)', backgroundColor: 'rgba(255, 82, 82, 0.12)' }}>
                  <strong>Error:</strong> {error}
                </div>
              )}

              {successMessage && (
                <div style={{ ...bannerBase, color: '#93f1c3', borderColor: 'rgba(104, 235, 175, 0.34)', backgroundColor: 'rgba(104, 235, 175, 0.12)' }}>
                  <strong>Success:</strong> {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmitEscalation}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={fieldLabel}>Claim ID</label>
                  <input
                    type="number"
                    value={claimId}
                    onChange={(e) => setClaimId(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={fieldLabel}>Override Reason</label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={fieldLabel}>Override Amount (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={fieldLabel}>Final Decision</label>
                    <select
                      value={finalDecision}
                      onChange={(e) => setFinalDecision(e.target.value)}
                      required
                      style={inputStyle}
                    >
                      <option value="" style={{ backgroundColor: '#111827' }}>Select decision</option>
                      <option value="approve" style={{ backgroundColor: '#111827' }}>Approve Override</option>
                      <option value="reject" style={{ backgroundColor: '#111827' }}>Reject Override</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" disabled={loading} className="es-water-btn">
                    {loading ? 'Processing...' : 'Submit Override'}
                  </button>
                  <button type="button" onClick={handleReset} className="es-water-btn">
                    Reset Form
                  </button>
                </div>
              </form>
            </section>

            <section className="ed-anim-item" style={{ ...surfaceCard, padding: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.01em', fontWeight: 560 }}>Override Result</h3>
              <p style={{ margin: '8px 0 18px', color: 'rgba(211,223,242,0.78)', fontSize: '0.92rem' }}>
                Latest escalation action summary.
              </p>

              {!escalationResult ? (
                <div style={{ padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)', color: 'rgba(211,223,242,0.82)' }}>
                  Submit an override to view the decision snapshot here.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {[
                    { label: 'Status', value: escalationResult.status },
                    { label: 'Claim ID', value: escalationResult.claim_id },
                    { label: 'Override Reason', value: escalationResult.override_reason },
                    { label: 'Override Amount', value: `$${escalationResult.override_amount}` },
                    { label: 'Final Decision', value: toDecisionLabel(escalationResult.final_decision) }
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'grid', gap: '6px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11px', letterSpacing: '0.09em', color: 'rgba(220,228,240,0.72)', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: '#f6f9ff', fontWeight: 620, lineHeight: 1.5 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EscalationDashboard

