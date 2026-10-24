# -*- coding: utf-8 -*-
"""
export_site_content.py
Парсит страницы сайта FERRO DESIGN™ и создает полную базу данных сайта: data/site-content.json
"""

import os
import sys
import re
import json
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding='utf-8')

# 1. Порядок кейсов
ALL_PROJECTS_ORDER = [
    "project-nekrasova.html",
    "project-makarovsky.html",
    "project-ekater-park.html",
    "project-suomen.html",
    "project-nomer-otel.html",
    "project-pub-tagil.html",
    "project-a-frames.html",
    "project-hmao.html",
    "project-sochi-kvartira.html",
    "project-andr-fateevo.html",
    "project-gorbunovo-2fl.html",
    "project-artu-40m2.html",
    "project-kris-ggm.html",
    "project-banniy-kompl.html",
    "project-tagil-sergey.html"
]

HOME_PROJECTS_ORDER = [
    "project-nekrasova.html",
    "project-makarovsky.html",
    "project-nomer-otel.html",
    "project-a-frames.html",
    "project-hmao.html",
    "project-pub-tagil.html"
]

# 2. Словарь привязки названий комнат к префиксам файлов рендеров
ROOM_PREFIX_DICTIONARY = {
    "ГОСТИНАЯ": {"prefix": "living", "id": "room-living", "nav": "Гостиная"},
    "КУХНЯ-ГОСТИНАЯ": {"prefix": "living", "id": "room-living", "nav": "Гостиная"},
    "ГОСТИНАЯ И КУХНЯ": {"prefix": "living", "id": "room-living", "nav": "Гостиная"},
    "ГОСТИНАЯ И СТОЛОВАЯ": {"prefix": "living", "id": "room-living", "nav": "Гостиная"},
    "ГОСТИНАЯ И ЛАУНЖ": {"prefix": "living", "id": "room-lounge", "nav": "Гостиная"},
    "ПРИХОЖАЯ": {"prefix": "hallway", "id": "room-hallway", "nav": "Прихожая"},
    "ХОЛЛ": {"prefix": "hallway", "id": "room-hallway", "nav": "Прихожая"},
    "ХОЛЛ И ПРИХОЖАЯ": {"prefix": "hallway", "id": "room-hallway", "nav": "Прихожая"},
    "ГОСТЕВОЙ САНУЗЕЛ": {"prefix": "guestbath", "id": "room-guest-bath", "nav": "Гостевой санузел"},
    "ВАННАЯ КОМНАТА ПРИ СПАЛЬНЕ ХОЗЯИНА": {"prefix": "masterbath", "id": "room-master-bath", "nav": "Ванная"},
    "МАСТЕР-ВАННАЯ": {"prefix": "masterbath", "id": "room-master-bath", "nav": "Ванная"},
    "ВАННАЯ КОМНАТА": {"prefix": "bath", "id": "room-bath", "nav": "Санузел"},
    "САНУЗЕЛ": {"prefix": "bath", "id": "room-bath", "nav": "Санузел"},
    "САНУЗЛЫ": {"prefix": "bath", "id": "room-bath", "nav": "Санузел"},
    "СПАЛЬНЯ ГЛАВНАЯ": {"prefix": "bedroom", "id": "room-master-bed", "nav": "Спальня"},
    "МАСТЕР-СПАЛЬНЯ": {"prefix": "bedroom", "id": "room-master-bed", "nav": "Спальня"},
    "СПАЛЬНЯ": {"prefix": "bedroom", "id": "room-master-bed", "nav": "Спальня"},
    "ДЕТСКАЯ КОМНАТА": {"prefix": "kids", "id": "room-kids", "nav": "Детская"},
    "ДЕТСКАЯ": {"prefix": "kids", "id": "room-kids", "nav": "Детская"},
    "КАБИНЕТ": {"prefix": "kabinet", "id": "room-kabinet", "nav": "Кабинет"},
    "ПАРНАЯ": {"prefix": "banya", "id": "room-steam", "nav": "Парная"}
}

