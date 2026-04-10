import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Preloader from './components/Preloader'
import LandingPage from './components/LandingPage'
import OfficerDashboard from './pages/OfficerDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import EscalationDashboard from './pages/EscalationDashboard'
import SurveyorDashboard from './pages/SurveyorDashboard'
import Login from './pages/Login'
import CustomerClaimsPage from './components/CustomerClaimsPage'
import CustomerClaimDetailPage from './components/CustomerClaimDetailPage'
import { useAuth } from './contexts/AuthContext'

function App() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const { auth, login, logout, setRole } = useAuth()

  const handlePreloaderComplete = () => {
    setLoading(false)
  }

  const roleThemes = {
    officer: {
      title: 'NexOfficer Ops Gate',
      subtitle: 'Adjudicate with precision and high-frequency insight.',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #111827 35%, #0b1021 100%)',
      accent: '#7c3aed',
      glow: '0 0 60px rgba(124, 58, 237, 0.35)',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1600&q=80',
      credentials: { user: 'officer@nexclaim.io', pass: 'shield-ops' }
    },
    supreme: {
      title: 'NexSupreme Override',
      subtitle: 'Escalations, overrides, and decisive closures.',
      gradient: 'linear-gradient(135deg, #1b1b1b 0%, #2b0b1f 50%, #0d0d0d 100%)',
      accent: '#f59e0b',
      glow: '0 0 60px rgba(245, 158, 11, 0.35)',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80',
      credentials: { user: 'supreme@nexclaim.io', pass: 'override-zen' }
    },
    samurai: {
      title: 'NexSamurai Survey',
      subtitle: 'Rapid field intelligence and survey dispatch.',
      gradient: 'linear-gradient(135deg, #0b1224 0%, #0f1f3d 45%, #050910 100%)',
      accent: '#22d3ee',
      glow: '0 0 60px rgba(34, 211, 238, 0.35)',
      image: 'https://images.unsplash.com/photo-1522196822276-8e0e3c1b4c88?auto=format&fit=crop&w=1600&q=80',
      credentials: { user: 'samurai@nexclaim.io', pass: 'survey-blade' }
    }
  }

  const RoleLogin = ({ role }) => {
    const theme = roleThemes[role]
    const [form, setForm] = useState({ user: '', pass: '' })
    const [error, setError] = useState('')

    const handleSubmit = (e) => {
      e.preventDefault()
      const username = form.user?.trim().toLowerCase()
      // Allow quick bypass when user types 'admin', otherwise validate dummy creds
      if (username === 'admin' || (form.user === theme.credentials.user && form.pass === theme.credentials.pass)) {
        login(role)
        setError('')
        return
      }
      setError('Invalid credentials. Try the provided dummy combo or type "admin" to bypass.')
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: theme.gradient,
        color: '#e5e7eb',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 25%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.06), transparent 22%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.05), transparent 35%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'soft-light', opacity: 0.18 }} />

        <div style={{ padding: '18vh 7vw', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* brand removed per request */}
          <h1 style={{ fontSize: 'clamp(2.8rem, 3vw, 3.4rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>{theme.title}</h1>
          <p style={{ maxWidth: '520px', color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem' }}>{theme.subtitle}</p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', color: theme.accent }}>
            <span style={{ padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.accent}` }}>user: {theme.credentials.user}</span>
            <span style={{ padding: '8px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.accent}` }}>pass: {theme.credentials.pass}</span>
          </div>

          <div style={{ marginTop: '28px', width: '100%', maxWidth: '520px' }}>
            <div style={{ padding: '28px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: theme.glow }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                  Username
                  <input
                    type="text"
                    value={form.user}
                    onChange={(e) => setForm(prev => ({ ...prev, user: e.target.value }))}
                    placeholder={theme.credentials.user}
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid rgba(255,255,255,0.18)`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s, transform 0.2s',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.3)'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                  Password
                  <input
                    type="password"
                    value={form.pass}
                    onChange={(e) => setForm(prev => ({ ...prev, pass: e.target.value }))}
                    placeholder={theme.credentials.pass}
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid rgba(255,255,255,0.18)`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s, transform 0.2s',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.3)'
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  />
                </label>

                {error && <div style={{ color: '#fca5a5', fontSize: '0.95rem' }}>{error}</div>}

                <button
                  type="submit"
                  style={{
                    marginTop: '4px',
                    background: `linear-gradient(120deg, ${theme.accent}, #ffffff10)` ,
                    color: '#0b1021',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: theme.glow
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}
                >
                  Enter
                </button>
              </form>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${theme.image})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(0.2) saturate(1.2)', transform: 'scale(1.03)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.12), transparent 35%), linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }} />
          <div style={{ position: 'absolute', bottom: '6vh', left: '6vh', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', padding: '18px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: theme.accent }}>Live Ops Feed</div>
            <div style={{ marginTop: '10px', fontSize: '1.05rem', lineHeight: 1.5 }}>"We keep the pipeline clean and decisive. Welcome back to the deck."</div>
          </div>
        </div>
      </div>
    )
  }

  const RequireRole = ({ role, children }) => {
    if (!auth[role]) {
      return <RoleLogin role={role} />
    }
    return children
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const requestCustomerLogin = (targetPath) => {
    navigate(`/login?next=${encodeURIComponent(targetPath)}`)
  }

  // login handled by dedicated /login route

  const CustomerGate = ({ target, children }) => {
    const location = useLocation()
    useEffect(() => {
      if (!auth.customer) {
        const desired = target || location.pathname
        navigate(`/login?next=${encodeURIComponent(desired)}`, { replace: true })
      }
    }, [auth.customer, target, navigate, location])

    if (!auth.customer) return null
    return children
  }

  if (loading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/customer-login" element={<Login />} />
        <Route path="/my-claims" element={<CustomerGate><CustomerClaimsPage /></CustomerGate>} />
        <Route path="/my-claims/:id" element={<CustomerGate><CustomerClaimDetailPage /></CustomerGate>} />
        <Route
          path="/"
          element={
            <LandingPage
              onAction={(actionType) => {
                const targetPath = actionType === 'track' ? '/track' : '/claim'
                requestCustomerLogin(targetPath)
              }}
              onLoginClick={() => requestCustomerLogin('/dashboard')}
            />
          }
        />
        <Route
          path="/NexOfficer"
          element={
            <RequireRole role="officer">
              <OfficerDashboard onSwitchRole={handleLogout} />
            </RequireRole>
          }
        />
        <Route
          path="/NexSupreme"
          element={
            <RequireRole role="supreme">
              <EscalationDashboard onSwitchRole={handleLogout} />
            </RequireRole>
          }
        />
        <Route
          path="/NexSamurai"
          element={
            <RequireRole role="samurai">
              <SurveyorDashboard onSwitchRole={handleLogout} />
            </RequireRole>
          }
        />
        <Route
          path="/dashboard"
          element={
            <CustomerGate target="/dashboard">
              <CustomerDashboard onSwitchRole={handleLogout} onBackToLanding={handleLogout} initialAction={null} />
            </CustomerGate>
          }
        />
        <Route
          path="/claim"
          element={
            <CustomerGate target="/claim">
              <CustomerDashboard onSwitchRole={handleLogout} onBackToLanding={handleLogout} initialAction="new" />
            </CustomerGate>
          }
        />
        <Route
          path="/track"
          element={
            <CustomerGate target="/track">
              <CustomerDashboard onSwitchRole={handleLogout} onBackToLanding={handleLogout} initialAction="track" />
            </CustomerGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

