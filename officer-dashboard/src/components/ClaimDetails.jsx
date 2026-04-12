// -------------------------------------------------
// ClaimDetails Component
// -------------------------------------------------
// Displays comprehensive information about a single claim.
// Features:
//   - Fetches claim details, validation results, and risk evaluation
//   - Shows claim summary with all metadata
//   - Displays extracted document fields section
//   - Renders validation results table with pass/fail status
//   - Shows risk summary badge with evaluation results
//   - Provides Approve/Reject/Escalate action buttons
// State Management:
//   - claim: Single claim object with full details
//   - validationResults: Array of validation rule results
//   - riskData: Risk evaluation result object
//   - loading: Boolean for initial data fetch
//   - actionLoading: Boolean for status update operations
//   - error: String for error messages
// -------------------------------------------------
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { claimService } from '../services/api'

function ClaimDetails() {
  // -------------------------------------------------
  // Router Hooks
  // -------------------------------------------------
  // Extract claim ID from URL parameter /claims/:id
  const { id } = useParams()
  const navigate = useNavigate()

  // -------------------------------------------------
  // State Management
  // -------------------------------------------------
  const [claim, setClaim] = useState(null)
  const [validationResults, setValidationResults] = useState([])
  const [riskData, setRiskData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  // -------------------------------------------------
  // Data Fetching Effect
  // -------------------------------------------------
  // Runs when component mounts or ID changes
  // Fetches claim details, validation results, and risk evaluation
  // -------------------------------------------------
  useEffect(() => {
    fetchClaimData()
  }, [id])

  /**
   * Fetch all claim-related data from backend
   * Sequentially fetches: claim details, validation results, risk evaluation
   */
  const fetchClaimData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch claim details
      const claimResponse = await claimService.getClaim(id)
      setClaim(claimResponse.data)

      // Fetch validation results (may be empty if validation not run)
      try {
        const validationResponse = await claimService.getValidationResults(id)
        setValidationResults(validationResponse.data)
      } catch (err) {
        // Validation results may not exist yet - this is OK
        setValidationResults([])
      }

      // Fetch risk evaluation (may fail if claim not ready)
      try {
        const riskResponse = await claimService.evaluateRisk(id)
        setRiskData(riskResponse.data)
      } catch (err) {
        // Risk evaluation may not be available - this is OK
        setRiskData(null)
      }

      // Fetch documents
      try {
        const documentsResponse = await claimService.getDocuments(id)
        const validDocs = documentsResponse.data;
        setDocuments(validDocs)
      } catch (err) {
        setDocuments([])
        console.error('Doc Fetch Error:', err)
      }
    } catch (err) {
      setError('Failed to load claim details. Please try again.')
      console.error('Error fetching claim:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update claim status via API call
   * Called by Approve/Reject/Escalate buttons
   * @param {string} newStatus - Target status from ClaimStatus enum
   */
  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(true)
      const response = await claimService.updateStatus(id, newStatus)
      setClaim(response.data)
      alert(`Claim status updated to ${newStatus}`)
    } catch (err) {
      alert(`Failed to update status: ${err.response?.data?.detail || err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Trigger risk evaluation for the claim
   * Refreshes risk data after evaluation
   */
  const handleEvaluateRisk = async () => {
    try {
      setActionLoading(true)
      const response = await claimService.evaluateRisk(id)
      setRiskData(response.data)
      alert(`Risk evaluated: ${response.data.risk_level} risk level`)
      
      // Refresh claim data as status may have changed to ESCALATED
      const claimResponse = await claimService.getClaim(id)
      setClaim(claimResponse.data)
    } catch (err) {
      alert(`Failed to evaluate risk: ${err.response?.data?.detail || err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Get CSS class for status badge based on claim status
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

  /**
   * Get CSS class for validation result badge
   * @param {boolean} isMatch - Whether validation passed
   * @returns {string} CSS class name for the badge
   */
  const getValidationBadgeClass = (isMatch) => {
    return isMatch ? 'badge-green' : 'badge-red'
  }

  // -------------------------------------------------
  // Render Loading State
  // -------------------------------------------------
  if (loading) {
    return <div className="loading">Loading claim details...</div>
  }

  // -------------------------------------------------
  // Render Error State
  // -------------------------------------------------
  if (error) {
    return (
      <div className="error">
        {error}
        <button onClick={() => navigate('/claims')}>Back to Claims</button>
      </div>
    )
  }

  // -------------------------------------------------
  // Render No Data State
  // -------------------------------------------------
  if (!claim) {
    return (
      <div className="not-found">
        Claim not found
        <button onClick={() => navigate('/claims')}>Back to Claims</button>
      </div>
    )
  }

  // -------------------------------------------------
  // Render Claim Details
  // -------------------------------------------------
  return (
    <div className="claim-details">
      {/* Navigation */}
      <div className="details-header">
        <button onClick={() => navigate('/claims')} className="back-btn">
          ← Back to Claims
        </button>
        <h2>Claim Details: {claim.claim_number}</h2>
      </div>

      {/* Claim Summary Section */}
      <section className="claim-summary">
        <h3>Claim Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Claim Number:</label>
            <span>{claim.claim_number}</span>
          </div>
          <div className="summary-item">
            <label>Status:</label>
            <span className={getStatusBadgeClass(claim.status)}>
              {claim.status}
            </span>
          </div>
          <div className="summary-item">
            <label>Policy ID:</label>
            <span>{claim.policy_id}</span>
          </div>
          <div className="summary-item">
            <label>Incident Date:</label>
            <span>{new Date(claim.incident_date).toLocaleDateString()}</span>
          </div>
          <div className="summary-item">
            <label>Created:</label>
            <span>{new Date(claim.created_at).toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <label>Updated:</label>
            <span>{new Date(claim.updated_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="description-box">
          <label>Description:</label>
          <p>{claim.description}</p>
        </div>
      </section>

      {/* Risk Summary Section */}
      <section className="risk-section">
        <h3>Risk Assessment</h3>
        {riskData ? (
          <div className="risk-summary">
            <div className="risk-badge-container">
              <span className={getRiskBadgeClass(riskData.risk_level)}>
                {riskData.risk_level} RISK
              </span>
              {riskData.escalated && (
                <span className="escalated-badge badge-purple">
                  AUTO-ESCALATED
                </span>
              )}
            </div>
            <div className="risk-breakdown">
              <p>High Severity Failures: {riskData.high_failures}</p>
              <p>Medium Severity Failures: {riskData.medium_failures}</p>
              <p>Low Severity Failures: {riskData.low_failures}</p>
            </div>
          </div>
        ) : (
          <div className="no-risk-data">
            <p>Risk evaluation not available</p>
            {claim.status === 'READY_FOR_REVIEW' && (
              <button 
                onClick={handleEvaluateRisk} 
                disabled={actionLoading}
                className="action-btn evaluate-btn"
              >
                {actionLoading ? 'Evaluating...' : 'Evaluate Risk'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Section A: All Uploaded Documents */}
      <section className="all-documents-section">
        <h3>All Uploaded Documents</h3>
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={index} className="document-item">
              <p><strong>Document Type:</strong> {doc.document_type}</p>
              <p><strong>Uploaded At:</strong> {new Date(doc.extracted_at).toLocaleString()}</p>
              {doc.file_path && (
                <p>
                  <a href={`http://localhost:8000${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="view-doc-btn">
                    View Document
                  </a>
                </p>
              )}
            </div>
          ))
        ) : (
          <p>No documents uploaded</p>
        )}
      </section>

      {/* Section B: DA Extraction Data */}
      <section className="extraction-section">
        <h3>DA Extraction Data</h3>
        {(() => {
          const extractedDocs = documents.filter(doc => doc.fields && doc.fields.length > 0)
          return extractedDocs.length > 0 ? (
            extractedDocs.map((doc, index) => (
              <div key={index} className="extracted-document-item">
                <p><strong>Document Type:</strong> {doc.document_type}</p>
                <div className="extracted-fields">
                  <h4>Extracted Fields:</h4>
                  {doc.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="field-item">
                      <span><strong>Field Name:</strong> {field.field_name}</span>
                      <span><strong>Field Value:</strong> {field.field_value}</span>
                      <span><strong>Confidence Score:</strong> {field.confidence_score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No extraction data available</p>
          )
        })()}
      </section>

      {/* Validation Results Section */}
      <section className="validation-section">
        <h3>Validation Results</h3>
        {validationResults.length > 0 ? (
          <table className="validation-table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Expected Value</th>
                <th>Actual Value</th>
                <th>Result</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {validationResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.rule_name}</td>
                  <td>{result.expected_value}</td>
                  <td>{result.actual_value}</td>
                  <td>
                    <span className={getValidationBadgeClass(result.is_match)}>
                      {result.is_match ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td>{result.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No validation results available.</p>
        )}
      </section>

      {/* Action Buttons Section */}
      <section className="actions-section">
        <h3>Actions</h3>
        <div className="action-buttons">
          {/* Show action buttons only for READY_FOR_REVIEW claims */}
          {claim.status === 'READY_FOR_REVIEW' && (
            <>
              <button 
                onClick={() => handleStatusUpdate('APPROVED')}
                disabled={actionLoading}
                className="action-btn approve-btn"
              >
                {actionLoading ? 'Processing...' : 'Approve Claim'}
              </button>
              <button 
                onClick={() => handleStatusUpdate('REJECTED')}
                disabled={actionLoading}
                className="action-btn reject-btn"
              >
                {actionLoading ? 'Processing...' : 'Reject Claim'}
              </button>
              <button 
                onClick={() => handleStatusUpdate('ESCALATED')}
                disabled={actionLoading}
                className="action-btn escalate-btn"
              >
                {actionLoading ? 'Processing...' : 'Escalate Claim'}
              </button>
            </>
          )}
          
          {/* Show message for non-actionable statuses */}
          {claim.status !== 'READY_FOR_REVIEW' && (
            <p className="no-actions">
              No actions available. Claim is in {claim.status} status.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ClaimDetails
