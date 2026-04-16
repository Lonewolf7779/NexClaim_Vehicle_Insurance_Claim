import re

with open('d:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\OfficerDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''                  <div key={doc?.id ?? ${docType}-} style={{ backgroundColor: '#111', ''',
'''                  <React.Fragment key={doc?.id ?? ${docType}-}>
                  <div style={{ backgroundColor: '#111', ''')


content = content.replace(
'''                        </div>
                      </div>
                    )}
                  </div>
                )''',
'''                        </div>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                )''')

with open('d:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\OfficerDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
