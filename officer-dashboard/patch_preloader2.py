import re

# Update Preloader.jsx to use the same heavy lift effect + slightly scale up the main app when revealing it 
with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\Preloader.jsx", "r") as f:
    text = f.read()

old_outro = """    // Cinematic Outro
    tl.to(textRef.current, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    .to(preloaderRef.current, {
      y: '-100vh',
      duration: 0.8, // Super smooth, heavy lift
      ease: 'power4.inOut',
      roundProps: 'y'
    }, "-=0.5");"""

new_outro = """    // Cinematic Outro
    tl.to(textRef.current, {
      opacity: 0,
      y: -40,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    .to(preloaderRef.current, {
      y: '-100vh',
      borderBottomLeftRadius: '50% 20vh',
      borderBottomRightRadius: '50% 20vh',
      duration: 1.1, // Smooth heavy lift
      ease: 'power4.inOut'
    }, "-=0.5");"""

text = text.replace(old_outro, new_outro)

with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\Preloader.jsx", "w") as f:
    f.write(text)

# Update App.jsx to render both components so the lift reveals the app, and app smoothly scales in
with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "r") as f:
    app_text = f.read()

# Replace conditionally returning Preloader with rendering them together
old_cond = """  if (loading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }

  return (
    <div className="app">"""

new_cond = """  return (
    <>
      {loading && <Preloader onComplete={handlePreloaderComplete} />}
      <div className="app" style={{
        willChange: 'transform, opacity',
        transform: loading ? 'translateY(10vh) scale(0.95)' : 'translateY(0) scale(1)',
        opacity: loading ? 0.3 : 1,
        transition: 'transform 1.1s cubic-bezier(0.76, 0, 0.24, 1), opacity 1.1s ease',
        transitionDelay: loading ? '0s' : '0.1s' // Slight delay when dropping curtain off
      }}>"""

app_text = app_text.replace(old_cond, new_cond)

# App.jsx needs </Fragment> at the very end
if new_cond in app_text:
    idx = app_text.rfind("</div>\n  )\n}")
    if idx != -1:
        app_text = app_text[:idx] + "</div>\n    </>\n  )\n}"

with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "w") as f:
    f.write(app_text)

print("Preloader patched to Dennis Snellenberg Heavy Lift + Parallax App Reveal.")