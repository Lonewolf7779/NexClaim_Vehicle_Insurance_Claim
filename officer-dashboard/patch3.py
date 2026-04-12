import re

with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\components\\RoleTransition.jsx", "r") as f:
    text = f.read()

# remove {show && ( and )}
if "{show && (" in text:
    text = text.replace("{show && (", "")
    # the last )} needs to be removed
    idx = text.rfind(")}")
    if idx != -1:
        text = text[:idx] + text[idx+2:]
        with open("D:\\myProjects\\clones\\DA_PROJECT(DA_Integration)\\officer-dashboard\\src\\components\\RoleTransition.jsx", "w") as f:
            f.write(text)
        print("Removed {show && (")
else:
    print("Could not find {show && (")