class CaseBodyParser(HTMLParser):
    def __init__(self, nav_dict):
        super().__init__()
        self.nav_dict = nav_dict
        self.in_project_body = False
        self.rooms = []
        self.current_room = None
        
        self.current_mode = None
        self.diptych_depth = 0
        self.diptych_figs = []
        
        self.in_room_name = False
        self.room_name_text = ""
        
        self.in_figcaption = False
        self.figcaption_text = ""
        self.current_fig_src = None
        self.is_compact = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '').split()
        
        if tag == 'main' and 'project-body' in classes:
            self.in_project_body = True
            return

        if not self.in_project_body:
            return

        if tag == 'div' and 'room-header' in classes:
            r_id = attrs_dict.get('id', '')
            self.current_room = {
                "id": r_id,
                "name": "",
                "nav": self.nav_dict.get(r_id, ""),
                "prefix": "",
                "items": []
            }
            self.rooms.append(self.current_room)
            return

        if tag == 'h2' and 'room-name' in classes:
            self.in_room_name = True
            self.room_name_text = ""
            return

        if tag == 'div' and 'diptych-grid' in classes:
            self.current_mode = 'diptych-grid'
            self.diptych_depth = 1
            self.diptych_figs = []
            return

        if self.current_mode == 'diptych-grid' and tag == 'div':
            self.diptych_depth += 1

        if tag == 'figure':
            if 'media-block' in classes:
                self.current_mode = 'media-block'
                style = attrs_dict.get('style', '')
                self.is_compact = '800px' in style or 'max-width' in style
                self.current_fig_src = None
                self.figcaption_text = ""
            elif self.current_mode == 'diptych-grid':
                self.current_fig_src = None
                self.figcaption_text = ""

        if tag == 'img' and self.current_mode is not None:
            self.current_fig_src = attrs_dict.get('src', '')

        if tag == 'figcaption' and self.current_mode is not None:
            self.in_figcaption = True
            self.figcaption_text = ""

    def handle_data(self, data):
        if self.in_room_name:
            self.room_name_text += data
        elif self.in_figcaption:
            self.figcaption_text += data

    def handle_endtag(self, tag):
        if tag == 'main' and self.in_project_body:
            self.in_project_body = False
            return

        if not self.in_project_body:
            return

        if tag == 'h2' and self.in_room_name:
            self.in_room_name = False
            if self.current_room:
                self.current_room['name'] = self.room_name_text.strip()
                if not self.current_room['nav']:
                    self.current_room['nav'] = self.current_room['name']
            return

        if tag == 'figcaption' and self.in_figcaption:
            self.in_figcaption = False
            return

        if tag == 'figure':
            if self.current_mode == 'media-block':
                if self.current_room and self.current_fig_src:
                    self.current_room['items'].append({
                        "type": "full_compact" if self.is_compact else "full",
                        "src": self.current_fig_src,
                        "cap": self.figcaption_text.strip()
                    })
                self.current_mode = None
            elif self.current_mode == 'diptych-grid':
                if self.current_fig_src:
                    self.diptych_figs.append([self.current_fig_src, self.figcaption_text.strip()])

        if tag == 'div' and self.current_mode == 'diptych-grid':
            self.diptych_depth -= 1
            if self.diptych_depth == 0:
                if self.current_room and len(self.diptych_figs) == 2:
                    self.current_room['items'].append({
                        "type": "diptych",
                        "items": self.diptych_figs
                    })
                self.current_mode = None
                self.diptych_figs = []

