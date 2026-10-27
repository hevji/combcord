@echo off
setlocal EnableExtensions
title CombCord

rem ---------------------------------------------------------------------------
rem  CombCord - one script for build, inject, setup and status
rem
rem    combcord.bat            Build + inject + start Discord (default)
rem    combcord.bat run        Same as above
rem    combcord.bat build      Sync plugin source + build Vencord
rem    combcord.bat inject     Patch the current build, then start Discord
rem    combcord.bat setup      Create/update the Vencord fork and dependencies
rem    combcord.bat watch      Rebuild on file changes (leave this window open)
rem    combcord.bat start      Only start Discord
rem    combcord.bat status     Show fork path, version and state
rem    combcord.bat help       Show this list
rem ---------------------------------------------------------------------------

set "ROOT=%~dp0"
set "VENCORD_DIR=%ROOT%vencord-fork"
if defined COMBORD_VENCORD_DIR set "VENCORD_DIR=%COMBORD_VENCORD_DIR%"

set "PLUGIN_SRC=%ROOT%vencord-plugin\combcord"
set "PLUGIN_DST=%VENCORD_DIR%\src\plugins\combcord"

set "PNPM=pnpm"
where pnpm >nul 2>&1 || set "PNPM=%APPDATA%\npm\pnpm.cmd"

set "CMD=%~1"
if "%CMD%"=="" set "CMD=run"

if /i "%CMD%"=="run"    goto :run
if /i "%CMD%"=="build"  goto :build
if /i "%CMD%"=="inject" goto :inject
if /i "%CMD%"=="patch"   goto :patch
if /i "%CMD%"=="setup"  goto :setup
if /i "%CMD%"=="watch"  goto :watch
if /i "%CMD%"=="start"  goto :start
if /i "%CMD%"=="status" goto :status
if /i "%CMD%"=="help"   goto :usage
if /i "%CMD%"=="-h"     goto :usage
if /i "%CMD%"=="--help" goto :usage

echo Unknown command: %CMD%
echo.
goto :usage


rem ===========================================================================
:run
call :build
if errorlevel 1 goto :failed
call :inject
if errorlevel 1 goto :failed
echo.
echo Done. CombCord built and Discord is starting.
goto :eof


rem ===========================================================================
:build
call :require_setup
if errorlevel 1 exit /b 1

echo.
echo [1/2] Syncing plugin source into the Vencord fork...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%vencord-plugin\install.ps1" -VencordPath "%VENCORD_DIR%" -SkipBuild
if errorlevel 1 exit /b 1

echo.
echo [2/2] Building Vencord...
pushd "%VENCORD_DIR%"
call "%PNPM%" run build
set "BUILD_ERR=%ERRORLEVEL%"
popd
if not "%BUILD_ERR%"=="0" exit /b 1
exit /b 0


rem ===========================================================================
:inject
if not exist "%VENCORD_DIR%\dist\renderer.js" (
    echo No build found in %VENCORD_DIR%\dist
    echo Run: combcord.bat build
    exit /b 1
)

echo.
echo IMPORTANT: Close Discord manually before continuing.
echo            (Right-click tray icon -> Quit Discord)
echo.
pause

echo Starting Discord (loads from %VENCORD_DIR%\dist\)...
call :start_discord
exit /b 0


rem ===========================================================================
:patch
if not exist "%VENCORD_DIR%\dist\renderer.js" (
    echo No build found in %VENCORD_DIR%\dist
    echo Run: combcord.bat build
    exit /b 1
)

echo.
echo IMPORTANT: Close Discord manually before patching.
echo            (Right-click tray icon -> Quit Discord)
echo.
pause

echo Patching Discord app.asar (run only on first install or Discord update)...
pushd "%VENCORD_DIR%"
node scripts/runInstaller.mjs -- -repair -branch stable
set "PATCH_ERR=%ERRORLEVEL%"
popd
if not "%PATCH_ERR%"=="0" (
    echo Patch failed.
    exit /b 1
)

call :start_discord
exit /b 0


rem ===========================================================================
:setup
echo Setting up the Vencord fork at:
echo   %VENCORD_DIR%
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%vencord-plugin\install.ps1" -VencordPath "%VENCORD_DIR%"
if errorlevel 1 exit /b 1
echo.
echo Setup complete.
goto :eof


rem ===========================================================================
:watch
call :require_setup
if errorlevel 1 goto :failed
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%vencord-plugin\install.ps1" -VencordPath "%VENCORD_DIR%" -SkipBuild
if errorlevel 1 goto :failed
echo.
echo Watching for changes. Run "combcord.bat inject" in another window to test.
echo Press Ctrl+C to stop.
pushd "%VENCORD_DIR%"
call "%PNPM%" run build -- --watch
popd
goto :eof


rem ===========================================================================
:start
call :start_discord
goto :eof


rem ===========================================================================
:status
echo CombCord status
echo ----------------
echo Project:       %ROOT%
echo Vencord fork:  %VENCORD_DIR%
if exist "%VENCORD_DIR%\package.json" (echo Fork:          present) else (echo Fork:          MISSING - run: combcord.bat setup)
if exist "%PLUGIN_DST%\index.tsx" (echo Plugin source: present) else (echo Plugin source: MISSING)
if exist "%VENCORD_DIR%\dist\renderer.js" (echo Build:         present) else (echo Build:         MISSING - run: combcord.bat build)
set "VER="
for /f "tokens=5 delims= " %%v in ('findstr /c:"VERSION =" "%PLUGIN_SRC%\version.ts" 2^>nul') do set "VER=%%v"
if not defined VER goto :status_discord
set "VER=%VER:"=%"
set "VER=%VER:;=%"
echo Plugin version: %VER%
:status_discord
tasklist /FI "IMAGENAME eq Discord.exe" 2>nul | find /I "Discord.exe" >nul && (echo Discord:       running) || (echo Discord:       not running)
goto :eof


rem ===========================================================================
:usage
echo.
echo CombCord commands
echo ----------------
echo   combcord.bat            Build + start Discord (prompts to close Discord)
echo   combcord.bat build      Sync plugin source + build Vencord
echo   combcord.bat inject     Prompts to close Discord, then starts Discord (loads from dist)
echo   combcord.bat patch      Prompts to close Discord, patches app.asar, starts Discord
echo   combcord.bat setup      Create/update the Vencord fork and dependencies
echo   combcord.bat watch      Rebuild on file changes
echo   combcord.bat start      Only start Discord
echo   combcord.bat status     Show fork path, version and state
echo.
echo NOTE: inject and patch will prompt you to manually close Discord first.
echo       (Right-click Discord tray icon -> Quit Discord)
echo.
echo Vencord fork location:
echo   %VENCORD_DIR%
echo.
echo Override it by setting COMBORD_VENCORD_DIR before running this script.
goto :eof


rem ===========================================================================
:require_setup
if exist "%VENCORD_DIR%\package.json" exit /b 0
echo Vencord fork not found at %VENCORD_DIR%
echo Running setup first...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%vencord-plugin\install.ps1" -VencordPath "%VENCORD_DIR%"
exit /b %ERRORLEVEL%


rem ===========================================================================
:start_discord
if exist "%LOCALAPPDATA%\Discord\Update.exe" (
    start "" "%LOCALAPPDATA%\Discord\Update.exe" --processStart Discord.exe
) else (
    echo Could not find Discord at %LOCALAPPDATA%\Discord
)
exit /b 0


rem ===========================================================================
:failed
echo.
echo CombCord command failed. See the output above.
pause
exit /b 1
