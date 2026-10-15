import os
import re

# Конфигурация 12 новых проектов
PROJECTS = [
    {
        "file": "project-ekater-park.html",
        "folder": "EKATER_PARK",
        "title": "ЖК «Екатерининский парк»",
        "capsule": "Жилой интерьер · Екатеринбург",
        "location": "Екатеринбург",
        "type": "Интерьер квартиры",
        "statement": "Чистые архитектурные объемы, скрытые световые линии и гармоничный баланс натурального дерева и светлых тактильных фактур.",
        "next_file": "project-nomer-otel.html",
        "next_title": "Гостиничный номер"
    },
    {
        "file": "project-nomer-otel.html",
        "folder": "NOMER_OTEL",
        "title": "Отель «Номерной фонд»",
        "capsule": "Коммерческий интерьер · HoReCa",
        "location": "Екатеринбург",
        "type": "Гостиничный номер",
        "statement": "Камерная атмосфера премиального гостеприимства с акцентом на сценарии мягкого вечернего освещения и тактильный комфорт.",
        "next_file": "project-hmao.html",
        "next_title": "Частная резиденция ХМАО"
    },
    {
        "file": "project-hmao.html",
        "folder": "HMAO",
        "title": "Частная резиденция ХМАО",
        "capsule": "Загородный дом · ХМАО",
        "location": "ХМАО",
        "type": "Жилой дом",
        "statement": "Монументальная загородная архитектура, панорамное остекление и интеграция интерьера в северный природный контекст.",
        "next_file": "project-sochi-kvartira.html",
        "next_title": "Апартаменты в Сочи"
    },
    {
        "file": "project-sochi-kvartira.html",
        "folder": "SOCHI_KVARTIRA",
        "title": "Апартаменты в Сочи",
        "capsule": "Курортный интерьер · Сочи",
        "location": "Сочи",
        "type": "Интерьер апартаментов",
        "statement": "Воздушное южное пространство, светлая песчаная гамма и визуальная связь с морским пейзажем.",
        "next_file": "project-suomen.html",
        "next_title": "ЖК «Suomen Ranta»"
    },
    {
        "file": "project-suomen.html",
        "folder": "SUOMEN",
        "title": "ЖК «Suomen Ranta»",
        "capsule": "Скандинавский минимализм · Екатеринбург",
        "location": "Екатеринбург",
        "type": "Интерьер квартиры",
        "statement": "Сдержанная северная эстетика, функциональное зонирование и безупречная геометрия встроенной мебели.",
        "next_file": "project-a-frames.html",
        "next_title": "Комплекс A-Frame домов"
    },
    {
        "file": "project-a-frames.html",
        "folder": "A_FRAMES",
        "title": "Комплекс A-Frame домов",
        "capsule": "Архитектура и интерьер · Глэмпинг",
        "location": "Свердловская область",
        "type": "A-Frame коттеджи",
        "statement": "Выразительный треугольный силуэт, открытый второй свет и уютное сочетание бруса, камня и панорамных видов.",
        "next_file": "project-andr-fateevo.html",
        "next_title": "Коттедж в Фатеево"
    },
    {
        "file": "project-andr-fateevo.html",
        "folder": "ANDR_FATEEVO",
        "title": "Коттедж в Фатеево",
        "capsule": "Частный дом · Фатеево",
        "location": "Фатеево",
        "type": "Интерьер коттеджа",
        "statement": "Эргономичное загородное жилье для современной семьи с акцентом на долговечные материалы и теплое освещение.",
        "next_file": "project-gorbunovo-2fl.html",
        "next_title": "Дом в Горбуново"
    },
    {
        "file": "project-gorbunovo-2fl.html",
        "folder": "GORBUNOVO_2FL",
        "title": "Дом в Горбуново (2 этажа)",
        "capsule": "Двухэтажный дом · Горбуново",
        "location": "Горбуново",
        "type": "Интерьер дома",
        "statement": "Просторный двухсветный объем, строгие линии лестницы и гармоничное перетекание общественных зон в приватные.",
        "next_file": "project-artu-40m2.html",
        "next_title": "Апартаменты ArtU 40 м²"
    },
    {
        "file": "project-artu-40m2.html",
        "folder": "ARTU_40M2",
        "title": "Апартаменты ArtU 40 м²",
        "capsule": "Компактный интерьер · 40 м²",
        "location": "Екатеринбург",
        "type": "Интерьер апартаментов",
        "statement": "Максимальная утилизация полезной площади без визуального шума за счет скрытых систем хранения и трансформируемой мебели.",
        "next_file": "project-kris-ggm.html",
        "next_title": "Квартира на ГГМ"
    },
    {
        "file": "project-kris-ggm.html",
        "folder": "KRIS_GGM",
        "title": "Квартира на ГГМ",
        "capsule": "Жилой интерьер · Нижний Тагил",
        "location": "Нижний Тагил",
        "type": "Интерьер квартиры",
        "statement": "Современный городской интерьер с акцентной фактурой декоративной штукатурки и тонкими графичными профилями.",
        "next_file": "project-pub-tagil.html",
        "next_title": "Гастропаб в Тагиле"
    },
    {
        "file": "project-pub-tagil.html",
        "folder": "PUB_TAGIL",
        "title": "Гастропаб в Нижнем Тагиле",
        "capsule": "Общественный интерьер · HoReCa",
        "location": "Нижний Тагил",
        "type": "Интерьер паба",
        "statement": "Аутентичный барный стиль: состаренная кирпичная кладка, массив темного дуба, кожаная обивка и теплая латунь.",
        "next_file": "project-banniy-kompl.html",
        "next_title": "Банный СПА-комплекс"
    },
    {
        "file": "project-banniy-kompl.html",
        "folder": "BANNIY_KOMPL",
        "title": "Банный СПА-комплекс",
        "capsule": "Архитектура и СПА · Wellness",
        "location": "Свердловская область",
        "type": "Банный комплекс",
        "statement": "Контраст дикого природного камня и ароматного термодерева, создающий иммерсивный опыт релаксации и восстановления.",
        "next_file": "project-nekrasova.html",
        "next_title": "ЖК «На Некрасова»"
    }
]

