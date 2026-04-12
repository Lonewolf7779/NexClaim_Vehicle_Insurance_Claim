import re

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\App.jsx", "r") as f:
    content = f.read()

# Replace the layout container
old_layout = """      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1c1d20',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
        position: 'relative'
      }}>
        {/* Subtle noise texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.3, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '800px', width: '100%', padding: '0 5vw', display: 'flex', flexDirection: 'column', gap: '8vh', zIndex: 10 }}>"""

new_layout = """      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#1c1d20',
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", "Neue Montreal", Arial, sans-serif',
        position: 'relative'
      }}>
        {/* Left pane: Login form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 5vw', position: 'relative' }}>
          {/* Subtle noise texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', opacity: 0.3, pointerEvents: 'none' }} />

          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8vh', zIndex: 10 }}>"""

content = content.replace(old_layout, new_layout)

# Re-align form and button to standard display (instead of flex-end)
content = content.replace(
    "<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px', alignSelf: 'flex-end' }}>",
    "<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '400px' }}>"
)

content = content.replace(
    "<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>",
    "<div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>"
)

# Add the right pane gradient
close_tags = """              </button>
            </div>
          </form>
        </div>
      </div>
      </RoleTransition>"""

new_close_tags = """              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right pane: Color gradient */}
      <div style={{ 
        flex: 1, 
        background: theme.gradient, 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Inner glow effect utilizing theme accent */}
        <div style={{ 
          position: 'absolute', 
          width: '150%', 
          height: '150%', 
          background: `radial-gradient(circle at center, ${theme.accent} 0%, transparent 60%)`, 
          opacity: 0.15, 
          filter: 'blur(60px)' 
        }} />
      </div>
      
      </div>
      </RoleTransition>"""

content = content.replace(close_tags, new_close_tags)

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\App.jsx", "w") as f:
    f.write(content)

print("Split screen layout patched!")
