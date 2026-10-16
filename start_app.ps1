# Script de Inicialização do Praticom (Backend + Frontend)

$projectRoot = $PSScriptRoot

Write-Host "🚀 Iniciando backend Node.js / Express..." -ForegroundColor Cyan
$backendRunning = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "Backend já está em execução na porta 5000." -ForegroundColor Yellow
} else {
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$projectRoot\server" -WindowStyle Hidden
}

Write-Host "🚀 Iniciando frontend Vite / React..." -ForegroundColor Cyan
Set-Location "$projectRoot\client"
npm run dev
