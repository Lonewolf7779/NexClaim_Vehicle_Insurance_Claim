
          {/* Step 3: Review and Submit */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: '24px' }}>Review Your Claim</h3>

              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#1976d2' }}>Policy Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><strong>Policy Holder:</strong></div>
                  <div>{formData.policyHolderName}</div>
                  <div><strong>Vehicle Model:</strong></div>
                  <div>{formData.vehicleModel || 'N/A'}</div>
                  <div><strong>Vehicle Number:</strong></div>
                  <div>{formData.vehicleNumber}</div>
                  <div><strong>Policy Valid Till:</strong></div>
                  <div>{formatDate(formData.policyEndDate)}</div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#1976d2' }}>Incident Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div><strong>Incident Date:</strong></div>
                  <div>{formData.incidentDate ? new Date(formData.incidentDate).toLocaleString() : 'Not specified'}</div>
                  <div><strong>Incident Location:</strong></div>
                  <div>{formData.incidentLocation || 'Not specified'}</div>
                  <div><strong>Claim Type:</strong></div>
                  <div>{getClaimTypeDisplay(formData.claimType)}</div>
                  <div><strong>Police Complaint Filed:</strong></div>
                  <div>{formData.policeReportFiled}</div>
                  <div><strong>Another Vehicle Involved:</strong></div>
                  <div>{formData.anotherVehicleInvolved}</div>
                  <div><strong>Estimated Repair Cost:</strong></div>
                  <div>{formData.estimatedRepairCost ? `₹ ${formData.estimatedRepairCost}` : 'Not specified'}</div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <strong>Description:</strong>
                  <p style={{ margin: '8px 0 0', fontSize: '14px' }}>{formData.description || 'No description provided'}</p>
                </div>
                {formData.anotherVehicleInvolved === 'Yes' && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                    <strong>Other Vehicle Details:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '14px' }}>
                      <div><strong>Vehicle Number:</strong></div>
                      <div>{formData.otherVehicleNumber || 'N/A'}</div>
                      <div><strong>Driver Name:</strong></div>
                      <div>{formData.otherDriverName || 'N/A'}</div>
                      <div><strong>Insurance Company:</strong></div>
                      <div>{formData.otherInsuranceCompany || 'N/A'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.7)' }}>Documents Uploaded</h4>      
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    {requiredDocs.map((doc) => {
                      const isUploaded = uploadedDocs[doc.id] || formData[doc.id] 
                      return (
                        <div key={doc.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: isUploaded ? '#4caf50' : 'rgba(255,255,255,0.5)'
                        }}>
                          <span style={{ marginRight: '8px' }}>{isUploaded ? '✓' : '✗'}</span>
                          {doc.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', gap: '12px' }}>        
            {currentStep < 3 ? (
              <button
                className="nav-btn-primary"
                onClick={() => {
                  if (currentStep === 1) {
                    if (!policyNumber) {
                      setError('Policy Number is required to proceed')
                      return
                    }
                    if (!formData.claimType) {
                      setError('Please select a claim type to proceed')
                      return
                    }
                  }
                  setError('')
                  setCurrentStep(prev => prev + 1)
                }}
                style={{
                  padding: '14px 36px',
                  backgroundColor: '#ffffff',
                  color: '#0b0b0f',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer'
                }}
              >
                Next
              </button>
            ) : (
              <button
                className="nav-btn-primary"
                onClick={handleSubmitClaim}
                disabled={loading}
                style={{
                  padding: '14px 36px',
                  backgroundColor: loading ? 'rgba(255,255,255,0.5)' : '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
