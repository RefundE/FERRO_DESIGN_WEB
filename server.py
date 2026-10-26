# -*- coding: utf-8 -*-
"""
FERRO DESIGN™ — High Performance Local Server & Admin API
Powered by Starlette & Uvicorn.
Serves public landing pages, admin panel and secure REST API.
"""

import os
import sys
import json
import time
import hmac
import base64
import hashlib
import secrets
import io
import shutil
from datetime import datetime
from typing import Optional, Dict, Any, List

# Reconfigure console streams for UTF-8 on Windows
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.requests import Request
from starlette.responses import JSONResponse, Response, FileResponse
from starlette.staticfiles import StaticFiles
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.datastructures import UploadFile

# Optional Pillow for server-side WebP optimization
try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

# Base paths
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(ROOT_DIR, "data")
BACKUPS_DIR = os.path.join(DATA_DIR, "backups")
IMAGES_DIR = os.path.join(ROOT_DIR, "images")
ADMIN_DIR = os.path.join(ROOT_DIR, "admin")
CONTENT_FILE = os.path.join(DATA_DIR, "site-content.json")
CONFIG_FILE = os.path.join(ROOT_DIR, "admin_config.json")

# Ensure critical directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BACKUPS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# ==============================================================================
# CONFIGURATION & AUTHENTICATION MANAGER
# ==============================================================================

def load_config() -> Dict[str, Any]:
    """Loads configuration from admin_config.json with safe defaults."""
    default_config = {
        "server": {
            "host": "127.0.0.1",
            "port": 8000
        },
        "auth": {
            "password": "ferro2026",
            "token_secret": "ferro_secret_key_change_in_production_2026"
        },
        "studio": {
            "name": "FERRO DESIGN™",
            "city": "Екатеринбург"
        }
    }
    if not os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(default_config, f, ensure_ascii=False, indent=2)
            return default_config
        except Exception:
            return default_config

    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            user_config = json.load(f)
            # Merge with defaults
            merged = default_config.copy()
            if isinstance(user_config.get("server"), dict):
                merged["server"].update(user_config["server"])
            if isinstance(user_config.get("auth"), dict):
                merged["auth"].update(user_config["auth"])
            if isinstance(user_config.get("studio"), dict):
                merged["studio"].update(user_config["studio"])
            return merged
    except Exception as e:
        print(f"[WARN] Error reading config file {CONFIG_FILE}: {e}. Using defaults.")
        return default_config

CURRENT_CONFIG = load_config()
TOKEN_SECRET = CURRENT_CONFIG.get("auth", {}).get("token_secret", "ferro_secret_2026").encode("utf-8")
SESSION_TTL_SECONDS = 7 * 24 * 3600  # 7 days

# In-memory session tokens registry
ACTIVE_SESSIONS: Dict[str, float] = {}

