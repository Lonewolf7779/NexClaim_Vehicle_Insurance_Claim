import re

file_path = r'd:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\pages\CustomerDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Strip glass-panel class
content = content.replace(' className=\"glass-panel\"', '')
content = content.replace('className=\"glass-panel\"', '')

new_css = '''
        .premium-dashboard-root {
          background-color: #111111 !important;
          color: #ffffff !important;
          min-height: 100vh;
          font-family: "Helvetica Neue", "Neue Montreal", Arial, sans-serif !important;
        }

        .premium-dashboard-root::before {
          content: "";
          position: fixed;
          inset: 0;
          background: #111111;
          z-index: 0;
          pointer-events: none;
        }

        .premium-dashboard-root * {
          z-index: 1;
        }

        .premium-dashboard-root main {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 5vw !important;
          display: flex;
          flex-direction: column;
          gap: 60px;
        }

        .premium-dashboard-root header {
           background: transparent !important;
           border-bottom: none !important;
           box-shadow: none !important;
           padding: 0 !important;
           margin-bottom: 2rem;
        }
        .premium-dashboard-root header h1 {
           color: #fff !important;
           font-size: clamp(3rem, 6vw, 6rem) !important;
           font-weight: 400 !important;
           letter-spacing: -0.02em !important;
           line-height: 1.1 !important;
           margin: 0 !important;
        }

        /* Typography */
        .premium-dashboard-root h2 { font-size: clamp(2.5rem, 4vw, 4rem) !important; font-weight: 400 !important; letter-spacing: -0.02em !important; line-height: 1.1 !important; margin-bottom: 1.5rem !important; color: #fff !important; border:none!important; }
        .premium-dashboard-root h3 { font-size: clamp(1.8rem, 3vw, 3rem) !important; font-weight: 400 !important; letter-spacing: -0.01em !important; border:none!important; color: #fff !important;}
        .premium-dashboard-root p, .premium-dashboard-root span { font-size: 1.4rem !important; font-weight: 300 !important; letter-spacing: 0 !important; color: #999999 !important; }
        
        .premium-dashboard-root label, .premium-dashboard-root li { 
          font-size: 0.85rem !important; 
          text-transform: uppercase !important; 
          letter-spacing: 0.1em !important; 
          color: #666666 !important; 
          font-weight: 400 !important;
        }

        /* Naked Inputs instead of Cards */
        .premium-dashboard-root input,
        .premium-dashboard-root select,
        .premium-dashboard-root textarea {
           background: transparent !important;
           border: none !important;
           border-bottom: 1px solid #333333 !important;
           color: #ffffff !important;
           border-radius: 0 !important;
           padding: 12px 0 !important;
           font-size: 1.2rem !important;
           outline: none !important;
           transition: border-color 0.3s ease !important;
           width: 100% !important;
           box-sizing: border-box !important;
           margin-top: 8px !important;
           font-family: inherit !important;
        }
        .premium-dashboard-root input:focus,
        .premium-dashboard-root select:focus,
        .premium-dashboard-root textarea:focus {
           border-bottom-color: #ffffff !important;
           box-shadow: none !important;
           transform: none !important;
           background: transparent !important;
        }
        .premium-dashboard-root select option {
          background: #1c1d20 !important;
          color: #ffffff !important;
        }

        /* Buttons */
        .premium-dashboard-root button {
          position: relative;
          overflow: hidden;
          background: transparent !important;
          border: 1px solid #333333 !important;
          color: #ffffff !important;
          padding: 16px 40px !important;
          border-radius: 999px !important;
          cursor: pointer;
          font-size: 1rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          transition: color 0.4s ease, border-color 0.4s ease, background 0.4s ease !important;
          box-shadow: none !important;
        }
        .premium-dashboard-root button:hover {
          border-color: #ffffff !important;
          background: rgba(255,255,255,0.05) !important;
          transform: none !important;
        }
        .premium-dashboard-root .nav-btn-primary {
          background: #ffffff !important;
          color: #000000 !important;
          border: 1px solid #ffffff !important;
        }
        .premium-dashboard-root .nav-btn-primary:hover {
          background: transparent !important;
          color: #ffffff !important;
          transform: none!important;
        }
'''

start_idx = content.find('style.innerHTML = ')
if start_idx != -1:
    end_idx = content.find(';', start_idx)
    content = content[:start_idx + len('style.innerHTML = \n')] + new_css + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done re-writing styles and removing glass panels!')
