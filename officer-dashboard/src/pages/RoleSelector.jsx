import React from 'react'

// -------------------------------------------------
// Role Selector Component
// Allows users to select their role: Customer, Surveyor,
// Officer, or Escalation Officer
// -------------------------------------------------
function RoleSelector({ onSelectRole }) {
  const roles = [
    { id: 'customer', name: 'Customer', description: 'Create claims and upload documents' },
    { id: 'surveyor', name: 'Surveyor', description: 'Upload survey reports and assessments' },
    { id: 'officer', name: 'Claims Officer', description: 'Process, validate, and decide on claims' },
    { id: 'escalation', name: 'Escalation Officer', description: 'Override approval for escalated claims' }
  ]

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 90
  }

  const cardStyle = {
    width: '100%',
    maxWidth: '900px',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    padding: '40px 24px',
    textAlign: 'center',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)'
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px'
  }

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '16px' }}>Insurance Claim Processing System</h1>
        <h2 style={{ marginBottom: '24px' }}>Select Your Role</h2>
        <div style={gridStyle}>
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              style={{
                  padding: '24px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  border: '2px solid #d0d0d0',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  textAlign: 'left',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{role.name}</div>
                <div style={{ fontSize: '14px', color: '#555' }}>{role.description}</div>
              </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RoleSelector

