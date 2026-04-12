import re

filepath = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# I will replace:
#       </RoleTransition>
#
#         <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>

# With just normal div, and I will add </RoleTransition> at the very end before the closing parenthesis.

pattern1 = r'      </RoleTransition>\s*?(<div style=\{\{ position: \'relative\', zIndex: 1, overflow: \'hidden\' \}\}>)'
replacement1 = r'\1'
content = re.sub(pattern1, replacement1, content)

pattern2 = r'          </div>\n        </div>\n      </div>\n    \)\n  \}'
replacement2 = '          </div>\n        </div>\n      </div>\n      </RoleTransition>\n    )\n  }'
content = re.sub(pattern2, replacement2, content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done fixing tags.")