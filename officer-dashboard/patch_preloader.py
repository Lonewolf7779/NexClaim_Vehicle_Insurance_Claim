import re

# 1. Update App.jsx to render App content underneath Preloader
with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "r") as f:
    app_text = f.read()

# Replace the conditional return
old_load = """  if (loading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }

  return (
    <div className="app">"""

new_load = """  return (
    <>
      {loading && <Preloader onComplete={handlePreloaderComplete} />}
      <div className="app" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.8s ease' }}>"""

if old_load in app_text:
    app_text = app_text.replace(old_load, new_load)
    # The return in App.jsx needs an extra closing tag for the fragment
    idx = app_text.rfind("</div>")
    if idx != -1:
        app_text = app_text[:idx] + "</div>\n    </>" + app_text[idx+6:]
    with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "w") as f:
        f.write(app_text)
    print("App.jsx patched!")
else:
    # try another way
    old_load = """  if (loading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }

  return (
    <div className="app">"""
    
    app_text = app_text.replace("""  if (loading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }

  return (
    <div className="app">""", """  return (
    <>
      {loading && <Preloader onComplete={handlePreloaderComplete} />}
      <div className="app" style={{ 
        // We ensure it is rendered but we let it reveal or just be underneath
        // actually if it's underneath we don't need opacity 0, we can just let it sit there. 
        // but if we want a lift effect on the dashboard itself? No, the preloader lifts up revealing the dashboard 
      }}>""")
    if "return (\n    <>" in app_text:
         app_text = app_text.replace("</div>\n  )\n}", "</div>\n    </>\n  )\n}")
         with open(r"d:\myProjects\clones\DA_PROJECT(DA_Integration)\officer-dashboard\src\App.jsx", "w") as f:
             f.write(app_text)
         print("App.jsx patched smoothly!")

