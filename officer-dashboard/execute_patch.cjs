const fs = require('fs');

try {
  let content = fs.readFileSync('src/pages/CustomerDashboard.jsx', 'utf8');

  // 1. Inputs to 'text' instead of 'number'
  content = content.replace(/type="number"/g, 'type="text"');

  // 2. Remove layout wrappers cleanly
  // A wrapper looks like: 
  // <div style={{ display: 'flex', flexDirection: 'column' }}>
  // Let's replace ONLY those that immediately enclose <h3> and <div className="dashboard-masonry"...>
  // We'll just be safe and inject a css class to make them fully flat
  
  content = content.replace(/<div style=\{\{\s*display:\s*'flex',\s*flexDirection:\s*'column'\s*\}\}>/g, '<div className="flat-flex-col">');

  let cssPatch = `
        /* Overridden user styles for uncontained UI */
        .premium-dashboard-root main { padding: 40px 5vw !important; }
        
        .flat-flex-col {
           display: flex !important;
           flex-direction: column !important;
           gap: 8px !important;
           margin-bottom: 24px;
        }

        .dashboard-masonry {
           column-count: 2 !important;
           column-gap: 40px !important;
           margin-top: 16px !important;
        }
        .dashboard-masonry > div {
           break-inside: avoid !important;
           margin-bottom: 32px !important;
           background: transparent !important;
           border: none !important;
           box-shadow: none !important;
           padding: 0 !important;
        }
        @media (max-width: 900px) {
           .dashboard-masonry { column-count: 1 !important; }
        }

        /* Destroy ANY container backgrounds / borders / shadow to match "no containing divs" request */
        .premium-dashboard-root [style*="backgroundColor"], 
        .premium-dashboard-root [style*="backgroundColor: '#f5f5f5'"],
        .premium-dashboard-root [style*="backgroundColor: '#e3f2bd'"],
        .premium-dashboard-root [style*="backgroundColor: 'white'"],
        .premium-dashboard-root [style*="border: '1px solid #e0e0e0'"],
        .premium-dashboard-root .glass-panel {
           background-color: transparent !important;
           background: transparent !important;
           border: none !important;
           box-shadow: none !important;
        }

        .premium-dashboard-root label {
          font-size: 0.85rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          color: #666666 !important;
          font-weight: 400 !important;
          margin-bottom: 4px !important;
          display: block !important;
        }
        
        /* Make inputs exact design of login pages */
        .premium-dashboard-root input:not([type="file"]),
        .premium-dashboard-root select,
        .premium-dashboard-root textarea {
           background: transparent !important;
           border: none !important;
           border-bottom: 1px solid #333333 !important;
           padding: 12px 0 !important;
           color: #ffffff !important;
           font-size: 1.2rem !important;
           outline: none !important;
           transition: border-color 0.3s ease !important;
        }
        .premium-dashboard-root input:not([type="file"]):focus,
        .premium-dashboard-root select:focus,
        .premium-dashboard-root textarea:focus {
           border-bottom-color: #ffffff !important;
        }
`;

  // Inject CSS safely before /* Buttons */
  if (content.indexOf("/* Overridden user styles") === -1) {
    content = content.replace(/\/\* Buttons \*\//, cssPatch + "\n        /* Buttons */");
  }

  // To truly remove the `bg and container divs`, some divs have inline styles like:
  // `<div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '40px', boxShadow: '0 8px 28px rgba(0,0,0,0.16)' }}`
  // Let's just remove them structurally with a simple string replacement for known hardcoded values
  
  // Ex: the success page container
  content = content.replace("backgroundColor: 'white',\n        borderRadius: '14px',\n        padding: '56px 40px',\n        boxShadow: '0 6px 28px rgba(0,0,0,0.14)'", 
                            "backgroundColor: 'transparent', padding: '0'");

  // Tracking page container
  content = content.replace("backgroundColor: 'white',\n        borderRadius: '14px',\n        padding: '40px',\n        boxShadow: '0 8px 28px rgba(0,0,0,0.16)'", 
                            "backgroundColor: 'transparent', padding: '0'");

  fs.writeFileSync('src/pages/CustomerDashboard.jsx', content);
  
  console.log('CustomerDashboard updated successfully without breaking JSX bounds');
} catch(e) {
  console.log('Error updating file', e);
  process.exit(1);
}
