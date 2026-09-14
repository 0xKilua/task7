@echo off
chcp 65001 >nul
title Carnet de Fer
cd /d "%~dp0"

echo ==========================================
echo            CARNET DE FER
echo ==========================================
echo.

echo [1/3] Recuperation de la derniere version...
call git pull
if errorlevel 1 (
  echo.
  echo   Mise a jour impossible ^(pas de connexion ?^).
  echo   On continue avec la version deja presente.
)
echo.

if not exist "node_modules" (
  echo [2/3] Premiere installation, compte environ 30 secondes...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo   ERREUR : l'installation a echoue.
    echo   Verifie que Node.js est installe ^(node -v^).
    echo.
    pause
    exit /b 1
  )
) else (
  echo [2/3] Dependances deja installees.
)
echo.

echo [3/3] Demarrage du site...
echo.
echo   Le navigateur s'ouvrira des que le site sera pret.
echo   GARDE CETTE FENETRE OUVERTE pendant que tu l'utilises.
echo   Pour arreter : ferme cette fenetre.
echo.

REM Attend que le serveur reponde vraiment avant d'ouvrir le navigateur :
REM un delai fixe ouvrait parfois la page avant que Next.js soit pret, d'ou
REM un ERR_CONNECTION_REFUSED. PowerShell -Command n'est pas soumis a la
REM politique d'execution, qui ne bloque que les fichiers .ps1.
start "" powershell -NoProfile -WindowStyle Hidden -Command "for($i=0; $i -lt 120; $i++){ try { $null = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2; Start-Process 'http://localhost:3000'; break } catch { Start-Sleep -Seconds 1 } }"

call npm.cmd run dev

echo.
echo Le serveur s'est arrete.
pause
