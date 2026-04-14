import re

with open('d:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\CustomerDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Root Layout
old_outer = """  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <div style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onBackToLanding}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#1976d2', fontWeight: 'bold', fontSize: '18px' }}>N</span>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '0.5px' }}>NexClaim</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={onSwitchRole}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            Switch Role
          </button>
        </div>
      </div>

      {view === 'landing' ? renderLandingPage() :
       view === 'form' ? renderClaimForm() :
       renderTrackView()}
    </div>
  );"""

new_outer = """  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1c1d20', 
      color: '#ffffff', 
      fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
      position: 'relative'
    }}>
      {/* Subtle noise texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.3, pointerEvents: 'none' }} />

      <style>{`
        .water-btn {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 16px 40px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: color 0.4s ease, border-color 0.4s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }
        .water-btn::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 0%;
          background: #ffffff;
          border-radius: 50% 50% 0 0;
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.5s ease;
          z-index: 0;
        }
        .water-btn:hover::before {
          height: 100%;
          border-radius: 0;
        }
        .water-btn:hover {
          color: #1c1d20;
          border-color: #ffffff;
        }
        input, select, textarea {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid #333333 !important;
            border-radius: 0 !important;
            color: #ffffff !important;
            outline: none !important;
            transition: border-color 0.3s ease !important;
            box-shadow: none !important;
        }
        input:focus, select:focus, textarea:focus {
            border-bottom-color: #ffffff !important;
        }
        ::placeholder {
            color: #666666 !important;
        }
        .card-bg {
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            border: none !important;
        }
        .label-text {
            font-size: 0.85rem !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            color: #666666 !important;
            font-weight: 400 !important;
            display: block;
            margin-bottom: 8px;
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 10, padding: '10vh 5vw' }}>
          {view === 'landing' ? renderLandingPage() :
           view === 'form' ? renderClaimForm() :
           renderTrackView()}
      </div>
    </div>
  );"""

text = text.replace(old_outer, new_outer)


# Replace renderLandingPage section
old_landing = """  const renderLandingPage = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '42px', color: '#1976d2', marginBottom: '18px', letterSpacing: '0.5px' }}>
          Smart Insurance Claim Portal
        </h1>
        <p style={{ fontSize: '20px', color: '#666' }}>
          Submit and track your vehicle insurance claims easily.
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '14px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '28px', fontSize: '24px' }}>Start Your Claim</h2>

        <div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Policy Number
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g., POL-2024-001"
              style={{
                padding: '12px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Vehicle Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g., MH01AB1234"
              style={{
                padding: '12px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => { setCurrentStep(1); setView('form'); }}
            style={{
              padding: '16px 36px',
              width: '100%',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '12px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1565c0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1976d2'}
          >
            Start Claim Process →
          </button>
        </div>
      </div>
    </div>
  );"""

new_landing = """  const renderLandingPage = () => (
    <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8vh' }}>
      <div>
        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
          Smart Insurance<br/>Claim Portal
        </h1>
        <p style={{ marginTop: '24px', fontSize: '1.4rem', color: '#999999', fontWeight: 300 }}>
          Submit and track your vehicle insurance claims efficiently.
        </p>
      </div>

      <div className="card-bg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="label-text">Policy Number</label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              placeholder="e.g., POL-2024-001"
              style={{
                padding: '12px 0',
                width: '100%',
                fontSize: '1.2rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label className="label-text">Vehicle Number</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g., MH01AB1234"
              style={{
                padding: '12px 0',
                width: '100%',
                fontSize: '1.2rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <button
              className="water-btn"
              type="button"
              onClick={() => { setCurrentStep(1); setView('form'); }}
            >
              <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>Start Claim Process →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );"""

text = text.replace(old_landing, new_landing)


# Next, the track view layout
old_track = """  const renderTrackView = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <h2 style={{ fontSize: '32px' }}>Track Your Claims</h2>
        <button
          onClick={() => setView('landing')}
          style={{
            padding: '10px 24px',
            backgroundColor: 'transparent',
            border: '2px solid #1976d2',
            color: '#1976d2',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
            fontSize: '15px'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#1976d2';
            e.target.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#1976d2';
          }}
        >
          + New Claim
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {dummyClaims.map(claim => (
          <div key={claim.id} style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #eee'
          }}>"""

new_track = """  const renderTrackView = () => (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8vh',
        gap: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', fontWeight: 400, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            Track Your Claims
          </h2>
          <p style={{ marginTop: '16px', fontSize: '1.2rem', color: '#999999', fontWeight: 300 }}>
             Review the lifecycle and status of your submitted cases.
          </p>
        </div>
        <button
          className="water-btn"
          onClick={() => setView('landing')}
          style={{ 
            borderColor: '#333333', 
            color: '#999999',
            marginTop: '10px'
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.color = '#1c1d20'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#333333'; e.currentTarget.style.color = '#999999'; }}
        >
          <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>+ New Claim</span>
        </button>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {dummyClaims.map(claim => (
          <div key={claim.id} style={{
            background: 'transparent',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid #333333',
            transition: 'border-color 0.3s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#666666'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#333333'}
          >"""

text = text.replace(old_track, new_track)


with open('d:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\CustomerDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Customer Dashboard completely reskinned")

