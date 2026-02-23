// -------------------------------------------------
// ClaimList Component
// -------------------------------------------------
// Displays a table of all insurance claims with key information.
// Features:
//   - Fetches claims data from backend on component mount
//   - Displays claim number, status, and risk level
//   - Each row is clickable and navigates to claim details
//   - Risk evaluation is fetched for each claim to display risk badge
// State Management:
//   - claims: Array of claim objects
//   - loading: Boolean for loading state
//   - error: String for error messages
//   - riskData: Object mapping claim IDs to risk evaluation results
// -------------------------------------------------
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { claimService } from '../services/api'

function ClaimList() {
  // -------------------------------------------------
  // State Management
  // -------------------------------------------------
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [riskData, setRiskData] = useState({})
  
  // React Router navigation hook for programmatic routing
  const navigate = useNavigate()

  // -------------------------------------------------
  // Data Fetching Effect
  // -------------------------------------------------
  // Runs once on component mount to fetch all claims
  // Then fetches risk evaluation for each claim in READY_FOR_REVIEW status
  // -------------------------------------------------
  useEffect(() => {
    fetchClaims()
  }, [])

  /**
   * Fetch all claims from the backend API
   * Sets loading state during fetch and handles errors
   */
  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await claimService.getClaims()
      setClaims(response.data)
      
      // Fetch risk data for claims that might have validation results
      const riskPromises = response.data
        .filter(claim => claim.status === 'READY_FOR_REVIEW' || claim.status === 'ESCALATED')
        .map(claim => fetchRiskForClaim(claim.id))
      
      await Promise.all(riskPromises)
    } catch (err) {
      setError('Failed to load claims. Please try again.')
      console.error('Error fetching claims:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch risk evaluation for a specific claim
   * Stores result in riskData state object keyed by claim ID
   * @param {number} claimId - The claim ID to evaluate
   */
  const fetchRiskForClaim = async (claimId) => {
    try {
      const response = await claimService.evaluateRisk(claimId)
      setRiskData(prev => ({
        ...prev,
        [claimId]: response.data
      }))
    } catch (err) {
      // Risk evaluation may fail if validation hasn't been run
      // This is expected behavior, so we don't show error
      console.log(`Risk evaluation not available for claim ${claimId}`)
    }
  }

  /**
   * Navigate to claim details page when row is clicked
   * @param {number} id - Claim ID to navigate to
   */
  const handleRowClick = (id) => {
    navigate(`/claims/${id}`)
  }

  /**
   * Get CSS class for status badge based on claim status
   * Maps each status to a specific color-coded badge style
   * @param {string} status - Claim status value
   * @returns {string} CSS class name for the badge
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
   * Get CSS class for risk badge based on risk level
   * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH)
   * @returns {string} CSS class name for the badge
   */
  const getRiskBadgeClass = (riskLevel) => {
    const riskClasses = {
      'LOW': 'badge-green',
      'MEDIUM': 'badge-orange',
      'HIGH': 'badge-red'
    }
    return `risk-badge ${riskClasses[riskLevel] || 'badge-gray'}`
  }

  // -------------------------------------------------
  // Render Loading State
  // -------------------------------------------------
  if (loading) {
    return <div className="loading">Loading claims...</div>
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
    <div className="claim-list">
      <h2>All Claims</h2>
      
      <table className="claims-table">
        <thead>
          <tr>
            <th>Claim Number</th>
            <th>Status</th>
            <th>Risk Level</th>
            <th>Incident Date</th>
            <th>Description</th>
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
              <td>
                <span className={getStatusBadgeClass(claim.status)}>
                  {claim.status}
                </span>
              </td>
              <td>
                {riskData[claim.id] ? (
                  <span className={getRiskBadgeClass(riskData[claim.id].risk_level)}>
                    {riskData[claim.id].risk_level}
                  </span>
                ) : (
                  <span className="risk-badge badge-gray">Not Evaluated</span>
                )}
              </td>
              <td>{new Date(claim.incident_date).toLocaleDateString()}</td>
              <td>{claim.description}</td>
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

export default ClaimList
