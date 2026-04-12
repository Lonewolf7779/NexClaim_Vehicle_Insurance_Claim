import re

with open(r"src\App.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add export default App again if it was removed
if "export default App" not in text:
    text += "\nexport default App;\n"
    with open(r"src\App.jsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Added export default App")
else:
    print("export default App is already there")
