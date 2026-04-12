import re

role_path = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\RoleTransition.jsx"
with open(role_path, "r", encoding="utf-8") as f:
    role_code = f.read()

# Fix the ReferenceError by adding the SVG
html_old = r'''          \{\/\* Post-login Minimalist Loader \*/\}
          <div ref=\{loaderRef\} style=\{\{ display: isAfterLogin \? 'flex' : 'none', position: 'absolute', alignItems: 'center', justifyContent: 'center' \}\}>.*?</div\>'''

html_new = '''          {/* Cute Smiley Loader */}
          <div ref={loaderRef} style={{ display: isAfterLogin ? 'flex' : 'none', position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>       
             <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="#ffffff" strokeWidth="4"/>
                <path ref={leftEyeRef} d="M22 28 Q22 26 24 26 Q26 26 26 28 Q26 30 24 30 Q22 30 22 28 Z" fill="#ffffff" />
                <path ref={rightEyeRef} d="M38 28 Q38 26 40 26 Q42 26 42 28 Q42 30 40 30 Q38 30 38 28 Z" fill="#ffffff" />
                <path ref={mouthRef} d="M20 40 Q32 50 44 40" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="transparent" />
             </svg>
          </div>'''

role_code = re.sub(html_old, html_new, role_code, flags=re.DOTALL)

with open(role_path, "w", encoding="utf-8") as f:
    f.write(role_code)
