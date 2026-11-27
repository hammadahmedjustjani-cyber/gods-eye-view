@echo off
setlocal EnableExtensions
title God's Eye View
cd /d "%~dp0"

echo.
echo   ============================================================
echo      GOD'S EYE VIEW  -  one-click launcher
echo   ============================================================
echo.

rem --- 1. Node.js present? -------------------------------------------------
where node >nul 2>nul
if errorlevel 1 goto NO_NODE

rem --- 2. Node.js new enough? (needs 24.14+, checked in the launcher) ------
node "launcher\gev-launch.mjs"
set "GEV_EXIT=%ERRORLEVEL%"

if "%GEV_EXIT%"=="0" goto DONE
if "%GEV_EXIT%"=="1" goto FAILED

:DONE
echo.
echo   Server closed.
echo.
pause
exit /b 0

:FAILED
echo.
echo   The launcher stopped with an error. Scroll up for the reason,
echo   or open launcher\launch.log.
echo.
pause
exit /b 1

:NO_NODE
echo   Node.js was not found on this PC.
echo.
echo   1. Go to  https://nodejs.org/
echo   2. Download the LTS installer (.msi) for Windows
echo   3. Install it with the default options
echo   4. Close this window, then double-click
echo      START-GODS-EYE-VIEW.bat again
echo.
echo   Optional: check "Automatically install the necessary tools"
echo   during setup - the app needs no compiler, but it does no harm.
echo.
pause
start "" "https://nodejs.org/en/download"
exit /b 1