def parse_home_content():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # Hero
    hero_title = "FERRO DESIGN"
    hero_desc_m = re.search(r'<p class="hero-description">\s*(.*?)\s*</p>', html, re.DOTALL)
    hero_desc = hero_desc_m.group(1).strip() if hero_desc_m else ""
    hero_desc = re.sub(r'\s+', ' ', hero_desc)

    btn_text_m = re.search(r'<a href="#contact" class="btn-outline-minimal">(.*?)</a>', html)
    btn_text = btn_text_m.group(1).strip() if btn_text_m else "Оставить заявку"

    slides = re.findall(r'<div class="hero-bg-media">\s*(.*?)\s*</div>', html, re.DOTALL)
    slide_imgs = []
    if slides:
        slide_imgs = re.findall(r'<img [^>]*src="([^"]+)"', slides[0])

    # Services
    services = []
    sec_m = re.search(r'<section id="services"[^>]*>(.*?)</section>', html, re.DOTALL)
    if sec_m:
        sec_html = sec_m.group(1)
        raw_cards = sec_html.split('<div class="service-card">')[1:]
        for rc in raw_cards:
            num_m = re.search(r'<span class="service-num">([^<]+)</span>', rc)
            name_m = re.search(r'<h3 class="service-name">([^<]+)</h3>', rc)
            desc_m = re.search(r'<p class="service-desc">\s*(.*?)\s*</p>', rc, re.DOTALL)
            price_m = re.search(r'<div class="service-price">([^<]+)</div>', rc)
            services.append({
                "num": num_m.group(1).strip() if num_m else "",
                "name": name_m.group(1).strip() if name_m else "",
                "desc": re.sub(r'\s+', ' ', desc_m.group(1).strip()) if desc_m else "",
                "price": price_m.group(1).strip() if price_m else ""
            })

    # About section
    manifesto_m = re.search(r'<p class="about-manifesto">\s*(.*?)\s*</p>', html, re.DOTALL)
    manifesto = re.sub(r'\s+', ' ', manifesto_m.group(1).strip()) if manifesto_m else ""

    stats = []
    stat_items = re.findall(r'<div class="stat-item">\s*(.*?)\s*</div>', html, re.DOTALL)
    for si in stat_items:
        num_m = re.search(r'<span class="stat-number"([^>]*)>(.*?)</span>', si)
        label_m = re.search(r'<span class="stat-label">(.*?)</span>', si)
        attrs = num_m.group(1) if num_m else ""
        target_m = re.search(r'data-target="([^"]+)"', attrs)
        suffix_m = re.search(r'data-suffix="([^"]*)"', attrs)
        format_m = re.search(r'data-format="([^"]*)"', attrs)
        
        target_val = int(target_m.group(1)) if target_m and target_m.group(1).isdigit() else (target_m.group(1) if target_m else 0)
        stats.append({
            "target": target_val,
            "suffix": suffix_m.group(1) if suffix_m else "",
            "format": format_m.group(1) if format_m else "",
            "label": label_m.group(1).strip() if label_m else ""
        })

    # Contacts
    intro_m = re.search(r'<p class="contact-intro">\s*(.*?)\s*</p>', html, re.DOTALL)
    contact_intro = re.sub(r'\s+', ' ', intro_m.group(1).strip()) if intro_m else ""

    loc_m = re.search(r'<span class="detail-label">Локация</span>\s*<span class="detail-val">(.*?)</span>', html)
    location = loc_m.group(1).strip() if loc_m else "Екатеринбург, ул. Розы Люксембург, 17"

    phone_m = re.search(r'<a href="(tel:[^"]+)" class="detail-val">(.*?)</a>', html)
    phone_href = phone_m.group(1).strip() if phone_m else "tel:+79634426192"
    phone_text = phone_m.group(2).strip() if phone_m else "+7 (963) 442-61-92"

    email_m = re.search(r'<a href="mailto:([^"]+)" class="detail-val">(.*?)</a>', html)
    email = email_m.group(1).strip() if email_m else "artem1-nt@mail.ru"

    return {
        "hero": {
            "title": hero_title,
            "description": hero_desc,
            "btnText": btn_text,
            "slides": slide_imgs
        },
        "services": services,
        "aboutSection": {
            "manifesto": manifesto,
            "stats": stats
        },
        "contacts": {
            "intro": contact_intro,
            "location": location,
            "phone": phone_text,
            "phoneHref": phone_href,
            "email": email
        }
    }

