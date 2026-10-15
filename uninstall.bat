@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ======================================================
echo    Antigravity 2.0 Language Switcher Mod Uninstaller
echo ======================================================
echo.

node uninstall.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Uninstallation failed.
    pause
    exit /b 1
)

echo.
pause
