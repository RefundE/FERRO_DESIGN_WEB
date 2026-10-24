import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/site-content.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=== CHECKING SECTIONS IN DATA/SITE-CONTENT.JSON ===")

# 1. home
home = data["home"]
assert "hero" in home and home["hero"]["title"] == "FERRO DESIGN"
assert len(home["hero"]["slides"]) == 2
assert len(home["services"]) == 3
for s in home["services"]:
    assert s["num"] and s["name"] and s["desc"] and s["price"]
assert "manifesto" in home["aboutSection"] and len(home["aboutSection"]["stats"]) == 4
for st in home["aboutSection"]["stats"]:
    assert "target" in st and "label" in st
assert home["contacts"]["location"] == "Екатеринбург, ул. Розы Люксембург, 17"
assert home["contacts"]["phone"] == "+7 (963) 442-61-92"
assert home["contacts"]["phoneHref"] == "tel:+79634426192"
assert home["contacts"]["email"] == "artem1-nt@mail.ru"
print("✓ 1. home section: OK")

# 2. aboutPage
about = data["aboutPage"]
assert about["title"] == "О студии FERRO DESIGN™"
assert len(about["steps"]) == 4
for st in about["steps"]:
    assert st["num"] and st["title"] and st["text"]
assert len(about["faq"]) == 6
for fq in about["faq"]:
    assert fq["question"] and fq["answer"]
assert len(about["supervisionHtml"]) > 50
assert len(about["geoHtml"]) > 50
print("✓ 2. aboutPage section: OK")

# 3. homeProjectsOrder
assert len(data["homeProjectsOrder"]) == 6
assert data["homeProjectsOrder"] == [
    "project-nekrasova.html",
    "project-makarovsky.html",
    "project-nomer-otel.html",
    "project-a-frames.html",
    "project-hmao.html",
    "project-pub-tagil.html"
]
print("✓ 3. homeProjectsOrder: OK")

# 4. allProjectsOrder
assert len(data["allProjectsOrder"]) == 15
print("✓ 4. allProjectsOrder: OK")

# 5. roomPrefixDictionary
assert len(data["roomPrefixDictionary"]) >= 15
for k, v in data["roomPrefixDictionary"].items():
    assert "prefix" in v and "id" in v and "nav" in v
print("✓ 5. roomPrefixDictionary: OK")

# 6. projects
assert len(data["projects"]) == 15
total_images = 0
for p in data["projects"]:
    assert p["id"]
    assert p["filename"]
    assert p["folder"]
    assert p["title"]
    assert p["cardTitle"]
    assert p["metaDesc"]
    assert p["ogImage"].startswith("http")
    assert p["heroDay"]
    assert p["cardImage"]
    assert p["city"]
    assert p["cardCity"]
    assert p["mapCity"]
    assert len(p["coords"]) == 2
    assert p["specsCategory"] in ("Квартира", "Загородный дом", "Коммерческий объект")
    assert p["filterCategory"] in ("flats", "houses", "commercial")
    assert p["badgeLabel"] in ("Жилая квартира", "Загородный дом", "Коммерческий объект")
    assert isinstance(p["area"], int) and p["area"] > 0
    assert p["year"]
    assert len(p["rooms"]) > 0

    for r in p["rooms"]:
        assert r["id"] and r["name"] and r["nav"] and r["prefix"]
        assert len(r["items"]) > 0
        for it in r["items"]:
            assert it["type"] in ("full", "full_compact", "diptych")
            if it["type"] in ("full", "full_compact"):
                assert "src" in it and "cap" in it
                total_images += 1
            elif it["type"] == "diptych":
                assert len(it["items"]) == 2
                assert len(it["items"][0]) == 2 and len(it["items"][1]) == 2
                total_images += 2

print(f"✓ 6. projects: all 15 projects verified with {total_images} total render images!")
print("\n✨ ALL CHECKS PASSED WITH 100% SUCCESS! ✨")
