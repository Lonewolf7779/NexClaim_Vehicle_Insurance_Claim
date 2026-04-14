// -------------------------------------------------
// CustomerClaimDetailPage Component
// -------------------------------------------------
// Customer-facing detailed view of a single claim.
// Features:
//   - Fetches claim details and validation results
//   - Displays claim summary with all metadata
//   - Shows financial breakdown section (placeholder for future)
//   - Renders simple timeline showing claim status progression
//   - Displays validation results for transparency
// State Management:
//   - claim: Single claim object with full details
//   - validationResults: Array of validation rule results
//   - loading: Boolean for initial data fetch
//   - error: String for error messages
// -------------------------------------------------
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { claimService } from '../services/api'

const FONT_STACK = '"Helvetica Neue", "Neue Montreal", Helvetica, Arial, sans-serif'

function CustomerClaimDetailPage() {
  // -------------------------------------------------
  // Router Hooks
  // -------------------------------------------------
  const { id } = useParams()
  const navigate = useNavigate()

  // -------------------------------------------------
  // State Management
  // -------------------------------------------------
  const [claim, setClaim] = useState(null)
  const [validationResults, setValidationResults] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [docType, setDocType] = useState('INVOICE')
  const [uploading, setUploading] = useState(false)

  // -------------------------------------------------
  // Data Fetching Effect
  // -------------------------------------------------
  useEffect(() => {
    fetchClaimData()
  }, [id])

  /**
   * Fetch claim details and validation results
   */
  const fetchClaimData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch claim details
      const claimResponse = await claimService.getClaim(id)
      setClaim(claimResponse.data)

      // Fetch validation results (may be empty)
      try {
        const validationResponse = await claimService.getValidationResults(id)
        setValidationResults(validationResponse.data)
      } catch (err) {
        setValidationResults([])
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
   * Format currency value
   */
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—'
    return `$${parseFloat(value).toFixed(2)}`
  }

  /**
   * Define timeline steps based on claim status workflow
   */
  const getTimelineSteps = () => {
    const steps = [
      { key: 'SUBMITTED', label: 'Claim Submitted' },
      { key: 'PROCESSING', label: 'Under Processing' },
      { key: 'READY_FOR_REVIEW', label: 'Ready for Review' },
      { key: 'APPROVED', label: 'Approved' }
    ]
    return steps
  }

  /**
   * Determine if a timeline step is completed, current, or pending
   */
  const getStepStatus = (stepKey, currentStatus) => {
    const statusOrder = ['SUBMITTED', 'PROCESSING', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'ESCALATED']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const stepIndex = statusOrder.indexOf(stepKey)

    if (currentStatus === stepKey) return 'current'
    if (stepIndex < currentIndex) return 'completed'
    return 'pending'
  }

  /**
   * Handle file upload for additional documents
   */
  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    try {
      setUploading(true)
      await claimService.uploadFile(id, selectedFile, docType)
      alert('File uploaded successfully!')
      setSelectedFile(null)
      // Refresh the entire claim data including documents
      await fetchClaimData()
    } catch (err) {
      alert(`Failed to upload file: ${err.message}`)
    } finally {
      setUploading(false)
    }
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
        <button onClick={() => navigate('/track')} className="back-btn">
          Back to My Claims
        </button>
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
        <button onClick={() => navigate('/track')} className="back-btn">
          Back to My Claims
        </button>
      </div>
    )
  }

  // -------------------------------------------------
  // Render Claim Details
  // -------------------------------------------------
  return (
    <div className="customer-claim-detail" style={{ fontFamily: FONT_STACK }}>
      {/* Navigation */}
      <div className="details-header">
        <button onClick={() => navigate('/track')} className="back-btn">
          ← Back to My Claims
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
            <label>Incident Date:</label>
            <span>{new Date(claim.incident_date).toLocaleDateString()}</span>
          </div>
          <div className="summary-item">
            <label>Submitted On:</label>
            <span>{new Date(claim.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="description-box">
          <label>Description:</label>
          <p>{claim.description}</p>
        </div>
      </section>

      {/* Financial Breakdown Section */}
      <section className="financial-section">
        <h3>Financial Breakdown</h3>
        <div className="financial-grid">
          <div className="financial-item">
            <label>Claim Amount:</label>
            <span>{formatCurrency(claim.claim_amount)}</span>
          </div>
          <div className="financial-item">
            <label>Deductible:</label>
            <span>{formatCurrency(claim.deductible)}</span>
          </div>
          <div className="financial-item">
            <label>Final Payable:</label>
            <span className="highlight-amount">
              {formatCurrency(claim.final_payable_amount)}
            </span>
          </div>
          <div className="financial-item">
            <label>Payment Status:</label>
            <span>{claim.payment_status || 'Pending'}</span>
          </div>
        </div>
      </section>

      {/* Upload Additional Document Section */}
      <section className="upload-section">
        <h3>Upload Additional Document</h3>
        <form onSubmit={handleFileUpload} className="upload-form">
          <div className="upload-field">
            <label>Document Type:</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="INVOICE">INVOICE</option>
              <option value="CLAIM_FORM">CLAIM_FORM</option>
              <option value="RC_BOOK">RC_BOOK</option>
              <option value="DRIVING_LICENSE">DRIVING_LICENSE</option>
            </select>
          </div>
          <div className="upload-field">
            <label>Select File:</label>
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
            />
          </div>
          <button type="submit" disabled={uploading} className="upload-btn">
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </section>

      {/* Documents Section */}
      <section className="documents-section">
        <h3>Submitted Documents</h3>
        {documents.length > 0 ? (
          documents.map((doc, index) => (
            <div key={index} className="document-item">
              <p><strong>Document Type:</strong> {doc.document_type}</p>
              <p><strong>Extracted At:</strong> {new Date(doc.extracted_at).toLocaleString()}</p>
              {doc.file_path && (
                <p>
                  <a href={`http://localhost:8000${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="view-doc-btn">
                    View Document
                  </a>
                </p>
              )}
              {doc.fields && doc.fields.length > 0 && (
                <div className="document-fields">
                  <h4>Fields:</h4>
                  {doc.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="field-item">
                      <span><strong>Field Name:</strong> {field.field_name}</span>
                      <span><strong>Field Value:</strong> {field.field_value}</span>
                      <span><strong>Confidence Score:</strong> {field.confidence_score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No documents available</p>
        )}
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <h3>Claim Progress</h3>
        <div className="timeline">
          {getTimelineSteps().map((step, index) => {
            const stepStatus = getStepStatus(step.key, claim.status)
            return (
              <div key={step.key} className={`timeline-step ${stepStatus}`}>
                <div className="step-indicator">
                  {stepStatus === 'completed' ? '✓' : 
                   stepStatus === 'current' ? '●' : '○'}
                </div>
                <div className="step-label">{step.label}</div>
                {index < getTimelineSteps().length - 1 && (
                  <div className={`step-connector ${stepStatus}`}></div>
                )}
              </div>
            )
          })}
        </div>
        {(claim.status === 'REJECTED' || claim.status === 'ESCALATED') && (
          <div className="status-notice">
            {claim.status === 'REJECTED' 
              ? 'This claim has been rejected.' 
              : 'This claim has been escalated for further review.'}
          </div>
        )}
      </section>

      {/* Validation Results Section */}
      <section className="validation-section">
        <h3>Validation Results</h3>
        {validationResults.length > 0 ? (
          <table className="validation-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {validationResults.map((result, index) => (
                <tr key={index}>
                  <td>{result.rule_name}</td>
                  <td>
                    <span className={result.is_match ? 'badge-green' : 'badge-red'}>
                      {result.is_match ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Validation results not yet available.</p>
        )}
      </section>
    </div>
  )
}

export default CustomerClaimDetailPage
