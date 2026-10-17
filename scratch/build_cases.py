# -*- coding: utf-8 -*-
import os

projects_data = [
    {
        "filename": "project-ekater-park.html",
        "title": "ЖК «Екатерининский парк»",
        "meta_title": "ЖК «Екатерининский парк» — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера квартиры 78 м² в ЖК «Екатерининский парк», Екатеринбург от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/EKATER_PARK/bedroom_01.webp",
        "hero_image": "images/EKATER_PARK/bedroom_01.webp",
        "city": "Екатеринбург",
        "area": "78 м²",
        "category": "Квартира",
        "year": "2026",
        "next_url": "project-suomen.html",
        "next_title": "ЖК «Suomen Ranta»",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/living_01.webp", "Кухонный гарнитур и обеденная группа"),
                        ("images/EKATER_PARK/living_02.webp", "Диванная группа и декоративное озеленение")
                    ]},
                    {"type": "full", "src": "images/EKATER_PARK/living_03.webp", "cap": "ТВ-панель со скрытыми системами хранения"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ПРИХОЖАЯ",
                "nav": "Прихожая",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/enter_01.webp", "Входная группа со встроенными шкафами"),
                        ("images/EKATER_PARK/enter_02.webp", "Парящие шкафы с теплой нижней подсветкой")
                    ]},
                    {"type": "full", "src": "images/EKATER_PARK/enter_03.webp", "cap": "Приватный коридор"}
                ]
            },
            {
                "id": "room-bedroom",
                "name": "СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/bedroom_01.webp", "Мастер-спальня с реечной панелью"),
                        ("images/EKATER_PARK/bedroom_02.webp", "Второй ракурс мастер-спальни")
                    ]}
                ]
            },
            {
                "id": "room-kids",
                "name": "ДЕТСКАЯ",
                "nav": "Детская",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/kid_01.webp", "Детская комната со встроенным рабочим местом"),
                        ("images/EKATER_PARK/kid_02.webp", "Игровая зона и спальное место")
                    ]}
                ]
            },
            {
                "id": "room-guest",
                "name": "ГОСТЕВАЯ",
                "nav": "Гостевая",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/guest_01.webp", "Гостевая комната с диваном"),
                        ("images/EKATER_PARK/guest_02.webp", "Эргономичная система хранения и письменный стол")
                    ]}
                ]
            },
            {
                "id": "room-bath",
                "name": "САНУЗЛЫ",
                "nav": "Санузлы",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/bathroom_01.webp", "Санузел с отделкой под дерево и камень"),
                        ("images/EKATER_PARK/bathroom_02.webp", "Зона раковины с круглым зеркалом и подсветкой")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/EKATER_PARK/small_bathroom_01.webp", "Гостевой санузел в графитовой гамме"),
                        ("images/EKATER_PARK/small_bathroom_02.webp", "Подвесная сантехника и скрытая подсветка")
                    ]}
                ]
            }
        ]
    },
    {
        "filename": "project-suomen.html",
        "title": "ЖК «Suomen Ranta»",
        "meta_title": "ЖК «Suomen Ranta» — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера квартиры 58 м² в ЖК «Suomen Ranta», Екатеринбург от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/SUOMEN/cover.webp",
        "hero_image": "images/SUOMEN/cover.webp",
        "city": "Екатеринбург",
        "area": "58 м²",
        "category": "Квартира",
        "year": "2026",
        "next_url": "project-nomer-otel.html",
        "next_title": "Отель «Номерной фонд»",
        "rooms": [
            {
                "id": "room-living",
                "name": "КУХНЯ-ГОСТИНАЯ",
                "nav": "Кухня-гостиная",
                "items": [
                    {"type": "full", "src": "images/SUOMEN/cover.webp", "cap": "Общий вид объединенного пространства кухни-гостиной"},
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/kitchen_01.webp", "Кухонный гарнитур со встроенной техникой"),
                        ("images/SUOMEN/kitchen_02.webp", "Обеденная зона и акцентный свет")
                    ]}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ПРИХОЖАЯ",
                "nav": "Прихожая",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/enter_01.webp", "Входной холл"),
                        ("images/SUOMEN/enter_02.webp", "Гардеробная система и ростовое зеркало")
                    ]}
                ]
            },
            {
                "id": "room-bedroom",
                "name": "СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "full", "src": "images/SUOMEN/bedroom_01.webp", "cap": "Мастер-спальня в нейтральных тонах"},
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/bedroom_02.webp", "Прикроватная зона и текстиль"),
                        ("images/SUOMEN/bedroom_03.webp", "Рабочее место в спальне")
                    ]}
                ]
            },
            {
                "id": "room-kids",
                "name": "ДЕТСКАЯ",
                "nav": "Детская",
                "items": [
                    {"type": "full", "src": "images/SUOMEN/kids_01.webp", "cap": "Детская комната"},
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/kids_02.webp", "Зона учебы и отдыха в детской"),
                        ("images/SUOMEN/kids_03.webp", "Система хранения и спальное место")
                    ]}
                ]
            },
            {
                "id": "room-bath",
                "name": "ВАННАЯ КОМНАТА",
                "nav": "Ванная",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/green_bath_0.webp", "Ванная комната в оливковом сценарии"),
                        ("images/SUOMEN/green_bath_02.webp", "Душевая зона со встроенной нишей")
                    ]},
                    {"type": "full", "src": "images/SUOMEN/green_bath_03.webp", "cap": "Подвесная раковина с зеркалом (зеленый сценарий)"},
                    {"type": "diptych", "items": [
                        ("images/SUOMEN/red_bath_01.webp", "Второй сценарий отделки в терракотовой гамме"),
                        ("images/SUOMEN/red_bath_02.webp", "Зона умывальника с подсветкой (терракотовый сценарий)")
                    ]},
                    {"type": "full", "src": "images/SUOMEN/red_bath_03.webp", "cap": "Консольная сантехника и фактура плитки"}
                ]
            }
        ]
    },
    {
        "filename": "project-nomer-otel.html",
        "title": "Отель «Номерной фонд»",
        "meta_title": "Отель «Номерной фонд» — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект гостиничного номера 40 м² в Екатеринбурге от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/NOMER_OTEL/cover.webp",
        "hero_image": "images/NOMER_OTEL/cover.webp",
        "city": "Екатеринбург",
        "area": "40 м²",
        "category": "Коммерческий объект",
        "year": "2026",
        "next_url": "project-pub-tagil.html",
        "next_title": "Гастропаб в Нижнем Тагиле",
        "rooms": [
            {
                "id": "room-suite",
                "name": "НОМЕРНОЙ ФОНД",
                "nav": "Номер",
                "items": [
                    {"type": "full", "src": "images/NOMER_OTEL/cover.webp", "cap": "Общий вид интерьера гостиничного номера"},
                    {"type": "diptych", "items": [
                        ("images/NOMER_OTEL/main_02.webp", "Спальная зона номера с мягким изголовьем"),
                        ("images/NOMER_OTEL/main_03.webp", "Рабочая зона и акцентный свет")
                    ]},
                    {"type": "full", "src": "images/NOMER_OTEL/main_04.webp", "cap": "Детали отделки и текстиля"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ",
                "nav": "Холл",
                "items": [
                    {"type": "full", "src": "images/NOMER_OTEL/enter_02.webp", "cap": "Входной холл номера с гардеробной группой"}
                ]
            },
            {
                "id": "room-bath",
                "name": "САНУЗЕЛ",
                "nav": "Санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/NOMER_OTEL/bath_01.webp", "Санузел в темном керамограните"),
                        ("images/NOMER_OTEL/bath_02.webp", "Душевая зона с контурной подсветкой")
                    ]},
                    {"type": "full", "src": "images/NOMER_OTEL/bath_03.webp", "cap": "Раковина и встроенная подсветка зеркала"}
                ]
            }
        ]
    },
    {
        "filename": "project-pub-tagil.html",
        "title": "Гастропаб в Нижнем Тагиле",
        "meta_title": "Гастропаб в Нижнем Тагиле — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера гастропаба 200 м² в Нижнем Тагиле от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/PUB_TAGIL/cover.webp",
        "hero_image": "images/PUB_TAGIL/cover.webp",
        "city": "Нижний Тагил",
        "area": "200 м²",
        "category": "Коммерческий объект",
        "year": "2026",
        "next_url": "project-a-frames.html",
        "next_title": "Комплекс A-Frame домов",
        "rooms": [
            {
                "id": "room-bar",
                "name": "БАРНАЯ ЗОНА",
                "nav": "Бар",
                "items": [
                    {"type": "full", "src": "images/PUB_TAGIL/cover.webp", "cap": "Общий вид барной зоны гастропаба"},
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/bar_01.webp", "Барная стойка из темного дуба"),
                        ("images/PUB_TAGIL/bar_02.webp", "Стеллаж с подсветкой и посадка у стойки")
                    ]}
                ]
            },
            {
                "id": "room-main-hall",
                "name": "ОСНОВНОЙ ЗАЛ",
                "nav": "Основной зал",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/main_01.webp", "Основной зал паба"),
                        ("images/PUB_TAGIL/main_02.webp", "Кожаные диваны и кирпичная кладка")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/main_03.webp", "Уютная посадка у окна"),
                        ("images/PUB_TAGIL/main_04.webp", "Фактура кирпича и теплое освещение")
                    ]}
                ]
            },
            {
                "id": "room-vip",
                "name": "VIP-ЗАЛЫ",
                "nav": "VIP-залы",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/vip_1_01.webp", "Приватная VIP-зона"),
                        ("images/PUB_TAGIL/vip_1_02.webp", "Круглый стол и латунные светильники")
                    ]},
                    {"type": "full", "src": "images/PUB_TAGIL/vip_2_01.webp", "cap": "Камерный лаунж"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ",
                "nav": "Холл",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/enter_01.webp", "Входная зона и гардероб"),
                        ("images/PUB_TAGIL/enter_02.webp", "Фрагмент холла")
                    ]}
                ]
            },
            {
                "id": "room-wc",
                "name": "САНУЗЛЫ",
                "nav": "Санузлы",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/PUB_TAGIL/wc_1_0.webp", "Гостевой санузел в графитовом камне"),
                        ("images/PUB_TAGIL/wc_2_01.webp", "Раковина и зеркало с контурным светом")
                    ]}
                ]
            }
        ]
    },
    {
        "filename": "project-a-frames.html",
        "title": "Комплекс A-Frame домов",
        "meta_title": "Комплекс A-Frame домов — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьеров комплекса загородных домов A-Frame 100 м² в Свердловской области от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/A_FRAMES/cover.webp",
        "hero_image": "images/A_FRAMES/cover.webp",
        "city": "Свердловская обл.",
        "area": "100 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-hmao.html",
        "next_title": "Частная резиденция ХМАО",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/A_FRAMES/cover.webp", "cap": "Общий вид пространства комплекса A-Frame"},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/living_dark_01.webp", "Гостиная — темный сценарий"),
                        ("images/A_FRAMES/living_light_01.webp", "Гостиная — светлый сценарий")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/living_dark_02.webp", "Кухня — темный сценарий"),
                        ("images/A_FRAMES/living_light_02.webp", "Кухня — светлый сценарий")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/living_dark_03.webp", "Камерное освещение — темный дом"),
                        ("images/A_FRAMES/living_light_03.webp", "Панорамное остекление — светлый дом")
                    ]},
                    {"type": "full", "src": "images/A_FRAMES/living_dark_04.webp", "cap": "Чугунный камин на фоне черного металла"},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/living_light_04.webp", "Лестница на антресольный этаж"),
                        ("images/A_FRAMES/living_light_05.webp", "Связь интерьера с природным окружением")
                    ]},
                    {"type": "full", "src": "images/A_FRAMES/living_light_06.webp", "cap": "Мягкая зона отдыха со вторым светом"}
                ]
            },
            {
                "id": "room-bed-1fl",
                "name": "СПАЛЬНЯ 1 ЭТАЖА",
                "nav": "Спальня 1 этажа",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bedroom_dark_1fl_01.webp", "Спальня 1 этажа — темный сценарий"),
                        ("images/A_FRAMES/bedroom_light_1fl_01.webp", "Спальня 1 этажа — светлый сценарий")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bedroom_dark_1fl_02.webp", "Фактура обожженного дерева"),
                        ("images/A_FRAMES/bedroom_light_1fl_02.webp", "Отделка светлым брусом")
                    ]}
                ]
            },
            {
                "id": "room-bed-2fl",
                "name": "СПАЛЬНЯ 2 ЭТАЖА",
                "nav": "Спальня 2 этажа",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bedroom_dark_2f_01.webp", "Антресольная спальня — темный сценарий"),
                        ("images/A_FRAMES/bedroom_light_2f_01.webp", "Антресольная спальня — светлый сценарий")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bedroom_dark_2f_02.webp", "Вид на общее пространство"),
                        ("images/A_FRAMES/bedroom_light_2f_02.webp", "Вид из мансардного окна")
                    ]}
                ]
            },
            {
                "id": "room-bath",
                "name": "САНУЗЕЛ",
                "nav": "Санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bathroom_dark_01.webp", "Санузел в темном сланце"),
                        ("images/A_FRAMES/bathroom_light_01.webp", "Санузел в светлом микроцементе")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/A_FRAMES/bathroom_dark_02.webp", "Раковина с латунным смесителем"),
                        ("images/A_FRAMES/bathroom_light_02.webp", "Душевой отсек с черной сантехникой")
                    ]}
                ]
            }
        ]
    },
    {
        "filename": "project-hmao.html",
        "title": "Частная резиденция ХМАО",
        "meta_title": "Частная резиденция ХМАО — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера частного загородного дома 200 м² в Сургуте / ХМАО от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/HMAO/living_01.webp",
        "hero_image": "images/HMAO/living_01.webp",
        "city": "Сургут / ХМАО",
        "area": "200 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-sochi-kvartira.html",
        "next_title": "Апартаменты в Сочи",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/HMAO/cover.webp", "cap": "Общий вид пространства со вторым светом"},
                    {"type": "diptych", "items": [
                        ("images/HMAO/living_01.webp", "Гостиная со вторым светом"),
                        ("images/HMAO/living_02.webp", "Мягкая зона и камин")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/HMAO/living_03.webp", "Панорамное остекление гостиной"),
                        ("images/HMAO/living_04.webp", "ТВ-группа в отделке натуральным сланцем")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/HMAO/living_05.webp", "Обеденная группа на 8 персон"),
                        ("images/HMAO/living_06.webp", "Кухонный остров и встроенные колонны")
                    ]},
                    {"type": "full", "src": "images/HMAO/ladder_01.webp", "cap": "Архитектурная лестница со стеклянным ограждением"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ",
                "nav": "Холл",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/HMAO/enter_01.webp", "Входной холл с гардеробными шкафами"),
                        ("images/HMAO/enter_02.webp", "Интегрированная подсветка и зеркало")
                    ]},
                    {"type": "full", "src": "images/HMAO/enter_03.webp", "cap": "Коридор первого этажа"}
                ]
            },
            {
                "id": "room-kabinet",
                "name": "КАБИНЕТ",
                "nav": "Кабинет",
                "items": [
                    {"type": "full", "src": "images/HMAO/kabinet_01.webp", "cap": "Приватный кабинет владельца"}
                ]
            },
            {
                "id": "room-master",
                "name": "МАСТЕР-СПАЛЬНЯ",
                "nav": "Мастер-спальня",
                "items": [
                    {"type": "full", "src": "images/HMAO/bedroom_01.webp", "cap": "Мастер-спальня с панорамным видом"},
                    {"type": "diptych", "items": [
                        ("images/HMAO/bedroom_02.webp", "Прикроватные подвесы и текстиль"),
                        ("images/HMAO/bedroom_03.webp", "Зона будуара в спальне")
                    ]}
                ]
            },
            {
                "id": "room-guest",
                "name": "ГОСТЕВАЯ СПАЛЬНЯ",
                "nav": "Гостевая спальня",
                "items": [
                    {"type": "full", "src": "images/HMAO/guest_01.webp", "cap": "Гостевая спальня"}
                ]
            },
            {
                "id": "room-kids",
                "name": "ДЕТСКИЕ КОМНАТЫ",
                "nav": "Детские",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/HMAO/kids_1_01.webp", "Первая детская комната"),
                        ("images/HMAO/kids_1_02.webp", "Рабочее место в детской")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/HMAO/kids_2_01.webp", "Вторая детская комната"),
                        ("images/HMAO/kids_2_02.webp", "Игровая зона и спальное место")
                    ]},
                    {"type": "full", "src": "images/HMAO/kids_2_03.webp", "cap": "Система хранения игрушек и книг"}
                ]
            }
        ]
    },
    {
        "filename": "project-sochi-kvartira.html",
        "title": "Апартаменты в Сочи",
        "meta_title": "Апартаменты в Сочи — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера апартаментов 55 м² в Сочи от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/SOCHI_KVARTIRA/bedroom_01.webp",
        "hero_image": "images/SOCHI_KVARTIRA/bedroom_01.webp",
        "city": "Сочи",
        "area": "55 м²",
        "category": "Квартира",
        "year": "2026",
        "next_url": "project-andr-fateevo.html",
        "next_title": "Коттедж в Фатеево",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/SOCHI_KVARTIRA/cover.webp", "cap": "Общий вид пространства"},
                    {"type": "diptych", "items": [
                        ("images/SOCHI_KVARTIRA/living_01.webp", "Гостиная зона"),
                        ("images/SOCHI_KVARTIRA/living_02.webp", "Акцентная зона и детализация")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/SOCHI_KVARTIRA/living_03.webp", "Фрагмент интерьера гостиной"),
                        ("images/SOCHI_KVARTIRA/living_04.webp", "Детализация гостиной")
                    ]}
                ]
            },
            {
                "id": "room-bedroom",
                "name": "СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/SOCHI_KVARTIRA/bedroom_01.webp", "Спальная зона"),
                        ("images/SOCHI_KVARTIRA/bedroom_02.webp", "Прикроватная зона и освещение")
                    ]},
                    {"type": "full", "src": "images/SOCHI_KVARTIRA/bedroom_03.webp", "cap": "Общий ракурс спальни"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ПРИХОЖАЯ",
                "nav": "Прихожая",
                "items": [
                    {"type": "full", "src": "images/SOCHI_KVARTIRA/enter_01.webp", "cap": "Входная группа и гардеробная"}
                ]
            }
        ]
    },
    {
        "filename": "project-andr-fateevo.html",
        "title": "Коттедж в Фатеево",
        "meta_title": "Коттедж в Фатеево — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера загородного коттеджа 152 м² в пос. Фатеево (Свердловская обл.) от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/ANDR_FATEEVO/cover.webp",
        "hero_image": "images/ANDR_FATEEVO/cover.webp",
        "city": "Свердловская обл.",
        "area": "152 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-gorbunovo-2fl.html",
        "next_title": "Дом в Горбуново",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ И КУХНЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/ANDR_FATEEVO/cover.webp", "cap": "Общий вид пространства кухни-гостиной"},
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/living_02.webp", "Обеденная зона и панорамный вид"),
                        ("images/ANDR_FATEEVO/living_03.webp", "Кухонный остров и столовая")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/living_04.webp", "Встроенные кухонные колонны"),
                        ("images/ANDR_FATEEVO/living_05.webp", "ТВ-панель со скрытой подсветкой")
                    ]}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ",
                "nav": "Холл",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/enter_01.webp", "Входной холл"),
                        ("images/ANDR_FATEEVO/enter_02.webp", "Гардеробная группа и зеркало")
                    ]}
                ]
            },
            {
                "id": "room-kabinet",
                "name": "КАБИНЕТ",
                "nav": "Кабинет",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/kabinet_01.webp", "Рабочий кабинет"),
                        ("images/ANDR_FATEEVO/kabinet_02.webp", "Письменный стол и стеллаж")
                    ]},
                    {"type": "full", "src": "images/ANDR_FATEEVO/kabinet_03.webp", "cap": "Диванная зона в кабинете"}
                ]
            },
            {
                "id": "room-guest-bath",
                "name": "ГОСТЕВОЙ САНУЗЕЛ",
                "nav": "Гостевой санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/enter_bath_01.webp", "Гостевой санузел первого этажа"),
                        ("images/ANDR_FATEEVO/enter_bath_02.webp", "Раковина с подсветкой")
                    ]}
                ]
            },
            {
                "id": "room-master",
                "name": "МАСТЕР-СПАЛЬНЯ",
                "nav": "Мастер-спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/bedroom_01.webp", "Мастер-спальня"),
                        ("images/ANDR_FATEEVO/bedroom_02.webp", "Прикроватная группа и текстиль")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/masterbath_01.webp", "Ванная комната при спальне"),
                        ("images/ANDR_FATEEVO/masterbath_02.webp", "Душевая зона и стеклянная перегородка")
                    ]},
                    {"type": "full", "src": "images/ANDR_FATEEVO/masterbath_03.webp", "cap": "Двойная раковина и зеркало с подсветкой"}
                ]
            },
            {
                "id": "room-kids",
                "name": "ДЕТСКАЯ И САНУЗЕЛ",
                "nav": "Детская",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/kids_01.webp", "Детская комната"),
                        ("images/ANDR_FATEEVO/kids_02.webp", "Письменный стол и стеллажи")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/kids_03.webp", "Спальная зона в детской"),
                        ("images/ANDR_FATEEVO/kids_04.webp", "Система хранения в детской")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/ANDR_FATEEVO/kids_bathrooom_01.webp", "Детский санузел"),
                        ("images/ANDR_FATEEVO/kids_bathrooom_02.webp", "Раковина и зеркало в детском санузле")
                    ]}
                ]
            }
        ]
    },
    {
        "filename": "project-gorbunovo-2fl.html",
        "title": "Дом в Горбуново",
        "meta_title": "Дом в Горбуново (2 этажа) — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера двухэтажного загородного дома 200 м² в пос. Горбуново от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/GORBUNOVO_2FL/cover.webp",
        "hero_image": "images/GORBUNOVO_2FL/cover.webp",
        "city": "Горбуново",
        "area": "200 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-artu-40m2.html",
        "next_title": "Апартаменты ArtU 40 м²",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ И КУХНЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/GORBUNOVO_2FL/cover.webp", "cap": "Общий вид пространства"},
                    {"type": "diptych", "items": [
                        ("images/GORBUNOVO_2FL/living_01.webp", "Гостиная зона с мягкой группой"),
                        ("images/GORBUNOVO_2FL/living_02.webp", "Обеденная зона и кухня")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/GORBUNOVO_2FL/living_03.webp", "ТВ-группа с каминной зоной"),
                        ("images/GORBUNOVO_2FL/living_04.webp", "Архитектурная лестница")
                    ]}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ПРИХОЖАЯ",
                "nav": "Прихожая",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/GORBUNOVO_2FL/enter_01.webp", "Входной холл"),
                        ("images/GORBUNOVO_2FL/enter_02.webp", "Встроенные гардеробные системы")
                    ]}
                ]
            },
            {
                "id": "room-bedrooms",
                "name": "СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/GORBUNOVO_2FL/bedroom_01.webp", "Мастер-спальня"),
                        ("images/GORBUNOVO_2FL/bedroom_02.webp", "Изголовье кровати и светильники")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/GORBUNOVO_2FL/bedroom_03.webp", "Гостевая спальня"),
                        ("images/GORBUNOVO_2FL/bedroom_04.webp", "Рабочее место в спальне")
                    ]},
                    {"type": "full", "src": "images/GORBUNOVO_2FL/bedroom_05.webp", "cap": "Перспективный вид спальни второго этажа"}
                ]
            }
        ]
    },
    {
        "filename": "project-artu-40m2.html",
        "title": "Апартаменты ArtU 40 м²",
        "meta_title": "Апартаменты ArtU 40 м² — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера апартаментов 40 м² в Екатеринбурге от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/ARTU_40M2/living_01.webp",
        "hero_image": "images/ARTU_40M2/living_01.webp",
        "city": "Екатеринбург",
        "area": "40 м²",
        "category": "Квартира",
        "year": "2026",
        "next_url": "project-kris-ggm.html",
        "next_title": "Дом на ГГМ",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ И КУХНЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/ARTU_40M2/cover.webp", "cap": "Общий вид пространства"},
                    {"type": "diptych", "items": [
                        ("images/ARTU_40M2/living_01.webp", "Гостиная зона с раскладным диваном"),
                        ("images/ARTU_40M2/living_02.webp", "Кухонная зона и обеденный стол")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/ARTU_40M2/living_03.webp", "ТВ-группа со скрытыми полками"),
                        ("images/ARTU_40M2/living_04.webp", "Встроенная техника и кухонный фронт")
                    ]}
                ]
            },
            {
                "id": "room-bedroom",
                "name": "СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ARTU_40M2/bedroom_01.webp", "Приватная спальная зона"),
                        ("images/ARTU_40M2/bedroom_02.webp", "Прикроватные подвесы и текстура стен")
                    ]},
                    {"type": "full", "src": "images/ARTU_40M2/bedroom_03.webp", "cap": "Шкафная группа в спальне"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ",
                "nav": "Холл",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ARTU_40M2/enter_01.webp", "Входной холл с ростовым зеркалом"),
                        ("images/ARTU_40M2/enter_02.webp", "Входной шкаф со скрытой подсветкой")
                    ]},
                    {"type": "full", "src": "images/ARTU_40M2/enter_03.webp", "cap": "Переход в жилое пространство"}
                ]
            },
            {
                "id": "room-bath",
                "name": "САНУЗЕЛ",
                "nav": "Санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/ARTU_40M2/bath_01.webp", "Санузел в теплой гамме"),
                        ("images/ARTU_40M2/bath_02.webp", "Душевая перегородка и сантехника")
                    ]},
                    {"type": "full_compact", "src": "images/ARTU_40M2/bath_03.webp", "cap": "Раковина с подвесной тумбой и подсветкой"}
                ]
            }
        ]
    },
    {
        "filename": "project-kris-ggm.html",
        "title": "Дом на ГГМ",
        "meta_title": "Дом на ГГМ — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера частного загородного дома 200 м² на ГГМ, Нижний Тагил от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/KRIS_GGM/living_01.webp",
        "hero_image": "images/KRIS_GGM/living_01.webp",
        "city": "Нижний Тагил",
        "area": "200 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-banniy-kompl.html",
        "next_title": "Банный комплекс",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ И СТОЛОВАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/KRIS_GGM/cover.webp", "cap": "Общий вид пространства"},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/living_01.webp", "Гостиная зона с камином"),
                        ("images/KRIS_GGM/living_02.webp", "Обеденная зона и кухня")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/living_03.webp", "ТВ-группа с подсветкой"),
                        ("images/KRIS_GGM/ladder_01.webp", "Архитектурная лестница")
                    ]}
                ]
            },
            {
                "id": "room-fl2",
                "name": "ВТОРОЙ ЭТАЖ",
                "nav": "Второй этаж",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/fl2_01.webp", "Холл второго этажа"),
                        ("images/KRIS_GGM/fl2_02.webp", "Зона отдыха второго этажа")
                    ]},
                    {"type": "full", "src": "images/KRIS_GGM/fl2_03.webp", "cap": "Приватный коридор"}
                ]
            },
            {
                "id": "room-kabinet",
                "name": "КАБИНЕТ",
                "nav": "Кабинет",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/kabinet_01.webp", "Рабочий кабинет"),
                        ("images/KRIS_GGM/kabinet_02.webp", "Письменный стол и стеллажи")
                    ]},
                    {"type": "full", "src": "images/KRIS_GGM/kabinet_03.webp", "cap": "Диванная зона в кабинете"}
                ]
            },
            {
                "id": "room-master",
                "name": "МАСТЕР-СПАЛЬНЯ",
                "nav": "Мастер-спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bedroom_01.webp", "Мастер-спальня"),
                        ("images/KRIS_GGM/bedroom_02.webp", "Изголовье кровати и подвесы")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bedroom_03.webp", "Шкафная группа с подсветкой"),
                        ("images/KRIS_GGM/bedroom_04.webp", "Общий вид спальни")
                    ]}
                ]
            },
            {
                "id": "room-kids-1",
                "name": "ПЕРВАЯ ДЕТСКАЯ",
                "nav": "Детская 1",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/kids_1_01.webp", "Первая детская комната"),
                        ("images/KRIS_GGM/kids_1_02.webp", "Учебное место и система полок")
                    ]},
                    {"type": "full", "src": "images/KRIS_GGM/kids_1_03.webp", "cap": "Спальная зона в первой детской"}
                ]
            },
            {
                "id": "room-kids-2",
                "name": "ВТОРАЯ ДЕТСКАЯ",
                "nav": "Детская 2",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/kids_2_01.webp", "Вторая детская комната"),
                        ("images/KRIS_GGM/kids_2_02.webp", "Рабочее место во второй детской")
                    ]},
                    {"type": "full", "src": "images/KRIS_GGM/kids_2_03.webp", "cap": "Встроенные шкафы"}
                ]
            },
            {
                "id": "room-bath-1",
                "name": "ОСНОВНАЯ ВАННАЯ",
                "nav": "Ванная 1",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bathroom_1_01.webp", "Основная ванная комната"),
                        ("images/KRIS_GGM/bathroom_1_02.webp", "Отдельностоящая ванна")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bathroom_1_03.webp", "Душевая перегородка"),
                        ("images/KRIS_GGM/bathroom_1_04.webp", "Двойная раковина с подсветкой")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bathroom_1_05.webp", "Инсталляция и скрытые шкафы"),
                        ("images/KRIS_GGM/bathroom_1_06.webp", "Детали керамогранита")
                    ]}
                ]
            },
            {
                "id": "room-bath-2",
                "name": "ВТОРОЙ САНУЗЕЛ",
                "nav": "Санузел 2",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bathroom_2_01.webp", "Второй санузел в теплом камне"),
                        ("images/KRIS_GGM/bathroom_2_02.webp", "Душевой отсек с нишей")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/KRIS_GGM/bathroom_2_03.webp", "Консольная раковина с подсветкой"),
                        ("images/KRIS_GGM/bathroom_2_04.webp", "Подвесной унитаз и латунные аксессуары")
                    ]}
                ]
            }
        ]
    },
    {
        "filename": "project-banniy-kompl.html",
        "title": "Банный комплекс",
        "meta_title": "Банный комплекс — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера загородного банного комплекса 55 м² в Свердловской области от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/BANNIY_KOMPL/cover.webp",
        "hero_image": "images/BANNIY_KOMPL/cover.webp",
        "city": "Свердловская обл.",
        "area": "55 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-tagil-sergey.html",
        "next_title": "Коттедж в Тагиле",
        "rooms": [
            {
                "id": "room-lounge",
                "name": "ГОСТИНАЯ И ЛАУНЖ",
                "nav": "Гостиная",
                "items": [
                    {"type": "full", "src": "images/BANNIY_KOMPL/cover.webp", "cap": "Общий вид пространства"},
                    {"type": "diptych", "items": [
                        ("images/BANNIY_KOMPL/living_01.webp", "Гостиная зона отдыха"),
                        ("images/BANNIY_KOMPL/living_02.webp", "Каминная группа и текстиль")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/BANNIY_KOMPL/living_03.webp", "Обеденный стол из слэба"),
                        ("images/BANNIY_KOMPL/living_04.webp", "Фактура дерева и теплое освещение")
                    ]}
                ]
            },
            {
                "id": "room-steam",
                "name": "ПАРНАЯ",
                "nav": "Парная",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/BANNIY_KOMPL/banya_01.webp", "Парная из кедра с подсветкой пологов"),
                        ("images/BANNIY_KOMPL/banya_02.webp", "Банная печь в облицовке талькохлоритом")
                    ]}
                ]
            },
            {
                "id": "room-bath",
                "name": "ДУШЕВАЯ И САНУЗЕЛ",
                "nav": "Душевая и санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/BANNIY_KOMPL/bath_1_01.webp", "Душевая зона с обливным ведром"),
                        ("images/BANNIY_KOMPL/bath_1_02.webp", "Облицовка скальным камнем")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/BANNIY_KOMPL/bath_2_01.webp", "Гостевой санузел комплекса"),
                        ("images/BANNIY_KOMPL/bath_2_02.webp", "Раковина из цельного валуна")
                    ]},
                    {"type": "full_compact", "src": "images/BANNIY_KOMPL/bath_2_03.webp", "cap": "Зеркало с фоновой подсветкой и латунная сантехника"}
                ]
            }
        ]
    },
    {
        "filename": "project-tagil-sergey.html",
        "title": "Коттедж в Тагиле",
        "meta_title": "Коттедж в Тагиле — Студия дизайна FERRO DESIGN",
        "meta_desc": "Дизайн-проект интерьера загородного дома 160 м² в Нижнем Тагиле от студии дизайна FERRO DESIGN™.",
        "og_image": "https://ferro-design.ru/images/TAGIL_SERGEY/cover.webp",
        "hero_image": "images/TAGIL_SERGEY/cover.webp",
        "city": "Нижний Тагил",
        "area": "160 м²",
        "category": "Загородный дом",
        "year": "2026",
        "next_url": "project-nekrasova.html",
        "next_title": "ЖК «На Некрасова»",
        "rooms": [
            {
                "id": "room-living",
                "name": "ГОСТИНАЯ И СТОЛОВАЯ",
                "nav": "Гостиная",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/living_01.webp", "Гостиная зона с камином"),
                        ("images/TAGIL_SERGEY/living_02.webp", "Обеденная зона и кухня")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/living_03.webp", "ТВ-группа со скрытыми системами"),
                        ("images/TAGIL_SERGEY/living_04.webp", "Кухонный гарнитур и остров")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/living_05.webp", "Фактура керамогранита и дерево"),
                        ("images/TAGIL_SERGEY/living_06.webp", "Остров и барные стулья")
                    ]},
                    {"type": "full", "src": "images/TAGIL_SERGEY/living_07.webp", "cap": "Общий ракурс гостиной зоны"}
                ]
            },
            {
                "id": "room-hallway",
                "name": "ХОЛЛ И ПРИХОЖАЯ",
                "nav": "Холл",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/enter_01.webp", "Входная группа со встроенными шкафами"),
                        ("images/TAGIL_SERGEY/enter_02.webp", "Ростовое зеркало с подсветкой")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/enter_03.webp", "Холл с распашными дверьми"),
                        ("images/TAGIL_SERGEY/koridor_01.webp", "Приватный коридор")
                    ]}
                ]
            },
            {
                "id": "room-kabinet",
                "name": "КАБИНЕТ",
                "nav": "Кабинет",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/kabinet_01.webp", "Рабочий стол и стеллажи"),
                        ("images/TAGIL_SERGEY/kabinet_02.webp", "ТВ-зона и мягкий диван")
                    ]}
                ]
            },
            {
                "id": "room-master-bed",
                "name": "МАСТЕР-СПАЛЬНЯ",
                "nav": "Спальня",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/bedroom_01.webp", "Мастер-спальня с мягким изголовьем"),
                        ("images/TAGIL_SERGEY/bedroom_02.webp", "Прикроватная группа и подвесы")
                    ]},
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/bedroom_03.webp", "ТВ-зона в спальне"),
                        ("images/TAGIL_SERGEY/bedroom_04.webp", "Встроенный гардеробный фронт")
                    ]}
                ]
            },
            {
                "id": "room-master-bath",
                "name": "ВАННАЯ КОМНАТА",
                "nav": "Ванная",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/masterbath_01.webp", "Ванная комната в теплом камне"),
                        ("images/TAGIL_SERGEY/masterbath_02.webp", "Душевая перегородка и ниша")
                    ]},
                    {"type": "full", "src": "images/TAGIL_SERGEY/masterbath_03.webp", "cap": "Консольная тумба с двойной раковиной"}
                ]
            },
            {
                "id": "room-kids",
                "name": "ДЕТСКАЯ КОМНАТА",
                "nav": "Детская",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/kid_01.webp", "Детская комната со встроенным шкафом"),
                        ("images/TAGIL_SERGEY/kid_02.webp", "Рабочее место и ТВ-зона")
                    ]}
                ]
            },
            {
                "id": "room-kid-bath",
                "name": "ДЕТСКИЙ САНУЗЕЛ",
                "nav": "Детский санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/kid_bath_01.webp", "Детский санузел с круглой подсветкой"),
                        ("images/TAGIL_SERGEY/kid_bath_02.webp", "Душевая зона")
                    ]}
                ]
            },
            {
                "id": "room-guest-bath",
                "name": "ГОСТЕВОЙ САНУЗЕЛ",
                "nav": "Гостевой санузел",
                "items": [
                    {"type": "diptych", "items": [
                        ("images/TAGIL_SERGEY/guest_bath_01.webp", "Гостевой санузел в графитовой гамме"),
                        ("images/TAGIL_SERGEY/guest_bath_02.webp", "Подвесная сантехника и свет")
                    ]}
                ]
            }
        ]
    }
]