def parse_about_page():
    with open('about.html', 'r', encoding='utf-8') as f:
        html = f.read()

    title_m = re.search(r'<h1 class="about-page-title">(.*?)</h1>', html)
    title = title_m.group(1).strip() if title_m else "О студии FERRO DESIGN™"

    lead_m = re.search(r'<p class="about-page-lead">\s*(.*?)\s*</p>', html, re.DOTALL)
    lead = re.sub(r'\s+', ' ', lead_m.group(1).strip()) if lead_m else ""

    badge_m = re.search(r'<div class="about-chief-badge">\s*(.*?)\s*</div>', html, re.DOTALL)
    chief_badge_raw = badge_m.group(1).strip() if badge_m else "<span>ГЛАВНЫЙ ДИЗАЙНЕР:</span> АРТЕМ МАРЧЕНКО"
    chief_badge = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', chief_badge_raw)).strip()

    # Steps
    steps = []
    raw_steps = html.split('<div class="design-step-card">')[1:]
    for rs in raw_steps:
        num_m = re.search(r'<span class="step-num">([^<]+)</span>', rs)
        t_m = re.search(r'<h3 class="step-title">([^<]+)</h3>', rs)
        desc_m = re.search(r'<p class="step-text">\s*(.*?)\s*</p>', rs, re.DOTALL)
        steps.append({
            "num": num_m.group(1).strip() if num_m else "",
            "title": t_m.group(1).strip() if t_m else "",
            "text": re.sub(r'\s+', ' ', desc_m.group(1).strip()) if desc_m else ""
        })

    # supervisionHtml & geoHtml
    sup_m = re.search(r'<h2 class="about-block-title">Авторский надзор и комплектация</h2>\s*<div class="geo-info-card">(.*?)</div>\s*</div>', html, re.DOTALL)
    supervision_html = sup_m.group(1).strip() if sup_m else ""

    geo_m = re.search(r'<h2 class="about-block-title">География проектов</h2>\s*<div class="geo-info-card">(.*?)</div>\s*</div>', html, re.DOTALL)
    geo_html = geo_m.group(1).strip() if geo_m else ""

    # FAQ
    faq = []
    faq_items = re.findall(r'<details class="faq-item">\s*<summary class="faq-question">([^<]+)</summary>\s*<p class="faq-answer">\s*(.*?)\s*</p>\s*</details>', html, re.DOTALL)
    for q, a in faq_items:
        faq.append({
            "question": q.strip(),
            "answer": re.sub(r'\s+', ' ', a.strip())
        })

    return {
        "title": title,
        "lead": lead,
        "chiefBadge": chief_badge,
        "steps": steps,
        "supervisionHtml": supervision_html,
        "geoHtml": geo_html,
        "faq": faq
    }

def parse_map_projects():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    map_match = re.search(r'const projects = \[(.*?)\];\s*const popupCard', html, re.DOTALL)
    if not map_match:
        return {}

    map_code = map_match.group(1)
    proj_blocks = re.findall(r'\{([^{}]+)\}', map_code)
    map_projects = {}
    for block in proj_blocks:
        id_m = re.search(r"id:\s*'([^']+)'", block)
        coords_m = re.search(r"coords:\s*\[([\d\.]+),\s*([\d\.]+)\]", block)
        city_m = re.search(r"city:\s*'([^']+)'", block)
        title_m = re.search(r"title:\s*'([^']+)'", block)
        type_m = re.search(r"type:\s*'([^']+)'", block)
        area_m = re.search(r"area:\s*'([^']+)'", block)
        img_m = re.search(r"img:\s*'([^']+)'", block)
        link_m = re.search(r"link:\s*'([^']+)'", block)

        if link_m:
            link = link_m.group(1)
            map_projects[link] = {
                "id": id_m.group(1) if id_m else "",
                "coords": [float(coords_m.group(1)), float(coords_m.group(2))] if coords_m else [],
                "mapCity": city_m.group(1) if city_m else "",
                "mapTitle": title_m.group(1) if title_m else "",
                "mapType": type_m.group(1) if type_m else "",
                "mapArea": area_m.group(1) if area_m else "",
                "mapImg": img_m.group(1) if img_m else ""
            }

    return map_projects