def create_session_token() -> str:
    """Generates a cryptographically signed session token with expiry timestamp."""
    random_part = secrets.token_hex(16)
    timestamp = int(time.time())
    payload = f"{random_part}.{timestamp}"
    signature = hmac.new(TOKEN_SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    token = f"{payload}.{signature}"
    ACTIVE_SESSIONS[token] = timestamp + SESSION_TTL_SECONDS
    return token

def is_valid_token(token: Optional[str]) -> bool:
    """Validates session token signature and expiration."""
    if not token or not isinstance(token, str):
        return False

    parts = token.split(".")
    if len(parts) != 3:
        return False

    random_part, timestamp_str, received_sig = parts
    try:
        created_at = int(timestamp_str)
    except ValueError:
        return False

    # Check expiration
    now = time.time()
    if now - created_at > SESSION_TTL_SECONDS or now < created_at:
        return False

    # Verify HMAC signature
    payload = f"{random_part}.{timestamp_str}"
    expected_sig = hmac.new(TOKEN_SECRET, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(received_sig, expected_sig):
        return False

    return True

def extract_token_from_request(request: Request) -> Optional[str]:
    """Extracts session token from Authorization header or custom header."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    custom_token = request.headers.get("x-auth-token")
    if custom_token:
        return custom_token.strip()
    return request.query_params.get("token")

# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

async def api_login(request: Request) -> Response:
    """
    POST /api/auth/login
    Validates admin password and returns session token.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            {"status": "error", "message": "Некорректный JSON в теле запроса"},
            status_code=400
        )

    provided_password = body.get("password", "")
    config = load_config()
    configured_password = config.get("auth", {}).get("password", "ferro2026")

    # Support plaintext comparison or SHA-256 match
    provided_hash = hashlib.sha256(provided_password.encode("utf-8")).hexdigest()
    is_match = (provided_password == configured_password) or (provided_hash == configured_password)

    if not is_match:
        return JSONResponse(
            {"status": "error", "message": "Неверный пароль администратора"},
            status_code=401
        )

    token = create_session_token()
    studio_name = config.get("studio", {}).get("name", "FERRO DESIGN™")
    return JSONResponse({
        "status": "ok",
        "message": "Успешная авторизация",
        "token": token,
        "expiresIn": SESSION_TTL_SECONDS,
        "studio": studio_name
    })

async def api_auth_check(request: Request) -> Response:
    """
    GET /api/auth/check
    Checks if current session token is valid and active.
    """
    token = extract_token_from_request(request)
    if is_valid_token(token):
        return JSONResponse({
            "status": "ok",
            "valid": True,
            "message": "Сессия активна"
        })
    else:
        return JSONResponse(
            {
                "status": "error",
                "valid": False,
                "message": "Сессия не авторизована или токен истек"
            },
            status_code=401
        )

async def api_get_content(request: Request) -> Response:
    """
    GET /api/content
    Returns the parsed site-content.json.
    """
    try:
        if not os.path.exists(CONTENT_FILE):
            return JSONResponse(
                {"status": "error", "message": f"Файл {CONTENT_FILE} не найден на сервере"},
                status_code=404
            )
        with open(CONTENT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(
            data,
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
        )
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"Ошибка чтения site-content.json: {str(e)}"},
            status_code=500
        )

async def api_save_content(request: Request) -> Response:
    """
    POST /api/content
    Validates content, creates automatic timestamped backup and updates site-content.json.
    """
    try:
        try:
            content = await request.json()
        except Exception:
            return JSONResponse(
                {"status": "error", "message": "Некорректный JSON в теле запроса"},
                status_code=400
            )

        if not isinstance(content, dict):
            return JSONResponse(
                {"status": "error", "message": "Данные сайта должны быть объектом JSON"},
                status_code=400
            )

        # Validate structure basics
        if "projects" not in content and "home" not in content:
            return JSONResponse(
                {"status": "error", "message": "Отсутствуют ключевые разделы сайта (home, projects)"},
                status_code=400
            )

        # 1. Create backup if current file exists
        backup_filename = None
        if os.path.exists(CONTENT_FILE):
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"site-content-{timestamp}.json"
            backup_path = os.path.join(BACKUPS_DIR, backup_filename)
            shutil.copy2(CONTENT_FILE, backup_path)

        # 2. Save new content atomically
        temp_file = CONTENT_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(content, f, ensure_ascii=False, indent=2)
        os.replace(temp_file, CONTENT_FILE)

        return JSONResponse({
            "status": "ok",
            "message": "Контент сайта успешно сохранен",
            "backup": backup_filename
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"Ошибка при сохранении контента: {str(e)}"},
            status_code=500
        )

