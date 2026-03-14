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

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '40px' }}>Insurance Claim Processing System</h1>
      <h2 style={{ marginBottom: '30px' }}>Select Your Role</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            style={{
              padding: '30px',
              fontSize: '18px',
              cursor: 'pointer',
              border: '2px solid #333',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{role.name}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>{role.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default RoleSelector

