// -------------------------------------------------
// CustomerClaimsPage Component
// -------------------------------------------------
// Customer-facing view showing a list of claims belonging to the user.
// Features:
//   - Fetches all claims from backend
//   - Displays table with claim number, incident date, status
//   - Shows financial information: final payable amount and payment status
//   - Each row navigates to claim detail page
// State Management:
//   - claims: Array of claim objects
//   - loading: Boolean for loading state
//   - error: String for error messages
// -------------------------------------------------
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { claimService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

function CustomerClaimsPage() {
  // -------------------------------------------------
  // State Management
  // -------------------------------------------------
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // React Router navigation hook
  const navigate = useNavigate()

  const { customerUser } = useAuth()
  const policyNumber = customerUser?.policyNumber

  // -------------------------------------------------
  // Data Fetching Effect
  // -------------------------------------------------
  useEffect(() => {
    fetchClaims()
  }, [policyNumber])

  /**
   * Fetch all claims from the backend API
   */
  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await claimService.getClaims(policyNumber ? { policy_number: policyNumber } : undefined)
      setClaims(response.data)
    } catch (err) {
      setError('Failed to load claims. Please try again.')
      console.error('Error fetching claims:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Navigate to claim detail page when row is clicked
   */
  const handleRowClick = (id) => {
    navigate(`/my-claims/${id}`)
  }

  /**
   * Get CSS class for status badge
   */
  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'SUBMITTED': 'badge-gray',
      'PROCESSING': 'badge-blue',
      'READY_FOR_REVIEW': 'badge-orange',
      'APPROVED': 'badge-green',
      'REJECTED': 'badge-red',
      'ESCALATED': 'badge-purple'
    }
    return `status-badge ${statusClasses[status] || 'badge-gray'}`
  }

  /**
   * Format currency value for display
   */
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—'
    return `$${parseFloat(value).toFixed(2)}`
  }

  /**
   * Get payment status display text
   */
  const getPaymentStatus = (claim) => {
    if (claim.status === 'APPROVED') {
      return claim.payment_status || 'Pending'
    }
    return '—'
  }

  // -------------------------------------------------
  // Render Loading State
  // -------------------------------------------------
  if (loading) {
    return <div className="loading">Loading your claims...</div>
  }

  // -------------------------------------------------
  // Render Error State
  // -------------------------------------------------
  if (error) {
    return <div className="error">{error}</div>
  }

  // -------------------------------------------------
  // Render Claims Table
  // -------------------------------------------------
  return (
    <div className="customer-claims-page" style={{ fontFamily: FONT_STACK }}>
      <h2>My Claims</h2>
      
      <table className="claims-table">
        <thead>
          <tr>
            <th>Claim Number</th>
            <th>Incident Date</th>
            <th>Status</th>
            <th>Final Payable</th>
            <th>Payment Status</th>
          </tr>
        </thead>
        <tbody>
          {claims.map(claim => (
            <tr 
              key={claim.id} 
              onClick={() => handleRowClick(claim.id)}
              className="clickable-row"
            >
              <td>{claim.claim_number}</td>
              <td>{new Date(claim.incident_date).toLocaleDateString()}</td>
              <td>
                <span className={getStatusBadgeClass(claim.status)}>
                  {claim.status}
                </span>
              </td>
              <td>{formatCurrency(claim.final_payable_amount)}</td>
              <td>{getPaymentStatus(claim)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {claims.length === 0 && (
        <p className="no-data">No claims found.</p>
      )}
    </div>
  )
}

export default CustomerClaimsPage
