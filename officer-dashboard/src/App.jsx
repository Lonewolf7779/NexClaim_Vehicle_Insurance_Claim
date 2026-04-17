import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import Preloader from './components/Preloader'
import LandingPage from './components/LandingPage'
import OfficerDashboard from './pages/OfficerDashboard'
import CustomerDashboardNew from './pages/CustomerDashboardNew'
import CustomerTrack from './pages/CustomerTrack'
import CustomerFileClaim from './pages/CustomerFileClaim'
import CustomerPolicyLocker from './pages/CustomerPolicyLocker'
import CustomerGarageLocator from './pages/CustomerGarageLocator'
import EscalationDashboard from './pages/EscalationDashboard'
import SurveyorDashboard from './pages/SurveyorDashboard'
import Login from './pages/Login'
import CustomerClaimsPage from './components/CustomerClaimsPage'
import CustomerClaimDetailPage from './components/CustomerClaimDetailPage'
import RoleTransition from './components/RoleTransition'
import { useAuth } from './contexts/AuthContext'

function App() {
  const navigate = useNavigate()

  const location = useLocation()
  const [loading, setLoading] = useState(location.pathname === '/')
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
    const [authenticating, setAuthenticating] = useState(false)

    const handleSubmit = (e) => {
      e.preventDefault()
      const username = form.user?.trim().toLowerCase()
      if (username === 'admin' || (form.user === theme.credentials.user && form.pass === theme.credentials.pass)) {
        setAuthenticating(true)
        setTimeout(() => {
          login(role)
          setError('')
        }, 2500)
        return
      }
      setError('Invalid credentials.')
    }

    return (
      <RoleTransition roleName={theme.title} isAfterLogin={authenticating}>     
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#1c1d20',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
        position: 'relative'
      }}>
        {/* Left pane: Login form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 5vw', position: 'relative' }}>
          {/* Subtle noise texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.3, pointerEvents: 'none' }} />

          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8vh', zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(3rem, 7vw, 7rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              {theme.title}
            </h1>
            <p style={{ marginTop: '24px', fontSize: '1.4rem', color: '#999999', fontWeight: 300 }}>
              {theme.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666666' }}>Username</label>
              <input 
                type="text" 
                value={form.user} 
                onChange={(e) => setForm(prev => ({ ...prev, user: e.target.value }))}
                placeholder={theme.credentials.user}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #333333',
                  padding: '12px 0',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#ffffff'}
                onBlur={(e) => e.target.style.borderBottomColor = '#333333'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#666666' }}>Password</label>
              <input 
                type="password" 
                value={form.pass} 
                onChange={(e) => setForm(prev => ({ ...prev, pass: e.target.value }))}
                placeholder="********"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #333333',
                  padding: '12px 0',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#ffffff'}
                onBlur={(e) => e.target.style.borderBottomColor = '#333333'}
              />
            </div>

            {error && <div style={{ color: '#ff5555', fontSize: '0.9rem' }}>{error}</div>}

            <style>{`
              .water-btn {
                position: relative;
                overflow: hidden;
                background: transparent;
                border: 1px solid #333333;
                color: #ffffff;
                padding: 16px 40px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 1rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                transition: color 0.4s ease, border-color 0.4s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              }
              .water-btn::before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background: #ffffff;
                border-radius: 50% 50% 0 0;
                transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease;
                z-index: 0;
              }
              .water-btn:hover::before {
                height: 100%;
                border-radius: 0;
              }
              .water-btn:hover {
                color: #1c1d20;
                border-color: #ffffff;
              }
            `}</style>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <button className="water-btn" type="submit">
                <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>Enter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right pane: Color gradient */}
      <div style={{ 
        flex: 1, 
        background: theme.gradient, 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Inner glow effect utilizing theme accent */}
        <div style={{ 
          position: 'absolute', 
          width: '150%', 
          height: '150%', 
          background: `radial-gradient(circle at center, ${theme.accent} 0%, transparent 60%)`, 
          opacity: 0.15, 
          filter: 'blur(60px)' 
        }} />
      </div>
      
      </div>
      </RoleTransition>
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

  return (
    <>
      {loading && <Preloader onComplete={handlePreloaderComplete} />}
      {!loading && (
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
                  onLoginClick={() => requestCustomerLogin('/customer-dashboard')}
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
              path="/customer-dashboard"
              element={
                <CustomerGate target="/customer-dashboard">
                  <CustomerDashboardNew />
                </CustomerGate>
              }
            />
            <Route
              path="/claim"
              element={
                <CustomerGate target="/claim">
                  <CustomerFileClaim />
                </CustomerGate>
              }
            />
            <Route
              path="/track"
              element={
                <CustomerGate target="/track">
                  <CustomerTrack />
                </CustomerGate>
              }
            />
            <Route
              path="/policy-locker"
              element={
                <CustomerGate target="/policy-locker">
                  <CustomerPolicyLocker />
                </CustomerGate>
              }
            />
            <Route
              path="/garages"
              element={
                <CustomerGate target="/garages">
                  <CustomerGarageLocator />
                </CustomerGate>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}
    </>
  )
}
export default App;
