const fs = require('fs');
const path = require('path');

const filePath = 'd:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\pages\\OfficerDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const badPart =                     <button
                      onClick={() => canView && handleViewDocument(doc)}        
                      disabled={!canView}
                      onMouseEnter={canView ? hoverEffect : null}
                      onMouseLeave={canView ? leaveEffect : null}
                      style={{
                        ...btnOutline,
                        padding: '10px 20px',
                        fontSize: '11px',
                        opacity: canView ? 1 : 0.3,
                        cursor: canView ? 'pointer' : 'not-allowed',
                      }}
                    >
                      VIEW
                      </button>
                    </div>

                    {fieldCount > 0 && (;

const goodPart =                     <button
                      onClick={() => canView && handleViewDocument(doc)}        
                      disabled={!canView}
                      onMouseEnter={canView ? hoverEffect : null}
                      onMouseLeave={canView ? leaveEffect : null}
                      style={{
                        ...btnOutline,
                        padding: '10px 20px',
                        fontSize: '11px',
                        opacity: canView ? 1 : 0.3,
                        cursor: canView ? 'pointer' : 'not-allowed',
                      }}
                    >
                      VIEW
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>

                    {fieldCount > 0 && (;

content = content.replace(badPart, goodPart);

// also we need to wrap the whole return inside a div fragment.
const badStart =                 return (
                  <div key={doc?.id;

const goodStart =                 return (
                  <React.Fragment key={doc?.id ?? \\-\\}>
                  <div;

content = content.replace(badStart, goodStart);

// find the end of the return
const badEnd =                     )}
                  </div>
                );

const goodEnd =                     )}
                  </div>
                  </React.Fragment>
                );

content = content.replace(badEnd, goodEnd);

fs.writeFileSync(filePath, content, 'utf8');
console.log('done');
