@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ======================================================
echo    Antigravity 2.0 Language Switcher Mod Builder
echo ======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [*] Installing dependencies: asar...
    call npm install --no-fund --no-audit
)

node build.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
pause
