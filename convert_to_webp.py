# -*- coding: utf-8 -*-
"""
FERRO DESIGN™ — Скрипт пакетной конвертации изображений в формат WebP
Автоматически находит все .jpg, .jpeg, .png в папке images/ (кроме логотипов),
конвертирует их в WebP (качество 86%, max 2560px) и обновляет пути в HTML, CSS, JS и JSON.
"""

import os
import re
import sys
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

IMAGE_DIR = 'images'
SKIP_FOLDERS = {'LOGO_SOCIALS', 'LOGO_SVG'}
SKIP_FILES = {'logo.png', 'podpis.png', 'favicon.png'}

converted = {}

for root, dirs, files in os.walk(IMAGE_DIR):
    if any(skip in root for skip in SKIP_FOLDERS):
        continue
    for file in files:
        if file.lower() in SKIP_FILES:
            continue
        ext = os.path.splitext(file)[1].lower()
        if ext in {'.jpg', '.jpeg', '.png'}:
            src_path = os.path.join(root, file)
            webp_name = os.path.splitext(file)[0] + '.webp'
            webp_path = os.path.join(root, webp_name)

            try:
                with Image.open(src_path) as im:
                    if im.mode in ('RGBA', 'P'):
                        im = im.convert('RGB')
                    # Ограничиваем сверхбольшие 4K/8K рендеры до 2560px по длинной стороне для мгновенной загрузки
                    if max(im.size) > 2560:
                        im.thumbnail((2560, 2560), Image.Resampling.LANCZOS)
                    im.save(webp_path, 'WEBP', quality=86, method=6)

                rel_old = src_path.replace('\\', '/')
                rel_new = webp_path.replace('\\', '/')
                converted[rel_old] = rel_new
                print(f'Converted: {rel_old} -> {rel_new}')
            except Exception as e:
                print(f'Error converting {src_path}: {e}')

# Обновляем ссылки во всех HTML, CSS, JS файлах и data/site-content.json
target_files = [f for f in os.listdir('.') if f.endswith(('.html', '.css', '.js'))]
if os.path.exists('data/site-content.json'):
    target_files.append('data/site-content.json')

for tf in target_files:
    if not os.path.exists(tf):
        continue
    with open(tf, 'r', encoding='utf-8') as f:
        content = f.read()

    # Заменяем расширения .jpg / .jpeg внутри путей images/...
    updated = re.sub(
        r'(images/[A-Za-z0-9_/.-]+?)\.(jpg|jpeg|JPG|JPEG)',
        r'\1.webp',
        content
    )
    if updated != content:
        with open(tf, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f'Updated image paths to .webp in {tf}')

print(f'\nDone! Successfully processed. Converted {len(converted)} new images to WebP.')
