@echo off
REM Demarrage de l'application - double-cliquer sur ce fichier.
REM Contrairement au script PowerShell, un .bat n'est pas soumis a la
REM politique d'execution de PowerShell : ce chemin marche toujours.

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

REM Corrige une fois pour toutes le blocage "l'execution de scripts est desactivee"
REM qui empeche npm de fonctionner dans une fenetre PowerShell ouverte directement
REM (ce fichier .bat, lui, n'est jamais soumis a cette politique).
powershell -NoProfile -Command "$p = Get-ExecutionPolicy -Scope CurrentUser; if ($p -eq 'Restricted' -or $p -eq 'Undefined') { Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force }" >nul 2>&1

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
echo Demarrage du serveur dans une nouvelle fenetre...
start "Appui conseiller mobilite-carriere - serveur (ne pas fermer, Ctrl+C pour arreter)" cmd /k npm run dev

where curl >nul 2>&1
if errorlevel 1 (
    echo.
    echo Des que "Ready" s'affiche dans l'autre fenetre, ouvrez http://localhost:3000
    echo.
    pause
    exit /b 0
)

echo Attente du demarrage du serveur...
set intentos=0
:attente
set /a intentos+=1
if %intentos% GTR 90 (
    echo.
    echo Le serveur met plus de temps que prevu a demarrer.
    echo Verifiez la fenetre "...serveur" ouverte a cote : une erreur y est peut-etre affichee.
    echo Sinon, ouvrez vous-meme http://localhost:3000 des que "Ready" y apparait.
    echo.
    pause
    exit /b 1
)
curl -s -o NUL http://localhost:3000
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto attente
)

echo Serveur pret : ouverture du navigateur...
start http://localhost:3000

echo.
echo Le site est ouvert dans votre navigateur : http://localhost:3000
echo Le serveur tourne dans l'autre fenetre : ne la fermez pas tant que vous utilisez le site.
echo Cette fenetre peut etre fermee.
echo.
pause
