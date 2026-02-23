// -------------------------------------------------
// Root Application Component
// -------------------------------------------------
// Sets up React Router for client-side navigation.
// Defines two main routes:
//   - /claims: List view of all claims (ClaimList component)
//   - /claims/:id: Detail view for a specific claim (ClaimDetails component)
// Uses BrowserRouter for clean URL handling.
// -------------------------------------------------
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ClaimList from './components/ClaimList'
import ClaimDetails from './components/ClaimDetails'
import CustomerClaimsPage from './components/CustomerClaimsPage'
import CustomerClaimDetailPage from './components/CustomerClaimDetailPage'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* Header with navigation */}
        <header className="app-header">
          <h1>Insurance Claim Verification - Officer Dashboard</h1>
          <nav>
            <a href="/claims">Officer View</a>
            <a href="/my-claims">My Claims</a>
          </nav>

        </header>

        {/* Main content area with route definitions */}
        <main className="app-main">
          <Routes>
            {/* Redirect root to claims list */}
            <Route path="/" element={<Navigate to="/claims" replace />} />
            
            {/* Claims list page */}
            <Route path="/claims" element={<ClaimList />} />
            
            {/* Claim details page with ID parameter */}
            <Route path="/claims/:id" element={<ClaimDetails />} />
            
            {/* Customer claim list page */}
            <Route path="/my-claims" element={<CustomerClaimsPage />} />
            
            {/* Customer claim detail page */}
            <Route path="/my-claims/:id" element={<CustomerClaimDetailPage />} />
          </Routes>

        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
