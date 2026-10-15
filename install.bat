@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ======================================================
echo    Antigravity 2.0 Language Switcher Mod Installer
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
    echo [1/3] Installing dependencies: asar...
    call npm install --no-fund --no-audit
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

echo [2/3] Installing mod into Antigravity...
node install.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed.
    pause
    exit /b 1
)

echo.
pause
