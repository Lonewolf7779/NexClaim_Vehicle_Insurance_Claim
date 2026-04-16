import sys
import codecs
import re

path = 'd:/myProjects/clones/DA_PROJECT(DA_Integration)/officer-dashboard/src/pages/OfficerDashboard.jsx'
with codecs.open(path, 'r', 'utf8') as f:
    text = f.read()

# Replace the outer div layout
str_pattern1 = r'''return \(\s*<div key=\{doc\?\.id \?\? \$\{docType\}-\$\{doc\?\.extracted_at \?\? ''\}\}\s+style=\{\{([\s\S]*?)display: 'flex', alignItems: 'center', justifyContent: 'space-between',([\s\S]*?)\}\}\s+onMouseEnter=\{([\s\S]*?)\}\s+onMouseLeave=\{([\s\S]*?)\}>\s+<div style=\{\{ display: 'flex', alignItems: 'center', gap: '16px' \}\}>.*?\n.*?<span.*?>.*?</span>.*?<div.*?>.*?<div.*?\{label\}</div>.*?\{doc\?\.extracted_at &&.*?\}'''

new_repl1 = r'''return (
                  <div key={doc?.id ?? ${docType}-} style={{\1display: 'flex', flexDirection: 'column',\2}} onMouseEnter={\3} onMouseLeave={\4}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '28px', opacity: 0.8 }}>📄</span>
                        <div>
                          <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '14px' }}>{label}</div>
                          {doc?.extracted_at && <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.05em' }}>UPLOADED {formatDateTime(doc.extracted_at)}</div>}'''

text = re.sub(str_pattern1, new_repl1, text)

# Second targeted regex to append the fields UI after the view button
str_pattern2 = r'''VIEW\s*</button>\s*</div>\s*\)'''
new_repl2 = r'''VIEW
                      </button>
                    </div>

                    {fieldCount > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '12px', color: '#fff', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '12px' }}>AI EXTRACTION DATA:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                          {doc.fields.map((f, idx) => (
                            <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                              <div style={{ fontSize: '10px', color: '#10b981', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '700' }}>{f.field_name.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: '500', wordBreak: 'break-word' }}>{f.field_value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )'''

text = re.sub(str_pattern2, new_repl2, text)

with codecs.open(path, 'w', 'utf8') as f:
    f.write(text)

print("regex fix complete")