def natural_sort_key(s):
    name = s.lower()
    if 'cover' in name:
        return (-1, 0, name)
    parts = re.split(r'(\d+)', name)
    key = [int(p) if p.isdigit() else p for p in parts]
    return (0, key, name)

def get_images(folder_path):
    if not os.path.isdir(folder_path):
        return []
    valid_exts = {'.jpg', '.jpeg', '.png', '.webp'}
    files = [f for f in os.listdir(folder_path) if os.path.splitext(f)[1].lower() in valid_exts]
    files.sort(key=natural_sort_key)
    return files

def build_html(p, images):
    folder = p["folder"]
    title = p["title"]
    capsule = p["capsule"]
    loc = p["location"]
    ptype = p["type"]
    statement = p["statement"]
    next_file = p["next_file"]
    next_title = p["next_title"]

    body_content = []
    if not images:
        body_content.append(f"""
    <div class="statement-block">
      <span class="statement-tag">Проект в работе</span>
      <p class="statement-text">Визуализации для проекта {title} находятся в процессе загрузки.</p>
    </div>
        """)
    else:
        # 1. Полноразмерный главный ракурс
        hero = images[0]
        body_content.append(f"""
    <!-- 1. Главный ракурс -->
    <figure class="media-block">
      <div class="js-tilt">
        <img src="images/{folder}/{hero}" alt="{title} — Главный вид">
      </div>
      <figcaption>Общий вид пространства</figcaption>
    </figure>

    <!-- Манифест концепции -->
    <div class="statement-block">
      <span class="statement-tag">Архитектурная концепция</span>
      <p class="statement-text">{statement}</p>
    </div>
        """)

        # 2. Диптихи и одиночные ракурсы
        remaining = images[1:]
        i = 0
        pair_num = 1
        while i < len(remaining):
            if i + 1 < len(remaining):
                img1, img2 = remaining[i], remaining[i+1]
                body_content.append(f"""
    <!-- Диптих ракурсов #{pair_num} -->
    <div class="diptych-grid">
      <figure>
        <div class="js-tilt">
          <img src="images/{folder}/{img1}" alt="{title} — Ракурс">
        </div>
        <figcaption>Фрагмент интерьера</figcaption>
      </figure>
      <figure class="offset-frame">
        <div class="js-tilt">
          <img src="images/{folder}/{img2}" alt="{title} — Деталь">
        </div>
        <figcaption>Акцентная зона и детализация</figcaption>
      </figure>
    </div>
                """)
                i += 2
                pair_num += 1
            else:
                solo = remaining[i]
                body_content.append(f"""
    <figure class="media-block">
      <div class="js-tilt">
        <img src="images/{folder}/{solo}" alt="{title} — Перспектива">
      </div>
      <figcaption>Перспективный вид</figcaption>
    </figure>
                """)
                i += 1

    rendered_body = "\n".join(body_content)

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Ferro Design</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background-color: #faf9f7; color: #0d0d0d; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; line-height: 1.5; }}
    a {{ color: inherit; text-decoration: none; }}
    img {{ display: block; width: 100%; height: auto; object-fit: contain; }}

    /* Шапка */
    .project-header {{
      position: fixed; top: 0; left: 0; width: 100%; height: 72px; padding: 0 48px;
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 4px 20px rgba(0,0,0,0.03); z-index: 1000;
    }}
    .logo {{ font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }}
    .back-btn {{ font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; transition: color 0.2s; }}
    .back-btn:hover {{ color: #000; }}

    /* Шапка кейса */
    .project-intro {{ padding: 130px 48px 50px; max-width: 1400px; margin: 0 auto; }}
    .glass-capsule {{
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(14px) saturate(150%);
      border: 1px solid rgba(255, 255, 255, 0.75); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04), inset 0 1px 1.5px #ffffff;
      padding: 7px 18px; border-radius: 9999px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-bottom: 16px;
    }}
    .project-title {{ font-size: clamp(34px, 5.5vw, 64px); font-weight: 300; letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 36px; color: #0a0a0a; }}

    .project-specs-panel {{
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
      border-top: 1px solid rgba(13, 13, 13, 0.08); border-bottom: 1px solid rgba(13, 13, 13, 0.08); padding: 24px 0;
    }}
    .spec-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; display: block; margin-bottom: 4px; }}
    .spec-value {{ font-size: 14px; font-weight: 500; color: #111; }}

    /* Лента рендеров */
    .project-body {{ padding: 40px 48px 120px; max-width: 1400px; margin: 0 auto; }}
    .media-block {{ margin-bottom: 90px; }}
    figcaption {{ font-size: 12px; color: #888; letter-spacing: 0.02em; margin-top: 12px; text-align: right; }}

    .js-tilt {{
      position: relative; overflow: hidden; border-radius: 12px; background-color: #f2f1ee;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04); transform-style: preserve-3d; will-change: transform;
    }}
    .js-tilt img {{ max-height: 88vh; }}

    .diptych-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 90px; }}
    .triptych-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-bottom: 90px; }}
    .offset-frame {{ margin-top: 50px; }}

    .statement-block {{ max-width: 760px; margin: 100px auto; text-align: center; }}
    .statement-tag {{ font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; display: block; margin-bottom: 18px; }}
    .statement-text {{ font-size: 21px; font-weight: 300; line-height: 1.6; color: #222; }}

    .next-case-bar {{ border-top: 1px solid rgba(13,13,13,0.08); padding: 80px 0 20px; text-align: center; }}
    .next-sub {{ display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 12px; }}
    .next-title {{ font-size: clamp(26px, 3.5vw, 42px); font-weight: 300; transition: opacity 0.2s; }}
    .next-title:hover {{ opacity: 0.5; }}

    .project-footer {{ border-top: 1px solid rgba(13,13,13,0.08); padding: 36px 48px; display: flex; justify-content: space-between; font-size: 12px; color: #777; }}

    @media (max-width: 860px) {{
      .project-header {{ padding: 0 20px; }}
      .project-intro, .project-body, .project-footer {{ padding-left: 20px; padding-right: 20px; }}
      .project-specs-panel {{ grid-template-columns: repeat(2, 1fr); }}
      .diptych-grid, .triptych-grid {{ grid-template-columns: 1fr; gap: 24px; }}
      .offset-frame {{ margin-top: 0; }}
    }}
  </style>
</head>
<body>

  <header class="project-header">
    <a href="index.html" class="logo">FERRO DESIGN</a>
    <a href="index.html#projects" class="back-btn">← Все проекты</a>
  </header>

  <section class="project-intro">
    <div class="glass-capsule">{capsule}</div>
    <h1 class="project-title">{title}</h1>

    <div class="project-specs-panel">
      <div><span class="spec-label">Локация</span><span class="spec-value">{loc}</span></div>
      <div><span class="spec-label">Направление</span><span class="spec-value">{ptype}</span></div>
      <div><span class="spec-label">Визуализация</span><span class="spec-value">Ferro Design</span></div>
      <div><span class="spec-label">Статус</span><span class="spec-value">Реализован</span></div>
    </div>
  </section>

  <main class="project-body">
{rendered_body}

    <div class="next-case-bar">
      <span class="next-sub">Следующий проект</span>
      <a href="{next_file}" class="next-title">{next_title} →</a>
    </div>
  </main>

  <footer class="project-footer">
    <span>FERRO DESIGN · 2026</span>
    <span>Екатеринбург · Нижний Тагил</span>
  </footer>

  <script src="script.js"></script>
</body>
</html>
"""

def main():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    images_dir = os.path.join(base_dir, "images")
    print("Генерация страниц проектов...")

    for p in PROJECTS:
        folder_path = os.path.join(images_dir, p["folder"])
        imgs = get_images(folder_path)
        html_code = build_html(p, imgs)
        out_path = os.path.join(base_dir, p["file"])
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html_code)
        print(f"✓ {p['file']}: подгружено {len(imgs)} изображений")

    print("\nГотово! Все страницы созданы и готовы к просмотру.")

if __name__ == "__main__":
    main()