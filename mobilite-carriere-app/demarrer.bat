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

echo.
echo Verification des dependances ^(rapide si rien n'a change, plus long
echo apres une mise a jour du projet^)...
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

REM Un cache de build laisse par une version precedente peut provoquer des
REM erreurs "Failed to fetch" une fois le code mis a jour : on repart propre.
if exist ".next" (
    echo Nettoyage du cache de build precedent...
    rmdir /s /q ".next"
)

echo.
echo Demarrage du serveur... ^(Ctrl+C pour arreter^)
echo Ouvrez http://localhost:3000 des que "Ready" s'affiche ci-dessous.
echo.
call npm run dev

pause
