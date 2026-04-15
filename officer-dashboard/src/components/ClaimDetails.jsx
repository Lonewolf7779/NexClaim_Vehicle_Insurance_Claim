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

const REQUEST_DOCUMENT_TYPE_OPTIONS = [
  'DRIVING_LICENSE',
  'RC_BOOK',
  'BANK_DETAILS',
  'FIR',
  'REPAIR_ESTIMATE',
  'DAMAGE_PHOTOS'
]

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
  // Request Additional Documents (Officer Action)
  // -------------------------------------------------
  const [requestDocsOpen, setRequestDocsOpen] = useState(false)
  const [requestDocsTypes, setRequestDocsTypes] = useState([])
  const [requestDocsReason, setRequestDocsReason] = useState('')
  const [requestDocsSubmitting, setRequestDocsSubmitting] = useState(false)
  const [requestDocsError, setRequestDocsError] = useState(null)

  // -------------------------------------------------
  // Data Fetching Effect
  // -------------------------------------------------
  // Runs when component mounts or ID changes
  // Fetches claim details, validation results, and risk evaluation
  // -------------------------------------------------
  useEffect(() => {
    fetchClaimData()
  }, [id])

  const canRequestAdditionalDocuments =
    claim?.status === 'UNDER_REVIEW' || claim?.status === 'SUBMITTED'

  const handleToggleRequestDocType = (docType) => {
    setRequestDocsTypes((prev) => {
      if (prev.includes(docType)) {
        return prev.filter((t) => t !== docType)
      }
      return [...prev, docType]
    })
  }

  const openRequestDocs = () => {
    setRequestDocsError(null)
    setRequestDocsOpen(true)
  }

  const closeRequestDocs = () => {
    if (requestDocsSubmitting) return
    setRequestDocsOpen(false)
    setRequestDocsError(null)
  }

  const handleSubmitRequestDocs = async (e) => {
    e.preventDefault()

    const reason = requestDocsReason.trim()
    if (requestDocsTypes.length === 0) {
      setRequestDocsError('Please select at least one missing document type.')
      return
    }
    if (!reason) {
      setRequestDocsError('Please provide a reason for the document request.')
      return
    }

    try {
      setRequestDocsSubmitting(true)
      setRequestDocsError(null)

      const payload = {
        document_types: requestDocsTypes,
        reason
      }

      await claimService.requestDocuments(id, payload)

      // Refresh claim so UI reflects DOCUMENT_REQUIRED status
      const claimResponse = await claimService.getClaim(id)
      setClaim(claimResponse.data)

      setRequestDocsOpen(false)
      setRequestDocsTypes([])
      setRequestDocsReason('')
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to request additional documents.'
      setRequestDocsError(message)
    } finally {
      setRequestDocsSubmitting(false)
    }
  }

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
      'UNDER_REVIEW': 'badge-orange',
      'DOCUMENT_REQUIRED': 'badge-orange',
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

      {/* Document Requested Banner */}
      {claim.status === 'DOCUMENT_REQUIRED' && (
        <div className="nx-alert-banner" role="status">
          Waiting on Customer: Documents Requested.
        </div>
      )}

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

          {/* Request Additional Documents */}
          {canRequestAdditionalDocuments && (
            <button
              type="button"
              onClick={openRequestDocs}
              disabled={actionLoading}
              className="water-btn water-btn--sm"
              style={{ position: 'relative', zIndex: 1 }}
            >
              Request Additional Documents
            </button>
          )}
          
          {/* Show message for non-actionable statuses */}
          {claim.status !== 'READY_FOR_REVIEW' && !canRequestAdditionalDocuments && (
            <p className="no-actions">
              No actions available. Claim is in {claim.status} status.
            </p>
          )}
        </div>
      </section>

      {/* Request Documents Modal */}
      {requestDocsOpen && (
        <div className="nx-modal-overlay" role="dialog" aria-modal="true" aria-label="Request Additional Documents">
          <div className="nx-modal">
            <div className="nx-modal-header">
              <h3 className="nx-modal-title">Request Additional Documents</h3>
              <p className="nx-modal-subtitle">Select missing documents and provide a clear reason for the customer.</p>
            </div>

            <form onSubmit={handleSubmitRequestDocs}>
              <div className="nx-form-row">
                <label className="nx-label">Missing Document Types</label>
                <div className="nx-checkbox-grid">
                  {REQUEST_DOCUMENT_TYPE_OPTIONS.map((docType) => {
                    const checked = requestDocsTypes.includes(docType)
                    return (
                      <label key={docType} className="nx-checkbox-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleRequestDocType(docType)}
                          disabled={requestDocsSubmitting}
                        />
                        <span>{docType.replace(/_/g, ' ')}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="nx-form-row">
                <label className="nx-label" htmlFor="request-docs-reason">Reason</label>
                <textarea
                  id="request-docs-reason"
                  className="nx-textarea"
                  value={requestDocsReason}
                  onChange={(e) => setRequestDocsReason(e.target.value)}
                  placeholder='E.g., "Please provide a clear picture of your Driving License and a cancelled cheque for NEFT transfer."'
                  disabled={requestDocsSubmitting}
                />
              </div>

              {requestDocsError && (
                <div className="nx-inline-error" role="alert">
                  {requestDocsError}
                </div>
              )}

              <div className="nx-modal-actions">
                <button
                  type="button"
                  className="water-btn water-btn--sm back-btn-cs"
                  onClick={closeRequestDocs}
                  disabled={requestDocsSubmitting}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="water-btn water-btn--sm"
                  disabled={requestDocsSubmitting}
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  {requestDocsSubmitting ? 'Requesting…' : 'Request Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClaimDetails
