import re
import os

base_path = r"c:\Users\prade\OneDrive\Desktop\CODING\WEB DEVELOPMENT\nodejs\nocus\frontend"

files_to_process = [
    {"html": "views/index.html", "css": "assets/css/dashboard.css"},
    {"html": "views/problem.html", "css": "assets/css/editor.css"},
    {"html": "admin/problems-list.html", "css": "assets/css/admin.css"},
    {"html": "admin/problem-form.html", "css": "assets/css/admin.css", "append": True}
]

style_regex = re.compile(r'<style>(.*?)</style>', re.DOTALL)

for item in files_to_process:
    html_path = os.path.join(base_path, item["html"])
    css_path = os.path.join(base_path, item["css"])
    
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    match = style_regex.search(content)
    if match:
        css_content = match.group(1).strip()
        
        mode = "a" if item.get("append") else "w"
        with open(css_path, mode, encoding="utf-8") as f:
            if mode == "a":
                f.write("\n\n/* Extracted from " + item["html"] + " */\n")
            f.write(css_content)
        
        # We DO NOT remove it here yet, because we need to completely rewrite the HTML body anyway.
        # But we will remove the style block to clean up the file for our next steps.
        new_content = content[:match.start()] + content[match.end():]
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Extracted styles from {item['html']} to {item['css']}")
    else:
        print(f"No style tag found in {item['html']}")

