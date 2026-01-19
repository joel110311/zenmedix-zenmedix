# Script de Automatización ZenMedix
# Solo dale doble clic (Ejecutar con PowerShell) para subir tus cambios.

$projectPath = "C:\Users\Joel W11\Documents\Desarrollos\medflow"
$repoUrl = "https://github.com/joel110311/zenmedix-zenmedix.git"

Clear-Host
Write-Host "🚀 Iniciando Vibe Coding Sync..." -ForegroundColor Cyan

Set-Location $projectPath

# Verificar estado
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ Todo está actualizado. No hay cambios pendientes." -ForegroundColor Green
    Start-Sleep -Seconds 2
    exit
}

# Subir cambios
git add .
$commitMsg = Read-Host "💬 ¿Qué hiciste hoy? (Enter para automático)"
if ([string]::IsNullOrWhiteSpace($commitMsg)) { $commitMsg = "Actualización automática: Avance del proyecto" }

git commit -m "$commitMsg"
git push origin main

Write-Host "✨ ¡Código sincronizado en la nube!" -ForegroundColor Green
Pause