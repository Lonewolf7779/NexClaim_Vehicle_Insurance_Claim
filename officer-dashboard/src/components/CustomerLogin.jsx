import React, { useState } from 'react'
import RoleTransition from './RoleTransition'
import { useAuth } from '../contexts/AuthContext'
import Preloader from './Preloader'
import { policyService } from '../services/api'

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

export default function CustomerLogin({ onSuccess, onClose }) {
  const { loginCustomer } = useAuth()
  
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [form, setForm] = useState({ policyNumber: '', password: '' })
  const [error, setError] = useState('')
  const [authenticating, setAuthenticating] = useState(false)
  const [showPreloader, setShowPreloader] = useState(false)
  const [welcomeName, setWelcomeName] = useState('')

  const theme = {
    title: 'NexCustomer Portal',
    subtitle: mode === 'login' 
      ? 'Track your claims and settlements with full transparency.' 
      : 'Create your account to access your policy details.',
    gradient: 'linear-gradient(135deg, #091c1b 0%, #112d2c 50%, #030e0e 100%)',
    accent: '#10b981', // green for customer
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const policyNum = form.policyNumber.trim().toUpperCase()
    const password = form.password

    // Validate inputs
    if (!policyNum) {
      setError('Policy number is required.')
      return
    }
    if (!password) {
      setError('Password is required.')
      return
    }

    // Check password (hardcoded for testing)
    if (password !== 'admin') {
      setError('Invalid credentials.')
      return
    }

    setAuthenticating(true)

    try {
      const res = await policyService.getPolicyByNumber(policyNum)
      const name = res?.data?.policy_holder_name

      if (!name || !String(name).trim()) {
        throw new Error('Unable to retrieve policyholder information.')
      }

      // Store in context and localStorage
      loginCustomer(policyNum, name)
      setWelcomeName(String(name))

      // Show preloader with welcome message
      setShowPreloader(true)
    } catch (err) {
      setError(toReadableError(err, 'Unable to verify policy. Is the backend running?'))
      setAuthenticating(false)
    }
  }

  const handlePreloaderComplete = () => {
    setShowPreloader(false)
    setError('')
    onSuccess({ policyNumber: form.policyNumber.trim().toUpperCase(), policeholderName: welcomeName })
  }

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} customMessage={`Welcome ${welcomeName}`} />
  }

  return (
    <RoleTransition roleName={theme.title} isAfterLogin={authenticating}>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#1c1d20',
          color: '#ffffff',
          fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
          position: 'relative',
        }}
      >
        {/* Left pane: Login/Sign Up form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 5vw', position: 'relative' }}>
          {/* Subtle noise texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8vh', zIndex: 10 }}>
            {/* Header */}
            <div>
              <h1
                style={{
                  fontSize: 'clamp(3rem, 6vw, 6rem)',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {theme.title}
              </h1>
              <p style={{ marginTop: '24px', fontSize: '1.4rem', color: '#999999', fontWeight: 300 }}>
                {theme.subtitle}
              </p>
            </div>

            {/* Mode Toggle */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
                borderBottom: '1px solid #333333',
                paddingBottom: '24px',
              }}
            >
              <button
                onClick={() => { setMode('login'); setError('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: mode === 'login' ? '#ffffff' : '#666666',
                  fontSize: '1rem',
                  fontWeight: mode === 'login' ? 600 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  borderBottom: mode === 'login' ? '2px solid #10b981' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                Login
              </button>
              <button
                onClick={() => { setMode('signup'); setError('') }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: mode === 'signup' ? '#ffffff' : '#666666',
                  fontSize: '1rem',
                  fontWeight: mode === 'signup' ? 600 : 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  paddingBottom: '8px',
                  borderBottom: mode === 'signup' ? '2px solid #10b981' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px' }}>
              {/* Policy Number Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#666666',
                  }}
                >
                  Policy Number
                </label>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, policyNumber: e.target.value }))}
                  placeholder="e.g., POL1001"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333333',
                    padding: '12px 0',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#ffffff')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#333333')}
                />
              </div>

              {/* Password Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#666666',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333333',
                    padding: '12px 0',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#ffffff')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#333333')}
                />
              </div>

              {/* Hint Text */}
              {mode === 'signup' && (
                <div style={{ fontSize: '0.9rem', color: '#666666', marginTop: '-32px' }}>
                  {!error && (
                    <p>Your account will be created with this policy number. Password will be "admin" for testing.</p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div style={{ color: '#ff5555', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}

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
                .water-btn:disabled {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
                .back-btn-cs {
                  border-color: #333;
                  color: #999;
                }
                .back-btn-cs:hover {
                  color: #1c1d20;
                  border-color: #ffffff;
                }
              `}</style>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%', gap: '16px' }}>
                <button className="water-btn" type="submit" disabled={authenticating}>
                  <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
                    {authenticating ? 'Verifying...' : mode === 'login' ? 'Enter' : 'Create Account'}
                  </span>
                </button>
                {onClose && (
                  <button className="water-btn back-btn-cs" type="button" onClick={onClose}>
                    <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>Back</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right pane: Color gradient */}
        <div
          style={{
            flex: 1,
            background: theme.gradient,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner glow effect utilizing theme accent */}
          <div
            style={{
              position: 'absolute',
              width: '150%',
              height: '150%',
              background: `radial-gradient(circle at center, ${theme.accent} 0%, transparent 60%)`,
              opacity: 0.15,
              filter: 'blur(60px)',
            }}
          />
        </div>
      </div>
    </RoleTransition>
  )
}