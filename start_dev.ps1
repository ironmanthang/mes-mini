# Start Backend Infrastructure
Write-Host "Starting Docker containers..." -ForegroundColor Cyan
Set-Location "d:\program\mes-mini\backend"
docker compose up -d

# Start Prisma Studio in a new window
Write-Host "Starting Prisma Studio..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\program\mes-mini\backend'; npm run prisma-studio"

# Start Frontend in a new window
Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location 'd:\program\mes-mini\frontend'; npm run dev"

Write-Host "All systems are booting up!" -ForegroundColor Green
Read-Host "Press Enter to close this window"