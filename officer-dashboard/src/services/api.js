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
   * Update claim status (APPROVED, REJECTED, ESCALATED, etc.)
   * PATCH /claims/{id}/status
   * @param {number} id - Claim ID
   * @param {string} status - New status value from ClaimStatus enum
   * @returns {Promise} Updated claim object
   */
  updateStatus: (id, status) => api.patch(`/claims/${id}/status`, { status })
}

export default api