async def api_upload_image(request: Request) -> Response:
    """
    POST /api/upload
    Accepts image file (multipart/form-data or JSON base64),
    optimizes/converts to WebP if applicable, and saves into images/{FOLDER}/.
    """
    try:
        content_type = request.headers.get("content-type", "").lower()
        file_bytes: Optional[bytes] = None
        filename: str = ""
        target_folder: str = "GENERAL"

        # 1. Handle multipart/form-data upload
        if "multipart/form-data" in content_type:
            form = await request.form()
            upload_item = form.get("file")
            target_folder = str(form.get("folder", "GENERAL")).strip()
            if not upload_item or not hasattr(upload_item, "read"):
                return JSONResponse(
                    {"status": "error", "message": "Поле 'file' обязательно для загрузки"},
                    status_code=400
                )
            filename = upload_item.filename or "upload.webp"
            file_bytes = await upload_item.read()

        # 2. Handle JSON base64 upload
        elif "application/json" in content_type:
            body = await request.json()
            target_folder = str(body.get("folder", "GENERAL")).strip()
            filename = body.get("filename", "upload.webp")
            raw_data = body.get("data") or body.get("base64", "")
            if not raw_data:
                return JSONResponse(
                    {"status": "error", "message": "Отсутствуют данные файла в JSON (data/base64)"},
                    status_code=400
                )
            if "," in raw_data:
                raw_data = raw_data.split(",", 1)[1]
            file_bytes = base64.b64decode(raw_data)
        else:
            return JSONResponse(
                {"status": "error", "message": f"Неподдерживаемый Content-Type: {content_type}"},
                status_code=400
            )

        if not file_bytes:
            return JSONResponse(
                {"status": "error", "message": "Загружаемый файл пуст"},
                status_code=400
            )

        # Sanitize folder and filename (prevent path traversal)
        clean_folder = "".join(c for c in target_folder if c.isalnum() or c in ("_", "-")).strip()
        if not clean_folder:
            clean_folder = "GENERAL"

        base_name = os.path.basename(filename)
        name_root, ext = os.path.splitext(base_name)
        clean_name_root = "".join(c for c in name_root if c.isalnum() or c in ("_", "-")).strip() or "render"

        dest_dir = os.path.join(IMAGES_DIR, clean_folder)
        os.makedirs(dest_dir, exist_ok=True)

        final_filename = f"{clean_name_root}.webp"
        final_path = os.path.join(dest_dir, final_filename)

        # Image processing & WebP auto-conversion
        ext_lower = ext.lower()
        if HAS_PILLOW and ext_lower in (".jpg", ".jpeg", ".png", ".webp"):
            try:
                with Image.open(io.BytesIO(file_bytes)) as img:
                    # Convert palettes or transparency cleanly
                    if img.mode in ("RGBA", "P"):
                        if ext_lower != ".png":
                            img = img.convert("RGB")
                    elif img.mode != "RGB":
                        img = img.convert("RGB")

                    # Downscale ultra-high resolution renders (>2560px) for high performance
                    max_dim = max(img.size)
                    if max_dim > 2560:
                        img.thumbnail((2560, 2560), Image.Resampling.LANCZOS)

                    img.save(final_path, "WEBP", quality=86, method=6)
            except Exception as conv_err:
                # Fallback to direct write if Pillow encounters format issue
                print(f"[WARN] Pillow conversion warning: {conv_err}. Saving original bytes.")
                final_filename = f"{clean_name_root}{ext}"
                final_path = os.path.join(dest_dir, final_filename)
                with open(final_path, "wb") as f:
                    f.write(file_bytes)
        else:
            # Direct save
            if not ext_lower:
                final_filename = f"{clean_name_root}.webp"
            else:
                final_filename = f"{clean_name_root}{ext_lower}"
            final_path = os.path.join(dest_dir, final_filename)
            with open(final_path, "wb") as f:
                f.write(file_bytes)

        saved_size = os.path.getsize(final_path)
        rel_path = f"images/{clean_folder}/{final_filename}"

        return JSONResponse({
            "status": "ok",
            "message": "Файл успешно сохранен на сервере",
            "path": rel_path,
            "filename": final_filename,
            "folder": clean_folder,
            "size": saved_size
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"Ошибка загрузки файла: {str(e)}"},
            status_code=500
        )

