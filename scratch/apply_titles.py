import re, sys

sys.stdout.reconfigure(encoding='utf-8')

project_names = {
    'project-nekrasova.html': 'ЖК «На Некрасова»',
    'project-makarovsky.html': 'ЖК «Макаровский»',
    'project-ekater-park.html': 'ЖК «Екатерининский парк»',
    'project-suomen.html': 'ЖК «Suomen Ranta»',
    'project-nomer-otel.html': 'Отель «Номерной фонд»',
    'project-pub-tagil.html': 'Гастропаб в Нижнем Тагиле',
    'project-a-frames.html': 'Комплекс A-Frame домов',
    'project-hmao.html': 'Частная резиденция ХМАО',
    'project-sochi-kvartira.html': 'Апартаменты в Сочи',
    'project-andr-fateevo.html': 'Коттедж в Фатеево',
    'project-gorbunovo-2fl.html': 'Дом в Горбуново',
    'project-artu-40m2.html': 'Апартаменты в городе Екатеринбург',
    'project-kris-ggm.html': 'Частная резиденция в Нижнем Тагиле',
    'project-banniy-kompl.html': 'Банный комплекс',
    'project-tagil-sergey.html': 'Загородный дом в Нижнем Тагиле'
}

for filename, name in project_names.items():
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    new_title = f"{name} — Студия дизайна интерьера FERRO DESIGN™"
    
    # Update <title>
    content = re.sub(r'<title>.*?</title>', f'<title>{new_title}</title>', content)
    
    # Update og:title
    content = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{new_title}">', content)
    
    # Update twitter:title
    content = re.sub(r'<meta name="twitter:title" content=".*?">', f'<meta name="twitter:title" content="{new_title}">', content)

    # Specific updates for renamed projects
    if filename == 'project-artu-40m2.html':
        content = re.sub(r'<h1 class="project-title">.*?</h1>', f'<h1 class="project-title">{name}</h1>', content)
        content = re.sub(r'<img src="images/ARTU_40M2/living_01\.webp" alt=".*?"', f'<img src="images/ARTU_40M2/living_01.webp" alt="{name}"', content)
        content = re.sub(r'"name": ".*?"', f'"name": "Дизайн интерьера {name}"', content, count=1)
        content = content.replace('Апартаменты ArtU 40 м² в Екатеринбурге', f'{name} 40 м²')
        content = content.replace('апартаментов ArtU 40 м² в Екатеринбурге', f'{name} 40 м²')
        content = content.replace('апартаментов 40 м² в Екатеринбурге', f'апартаментов 40 м² в городе Екатеринбург')

    elif filename == 'project-kris-ggm.html':
        content = re.sub(r'<h1 class="project-title">.*?</h1>', f'<h1 class="project-title">{name}</h1>', content)
        content = re.sub(r'<img src="images/KRIS_GGM/living_01\.webp" alt=".*?"', f'<img src="images/KRIS_GGM/living_01.webp" alt="{name}"', content)
        content = re.sub(r'"name": ".*?"', f'"name": "Дизайн интерьера {name}"', content, count=1)
        content = content.replace('частного загородного дома 200 м² на ГГМ, Нижний Тагил', f'частной резиденции 200 м² в Нижнем Тагиле')
        content = content.replace('частного загородного дома 200 м² на ГГМ', f'частной резиденции 200 м² в Нижнем Тагиле')

    elif filename == 'project-tagil-sergey.html':
        content = re.sub(r'<h1 class="project-title">.*?</h1>', f'<h1 class="project-title">{name}</h1>', content)
        content = re.sub(r'<img src="images/TAGIL_SERGEY/cover\.webp" alt=".*?"', f'<img src="images/TAGIL_SERGEY/cover.webp" alt="{name}"', content)
        content = re.sub(r'"name": ".*?"', f'"name": "Дизайн интерьера {name}"', content, count=1)

    elif filename == 'project-gorbunovo-2fl.html':
        content = re.sub(r'"name": ".*?"', f'"name": "Дизайн интерьера {name}"', content, count=1)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {filename} -> {new_title}")
