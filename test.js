const fs = require('fs');
const path = 'd:/myProjects/clones/DA_PROJECT(DA_Integration)/officer-dashboard/src/pages/OfficerDashboard.jsx';
let text = fs.readFileSync(path, 'utf8');

const target = \                return (
                  <div key={doc?.id ?? \\\\\\\\-\\\\\\\\} style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '28px', opacity: 0.8 }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '14px' }}>{label}</div>
                        {doc?.extracted_at && <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.05em' }}>UPLOADED {formatDateTime(doc.extracted_at)}</div>}
                        {fieldCount > 0 && <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>{fieldCount} EXTRACTED FIELDS</div>}
                      </div>
                    </div>
                    <button\;

const replacement = \                return (
                  <div key={doc?.id ?? \\\\\\\\-\\\\\\\\} style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '28px', opacity: 0.8 }}>📄</span>
                        <div>
                          <div style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '14px' }}>{label}</div>
                          {doc?.extracted_at && <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', letterSpacing: '0.05em' }}>UPLOADED {formatDateTime(doc.extracted_at)}</div>}
                          {fieldCount > 0 && <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '600', letterSpacing: '0.05em' }}>{fieldCount} EXTRACTED FIELDS</div>}
                        </div>
                      </div>
                      <button\;

if (text.includes(target)) {
  fs.writeFileSync(path, text.replace(target, replacement), 'utf8');
  console.log('First pass success!');
} else {
  console.log('Target not found');
}

