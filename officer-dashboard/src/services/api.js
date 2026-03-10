// -------------------------------------------------
// API Service Module
// -------------------------------------------------
// Centralizes all HTTP communication with the FastAPI backend.
// Uses Axios for request/response handling with base URL configuration.
// All claim-related API calls are encapsulated in the claimService object.
// -------------------------------------------------
import axios from 'axios'

// -------------------------------------------------
// Axios Instance Configuration
// -------------------------------------------------
// Base URL points to FastAPI backend running on localhost:8000
// Timeout set to 10 seconds for all requests
// -------------------------------------------------
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// -------------------------------------------------
// Claim Service API Methods
// -------------------------------------------------
// Encapsulates all claim-related API endpoints
// Each method returns a Promise that resolves to the API response
// -------------------------------------------------
export const claimService = {
  /**
   * Fetch all claims from the backend
   * GET /claims
   * @returns {Promise} Array of claim objects
   */
  getClaims: () => api.get('/claims'),

  /**
   * Fetch a single claim by ID
   * GET /claims/{id}
   * @param {number} id - Claim ID
   * @returns {Promise} Single claim object
   */
  getClaim: (id) => api.get(`/claims/${id}`),

  /**
   * Fetch claim history/status timeline
   * GET /claims/{id}/history
   * @param {number} id - Claim ID
   * @returns {Promise} Array of status history objects
   */
  getClaimHistory: (id) => api.get(`/claims/${id}/history`),

  /**
   * Create a new claim
   * POST /claims/
   * @param {Object} data - Claim data with policy_id, incident_date, description
   * @returns {Promise} Created claim object with claim_id
   */
  createClaim: (data) => api.post('/claims/', data),

  /**
   * Trigger processing workflow for a claim
   * POST /claims/{id}/trigger-processing
   * @param {number} id - Claim ID
   * @returns {Promise} Updated claim object
   */
  triggerProcessing: (id) => api.post(`/claims/${id}/trigger-processing`),

  /**
   * Upload a file for a claim with a specific document type suffix
   * POST /upload/{id}?document_type={type}
   * @param {number} id - Claim ID
   * @param {File} file - File object to upload
   * @param {string} documentType - Document type suffix (e.g. INVOICE, RC, AADHAR)
   * @returns {Promise} Upload result with file_path
   */
  uploadFile: (id, file, documentType) => {
    const formData = new FormData()
    formData.append('files', file)
    return api.post(`/upload/${id}?document_type=${encodeURIComponent(documentType)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /**
   * Upload document for a claim
   * POST /claims/{id}/documents
   * @param {number} id - Claim ID
   * @param {Object} document - Document data with document_type and fields
   * @returns {Promise} Updated claim object
   */
  uploadDocument: (id, document) => api.post(`/claims/${id}/documents`, document),

  /**
   * Upload extracted document fields for a claim (used in testing workflow)
   * POST /claims/{id}/documents
   * @param {number} id - Claim ID
   * @param {Object} data - Extracted document data with policy_number, vehicle_number
   * @returns {Promise} Updated claim object
   */
  uploadExtractedDocument: (id, data) => api.post(`/claims/${id}/documents`, {
    document_type: 'extracted',
    fields: data
  }),

  /**
   * Run validation for a claim
   * POST /claims/{id}/run-validation
   * @param {number} id - Claim ID
   * @returns {Promise} Validation summary
   */
  runValidation: (id) => api.post(`/claims/${id}/run-validation`),

  /**
   * Fetch extracted documents and their fields for a claim
   * GET /claims/{id}/documents
   * @param {number} id - Claim ID
   * @returns {Promise} Array of document objects with fields
   */
  getDocuments: (id) => api.get(`/claims/${id}/documents`),

  /**
   * Fetch validation results for a specific claim
   * GET /claims/{id}/validation-results
   * @param {number} id - Claim ID
   * @returns {Promise} Array of validation result objects
   */
  getValidationResults: (id) => api.get(`/claims/${id}/validation-results`),

  /**
   * Trigger risk evaluation for a claim
   * POST /claims/{id}/evaluate-risk
   * @param {number} id - Claim ID
   * @returns {Promise} Risk evaluation result with level and failure counts
   */
  evaluateRisk: (id) => api.post(`/claims/${id}/evaluate-risk`),

  /**
   * Approve a claim with settlement calculation
   * POST /claims/{id}/approve
   * @param {number} id - Claim ID
   * @param {Object} data - Approval data with vehicle_age_years, parts, deductible_amount
   * @returns {Promise} Approval result with settlement details
   */
  approveClaim: (id, data) => api.post(`/claims/${id}/approve`, data),

  /**
   * Reject a claim
   * POST /claims/{id}/reject
   * @param {number} id - Claim ID
   * @param {Object} data - Rejection data with rejection_reason
   * @returns {Promise} Rejection result
   */
  rejectClaim: (id, data) => api.post(`/claims/${id}/reject`, data),

  /**
   * Manually escalate a claim
   * POST /claims/{id}/escalate
   * @param {number} id - Claim ID
   * @param {Object} data - Escalation data with officer_id and reason
   * @returns {Promise} Escalation result
   */
  escalateClaim: (id, data) => api.post(`/claims/${id}/escalate`, data),

  /**
   * Senior officer override approval for escalated claims
   * POST /claims/{id}/override-approve
   * @param {number} id - Claim ID
   * @param {Object} data - Override approval data with senior_officer_id, reason, vehicle_age_years, parts, deductible_amount
   * @returns {Promise} Override approval result
   */
  overrideApprove: (id, data) => api.post(`/claims/${id}/override-approve`, data),

  /**
   * Update claim status (APPROVED, REJECTED, ESCALATED, etc.)
   * PATCH /claims/{id}/status
   * @param {number} id - Claim ID
   * @param {string} status - New status value from ClaimStatus enum
   * @returns {Promise} Updated claim object
   */
  updateStatus: (id, status) => api.patch(`/claims/${id}/status`, { status }),

  // ================================================
  // Surveyor Dashboard API Methods
  // ================================================
  
  /**
   * Fetch claims assigned to surveyor (status = SURVEY_ASSIGNED)
   * GET /claims?status=SURVEY_ASSIGNED
   * @returns {Promise} Array of survey-pending claims
   */
  getSurveyClaims: () => api.get('/claims?status=SURVEY_ASSIGNED'),

  /**
   * Submit survey report and complete the survey
   * POST /claims/{id}/survey-complete
   * @param {number} id - Claim ID
   * @param {Object} data - Survey data with surveyor_id, damage_description, vehicle_condition, estimated_repair_cost, recommendation
   * @returns {Promise} Updated claim with status SURVEY_COMPLETED
   */
  submitSurveyReport: (id, data) => api.post(`/claims/${id}/survey-complete`, data),

  /**
   * Assign a claim to a surveyor
   * POST /claims/{id}/assign-surveyor
   * @param {number} id - Claim ID
   * @param {Object} data - Surveyor assignment data
   * @returns {Promise} Claim with status SURVEY_ASSIGNED
   */
  assignSurveyor: (id, data) => api.post(`/claims/${id}/assign-surveyor`, data),

  // ================================================
  // Officer Workflow API Methods
  // ================================================

  /**
   * Assign claim to officer for review
   * POST /claims/{id}/assign
   * @param {number} id - Claim ID
   * @param {Object} data - Assignment data with officer_id
   * @returns {Promise} Updated claim with status UNDER_REVIEW
   */
  assignClaim: (id, data) => api.post(`/claims/${id}/assign`, data),

  /**
   * Request additional documents from customer
   * POST /claims/{id}/request-documents
   * @param {number} id - Claim ID
   * @param {Object} data - Document request data
   * @returns {Promise} Updated claim with status DOCUMENT_REQUIRED
   */
  requestDocuments: (id, data) => api.post(`/claims/${id}/request-documents`, data),

  /**
   * Mark survey as complete
   * POST /claims/{id}/survey-complete
   * @param {number} id - Claim ID
   * @returns {Promise} Updated claim with status SURVEY_COMPLETED
   */
  completeSurvey: (id) => api.post(`/claims/${id}/survey-complete`),

  /**
   * Flag claim for investigation
   * POST /claims/{id}/flag-investigation
   * @param {number} id - Claim ID
   * @param {string} reason - Investigation reason
   * @returns {Promise} Updated claim with status UNDER_INVESTIGATION
   */
  flagInvestigation: (id, reason) => api.post(`/claims/${id}/flag-investigation?reason=${encodeURIComponent(reason)}`),

  /**
   * Update claim status to any valid status
   * POST /claims/{id}/update-status
   * @param {number} id - Claim ID
   * @param {Object} data - Status update data
   * @returns {Promise} Updated claim
   */
  updateClaimStatus: (id, data) => api.post(`/claims/${id}/update-status`, data),

  /**
   * Close a claim (after payment/repair)
   * POST /claims/{id}/close
   * @param {number} id - Claim ID
   * @param {Object} data - Closure data
   * @returns {Promise} Closed claim with status CLOSED
   */
  closeClaim: (id, data) => api.post(`/claims/${id}/close`, data)
}

// -------------------------------------------------
// Policy Service API Methods
// -------------------------------------------------
export const policyService = {
  /**
   * Fetch all policies from the backend
   * GET /policies
   * @returns {Promise} Array of policy objects
   */
  getPolicies: () => api.get('/policies'),

  /**
   * Fetch a single policy by ID
   * GET /policies/{id}
   * @param {number} id - Policy ID
   * @returns {Promise} Single policy object
   */
  getPolicy: (id) => api.get(`/policies/${id}`),

  /**
   * Fetch policy by policy number
   * GET /policies/by-number/{policy_number}
   * @param {string} policyNumber - Policy number
   * @returns {Promise} Single policy object
   */
  getPolicyByNumber: (policyNumber) => api.get(`/policies/by-number/${policyNumber}`)
}



export default api
