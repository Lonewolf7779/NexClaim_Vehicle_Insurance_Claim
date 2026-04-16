import re

with open('d:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\OfficerDashboard.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to find the specific block starting with 'return (' inside 'documents.map('
pattern = re.compile(r'(return \(\s*)(<div key=\{doc\?\.id \?\? \$\{docType\}-\$\{doc\?\.extracted_at \?\? \'\'\}\}.*?)(                \))', re.DOTALL)

def replacer(match):
    prefix = match.group(1)
    content = match.group(2)
    suffix = match.group(3)
    
    # We want to put a Fragment wrapper around it.
    new_content = '<React.Fragment key={doc?.id ?? ${docType}-}>\n                  ' + content.replace('</div>\n\n                    {fieldCount > 0 && (', '\n                    {fieldCount > 0 && (') + '\n                  </React.Fragment>\n'
    
    # Wait, the </div> we removed closes the Flex row. So we should NOT remove that </div>.
    # Instead, we just wrap it all in a Fragment or parent div.
    
    return prefix + '<div key={doc?.id ?? ${docType}-} style={{ backgroundColor: \'#111\', border: \'1px solid rgba(255,255,255,0.05)\', borderRadius: \'16px\', padding: \'24px\', transition: \'border-color 0.3s\', cursor: \'default\' }} onMouseEnter={e => e.currentTarget.style.borderColor = \'rgba(255,255,255,0.2)\'} onMouseLeave={e => e.currentTarget.style.borderColor = \'rgba(255,255,255,0.05)\'}>\n                    <div style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\' }}>\n' + content.replace('<div key={doc?.id ?? ${docType}-} style={{ backgroundColor: \'#111\', border: \'1px solid rgba(255,255,255,0.05)\', borderRadius: \'16px\', padding: \'24px\', display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', transition: \'border-color 0.3s\', cursor: \'default\' }} onMouseEnter={e => e.currentTarget.style.borderColor = \'rgba(255,255,255,0.2)\'} onMouseLeave={e => e.currentTarget.style.borderColor = \'rgba(255,255,255,0.05)\'}>', '').replace('VIEW\n                      </button>\n                    </div>\n\n                    {fieldCount > 0 && (', 'VIEW\n                      </button>\n                    </div>\n                    </div>\n\n                    {fieldCount > 0 && (') + suffix

# Let's see if that works.
match = pattern.search(text)
if match:
    # Actually just fix it simply
    pass

