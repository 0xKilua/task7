# Démarrage de l'application sur Windows (PowerShell)
# Usage : clic droit sur le fichier > "Exécuter avec PowerShell"
#     ou : .\demarrer.ps1

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host "=== Appui conseiller mobilite-carriere ===" -ForegroundColor Cyan

try {
    $versionNode = (node --version).TrimStart('v')
} catch {
    Write-Host "Node.js est introuvable." -ForegroundColor Red
    Write-Host "Installez la version LTS depuis https://nodejs.org puis relancez ce script."
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

$majeur = [int]($versionNode.Split('.')[0])
Write-Host "Node.js detecte : v$versionNode"
if ($majeur -lt 20 -or $majeur -gt 22) {
    Write-Host "Version testee : Node 20 a 22. La v$majeur peut poser probleme (module natif better-sqlite3)." -ForegroundColor Yellow
}

Write-Host "`nVerification des dependances (rapide si rien n'a change, plus long apres une mise a jour du projet)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nEchec de l'installation." -ForegroundColor Red
    Write-Host "Si l'erreur concerne better-sqlite3 / node-gyp, il manque les outils de compilation C++ :"
    Write-Host "  relancez l'installateur Node.js et cochez 'Tools for Native Modules',"
    Write-Host "  ou installez Visual Studio Build Tools (charge de travail 'Desktop development with C++')."
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

# Un cache de build laisse par une version precedente peut provoquer des erreurs
# "Failed to fetch" une fois le code mis a jour : on repart propre.
if (Test-Path '.next') {
    Write-Host "Nettoyage du cache de build precedent..."
    Remove-Item -Recurse -Force '.next'
}

Write-Host "`nDemarrage du serveur... (Ctrl+C pour arreter)" -ForegroundColor Green
Write-Host "Ouvrez http://localhost:3000 des que 'Ready' s'affiche ci-dessous.`n"
npm run dev
