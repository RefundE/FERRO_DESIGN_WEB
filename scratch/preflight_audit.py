import glob, os, re, sys
from html.parser import HTMLParser
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("FERRO DESIGN™ — COMPREHENSIVE PRE-FLIGHT AUDIT")
print("=" * 60)

html_files = sorted(glob.glob("*.html"))
print(f"Found {len(html_files)} HTML files: {html_files}\n")

errors = []
warnings = []

# --- 1. SITEMAP.XML AUDIT ---
if os.path.exists("sitemap.xml"):
    sitemap_content = open("sitemap.xml", encoding="utf-8").read()
    sitemap_urls = re.findall(r'<loc>(.*?)</loc>', sitemap_content)
    print(f"[SEO] sitemap.xml contains {len(sitemap_urls)} URLs.")
    expected_pages = [
        "https://ferro-design.ru/",
        "https://ferro-design.ru/about.html",
        "https://ferro-design.ru/projects.html",
        "https://ferro-design.ru/privacy.html"
    ] + [f"https://ferro-design.ru/{f}" for f in html_files if f not in ("404.html", "about.html", "projects.html", "privacy.html", "index.html")]
    
    missing_in_sitemap = set(expected_pages) - set(sitemap_urls)
    if missing_in_sitemap:
        warnings.append(f"sitemap.xml is missing URLs: {missing_in_sitemap}")
    else:
        print("[SEO] OK: All production pages are registered in sitemap.xml.")
else:
    errors.append("sitemap.xml is missing!")

# --- 2. ROBOTS.TXT AUDIT ---
if os.path.exists("robots.txt"):
    robots = open("robots.txt", encoding="utf-8").read()
    if "Sitemap: https://ferro-design.ru/sitemap.xml" in robots:
        print("[SEO] OK: robots.txt is present and points to sitemap.xml.")
    else:
        warnings.append("robots.txt does not link to sitemap.xml")
else:
    errors.append("robots.txt is missing!")

# --- 3. CSS SYNTAX & BALANCING ---
if os.path.exists("style.css"):
    css_content = open("style.css", encoding="utf-8").read()
    open_b = css_content.count('{')
    close_b = css_content.count('}')
    if open_b == close_b:
        print(f"[CSS] OK: style.css is balanced ({open_b} {{ vs {close_b} }}).")
    else:
        errors.append(f"style.css brace mismatch: {open_b} open vs {close_b} close!")
else:
    errors.append("style.css is missing!")

# --- 4. AUDIT EVERY HTML FILE ---
class PageAuditor(HTMLParser):
    def __init__(self, filepath):
        super().__init__()
        self.filepath = filepath
        self.links = []
        self.images = []
        self.scripts = []
        self.stylesheets = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if "id" in attrs_dict:
            self.ids.add(attrs_dict["id"])

        if tag == "a" and "href" in attrs_dict:
            self.links.append((attrs_dict["href"], self.getpos()))
        elif tag == "img" and "src" in attrs_dict:
            self.images.append((attrs_dict["src"], attrs_dict.get("alt", None), self.getpos()))
        elif tag == "script" and "src" in attrs_dict:
            self.scripts.append((attrs_dict["src"], self.getpos()))
        elif tag == "link" and attrs_dict.get("rel") == "stylesheet" and "href" in attrs_dict:
            self.stylesheets.append((attrs_dict["href"], self.getpos()))

parsed_pages = {}
for h in html_files:
    auditor = PageAuditor(h)
    with open(h, encoding="utf-8") as f:
        content = f.read()
    auditor.feed(content)
    parsed_pages[h] = (auditor, content)

print("\n--- CHECKING IMAGES & ASSETS ---")
for h, (auditor, content) in parsed_pages.items():
    # Check images
    for src, alt, pos in auditor.images:
        # Ignore external or data URLs
        if src.startswith("http") or src.startswith("data:"):
            continue
        clean_src = src.split("?")[0].split("#")[0]
        if not os.path.exists(clean_src):
            errors.append(f"Broken image in {h} line {pos[0]}: '{clean_src}' not found on disk!")
        if alt is None or alt.strip() == "":
            warnings.append(f"Missing alt on image in {h} line {pos[0]}: '{src}'")

    # Check scripts
    for src, pos in auditor.scripts:
        clean_src = src.split("?")[0]
        if not src.startswith("http") and not os.path.exists(clean_src):
            errors.append(f"Broken script in {h} line {pos[0]}: '{clean_src}' not found!")

    # Check stylesheets
    for href, pos in auditor.stylesheets:
        clean_href = href.split("?")[0]
        if not href.startswith("http") and not os.path.exists(clean_href):
            errors.append(f"Broken stylesheet in {h} line {pos[0]}: '{clean_href}' not found!")

print("\n--- CHECKING INTERNAL LINKS & ANCHORS ---")
for h, (auditor, content) in parsed_pages.items():
    for href, pos in auditor.links:
        if href.startswith("mailto:") or href.startswith("tel:") or href.startswith("http") or href == "javascript:void(0)":
            continue
        parsed = urlparse(href)
        path = parsed.path
        fragment = parsed.fragment

        target_file = path if path else h
        if target_file not in parsed_pages:
            errors.append(f"Broken link in {h} line {pos[0]}: target page '{target_file}' does not exist!")
        else:
            if fragment:
                target_auditor, _ = parsed_pages[target_file]
                if fragment not in target_auditor.ids:
                    # Non-fatal warning if it's dynamic anchor, but let's check
                    warnings.append(f"Anchor #{fragment} linked from {h} line {pos[0]} not found in {target_file} ids: {sorted(list(target_auditor.ids))[:5]}...")

print("\n--- CHECKING CONTACT FORMS ---")
for h, (auditor, content) in parsed_pages.items():
    if "contact-form" in content:
        # Check required fields
        if 'name="website"' not in content:
            warnings.append(f"Anti-spam honeypot (name='website') missing in form on {h}")
        if 'name="name"' not in content:
            errors.append(f"name='name' field missing in form on {h}")
        if 'name="contact"' not in content:
            errors.append(f"name='contact' field missing in form on {h}")

print("\n--- CHECKING TITLES & BRANDING ---")
for h, (auditor, content) in parsed_pages.items():
    title_match = re.search(r'<title>(.*?)</title>', content)
    if not title_match:
        errors.append(f"Missing <title> tag in {h}!")
    else:
        title = title_match.group(1)
        if "FERRO DESIGN" not in title:
            warnings.append(f"Branding 'FERRO DESIGN' not in <title> of {h}: '{title}'")

print("\n" + "=" * 60)
print(f"AUDIT SUMMARY: {len(errors)} ERRORS, {len(warnings)} WARNINGS")
print("=" * 60)

if errors:
    print("\n[ERRORS]:")
    for e in errors:
        print(f"  ❌ {e}")

if warnings:
    print("\n[WARNINGS]:")
    for w in warnings:
        print(f"  ⚠️ {w}")

if not errors and not warnings:
    print("\n✨ ALL CHECKS PASSED PERFECTLY WITH ZERO WARNINGS OR ERRORS! ✨")
