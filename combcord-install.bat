@echo off
setlocal EnableExtensions
title CombCord Installer

rem ---------------------------------------------------------------------------
rem  CombCord Installer - one-time setup
rem
rem  Installs prerequisites, clones Vencord fork, builds plugin, patches Discord
rem ---------------------------------------------------------------------------

echo.
echo ============================================================
echo   CombCord Installer
echo ============================================================
echo.

rem Check for admin (needed for some operations)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: Not running as Administrator.
    echo Some operations may fail. Consider re-running as Admin.
    echo.
)

rem ---------------------------------------------------------------------------
rem 1. Check/Install Prerequisites
rem ---------------------------------------------------------------------------
echo [1/6] Checking prerequisites...

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git not found in PATH.
    echo Install from https://git-scm.com/
    pause
    exit /b 1
)
echo   Git: OK

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found in PATH.
    echo Install Node.js 22+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('node --version') do set NODE_VER=%%v
echo   Node.js: %NODE_VER% OK

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo   pnpm not found, installing via npm...
    npm install -g pnpm@11.9.0
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install pnpm
        pause
        exit /b 1
    )
)
echo   pnpm: OK

rem ---------------------------------------------------------------------------
rem 2. Clone/Update Vencord fork
rem ---------------------------------------------------------------------------
echo.
echo [2/6] Setting up Vencord fork...

set "VENCORD_DIR=%~dp0vencord-fork"

if exist "%VENCORD_DIR%\package.json" (
    echo   Fork exists, updating...
    pushd "%VENCORD_DIR%"
    git pull --ff-only
    popd
) else (
    echo   Cloning Vencord (shallow)... 
    git clone --depth 1 https://github.com/Vendicated/Vencord.git "%VENCORD_DIR%"
    if %errorlevel% neq 0 (
        echo ERROR: Failed to clone Vencord
        pause
        exit /b 1
    )
)

rem ---------------------------------------------------------------------------
rem 3. Sync plugin source
rem ---------------------------------------------------------------------------
echo.
echo [3/6] Syncing CombCord plugin...

set "PLUGIN_SRC=%~dp0vencord-plugin\combcord"
set "PLUGIN_DST=%VENCORD_DIR%\src\plugins\combcord"

if not exist "%PLUGIN_SRC%\index.tsx" (
    echo ERROR: Plugin source not found at %PLUGIN_SRC%
    pause
    exit /b 1
)

rmdir /s /q "%PLUGIN_DST%" 2>nul
mkdir "%PLUGIN_DST%"
xcopy /E /I /Q "%PLUGIN_SRC%\*" "%PLUGIN_DST%\"
echo   Plugin synced to %PLUGIN_DST%

rem ---------------------------------------------------------------------------
rem 4. Install Vencord dependencies
rem ---------------------------------------------------------------------------
echo.
echo [4/6] Installing Vencord dependencies (this may take a while)... 
pushd "%VENCORD_DIR%"
pnpm install
if %errorlevel% neq 0 (
    echo ERROR: pnpm install failed
    popd
    pause
    exit /b 1
)
popd
echo   Dependencies installed

rem ---------------------------------------------------------------------------
rem 5. Build Vencord with plugin
rem ---------------------------------------------------------------------------
echo.
echo [5/6] Building Vencord...
pushd "%VENCORD_DIR%"
pnpm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    popd
    pause
    exit /b 1
)
popd
echo   Build complete

rem ---------------------------------------------------------------------------
rem 6. Patch Discord (first install only)
rem ---------------------------------------------------------------------------
echo.
echo [6/6] Patching Discord...
echo.
echo IMPORTANT: You must manually CLOSE DISCORD now.
echo            (Right-click Discord tray icon -> Quit Discord)
echo.
echo Press any key when Discord is fully closed...
pause >nul

pushd "%VENCORD_DIR%"
node scripts/runInstaller.mjs -- -repair -branch stable
set "PATCH_ERR=%ERRORLEVEL%"
popd

if not "%PATCH_ERR%"=="0" (
    echo.
    echo ERROR: Patch failed. Discord may not be fully closed.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Installation complete!
echo ============================================================
echo.
echo Next steps:
echo   1. Start Discord (combcord.bat start)
echo   2. Settings -> Vencord -> Plugins -> Enable "CombCord"
echo   3. Click gear icon next to CombCord to configure
echo.
echo For daily updates, use: combcord.bat build && combcord.bat inject
echo.
pause