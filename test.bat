@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ======================================================
echo       Antigravity Localization Mod Test Suite
echo ======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Running Translation Engine Unit Tests...
node test_pipeline.js
if %errorlevel% neq 0 (
    echo [ERROR] Translation engine test failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Running Locale Files Integrity and Coverage Tests...
node test_locales.js
if %errorlevel% neq 0 (
    echo [ERROR] Locale files validation failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Running Live Antigravity UI Test...
node test_live.js
if %errorlevel% neq 0 (
    echo [ERROR] Live UI test failed!
    pause
    exit /b 1
)

echo ======================================================
echo  [SUCCESS] All Antigravity i18n Tests Passed!
echo ======================================================
echo.
pause
