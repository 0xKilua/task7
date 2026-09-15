@echo off
REM Demarrage de l'application - double-cliquer sur ce fichier.
REM Contrairement au script PowerShell, un .bat n'est pas soumis a la
REM politique d'execution de PowerShell.

cd /d "%~dp0"
title Appui conseiller mobilite-carriere

echo === Appui conseiller mobilite-carriere ===
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js est introuvable.
    echo Installez la version LTS depuis https://nodejs.org puis relancez ce fichier.
    echo.
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node --version') do echo Node.js detecte : %%v

if not exist "node_modules" (
    echo.
    echo Installation des dependances ^(quelques minutes la premiere fois^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo Echec de l'installation.
        echo Si l'erreur concerne better-sqlite3 ou node-gyp, il manque les outils de
        echo compilation C++ : relancez l'installateur Node.js en cochant
        echo "Tools for Native Modules", ou installez Visual Studio Build Tools.
        echo.
        pause
        exit /b 1
    )
) else (
    echo Dependances deja installees.
)

echo.
echo Demarrage du serveur... ^(Ctrl+C pour arreter^)
echo Ouvrez http://localhost:3000 des que "Ready" s'affiche ci-dessous.
echo.
call npm run dev

pause
