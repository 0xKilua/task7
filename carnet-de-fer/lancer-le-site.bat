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
echo   Le site va s'ouvrir tout seul dans ton navigateur.
echo   GARDE CETTE FENETRE OUVERTE pendant que tu l'utilises.
echo   Pour arreter : ferme cette fenetre.
echo.

REM Ouvre le navigateur une fois le serveur pret, sans bloquer le demarrage.
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:3000"

call npm.cmd run dev

echo.
echo Le serveur s'est arrete.
pause
