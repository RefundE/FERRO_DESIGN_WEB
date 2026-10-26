# -*- coding: utf-8 -*-
"""
FERRO DESIGN™ — Python Site Generator Interface
Executes canonical generation via node builder.js or direct scripts.
"""

import os
import sys
import json
import subprocess
import shutil

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
CONTENT_FILE = os.path.join(ROOT_DIR, "data", "site-content.json")

def generate_pages(custom_content=None):
    """
    Generates all HTML pages and sitemap.xml.
    Returns list of generated file names.
    """
    if custom_content:
        # Write to temporary file or save directly
        with open(CONTENT_FILE, "w", encoding="utf-8") as f:
            json.dump(custom_content, f, ensure_ascii=False, indent=2)

    # Prefer node builder.js for 100% exact template parity with admin preview
    node_bin = shutil.which("node")
    if node_bin:
        script_path = os.path.join(ROOT_DIR, "builder.js")
        result = subprocess.run([node_bin, script_path], cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8")
        if result.returncode != 0:
            raise RuntimeError(f"builder.js failed: {result.stderr or result.stdout}")
        
        # Read files generated
        with open(CONTENT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        files = ["index.html", "projects.html", "about.html", "sitemap.xml"]
        for p in data.get("projects", []):
            if "filename" in p and p["filename"] not in files:
                files.append(p["filename"])
        return files
    else:
        raise RuntimeError("Node.js runtime not found on system path to execute builder.js.")

if __name__ == "__main__":
    try:
        files = generate_pages()
        print(f"Successfully generated {len(files)} pages:")
        for f in files:
            print(f"  ✓ {f}")
    except Exception as e:
        print(f"Generation error: {e}", file=sys.stderr)
        sys.exit(1)
