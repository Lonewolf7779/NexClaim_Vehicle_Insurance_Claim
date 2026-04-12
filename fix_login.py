import re

filepath = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Pattern captures from const RoleLogin = ({ role }) => { to the end of the RoleLogin component
pattern = r'(const RoleLogin = \(\{ role \}\) => \{)(.*?)(  const RequireRole)'

replacement_code = r'''\1
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
        }, 1500)
        return
      }
      setError('Invalid credentials.')
    }

    return (
      <RoleTransition roleName={theme.title} isAfterLogin={authenticating}>     
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1c1d20',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
        position: 'relative'
      }}>
        {/* Subtle noise texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.3, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '800px', width: '100%', padding: '0 5vw', display: 'flex', flexDirection: 'column', gap: '8vh', zIndex: 10 }}>
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
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

            <div style={{ marginTop: '20px', display: 'flex' }}>
              <button 
                type="submit"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#1c1d20',
                  color: '#ffffff',
                  border: '1px solid #333333',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#1c1d20';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1c1d20';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>Enter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      </RoleTransition>
    )
  }

\3'''

new_content = re.sub(pattern, replacement_code, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement complete.")
