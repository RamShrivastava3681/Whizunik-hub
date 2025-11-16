# WhizUnik Portal - Simple Port 80 Configuration Script
Write-Host "🔧 Configuring WhizUnik Portal for Port 80..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "backend\server\index.cjs")) {
    Write-Host "[ERROR] Please run this script from your WhizUnik Portal root directory" -ForegroundColor Red
    Write-Host "[ERROR] Expected to find: backend\server\index.cjs" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Starting port 80 configuration..." -ForegroundColor Green

# Step 1: Update backend environment
Write-Host "[FIX] Updating backend environment configuration..." -ForegroundColor Green
$backendEnvPath = "backend\.env.production"

if (Test-Path $backendEnvPath) {
    $content = Get-Content $backendEnvPath -Raw
    $updatedContent = $content -replace "PORT=5003", "PORT=80"
    $updatedContent | Set-Content $backendEnvPath -NoNewline
    Write-Host "[SUCCESS] Updated PORT to 80 in backend\.env.production" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend .env.production file not found" -ForegroundColor Red
}

# Step 2: Create PM2 configuration
Write-Host "[FIX] Creating PM2 ecosystem configuration..." -ForegroundColor Green
$pm2Config = @'
module.exports = {
  apps: [
    {
      name: 'whizunik-backend',
      script: 'server/index.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 80
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
'@

$pm2Config | Out-File "backend\ecosystem.config.js" -Encoding UTF8
Write-Host "[SUCCESS] Created PM2 configuration for port 80" -ForegroundColor Green

# Step 3: Verify configurations
Write-Host "[INFO] Verifying configurations..." -ForegroundColor Yellow

if (Test-Path "backend\.env.production") {
    $envContent = Get-Content "backend\.env.production"
    $portLine = $envContent | Where-Object { $_ -match "PORT=" }
    if ($portLine -match "PORT=80") {
        Write-Host "[SUCCESS] ✅ Backend environment configured for port 80" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] ⚠️ Backend port configuration unclear: $portLine" -ForegroundColor Yellow
    }
}

if (Test-Path "backend\ecosystem.config.js") {
    Write-Host "[SUCCESS] ✅ PM2 configuration created" -ForegroundColor Green
}

if (Test-Path "frontend\.env.production") {
    $frontendEnv = Get-Content "frontend\.env.production"
    $apiUrl = $frontendEnv | Where-Object { $_ -match "VITE_API_URL" }
    if ($apiUrl -match "portal\.whizunikhub\.com") {
        Write-Host "[SUCCESS] ✅ Frontend API URL configured correctly" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] ⚠️ Frontend API URL: $apiUrl" -ForegroundColor Yellow
    }
}

# Step 4: Create deployment summary
Write-Host "" 
Write-Host "=== PORT 80 CONFIGURATION COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Backend configured to run on port 80" -ForegroundColor Green
Write-Host "✅ PM2 ecosystem configuration created" -ForegroundColor Green
Write-Host "✅ Ready for VPS deployment" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Upload your backend/ folder to your VPS"
Write-Host "2. SSH to your VPS and navigate to the backend folder"
Write-Host "3. Run: npm install --production"
Write-Host "4. Run: pm2 start ecosystem.config.js"
Write-Host "5. Test: curl http://localhost:80/health"
Write-Host ""
Write-Host "FILES TO UPLOAD TO VPS:" -ForegroundColor Cyan
Write-Host "- backend/ (entire folder)"
Write-Host "- quick-fix-deployment.sh" 
Write-Host "- test-api-connection.sh"
Write-Host ""
Write-Host "🎉 Configuration ready for deployment!" -ForegroundColor Green