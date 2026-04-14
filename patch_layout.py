import re
import codecs

path = 'officer-dashboard/src/pages/CustomerDashboard.jsx'

with codecs.open(path, 'r', 'utf-8') as f:
    text = f.read()

# Replace the inline div styles and <div className="dashboard-masonry"> with flat elements.

# 1. First, strip all the wrapping `<div style={{ display: 'flex', flexDirection: 'column' }}>` 
# that are inside renderLandingPage and renderStepForm
text = text.replace("<div style={{ display: 'flex', flexDirection: 'column' }}>\n            <label>", "<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>\n            <label>")

# Wait, the user wants NO container divs.

def patch_file():
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace outer "Access Portal" and "System Status" cards in Landing Page
    # From:
    #         {/* Card 1: Intake Form */}
    #         <div className="dashboard-masonry" style={{}}>
    #           <h3 style={{ margin: 0,...
    # To:
    #         {/* Card 1: Intake Form */}
    #         <h3 style={{ margin: 0,...
    
    # Remove Card wrappers
    content = re.sub(
        r'\{\/\* Card 1: Intake Form \*\/\}\s*<div className="dashboard-masonry"[^>]*>',
        r'{/* Intake Form */}',
        content
    )
    content = re.sub(
        r'\{\/\* Card 2: Quick Stats \/ Info \*\/\}\s*<div className="dashboard-masonry"[^>]*>',
        r'{/* Quick Stats / Info */}',
        content
    )
    
    # Remove Step 1: Policy & Personal Details wrappers
    # <div style={{ display: 'flex', flexDirection: 'column' }}>
    #   <h3 ...>Policy & Personal Details</h3>
    #   <div className="dashboard-masonry" ...>
    content = re.sub(
        r'<div style=\{\{ display: \'flex\', flexDirection: \'column\' \}\}>\s*(<h3[^>]*>Policy & Personal Details</h3>)\s*<div className="dashboard-masonry"[^>]*>',
        r'\1\n                <div className="dashboard-masonry">',
        content
    )
    
    # Do same for Incident Details
    content = re.sub(
        r'</div>\s*</div>\s*<div style=\{\{ display: \'flex\', flexDirection: \'column\' \}\}>\s*(<h3[^>]*>Incident Details</h3>)\s*<div className="dashboard-masonry"[^>]*>',
        r'</div>\n\n              \1\n                <div className="dashboard-masonry">',
        content
    )
    
    # Remove Other Vehicle Details wrapper
    content = re.sub(
        r'<div style=\{\{\}\}>\s*(<h4[^>]*>Other Vehicle Details</h4>)\s*<div className="dashboard-masonry"[^>]*>',
        r'\1\n                      <div className="dashboard-masonry">',
        content
    )
    
    # Remove the matching closing divs for the removed wrappers
    # Actually, it's safer to just inject a CSS patch that resets ALL container styles if we aren't 100% sure we balance the JSX!
    
    # Let's fix the Label & Input styles to match Login and change type="number" to "text"
    content = content.replace('type="number"', 'type="text"')
    
    # We'll inject global CSS in useEffect to force the Masonry layout and remove any card formatting
    css_patch = """
        /* Enforce Masonry Effect and remove all card backgrounds */
        .dashboard-masonry {
           column-count: 2;
           column-gap: 40px;
           margin-top: 20px;
        }
        .dashboard-masonry > * {
           break-inside: avoid;
           margin-bottom: 30px;
           display: flex;
           flex-direction: column;
           gap: 8px; /* login style gap */
        }
        @media (max-width: 900px) {
           .dashboard-masonry { column-count: 1; }
        }
        
        /* Force login-style inputs and remove remaining container padding/bg */
        .premium-dashboard-root .card-bg, 
        .premium-dashboard-root div[style*="background"] {
           background: transparent !important;
           box-shadow: none !important;
           border: none !important;
        }
        
        .premium-dashboard-root label {
          font-size: 0.85rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          color: #666666 !important;
        }
    """
    
    if ".dashboard-masonry {" not in content:
        content = content.replace("/* Buttons */", css_patch + "\n        /* Buttons */")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
patch_file()
