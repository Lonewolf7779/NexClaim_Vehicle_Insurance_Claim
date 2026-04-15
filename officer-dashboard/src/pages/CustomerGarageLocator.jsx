import React from 'react'
import { useNavigate } from 'react-router-dom'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

function CustomerGarageLocator() {
  const navigate = useNavigate()

  // Note: These are example partner networks / service brands (names inspired by common real-world listings).
  const garages = [
    {
      name: 'Bosch Car Service',
      city: 'Bengaluru',
      specialty: 'Multi-brand repairs & diagnostics',
      website: 'https://www.boschcarservice.com'
    },
    {
      name: 'Mahindra First Choice Services',
      city: 'Pune',
      specialty: 'Mechanical + periodic maintenance',
      website: 'https://www.mahindrafirstchoiceservices.com'
    },
    {
      name: 'Castrol Auto Service',
      city: 'Hyderabad',
      specialty: 'Oil, brakes, battery & general service',
      website: 'https://www.castrol.com'
    },
    {
      name: 'GoMechanic Partner Garage',
      city: 'Delhi NCR',
      specialty: 'Car service packages & doorstep pickup',
      website: 'https://gomechanic.in'
    },
    {
      name: 'Tata Motors Authorized Service',
      city: 'Mumbai',
      specialty: 'OEM-authorized repair & spares',
      website: 'https://cars.tatamotors.com'
    },
    {
      name: 'Maruti Suzuki Authorized Service',
      city: 'Chennai',
      specialty: 'OEM-authorized repair & spares',
      website: 'https://www.marutisuzuki.com'
    }
  ]

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
    padding: '26px 24px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(255,255,255,0.05)'
  }

  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.35)'
  }

  return (
    <div style={pageStyle}>
      <div className="nx-noise-overlay" />
      <div style={glowStyle} />

      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(2.6rem, 6vw, 5.5rem)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
              Authorized Garages
            </h1>
            <p style={{ marginTop: 18, marginBottom: 0, color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', lineHeight: 1.5 }}>
              Choose a certified partner facility for inspection and repairs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="water-btn water-btn--sm back-btn-cs" onClick={() => navigate('/customer-dashboard')}>Back to Dashboard</button>
          </div>
        </div>

        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18 }}>
          {garages.map((g) => (
            <div key={`${g.name}-${g.city}`} style={cardStyle}>
              <div style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em' }}>{g.name}</div>
              <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                {g.specialty}
              </div>

              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                <div>
                  <div className="nx-label">City</div>
                  <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)' }}>{g.city}</div>
                </div>
                <div>
                  <div className="nx-label">Website</div>
                  <div style={{ marginTop: 6 }}>
                    <a href={g.website} style={linkStyle} target="_blank" rel="noreferrer">
                      {g.website.replace('https://', '')}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CustomerGarageLocator