def parse_catalog_projects():
    with open('projects.html', 'r', encoding='utf-8') as f:
        html = f.read()

    cards = re.findall(r'<a href="([^"]+)" class="project-card hw-card" data-category="([^"]+)" data-area="([^"]+)">\s*(.*?)\s*</a>', html, re.DOTALL)
    catalog = {}
    for link, cat, area_str, card_html in cards:
        img_m = re.search(r'<img [^>]*src="([^"]+)"', card_html)
        badge_m = re.search(r'<span class="glass-badge">([^<]+)</span>', card_html)
        title_m = re.search(r'<h3 class="card-project-title">([^<]+)</h3>', card_html)
        meta_m = re.search(r'<span class="card-project-meta">([^<]+)</span>', card_html)

        city = ""
        meta_area = ""
        if meta_m:
            meta_text = meta_m.group(1).strip()
            if '·' in meta_text:
                parts = meta_text.split('·')
                city = parts[0].strip()
                meta_area = parts[1].strip()

        catalog[link] = {
            "filterCategory": cat.strip(),
            "dataArea": int(area_str.strip()) if area_str.strip().isdigit() else area_str.strip(),
            "cardImage": img_m.group(1).strip() if img_m else "",
            "badgeLabel": badge_m.group(1).strip() if badge_m else "",
            "cardTitle": title_m.group(1).strip() if title_m else "",
            "cardCity": city,
            "cardMeta": meta_m.group(1).strip() if meta_m else ""
        }

    return catalog

def parse_home_peek_images():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    cards = re.findall(r'<a href="(project-[^"]+)"[^>]*>.*?<img [^>]*src="([^"]+)"', html, re.DOTALL)
    peek_map = {}
    for link, src in cards:
        if link not in peek_map:
            peek_map[link] = src
    return peek_map

