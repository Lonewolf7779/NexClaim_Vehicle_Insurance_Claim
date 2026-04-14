import re, os

files = [
    r'd:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\pages\CustomerDashboard.jsx',
    r'd:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\CustomerClaimsPage.jsx',
    r'd:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\CustomerClaimDetailPage.jsx'
]

new_css = '''
        .premium-dashboard-root { background-color: #111111 !important; color: #ffffff !important; min-height: 100vh; font-family: "Helvetica Neue", "Neue Montreal", Arial, sans-serif !important; }
        .premium-dashboard-root::before { content: ""; position: fixed; inset: 0; background: #111111; z-index: 0; pointer-events: none; }
        .premium-dashboard-root * { z-index: 1; }
        .premium-dashboard-root main { width: 100%; max-width: 1200px; margin: 0 auto; padding: 80px 5vw !important; display: flex; flex-direction: column; gap: 40px; }
        .premium-dashboard-root header { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin-bottom: 2rem; }
        .premium-dashboard-root header h1 { color: #fff !important; font-size: clamp(3rem, 6vw, 6rem) !important; font-weight: 400 !important; letter-spacing: -0.02em !important; line-height: 1.1 !important; margin: 0 !important; }
        .premium-dashboard-root h2 { font-size: clamp(2.5rem, 4vw, 4rem) !important; font-weight: 400 !important; letter-spacing: -0.02em !important; line-height: 1.1 !important; margin-bottom: 1.5rem !important; color: #fff !important; border:none!important; }
        .premium-dashboard-root h3 { font-size: clamp(1.8rem, 3vw, 3rem) !important; font-weight: 400 !important; letter-spacing: -0.01em !important; border:none!important; color: #fff !important;}
        .premium-dashboard-root p, .premium-dashboard-root span { font-size: 1.4rem !important; font-weight: 300 !important; letter-spacing: 0 !important; color: #999999 !important; }
        .premium-dashboard-root label, .premium-dashboard-root li {  font-size: 0.85rem !important; text-transform: uppercase !important; letter-spacing: 0.1em !important; color: #666666 !important; font-weight: 400 !important; }
        .premium-dashboard-root input, .premium-dashboard-root select, .premium-dashboard-root textarea { background: transparent !important; border: none !important; border-bottom: 1px solid #333333 !important; color: #ffffff !important; border-radius: 0 !important; padding: 12px 0 !important; font-size: 1.2rem !important; outline: none !important; transition: border-color 0.3s ease !important; width: 100% !important; box-sizing: border-box !important; margin-top: 8px !important; font-family: inherit !important; }
        .premium-dashboard-root input:focus, .premium-dashboard-root select:focus, .premium-dashboard-root textarea:focus { border-bottom-color: #ffffff !important; box-shadow: none !important; transform: none !important; background: transparent !important; }
        .premium-dashboard-root select option { background: #1c1d20 !important; color: #ffffff !important; }
        .premium-dashboard-root button { position: relative; overflow: hidden; background: transparent !important; border: 1px solid #333333 !important; color: #ffffff !important; padding: 16px 40px !important; border-radius: 999px !important; cursor: pointer; font-size: 1rem !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; transition: color 0.4s ease, border-color 0.4s ease, background 0.4s ease !important; box-shadow: none !important; }
        .premium-dashboard-root button:hover { border-color: #ffffff !important; }
        
        .dashboard-masonry { column-count: 2; column-gap: 40px; border: none !important; background: transparent !important; box-shadow: none !important; }
        .dashboard-masonry > div, .dashboard-masonry > * { break-inside: avoid; margin-bottom: 40px; border:none!important; box-shadow:none!important; background:transparent!important; padding:0!important; }
        @media (max-width: 900px) { .dashboard-masonry { column-count: 1; } }
        
        .premium-dashboard-root [style*="background"] { background: transparent !important; box-shadow: none !important; border: none !important; }
'''

for f in files:
    if not os.path.exists(f): 
        continue
    
    with open(f, 'r', encoding='utf-8') as file: 
        c = file.read()
    
    # 1. Update CSS properly entirely
    c = re.sub(r'style\.innerHTML\s*=\s*\[\s\S]*?\;', f'style.innerHTML = {new_css};\n', c)
    
    # 2. Rip out stringly classes
    c = c.replace(' className="glass-panel"', '')
    c = c.replace('className="glass-panel"', '')
    
    # 3. Rip out all background inline objects thoroughly
    c = re.sub(r'style=\{\{[^\}]*?backgroundColor:\s*[\'\"][^\'\"]+[\'\"][^\}]*?\}\}', 'style={{}}', c)
    c = re.sub(r'style=\{\{[^\}]*?background:\s*[\'\"][^\'\"]+[\'\"][^\}]*?\}\}', 'style={{}}', c)
    
    # 4. Find vertical layout forms and patch them with masonry
    c = re.sub(r'style=\{\{\s*display:\s*[\'\"]flex[\'\"],\s*flexDirection:\s*[\'\"]column[\'\"],\s*gap:\s*[\'\"]\d+px[\'\"]\s*\}\}', 'className="dashboard-masonry" style={{}}', c)
    
    with open(f, 'w', encoding='utf-8') as file: 
        file.write(c)
    
    print(f'Patched {f}')
