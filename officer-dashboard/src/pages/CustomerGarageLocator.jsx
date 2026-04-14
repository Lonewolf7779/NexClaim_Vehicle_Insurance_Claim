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
    backgroundColor: '#050505',
    color: '#ffffff',
    fontFamily: FONT_STACK,
    padding: '10vh 6vw'
  }

  const buttonStyle = {
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: '999px',
    fontFamily: FONT_STACK,
    fontSize: '0.9rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer'
  }

  const cardStyle = {
    padding: '26px 24px',
    borderRadius: '18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)'
  }

  const labelStyle = {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'rgba(255,255,255,0.5)'
  }

  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.35)'
  }

  return (
    <div style={pageStyle}>
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
          <button type="button" style={buttonStyle} onClick={() => navigate('/customer-dashboard')}>Back to Dashboard</button>
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
                <div style={labelStyle}>City</div>
                <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)' }}>{g.city}</div>
              </div>
              <div>
                <div style={labelStyle}>Website</div>
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
  )
}

export default CustomerGarageLocator
