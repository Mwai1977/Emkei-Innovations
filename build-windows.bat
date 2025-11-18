@echo off
echo ========================================
echo NVI Investment Dashboard Builder
echo Building Windows Installer
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 2: Building Windows installer...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo SUCCESS! Installer created!
echo ========================================
echo.
echo Your installer is located at:
echo %CD%\dist\NVI Investment Dashboard Setup 1.0.0.exe
echo.
echo You can now:
echo 1. Install it on this computer
echo 2. Copy it to other Windows computers
echo 3. Share it via USB, email, or cloud storage
echo.
pause
