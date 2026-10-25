# -*- coding: utf-8 -*-
import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

cases_order = [
    ("project-nekrasova.html", "project-makarovsky.html", "ЖК «Макаровский»"),
    ("project-makarovsky.html", "project-ekater-park.html", "ЖК «Екатерининский парк»"),
    ("project-ekater-park.html", "project-suomen.html", "ЖК «Suomen Ranta»"),
    ("project-suomen.html", "project-nomer-otel.html", "Отель «Номерной фонд»"),
    ("project-nomer-otel.html", "project-pub-tagil.html", "Гастропаб в Нижнем Тагиле"),
    ("project-pub-tagil.html", "project-a-frames.html", "Комплекс A-Frame домов"),
    ("project-a-frames.html", "project-hmao.html", "Частная резиденция ХМАО"),
    ("project-hmao.html", "project-sochi-kvartira.html", "Апартаменты в Сочи"),
    ("project-sochi-kvartira.html", "project-andr-fateevo.html", "Коттедж в Фотеево"),
    ("project-andr-fateevo.html", "project-gorbunovo-2fl.html", "Дом в Горбуново"),
    ("project-gorbunovo-2fl.html", "project-artu-40m2.html", "Апартаменты в городе Екатеринбург"),
    ("project-artu-40m2.html", "project-kris-ggm.html", "Частная резиденция в Нижнем Тагиле"),
    ("project-kris-ggm.html", "project-banniy-kompl.html", "Банный комплекс"),
    ("project-banniy-kompl.html", "project-tagil-sergey.html", "Загородный дом в Нижнем Тагиле"),
    ("project-tagil-sergey.html", "project-nekrasova.html", "ЖК «На Некрасова»"),
]

all_passed = True

for cur_file, expected_next, expected_title in cases_order:
    print(f"Checking {cur_file}...")
    if not os.path.exists(cur_file):
        print(f"  [ERROR] File {cur_file} does not exist!")
        all_passed = False
        continue

    content = open(cur_file, encoding='utf-8').read()

    # 1. No inline style
    # Note: style="max-width:..." is allowed on figures, but not <style> tags
    if "<style>" in content or "<style " in content:
        print(f"  [ERROR] Inline <style> tag found in {cur_file}")
        all_passed = False

    # 2. Header
    if "class=\"glass-header\"" not in content or "На главную" not in content or "Все проекты" not in content:
        print(f"  [ERROR] glass-header invalid in {cur_file}")
        all_passed = False

    header_m = re.search(r'<header class="glass-header">.*?</header>', content, re.DOTALL)
    if header_m:
        if "svg" in header_m.group(0).lower() or "→" in header_m.group(0) or "&rarr;" in header_m.group(0):
            print(f"  [ERROR] Arrow found in glass-header in {cur_file}")
            all_passed = False

    # 3. Intro specs
    if "project-yodezeen-specs" not in content:
        print(f"  [ERROR] project-yodezeen-specs missing in {cur_file}")
        all_passed = False

    # 4. Rooms and Room Nav
    room_ids = re.findall(r'<div class="room-header"\s+id="([^"]+)">', content)
    nav_hrefs = re.findall(r'<a href="#([^"]+)"\s+class="hw-room-link[^"]*">', content)
    if not room_ids:
        print(f"  [ERROR] No room-header IDs in {cur_file}")
        all_passed = False
    elif room_ids != nav_hrefs:
        print(f"  [ERROR] Room IDs {room_ids} != Nav Hrefs {nav_hrefs} in {cur_file}")
        all_passed = False

    # 5. Next case bar
    next_match = re.search(r'<div class="next-case-bar">.*?<a href="([^"]+)".*?<span>(.*?)</span>', content, re.DOTALL)
    if not next_match:
        print(f"  [ERROR] next-case-bar not found in {cur_file}")
        all_passed = False
    else:
        found_next = next_match.group(1).strip()
        found_title = next_match.group(2).strip()
        if found_next != expected_next:
            print(f"  [ERROR] Expected next {expected_next}, got {found_next} in {cur_file}")
            all_passed = False
        if found_title != expected_title:
            print(f"  [ERROR] Expected next title {expected_title}, got {found_title} in {cur_file}")
            all_passed = False

    # 6. Contact section & direct contacts (152-ФЗ zero-data-collection compliance)
    for elem in ['id="contact"', 'contact-section', 'contact-direct-card', 'direct-btn-telegram', 'direct-btn-max', 'direct-btn-phone']:
        if elem not in content:
            print(f"  [ERROR] Missing direct contact element {elem} in {cur_file}")
            all_passed = False
    for forbidden in ['<form', 'name="website"', 'name="name"', 'btn-submit']:
        if forbidden in content:
            print(f"  [ERROR] Forbidden form element {forbidden} found in {cur_file} (violates zero data collection policy)")
            all_passed = False

    # 7. Footer
    for foot_elem in ['site-footer', 'footer-socials', 'footer-brand-banner', 'footer-bottom-bar', 'FERRO DESIGN™']:
        if foot_elem not in content:
            print(f"  [ERROR] Missing footer element {foot_elem} in {cur_file}")
            all_passed = False

    # 8. Script and CSS
    if 'style.css?v=2' not in content:
        print(f"  [ERROR] Missing style.css?v=2 in {cur_file}")
        all_passed = False
    if 'script.js?v=2' not in content:
        print(f"  [ERROR] Missing script.js?v=2 in {cur_file}")
        all_passed = False

    # 9. OG image absolute
    og_m = re.search(r'<meta property="og:image" content="([^"]+)">', content)
    if not og_m or not og_m.group(1).startswith("https://ferro-design.ru/"):
        print(f"  [ERROR] og:image not absolute in {cur_file}: {og_m.group(1) if og_m else 'none'}")
        all_passed = False

    # 10. Check all referenced images on disk
    img_srcs = re.findall(r'<img[^>]+src="([^"]+)"', content)
    for src in img_srcs:
        if src.startswith("http"):
            continue
        src_clean = src.split('?')[0]
        if not os.path.exists(src_clean):
            print(f"  [ERROR] Image not found on disk in {cur_file}: {src_clean}")
            all_passed = False

if all_passed:
    print(f"\nSUCCESS: All {len(cases_order)} project case pages are strictly standardized and verified!")
else:
    print("\nFAIL: Errors were detected.")
