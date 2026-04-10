import React, { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, Shield, Gauge, Globe2 } from 'lucide-react'

const facts = [
  'Customers with complete policy and vehicle data see 22% faster claim reviews.',
  'Peak response hours land between 9-11 AM; filing early keeps you ahead.',
  'Uploading clear damage photos can cut settlement time by two days on average.',
  'Matching policy and VIN in your first submission reduces manual checks.',
  'Encrypted channels keep your claim notes locked end-to-end during review.'
]

function CustomerLogin({ onSuccess, onClose }) {
  const [form, setForm] = useState({ user: '', pass: '', policy: '', vehicle: '' })
  const [error, setError] = useState('')
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length))

  const creds = { user: 'customer@neclaim.io', pass: 'atlas-claim' }

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@500;600;700&display=swap'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % facts.length)
    }, 7000)
    return () => clearInterval(id)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const username = form.user?.trim().toLowerCase()
    // Allow quick bypass when user types 'admin', otherwise fall back to dummy creds
    if (username === 'admin' || (form.user === creds.user && form.pass === creds.pass)) {
      setError('')
      if (onSuccess) onSuccess({ policy: form.policy, vehicle: form.vehicle })
      return
    }
    setError('Invalid credentials. Type "admin" to bypass, or use the provided combo.')
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.shell}>
        <div style={styles.noise} />
        <div style={styles.grid} />

        <div style={styles.leftColumn}>
            {/* brand removed per request */}
          <h1 style={styles.heading}>Customer Login</h1>
          <p style={styles.lead}>A focused desk inspired by denisssnellenberg: sharp type, calm gradients, clear intent.</p>

          <div style={styles.formBlock}>
            <form onSubmit={submit} style={styles.form}>
              <label style={styles.label}>
                Username
                <input
                  style={styles.input}
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder={creds.user}
                />
              </label>
              <label style={styles.label}>
                Password
                <input
                  type="password"
                  style={styles.input}
                  value={form.pass}
                  onChange={(e) => setForm({ ...form, pass: e.target.value })}
                  placeholder={creds.pass}
                />
              </label>
              <label style={styles.label}>
                Policy Number
                <input
                  style={styles.input}
                  value={form.policy}
                  onChange={(e) => setForm({ ...form, policy: e.target.value })}
                  placeholder="ANY-12345"
                />
              </label>
              <label style={styles.label}>
                Vehicle Reference
                <input
                  style={styles.input}
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  placeholder="VIN-98765"
                />
              </label>
              {error && <div style={styles.error}>{error}</div>}
              <button type="submit" style={styles.primaryButton}>
                Enter
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={styles.hintsRow}>
              <span style={styles.hint}>user: {creds.user}</span>
              <span style={styles.hint}>pass: {creds.pass}</span>
              <span style={styles.hint}>policy: ANY-12345</span>
              <span style={styles.hint}>vehicle: VIN-98765</span>
            </div>
          </div>

          <div style={styles.heroPanel}>
            <div style={styles.heroOverlay}>
              <div style={styles.heroKicker}>Claim-ready</div>
              <div style={styles.heroTitle}>Sleek intake, zero noise.</div>
            </div>
          </div>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.factCard}>
            <div style={styles.cardLabel}>Do you know?</div>
            <div style={styles.factText}>{facts[factIndex]}</div>
          </div>

          <div style={styles.coolCard}>
            <div style={styles.cardLabel}>What is inside</div>
            <div style={styles.coolGrid}>
              <div style={styles.coolItem}>
                <Sparkles size={16} />
                <div>
                  <div style={styles.coolTitle}>Minimal shell</div>
                  <div style={styles.coolBody}>Focused canvas with layered gradients and deliberate whitespace.</div>
                </div>
              </div>
              <div style={styles.coolItem}>
                <Shield size={16} />
                <div>
                  <div style={styles.coolTitle}>Secure by default</div>
                  <div style={styles.coolBody}>Policy and VIN stay encrypted across the review loop.</div>
                </div>
              </div>
              <div style={styles.coolItem}>
                <Gauge size={16} />
                <div>
                  <div style={styles.coolTitle}>Fast tracking</div>
                  <div style={styles.coolBody}>We surface next actions before you wonder what is next.</div>
                </div>
              </div>
              <div style={styles.coolItem}>
                <Globe2 size={16} />
                <div>
                  <div style={styles.coolTitle}>Everywhere access</div>
                  <div style={styles.coolBody}>Stay synced on web, desk, or tablet without extra clicks.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Grotesk', 'Syne', 'Inter', sans-serif",
    color: '#e5e7eb'
  },
  noise: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 160 160%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.8%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.06%27/%3E%3C/svg%3E")',
    pointerEvents: 'none',
    mixBlendMode: 'soft-light'
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '22px 22px',
    opacity: 0.24,
    pointerEvents: 'none'
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 18% 22%, rgba(110, 231, 255, 0.12), transparent 32%), radial-gradient(circle at 82% 12%, rgba(124, 58, 237, 0.14), transparent 28%), linear-gradient(135deg, rgba(6,8,20,0.92), rgba(10,14,28,0.95))',
    backdropFilter: 'blur(12px)'
  },
  shell: {
    position: 'relative',
    width: 'min(1080px, 92vw)',
    height: 'min(88vh, 760px)',
    borderRadius: '26px',
    overflow: 'hidden',
    boxShadow: '0 42px 120px rgba(0,0,0,0.6)',
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    gap: '0px',
    background: 'rgba(10,12,20,0.78)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(14px)'
  },
  leftColumn: {
    position: 'relative',
    padding: '36px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundImage: 'linear-gradient(160deg, rgba(10,12,24,0.9) 0%, rgba(14,18,32,0.82) 60%, rgba(24,30,46,0.46) 100%)'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  brandDot: {
    height: '14px',
    width: '14px',
    borderRadius: '50%',
    background: 'linear-gradient(120deg, #6ee7ff, #7c3aed)'
  },
  brandText: {
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.76)'
  },
  heading: {
    fontSize: 'clamp(2.2rem, 3.6vw, 3.1rem)',
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
    margin: 0,
    color: '#f8fafc'
  },
  lead: {
    maxWidth: '560px',
    color: 'rgba(229,231,235,0.76)',
    fontSize: '0.98rem',
    lineHeight: 1.6,
    margin: 0
  },
  formBlock: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '14px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '14px',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: 'rgba(255,255,255,0.82)',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '11px 12px',
    color: '#f8fafc',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  },
  error: {
    gridColumn: '1 / -1',
    color: '#fca5a5',
    fontSize: '0.95rem'
  },
  primaryButton: {
    gridColumn: '1 / -1',
    marginTop: '6px',
    background: 'linear-gradient(120deg, #6ee7ff, #7c3aed)',
    color: '#0b1021',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 14px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 18px 40px rgba(124,58,237,0.28)',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease'
  },
  hintsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  hint: {
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#dbeafe',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  heroPanel: {
    position: 'relative',
    marginTop: '12px',
    borderRadius: '16px',
    height: '32%',
    minHeight: '160px',
    backgroundImage: 'linear-gradient(140deg, rgba(6,10,24,0.5), rgba(12,16,30,0.2)), url(https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=2000&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(0,0,0,0.4)'
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '22px',
    gap: '6px',
    background: 'linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.55) 90%)'
  },
  heroKicker: {
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.72)'
  },
  heroTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc'
  },
  rightColumn: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    background: 'linear-gradient(180deg, rgba(8,10,20,0.92), rgba(10,12,22,0.86))'
  },
  factCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  cardLabel: {
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.62)'
  },
  factText: {
    fontSize: '1.1rem',
    color: '#f1f5f9',
    lineHeight: 1.6
  },
  coolCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  coolGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px'
  },
  coolItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    color: '#e5e7eb'
  },
  coolTitle: {
    fontWeight: 700,
    fontSize: '1rem'
  },
  coolBody: {
    fontSize: '0.94rem',
    color: 'rgba(229,231,235,0.78)',
    lineHeight: 1.5
  }
}

export default CustomerLogin
