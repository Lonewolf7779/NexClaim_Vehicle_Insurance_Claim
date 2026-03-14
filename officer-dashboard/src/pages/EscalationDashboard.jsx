import React, { useState } from 'react'
import { claimService } from '../services/api'

// -------------------------------------------------
// Escalation Dashboard Component
// Placeholder for escalation override functionality
// -------------------------------------------------
function EscalationDashboard({ onSwitchRole }) {
  // State for escalation override
  const [claimId, setClaimId] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideAmount, setOverrideAmount] = useState('')
  const [finalDecision, setFinalDecision] = useState('')
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [escalationResult, setEscalationResult] = useState(null)

  // Handle API errors
  const handleApiError = (err) => {
    const message = err.response?.data?.detail || err.message || 'An error occurred'
    setError(message)
  }

  // Submit escalation override
  const handleSubmitEscalation = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Placeholder API call - would use claimService.overrideDecision in production
      await claimService.triggerProcessing(parseInt(claimId))
      setEscalationResult({
        claim_id: claimId,
        override_reason: overrideReason,
        override_amount: overrideAmount,
        final_decision: finalDecision,
        status: 'OVERRIDDEN'
      })
      setSuccessMessage('Escalation override submitted successfully!')
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setClaimId('')
    setOverrideReason('')
    setOverrideAmount('')
    setFinalDecision('')
    setError(null)
    setSuccessMessage(null)
    setEscalationResult(null)
  }

  return (
    <div className="escalation-dashboard" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Escalation Officer Dashboard</h1>
        <button onClick={onSwitchRole} style={{ padding: '8px 16px' }}>
          Switch Role
        </button>
      </header>

      <main>
        {/* Error Message */}
        {error && (
          <div style={{ color: 'red', padding: '10px', marginBottom: '20px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{ color: 'green', padding: '10px', marginBottom: '20px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {/* Escalation Override Form */}
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Escalation Override</h2>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Override approval decisions for escalated claims
          </p>
          <form onSubmit={handleSubmitEscalation}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Claim ID:</label>
              <input
                type="number"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                required
                style={{ padding: '8px', width: '300px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Override Reason:</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
                rows="3"
                style={{ padding: '8px', width: '300px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Override Amount ($):</label>
              <input
                type="number"
                step="0.01"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(e.target.value)}
                required
                style={{ padding: '8px', width: '300px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Final Decision:</label>
              <select
                value={finalDecision}
                onChange={(e) => setFinalDecision(e.target.value)}
                required
                style={{ padding: '8px', width: '300px' }}
              >
                <option value="">Select decision</option>
                <option value="approve">Approve Override</option>
                <option value="reject">Reject Override</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Processing...' : 'Submit Override'}
            </button>
          </form>
        </div>

        {/* Escalation Result */}
        {escalationResult && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
            <h3>Override Result</h3>
            <p><strong>Status:</strong> {escalationResult.status}</p>
            <p><strong>Claim ID:</strong> {escalationResult.claim_id}</p>
            <p><strong>Override Reason:</strong> {escalationResult.override_reason}</p>
            <p><strong>Override Amount:</strong> ${escalationResult.override_amount}</p>
            <p><strong>Final Decision:</strong> {escalationResult.final_decision}</p>
          </div>
        )}

        {/* Reset Button */}
        <div style={{ marginTop: '30px' }}>
          <button
            onClick={handleReset}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Reset Form
          </button>
        </div>
      </main>
    </div>
  )
}

export default EscalationDashboard

