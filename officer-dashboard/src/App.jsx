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
  // Role management state — restore from localStorage on load
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('userRole') || null
  })

  // Handle role selection — persist to localStorage
  const handleSelectRole = (role) => {
    localStorage.setItem('userRole', role)
    setCurrentRole(role)
  }

  // Handle role switch — clear from localStorage
  const handleSwitchRole = () => {
    localStorage.removeItem('userRole')
    setCurrentRole(null)
  }

  // Render role selector if no role selected
  if (!currentRole) {
    return <RoleSelector onSelectRole={handleSelectRole} />
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