def parse_case_study(filename, map_info, catalog_info, home_peek_src):
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # Basic metadata
    desc_m = re.search(r'<meta name="description" content="([^"]+)"', html)
    meta_desc = desc_m.group(1).strip() if desc_m else ""

    og_m = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    og_image = og_m.group(1).strip() if og_m else ""

    title_m = re.search(r'<h1 class="project-title">(.*?)</h1>', html)
    title = title_m.group(1).strip() if title_m else catalog_info.get("cardTitle", "")

    # Hero backgrounds
    intro_bg_m = re.search(r'<div class="project-intro-bg">(.*?)</div>', html, re.DOTALL)
    hero_day = None
    hero_night = None
    if intro_bg_m:
        bg_html = intro_bg_m.group(1)
        day_m = re.search(r'<img [^>]*class="[^"]*hero-bg-day[^"]*"[^>]*src="([^"]+)"', bg_html)
        if not day_m:
            day_m = re.search(r'<img [^>]*src="([^"]+)"[^>]*class="[^"]*hero-bg-day[^"]*"', bg_html)
        
        night_m = re.search(r'<img [^>]*class="[^"]*hero-bg-night[^"]*"[^>]*src="([^"]+)"', bg_html)
        if not night_m:
            night_m = re.search(r'<img [^>]*src="([^"]+)"[^>]*class="[^"]*hero-bg-night[^"]*"', bg_html)

        if day_m:
            hero_day = day_m.group(1).strip()
        else:
            first_m = re.search(r'<img [^>]*src="([^"]+)"', bg_html)
            if first_m:
                hero_day = first_m.group(1).strip()

        if night_m:
            hero_night = night_m.group(1).strip()

    # Specs
    specs_m = re.search(r'<div class="project-yodezeen-specs">(.*?)</div>\s*</div>\s*</div>\s*</section>', html, re.DOTALL)
    city = ""
    area_num = 0
    specs_category = ""
    year = "2026"

    if specs_m:
        sp_html = specs_m.group(1)
        c_m = re.search(r'<span class="specs-label">Город</span>\s*<span class="specs-val">([^<]+)</span>', sp_html)
        city = c_m.group(1).strip() if c_m else catalog_info.get("cardCity", "")

        a_m = re.search(r'<span class="specs-label">Площадь</span>\s*<span class="specs-val">([^<]+)</span>', sp_html)
        if a_m:
            a_val = a_m.group(1).strip()
            digits = re.search(r'\d+', a_val)
            area_num = int(digits.group(0)) if digits else catalog_info.get("dataArea", 0)
        else:
            area_num = catalog_info.get("dataArea", 0)

        cat_m = re.search(r'<span class="specs-label">Категория</span>\s*<span class="specs-val">([^<]+)</span>', sp_html)
        specs_category = cat_m.group(1).strip() if cat_m else ""

        y_m = re.search(r'<span class="specs-label">Год[^<]*</span>\s*<span class="specs-val">([^<]+)</span>', sp_html)
        year = y_m.group(1).strip() if y_m else "2026"
    else:
        city = catalog_info.get("cardCity", "")
        area_num = catalog_info.get("dataArea", 0)

    # Category normalization check
    filter_category = catalog_info.get("filterCategory", "")
    badge_label = catalog_info.get("badgeLabel", "")
    if not specs_category:
        if filter_category == 'flats':
            specs_category = "Квартира"
        elif filter_category == 'houses':
            specs_category = "Загородный дом"
        elif filter_category == 'commercial':
            specs_category = "Коммерческий объект"

    # Image folder detection
    folder_match = re.findall(r'images/([A-Za-z0-9_]+)/', html)
    valid_folders = [fld for fld in folder_match if fld not in ('COVER_MAIN', 'LOGO_SOCIALS')]
    folder = valid_folders[0] if valid_folders else ""

    # Parse rooms and items using robust HTMLParser
    nav_dict = dict(re.findall(r'<a href="#([^"]+)"[^>]*>([^<]+)</a>', html))
    parser = CaseBodyParser(nav_dict)
    parser.feed(html)

    for r in parser.rooms:
        r_name_clean = r["name"].strip()
        if r_name_clean in ROOM_PREFIX_DICTIONARY:
            r["prefix"] = ROOM_PREFIX_DICTIONARY[r_name_clean]["prefix"]
        else:
            first_img = ""
            if r["items"]:
                it = r["items"][0]
                if it["type"] in ("full", "full_compact"):
                    first_img = it["src"]
                elif it["type"] == "diptych":
                    first_img = it["items"][0][0]
            fname = first_img.split('/')[-1] if first_img else ""
            m = re.match(r'([A-Za-z_]+?)_?\d+', fname)
            r["prefix"] = m.group(1).rstrip('_') if m else "room"

    # Project ID
    proj_id = map_info.get("id") or filename.replace("project-", "").replace(".html", "")

    return {
        "id": proj_id,
        "filename": filename,
        "folder": folder,
        "title": title,
        "cardTitle": catalog_info.get("cardTitle", title),
        "metaDesc": meta_desc,
        "ogImage": og_image,
        "heroDay": hero_day,
        "heroNight": hero_night,
        "cardImage": catalog_info.get("cardImage", hero_day),
        "homePeekImage": home_peek_src,
        "city": city,
        "cardCity": catalog_info.get("cardCity", city),
        "mapCity": map_info.get("mapCity", city),
        "coords": map_info.get("coords", []),
        "specsCategory": specs_category,
        "filterCategory": filter_category,
        "badgeLabel": badge_label,
        "area": area_num,
        "year": year,
        "rooms": parser.rooms
    }

