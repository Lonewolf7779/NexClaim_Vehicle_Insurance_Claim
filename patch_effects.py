import os

# --- APP.JSX REPLACEMENT ---
app_path = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

app_old = """            <div style={{ marginTop: '20px', display: 'flex' }}>
              <button 
                type="submit"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: '#1c1d20',
                  color: '#ffffff',
                  border: '1px solid #333333',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#1c1d20';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1c1d20';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ position: 'relative', zIndex: 2 }}>Enter</span>
              </button>
            </div>"""

app_new = """            <style>{`
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
            `}</style>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="water-btn" type="submit">
                <span style={{ position: 'relative', zIndex: 2, pointerEvents: 'none' }}>Enter</span>
              </button>
            </div>"""

app_code = app_code.replace(app_old, app_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_code)


# --- ROLETRANSITION.JSX REPLACEMENT ---
role_path = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\RoleTransition.jsx"
with open(role_path, "r", encoding="utf-8") as f:
    role_code = f.read()

ref_old = """  const loaderRef = useRef(null);
  const dotRef = useRef(null);"""
ref_new = """  const loaderRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const mouthRef = useRef(null);"""
role_code = role_code.replace(ref_old, ref_new)

anim_old = """        // Small minimalist loader pulsing animation
        tl.to(dotRef.current, {
          scale: 1.5,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          repeat: 1,
          yoyo: true
        })
        .to(loaderRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        });"""
anim_new = """        // Cute smiley face animation
        tl.to([leftEyeRef.current, rightEyeRef.current], {
          scaleY: 0.1,
          duration: 0.15,
          repeat: 3,
          yoyo: true,
          transformOrigin: 'center',
          ease: 'power1.inOut'
        })
        .to(mouthRef.current, {
          attr: { d: 'M20 36 Q32 46 44 36' },
          duration: 0.4,
          ease: 'back.out(1.7)'
        }, "-=0.3")
        .to(loaderRef.current, {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          delay: 0.3
        });"""
role_code = role_code.replace(anim_old, anim_new)

html_old = """          {/* Post-login Minimalist Loader */}
          <div ref={loaderRef} style={{ display: isAfterLogin ? 'flex' : 'none', position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>       
             <div ref={dotRef} style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
          </div>"""
html_new = """          {/* Cute Smiley Loader */}
          <div ref={loaderRef} style={{ display: isAfterLogin ? 'flex' : 'none', position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>       
             <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#ffffff" strokeWidth="4"/>
                <path ref={leftEyeRef} d="M22 28 Q22 26 24 26 Q26 26 26 28 Q26 30 24 30 Q22 30 22 28 Z" fill="#ffffff" />
                <path ref={rightEyeRef} d="M38 28 Q38 26 40 26 Q42 26 42 28 Q42 30 40 30 Q38 30 38 28 Z" fill="#ffffff" />
                <path ref={mouthRef} d="M20 40 Q32 50 44 40" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="transparent" />
             </svg>
          </div>"""
role_code = role_code.replace(html_old, html_new)

with open(role_path, "w", encoding="utf-8") as f:
    f.write(role_code)

print("Patch injected flawlessly.")