def render_project(p):
    html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>{p["meta_title"]}</title>
  <meta name="description" content="{p["meta_desc"]}">

  <!-- Open Graph / Карточка для Telegram, WhatsApp, ВКонтакте -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="{p["title"]} — FERRO DESIGN">
  <meta property="og:description" content="{p["meta_desc"]}">
  <meta property="og:image" content="{p["og_image"]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{p["title"]} — FERRO DESIGN">
  <meta name="twitter:description" content="{p["meta_desc"]}">
  <meta name="twitter:image" content="{p["og_image"]}">

  <!-- Динамический анимированный фавикон F-E-R-R-O (генерируется script.js) -->
  <link rel="icon" id="dynamicFavicon" type="image/png" href="favicon.png">

  <!-- Шрифты Google Fonts: Unbounded (акцентные заголовки) и Manrope (основной текст) -->
  <link rel="stylesheet" href="style.css?v=2">

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": "Дизайн интерьера {p["title"]}",
    "description": "{p["meta_desc"]}",
    "creator": {{
      "@type": "HomeAndConstructionBusiness",
      "name": "FERRO DESIGN™"
    }}
  }}
  </script>
</head>
<body>

  <!-- ============================================================
       ФИКСИРОВАННАЯ ШАПКА С ЭФФЕКТОМ СТЕКЛА
  ============================================================ -->
  <header class="glass-header">
    <div class="header-inner">
      <a href="index.html" class="logo-link">
        <img src="images/logo.png" alt="FERRO DESIGN" class="header-logo-img" onerror="this.style.display='none'; document.getElementById('txt-logo').style.display='block';">
        <span id="txt-logo" class="logo-brand-text" style="display: none;">FERRO DESIGN™</span>
      </a>

      <nav class="desktop-nav">
        <a href="projects.html" class="nav-link">Все проекты</a>
        <a href="index.html" class="nav-link">На главную</a>
      </nav>
    </div>
  </header>

  <!-- ============================================================
       ГЛАВНЫЙ ЭКРАН (HERO 100vh) В СТИЛЕ YODEZEEN
  ============================================================ -->
  <section class="project-intro">
    <div class="project-intro-bg">
      <img src="{p["hero_image"]}" alt="{p["title"]}" class="hero-bg-layer hero-bg-day is-active" fetchpriority="high">
      <div class="project-intro-overlay"></div>
    </div>

    <div class="project-intro-container">
      <h1 class="project-title">{p["title"]}</h1>

      <div class="project-intro-bottom">
        <div class="project-yodezeen-specs">
          <!-- Левая колонка -->
          <div class="specs-col specs-col-left">
            <div class="specs-group">
              <span class="specs-label">Город</span>
              <span class="specs-val">{p["city"]}</span>
            </div>
            <div class="specs-group">
              <span class="specs-label">Площадь</span>
              <span class="specs-val">{p["area"]}</span>
            </div>
          </div>

          <!-- Правая колонка -->
          <div class="specs-col specs-col-right">
            <div class="specs-group">
              <span class="specs-label">Категория</span>
              <span class="specs-val">{p["category"]}</span>
            </div>
            <div class="specs-group">
              <span class="specs-label">Год реализации</span>
              <span class="specs-val">{p["year"]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================
       СЕКЦИИ ПОМЕЩЕНИЙ И ГАЛЕРЕЯ РЕНДЕРОВ
  ============================================================ -->
  <main class="project-body">
'''

    # Rooms and items
    for room in p["rooms"]:
        html += f'''
    <!-- ==========================================
         {room["name"]} (#{room["id"]})
    ========================================== -->
    <div class="room-header" id="{room["id"]}">
      <h2 class="room-name">{room["name"]}</h2>
    </div>
'''
        for item in room["items"]:
            if item["type"] == "full":
                html += f'''
    <figure class="media-block">
      <div class="js-tilt">
        <img src="{item["src"]}" alt="{room["name"]} — {item["cap"]}" loading="lazy" decoding="async">
      </div>
      <figcaption>{item["cap"]}</figcaption>
    </figure>
'''
            elif item["type"] == "full_compact":
                html += f'''
    <figure class="media-block" style="max-width: 800px; margin-left: auto; margin-right: auto;">
      <div class="js-tilt">
        <img src="{item["src"]}" alt="{room["name"]} — {item["cap"]}" loading="lazy" decoding="async">
      </div>
      <figcaption>{item["cap"]}</figcaption>
    </figure>
'''
            elif item["type"] == "diptych":
                (src1, cap1), (src2, cap2) = item["items"]
                html += f'''
    <div class="diptych-grid">
      <figure>
        <div class="js-tilt">
          <img src="{src1}" alt="{room["name"]} — {cap1}" loading="lazy" decoding="async">
        </div>
        <figcaption>{cap1}</figcaption>
      </figure>
      <figure>
        <div class="js-tilt">
          <img src="{src2}" alt="{room["name"]} — {cap2}" loading="lazy" decoding="async">
        </div>
        <figcaption>{cap2}</figcaption>
      </figure>
    </div>
'''

    # Floating room nav
    html += '''
    <!-- ============================================================
         ПЛАВАЮЩЕЕ МЕНЮ НАВИГАЦИИ ПО КОМНАТАМ
    ============================================================ -->
    <nav class="hw-room-nav" id="hwRoomNav" aria-label="Навигация по помещениям">
'''
    for idx, room in enumerate(p["rooms"]):
        active_cls = ' active' if idx == 0 else ''
        html += f'      <a href="#{room["id"]}" class="hw-room-link{active_cls}">{room["nav"]}</a>\n'

    html += f'''    </nav>

    <!-- ============================================================
         ПЕРЕХОД К СЛЕДУЮЩЕМУ КЕЙСУ
    ============================================================ -->
    <div class="next-case-bar">
      <span class="next-sub">Следующий проект</span>
      <a href="{p["next_url"]}" class="next-title">
        <span>{p["next_title"]}</span>
        <svg class="next-arrow-svg" viewBox="0 0 56 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M2 12H52M52 12L41 2M52 12L41 22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </main>

  <!-- ============================================================
       СЕКЦИЯ КОНТАКТОВ И ФОРМА ЗАЯВКИ
  ============================================================ -->
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-grid">
        <div class="contact-col-info">
          <h2 class="contact-title">Контакты</h2>
          <p class="contact-intro">
            Готовы обсудить ваш проект? Оставьте заявку или свяжитесь с нами удобным способом.
          </p>

          <div class="contact-details">
            <div class="contact-detail-row">
              <span class="detail-label">Локация</span>
              <span class="detail-val">Екатеринбург, ул. Розы Люксембург, 17</span>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Телефон</span>
              <a href="tel:+79634426192" class="detail-val">+7 (963) 442-61-92</a>
            </div>
            <div class="contact-detail-row">
              <span class="detail-label">Email</span>
              <a href="mailto:artem1-nt@mail.ru" class="detail-val">artem1-nt@mail.ru</a>
            </div>
          </div>
        </div>

        <div class="contact-col-form">
          <form class="contact-form">
            <input type="text" name="website" style="display:none;" tabindex="-1" autocomplete="off">
            <div class="form-group">
              <label for="userName" class="form-label">Ваше имя</label>
              <input type="text" id="userName" name="name" class="form-input" placeholder="Егор" required>
            </div>

            <div class="form-group">
              <label for="userPhone" class="form-label">Телефон или Telegram</label>
              <input type="tel" id="userPhone" name="contact" class="form-input" placeholder="+7 (___) ___-__-__" required>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="userCity" class="form-label">Город</label>
                <input type="text" id="userCity" name="city" class="form-input" placeholder="Екатеринбург">
              </div>
              <div class="form-group">
                <label for="userArea" class="form-label">Площадь (м²)</label>
                <input type="number" id="userArea" name="area" class="form-input" placeholder="120">
              </div>
            </div>

            <div class="form-group">
              <label for="userComment" class="form-label">Комментарий к проекту</label>
              <textarea id="userComment" name="comment" class="form-input form-textarea" rows="3" placeholder="Расскажите о планировке, сроках и пожеланиях..."></textarea>
            </div>

            <button type="submit" class="btn-submit">Отправить заявку</button>
            <div class="form-privacy-note">
              Нажимая кнопку «Отправить заявку», вы соглашаетесь с условиями <a href="privacy.html" target="_blank">Политики конфиденциальности</a> и даете согласие на обработку персональных данных.
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
  
  <!-- ============================================================
       ПОДВАЛ В СТИЛЕ YODEZEEN: СОЦСЕТИ, БРЕНД И ЮРИДИЧЕСКИЙ БЛОК
  ============================================================ -->
  <footer class="site-footer">
    <!-- 1. Иконки соцсетей студии (YouTube, Pinterest, Telegram) -->
    <div class="footer-socials">
      <!-- YouTube -->
      <a href="https://www.youtube.com/@ferrodesign7446/featured" target="_blank" rel="noopener" class="footer-social-btn" aria-label="YouTube">
        <img src="images/LOGO_SOCIALS/youtube.png" alt="YouTube">
      </a>
      <!-- Pinterest -->
      <a href="https://ru.pinterest.com/ferro_design_ekb/" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Pinterest">
        <img src="images/LOGO_SOCIALS/pinterest.png" alt="Pinterest">
      </a>
      <!-- Telegram -->
      <a href="https://t.me/ferrodesign_ekb" target="_blank" rel="noopener" class="footer-social-btn" aria-label="Telegram">
        <img src="images/LOGO_SOCIALS/telegram.png" alt="Telegram">
      </a>
    </div>

    <!-- Монументальная выдвигающаяся надпись FERRO DESIGN на всю ширину страницы -->
    <div class="footer-brand-banner">
      <div class="footer-brand-title" id="footerBrandTitle">FERRO DESIGN<span class="footer-brand-tm">™</span></div>
    </div>

    <!-- 2. Нижняя строка: копирайт с ИП, центрированное меню и юридический статус -->
    <div class="footer-bottom-bar">
      <div class="footer-copy">© 2026 FERRO DESIGN™. ИП СОКОЛОВА Н.В.</div>
      <ul class="footer-links">
        <li><a href="projects.html">ПРОЕКТЫ</a></li>
        <li><a href="index.html#services">УСЛУГИ</a></li>
        <li><a href="about.html">О НАС</a></li>
        <li><a href="privacy.html">ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</a></li>
        <li><a href="index.html#contact">КОНТАКТЫ</a></li>
      </ul>
      <div class="footer-credits">НЕ ЯВЛЯЕТСЯ ПУБЛИЧНОЙ ОФЕРТОЙ</div>
    </div>
  </footer>

  <!-- Скрипт сайта (интерактивный Lightbox галереи, tilt, плавный скролл, форма) -->
  <script src="script.js?v=2"></script>
</body>
</html>
'''
    return html

def main():
    for p in projects_data:
        html = render_project(p)
        filepath = p["filename"]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Generated {filepath} successfully.")

if __name__ == '__main__':
    main()
