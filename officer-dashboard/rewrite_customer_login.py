import React, { useState } from 'react'
import RoleTransition from './RoleTransition'

export default function CustomerLogin({ onSuccess, onClose }) {
  const [form, setForm] = useState({ user: '', pass: '', policy: '', vehicle: '' })
  const [error, setError] = useState('')
  const [authenticating, setAuthenticating] = useState(false)

  const theme = {
    title: 'NexCustomer Portal',
    subtitle: 'Track your claims and settlements with full transparency.',
    gradient: 'linear-gradient(135deg, #091c1b 0%, #112d2c 50%, #030e0e 100%)',
    accent: '#10b981', // green for customer
    credentials: { user: 'customer@nexclaim.io', pass: 'atlas-claim' }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const username = form.user?.trim().toLowerCase()
    
    // Quick validation
    if (username === 'admin' || (form.user === theme.credentials.user && form.pass === theme.credentials.pass)) {
      setAuthenticating(true)
      setTimeout(() => {
        setError('')
        onSuccess(form)
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
              <h1 style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
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
                  placeholder="••••••••"
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
                  <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>{authenticating ? 'Verifying...' : 'Enter'}</span>
                </button>
                {onClose && (
                  <button 
                    className="water-btn back-btn-cs" 
                    type="button" 
                    onClick={onClose} 
                  >
                    <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>Back</span>
                  </button>
                )}
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