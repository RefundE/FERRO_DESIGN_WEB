@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FERRO DESIGN — Сервер сайта и админ-панели

python --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Python не обнаружен в вашей системе!
    echo Установите Python 3 с официального сайта: https://www.python.org/
    echo Обязательно отметьте "Add Python to PATH" при установке.
    pause
    exit /b 1
)

start "" http://localhost:8000/admin/
python server.py
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Сервер был остановлен с ошибкой.
    pause
)
