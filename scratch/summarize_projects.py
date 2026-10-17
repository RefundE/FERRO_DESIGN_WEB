import os
import re

projects = [
    ('project-ekater-park.html', 'EKATER_PARK'),
    ('project-suomen.html', 'SUOMEN'),
    ('project-nomer-otel.html', 'NOMER_OTEL'),
    ('project-pub-tagil.html', 'PUB_TAGIL'),
    ('project-a-frames.html', 'A_FRAMES'),
    ('project-hmao.html', 'HMAO'),
    ('project-sochi-kvartira.html', 'SOCHI_KVARTIRA'),
    ('project-andr-fateevo.html', 'ANDR_FATEEVO'),
    ('project-gorbunovo-2fl.html', 'GORBUNOVO_2FL'),
    ('project-artu-40m2.html', 'ARTU_40M2'),
    ('project-kris-ggm.html', 'KRIS_GGM'),
    ('project-banniy-kompl.html', 'BANNIY_KOMPL')
]

with open('scratch/project_summary.txt', 'w', encoding='utf-8') as out:
    for filename, folder in projects:
        out.write(f'{"="*20} {filename} (Folder: {folder}) {"="*20}\n')
        img_folder = os.path.join('images', folder)
        disk_images = sorted(os.listdir(img_folder)) if os.path.exists(img_folder) else []
        out.write(f'Disk images ({len(disk_images)}): {", ".join(disk_images)}\n\n')
        
        if os.path.exists(filename):
            html = open(filename, encoding='utf-8').read()
            # Find all img src in html
            html_imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
            # Find figcaptions
            figures = re.findall(r'<figure[^>]*>(.*?)</figure>', html, re.DOTALL)
            out.write(f'HTML figures count: {len(figures)}\n')
            for fig in figures:
                src = re.search(r'src=["\']([^"\']+)["\']', fig)
                cap = re.search(r'<figcaption>(.*?)</figcaption>', fig)
                s = src.group(1) if src else 'no-src'
                c = cap.group(1) if cap else 'no-cap'
                out.write(f'   {s} -> {c}\n')
            
            # Find statements
            statements = re.findall(r'<div class="statement-block">(.*?)</div>', html, re.DOTALL)
            if statements:
                out.write(f'Statements: {len(statements)}\n')
                for st in statements:
                    tag = re.search(r'<span class="statement-tag">(.*?)</span>', st)
                    txt = re.search(r'<p class="statement-text">(.*?)</p>', st)
                    out.write(f'   Tag: {tag.group(1) if tag else ""}; Text: {txt.group(1).strip() if txt else ""}\n')
        out.write('\n\n')

print("Summary written successfully.")
