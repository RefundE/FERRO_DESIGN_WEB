# -*- coding: utf-8 -*-
"""
FERRO DESIGN™ — Backend Server API Test Suite
Tests all REST endpoints, static routing, backup creation and publishing.
"""

import os
import sys
import json
import base64
import time

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from starlette.testclient import TestClient
from server import app, CONTENT_FILE, BACKUPS_DIR, IMAGES_DIR

def run_tests():
    print("==================================================")
    print("   Запуск полного тестирования API server.py")
    print("==================================================")
    
    client = TestClient(app)
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] {name} - {details}")

    # 1. Test Static Routes
    print("\n1. Тестирование статических маршрутов:")
    r = client.get("/")
    assert_test("GET / (Публичный лендинг)", r.status_code == 200 and "FERRO DESIGN" in r.text)

    r = client.get("/admin/")
    assert_test("GET /admin/ (Админ-панель)", r.status_code == 200 and "FERRO" in r.text)

    r = client.get("/admin", follow_redirects=False)
    assert_test("GET /admin (Redirect на /admin/)", r.status_code in (301, 307, 308))

    # 2. Test Auth Login & Check
    print("\n2. Тестирование авторизации /api/auth/*:")
    r = client.post("/api/auth/login", json={"password": "wrong_password"})
    assert_test("POST /api/auth/login (Неверный пароль -> 401)", r.status_code == 401 and r.json().get("status") == "error")

    r = client.post("/api/auth/login", json={"password": "ferro2026"})
    login_data = r.json()
    token = login_data.get("token")
    assert_test("POST /api/auth/login (Верный пароль -> 200 + токен)", r.status_code == 200 and bool(token))

    r = client.get("/api/auth/check")
    assert_test("GET /api/auth/check (Без токена -> 401)", r.status_code == 401 and not r.json().get("valid"))

    r = client.get("/api/auth/check", headers={"Authorization": f"Bearer {token}"})
    assert_test("GET /api/auth/check (С валидным токеном -> 200)", r.status_code == 200 and r.json().get("valid") is True)

    # 3. Test Content API
    print("\n3. Тестирование контента /api/content:")
    r = client.get("/api/content")
    assert_test("GET /api/content (Получение site-content.json)", r.status_code == 200 and "home" in r.json() and "projects" in r.json())

    current_content = r.json()
    backups_before = len(os.listdir(BACKUPS_DIR)) if os.path.exists(BACKUPS_DIR) else 0

    # Save content (should trigger backup)
    r = client.post("/api/content", json=current_content)
    backups_after = len(os.listdir(BACKUPS_DIR)) if os.path.exists(BACKUPS_DIR) else 0
    assert_test("POST /api/content (Сохранение + создание бэкапа)", r.status_code == 200 and r.json().get("status") == "ok" and backups_after > backups_before)

    r = client.post("/api/content", json={"invalid": "no_home_or_projects"})
    assert_test("POST /api/content (Валидация некорректной структуры -> 400)", r.status_code == 400 and r.json().get("status") == "error")

    # 4. Test Image Upload
    print("\n4. Тестирование загрузки изображений /api/upload:")
    # Create a 10x10 dummy PNG
    from PIL import Image
    import io
    img = Image.new("RGB", (100, 100), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    r = client.post(
        "/api/upload",
        files={"file": ("test_render.png", png_bytes, "image/png")},
        data={"folder": "TEST_CASE"}
    )
    res_upload = r.json()
    assert_test(
        "POST /api/upload (Multipart PNG -> WebP авто-конвертация)",
        r.status_code == 200 and res_upload.get("path") == "images/TEST_CASE/test_render.webp"
    )

    # Verify file exists on disk
    expected_path = os.path.join(IMAGES_DIR, "TEST_CASE", "test_render.webp")
    assert_test("Файл WebP физически создан в images/TEST_CASE/", os.path.exists(expected_path))

    # Base64 JSON upload test
    b64_str = base64.b64encode(png_bytes).decode("ascii")
    r = client.post(
        "/api/upload",
        json={"filename": "base64_render.png", "folder": "TEST_CASE", "data": b64_str}
    )
    assert_test("POST /api/upload (JSON base64 -> WebP)", r.status_code == 200 and r.json().get("status") == "ok")

    # Clean up test files
    test_folder = os.path.join(IMAGES_DIR, "TEST_CASE")
    if os.path.exists(test_folder):
        import shutil
        shutil.rmtree(test_folder, ignore_errors=True)

    # 5. Test Publish API
    print("\n5. Тестирование публикации /api/publish:")
    r = client.post("/api/publish", json={})
    pub_res = r.json()
    published_files = pub_res.get("publishedFiles", [])
    assert_test(
        "POST /api/publish (Генерация всех HTML страниц и sitemap.xml)",
        r.status_code == 200 and pub_res.get("status") == "ok" and len(published_files) >= 19
    )

    print("\n==================================================")
    print(f"   Результат: {passed} из {total} тестов пройдено успешно!")
    print("==================================================")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
