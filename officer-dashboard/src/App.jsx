import React, { useState } from 'react'
import './App.css'

// Import page components
import RoleSelector from './pages/RoleSelector'
import OfficerDashboard from './pages/OfficerDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import SurveyorDashboard from './pages/SurveyorDashboard'
import EscalationDashboard from './pages/EscalationDashboard'

// -------------------------------------------------
// Role-Based Insurance Claim Processing System
// Main App Component
// -------------------------------------------------
function App() {
  // Role management state
  const [currentRole, setCurrentRole] = useState(null)

  // Handle role switch
  const handleSwitchRole = () => {
    setCurrentRole(null)
  }

  // Render role selector if no role selected
  if (!currentRole) {
    return <RoleSelector onSelectRole={setCurrentRole} />
  }

  // Render appropriate dashboard based on role
  return (
    <div className="app">
      <main style={{ padding: '0 20px' }}>
        {currentRole === 'customer' && <CustomerDashboard onSwitchRole={handleSwitchRole} />}
        {currentRole === 'surveyor' && <SurveyorDashboard onSwitchRole={handleSwitchRole} />}
        {currentRole === 'officer' && <OfficerDashboard onSwitchRole={handleSwitchRole} />}
        {currentRole === 'escalation' && <EscalationDashboard onSwitchRole={handleSwitchRole} />}
      </main>
    </div>
  )
}

export default App

