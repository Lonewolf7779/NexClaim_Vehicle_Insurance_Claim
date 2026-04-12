import re

filepath = r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'                <button.*?</button>\s*?</form>\s*?</div>\s*?</div>\s*?</div>'

replacement = """                <button
                  type="submit"
                  style={{
                    marginTop: '12px',
                    background: `linear-gradient(120deg, ${theme.accent}, #ffffff10)` ,
                    color: '#0b1021',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '18px 24px',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: theme.glow,
                    fontFamily: '"Space Grotesk", sans-serif'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}
                >
                  Enter
                </button>
              </form>
            </div>
          </div>
        </div>
      </RoleTransition>"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done.")

