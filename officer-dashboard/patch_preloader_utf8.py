import re

with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\Preloader.jsx", "r", encoding="utf-8") as f:
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

with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\components\Preloader.jsx", "w", encoding="utf-8") as f:
    f.write(text)

with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "r", encoding="utf-8") as f:
    app_text = f.read()

# Replace conditionals
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
        transition: 'transform 1.1s cubic-bezier(0.76, 0, 0.24, 1), opacity 1.1s cubic-bezier(0.76, 0, 0.24, 1)'
      }}>"""

if old_cond in app_text:
    app_text = app_text.replace(old_cond, new_cond)
    idx = app_text.rfind("</div>\n  )\n}")
    if idx != -1:
        app_text = app_text[:idx] + "</div>\n    </>\n  )\n}"
    
    with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "w", encoding="utf-8") as f:
        f.write(app_text)
    print("Preloader + App Layout parralax effect successfully patched!")
else:
    print("Could not locate conditional rendering in App.jsx")