def main():
    print("=" * 60)
    print("FERRO DESIGN™ — SITE CONTENT DATABASE EXPORTER")
    print("=" * 60)

    print("\n1. Parsing index.html home content...")
    home_data = parse_home_content()
    print(f"   Hero slides: {len(home_data['hero']['slides'])}")
    print(f"   Services: {len(home_data['services'])}")
    print(f"   Stats: {len(home_data['aboutSection']['stats'])}")
    print(f"   Location: {home_data['contacts']['location']}")

    print("\n2. Parsing about.html content...")
    about_data = parse_about_page()
    print(f"   Title: {about_data['title']}")
    print(f"   Steps: {len(about_data['steps'])}")
    print(f"   FAQ items: {len(about_data['faq'])}")

    print("\n3. Parsing projects from map & catalog...")
    map_projects = parse_map_projects()
    print(f"   Projects on map: {len(map_projects)}")
    catalog_projects = parse_catalog_projects()
    print(f"   Projects in catalog: {len(catalog_projects)}")
    home_peeks = parse_home_peek_images()
    print(f"   Projects on home page: {len(home_peeks)}")

    print("\n4. Parsing all 15 project case studies...")
    projects = []
    total_rooms = 0
    total_items = 0

    for filename in ALL_PROJECTS_ORDER:
        map_info = map_projects.get(filename, {})
        catalog_info = catalog_projects.get(filename, {})
        home_peek_src = home_peeks.get(filename, None)

        p_data = parse_case_study(filename, map_info, catalog_info, home_peek_src)
        projects.append(p_data)

        room_cnt = len(p_data["rooms"])
        item_cnt = sum(len(r["items"]) for r in p_data["rooms"])
        total_rooms += room_cnt
        total_items += item_cnt

        print(f"   ✓ {filename:<26} -> {p_data['title']:<36} | {p_data['specsCategory']:<18} | {p_data['area']:>3} м² | {room_cnt:>2} комнат | {item_cnt:>2} блоков")

    print(f"\nTotal parsed: {len(projects)} projects, {total_rooms} rooms, {total_items} render blocks.")

    # Structure of site-content.json
    site_content = {
        "home": home_data,
        "aboutPage": about_data,
        "homeProjectsOrder": HOME_PROJECTS_ORDER,
        "allProjectsOrder": ALL_PROJECTS_ORDER,
        "roomPrefixDictionary": ROOM_PREFIX_DICTIONARY,
        "projects": projects
    }

    # Save to data/site-content.json
    os.makedirs('data', exist_ok=True)
    output_path = os.path.join('data', 'site-content.json')

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(site_content, f, ensure_ascii=False, indent=2)

    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"\n✓ Successfully exported site database to '{output_path}' ({file_size_kb:.1f} KB).")

    # Verify JSON integrity
    with open(output_path, 'r', encoding='utf-8') as f:
        loaded = json.load(f)
    assert len(loaded["projects"]) == 15, "Expected 15 projects"
    assert len(loaded["homeProjectsOrder"]) == 6, "Expected 6 home projects"
    assert len(loaded["allProjectsOrder"]) == 15, "Expected 15 all projects"
    assert len(loaded["aboutPage"]["faq"]) == 6, "Expected 6 FAQ items"
    assert len(loaded["home"]["services"]) == 3, "Expected 3 services"
    assert len(loaded["home"]["aboutSection"]["stats"]) == 4, "Expected 4 stats counters"
    print("✓ All validation assertions passed flawlessly!")

if __name__ == '__main__':
    main()