async def api_publish(request: Request) -> Response:
    """
    POST /api/publish
    Updates data/site-content.json (if provided) and publishes all site pages to disk.
    Accepts:
      - optional 'content': full siteContent object
      - optional 'files': pre-rendered files dictionary { 'index.html': '...', ... }
    If 'files' is omitted, invokes builder.py to generate all pages directly from site-content.json.
    """
    try:
        body: Dict[str, Any] = {}
        try:
            body = await request.json()
        except Exception:
            body = {}

        # 1. If content is supplied in publish request, save it first
        new_content = body.get("content")
        if new_content and isinstance(new_content, dict):
            # Backup
            if os.path.exists(CONTENT_FILE):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = os.path.join(BACKUPS_DIR, f"site-content-{timestamp}.json")
                shutil.copy2(CONTENT_FILE, backup_path)
            # Save
            with open(CONTENT_FILE, "w", encoding="utf-8") as f:
                json.dump(new_content, f, ensure_ascii=False, indent=2)

        published_files: List[str] = []

        # 2. Check if pre-rendered files dictionary was supplied
        files_dict = body.get("files")
        if files_dict and isinstance(files_dict, dict) and len(files_dict) > 0:
            allowed_prefixes = ("project-", "index.", "projects.", "about.", "sitemap.", "privacy.")
            for fname, fcontent in files_dict.items():
                clean_fname = os.path.basename(fname)
                if not any(clean_fname.startswith(p) for p in allowed_prefixes):
                    continue
                target_file_path = os.path.join(ROOT_DIR, clean_fname)
                with open(target_file_path, "w", encoding="utf-8") as f:
                    f.write(fcontent)
                published_files.append(clean_fname)
        else:
            # 3. Use builder to generate all pages from site-content.json
            import builder
            published_files = builder.generate_pages()

        # 4. Автоматическая синхронизация с GitHub (Git commit & push)
        git_sync_info = {"status": "skipped", "message": "Синхронизация с Git пропущена"}
        sync_git = body.get("syncGit", True)
        if sync_git:
            try:
                import subprocess
                subprocess.run(["git", "add", "-A"], cwd=ROOT_DIR, check=False)
                subprocess.run(
                    ["git", "commit", "-m", "Обновление контента сайта через админ-панель"],
                    cwd=ROOT_DIR, capture_output=True, text=True, check=False
                )
                p_res = subprocess.run(
                    ["git", "push", "origin", "main"],
                    cwd=ROOT_DIR, capture_output=True, text=True, check=False
                )
                if p_res.returncode == 0:
                    git_sync_info = {"status": "ok", "message": "Синхронизировано с GitHub Pages"}
                else:
                    err_msg = (p_res.stderr or p_res.stdout or "Ошибка отправки в Git").strip()
                    git_sync_info = {"status": "warning", "message": f"Сохранено локально, но ошибка GitHub: {err_msg}"}
            except Exception as ge:
                git_sync_info = {"status": "warning", "message": f"Ошибка Git: {str(ge)}"}

        return JSONResponse({
            "status": "ok",
            "message": f"Сайт успешно опубликован! Обновлено страниц: {len(published_files)}",
            "publishedFiles": published_files,
            "gitSync": git_sync_info
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"Ошибка публикации сайта: {str(e)}"},
            status_code=500
        )

# ==============================================================================
# STARLETTE APPLICATION SETUP
# ==============================================================================

routes = [
    # REST API endpoints
    Route("/api/auth/login", api_login, methods=["POST"]),
    Route("/api/auth/check", api_auth_check, methods=["GET"]),
    Route("/api/content", api_get_content, methods=["GET"]),
    Route("/api/content", api_save_content, methods=["POST"]),
    Route("/api/upload", api_upload_image, methods=["POST"]),
    Route("/api/publish", api_publish, methods=["POST"]),

    # Admin Panel static files (/admin and /admin/...)
    Mount("/admin", app=StaticFiles(directory=ADMIN_DIR, html=True), name="admin"),

    # Public Landing Page static files (/ and all root assets)
    Mount("/", app=StaticFiles(directory=ROOT_DIR, html=True), name="public"),
]

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

app = Starlette(debug=False, routes=routes, middleware=middleware)

# ==============================================================================
# MAIN ENTRY POINT
# ==============================================================================

def main():
    import uvicorn

    config = load_config()
    server_cfg = config.get("server", {})
    host = server_cfg.get("host", "127.0.0.1")
    port = int(server_cfg.get("port", 8000))
    studio = config.get("studio", {}).get("name", "FERRO DESIGN™")

    print("=" * 64)
    print(f"  {studio} — Сервер сайта и админ-панели")
    print("=" * 64)
    print(f"  > Публичный сайт:   http://{host}:{port}/")
    print(f"  > Панель админки:   http://{host}:{port}/admin/")
    print(f"  > API эндпоинты:    http://{host}:{port}/api/content")
    print(f"  > Pillow (WebP):    {'Подключен' if HAS_PILLOW else 'Не установлен'}")
    print("  Для остановки сервера нажмите Ctrl + C")
    print("=" * 64)

    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    main()
