import os
import re
from PIL import Image

IMAGE_DIR = 'images'
SKIP_FOLDERS = {'LOGO_SOCIALS', 'LOGO_SVG'}

converted = {}

for root, dirs, files in os.walk(IMAGE_DIR):
    if any(skip in root for skip in SKIP_FOLDERS):
        continue
    for file in files:
        if file.lower() in {'logo.png', 'podpis.png'}:
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
                    im.save(webp_path, 'WEBP', quality=84, method=6)
                rel_old = src_path.replace('\\', '/')
                rel_new = webp_path.replace('\\', '/')
                converted[rel_old] = rel_new
                print(f'Converted: {rel_old} -> {rel_new}')
            except Exception as e:
                print(f'Error converting {src_path}: {e}')

# Обновляем ссылки во всех HTML, CSS и JS файлах
target_files = [f for f in os.listdir('.') if f.endswith(('.html', '.css', '.js'))]
for tf in target_files:
    with open(tf, 'r', encoding='utf-8') as f:
        content = f.read()
    # Заменяем расширения .jpg / .JPG внутри путей images/...
    updated = re.sub(
        r'(images/[A-Za-z0-9_/.-]+?)\.(jpg|jpeg|JPG|JPEG)',
        r'\1.webp',
        content
    )
    if updated != content:
        with open(tf, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f'Updated image paths to .webp in {tf}')

print(f'Done! Successfully converted {len(converted)} images to WebP.')
