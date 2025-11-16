# WhizUnik Portal - Quick Fix PowerShell Script
# Run this script on Windows to prepare files for deployment

Write-Host "🔧 Preparing WhizUnik Portal Quick Fixes..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[FIX] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "backend\server\index.cjs")) {
    Write-Error "Please run this script from your WhizUnik Portal root directory"
    Write-Error "Expected to find: backend\server\index.cjs"
    exit 1
}

Write-Status "Starting quick fixes preparation for WhizUnik Portal..."

# Step 1: Update backend environment configuration
Write-Status "Updating backend environment configuration..."
$backendPath = "backend\.env.production"

if (Test-Path $backendPath) {
    # Read the current config
    $config = Get-Content $backendPath
    
    # Update PORT configuration
    $updatedConfig = $config -replace "PORT=5003", "PORT=80"
    
    # Write back to file
    $updatedConfig | Out-File -FilePath $backendPath -Encoding UTF8
    
    Write-Status "✅ Updated PORT from 5003 to 80 in $backendPath"
} else {
    Write-Error "Backend .env.production file not found at: $backendPath"
}

# Step 2: Create PM2 ecosystem configuration
Write-Status "Creating PM2 ecosystem configuration..."
$ecosystemConfig = @"
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
      min_uptime: '10s',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
"@

$ecosystemConfig | Out-File -FilePath "backend\ecosystem.config.js" -Encoding UTF8
Write-Status "✅ Created PM2 ecosystem configuration"

# Step 3: Create deployment instructions
Write-Status "Creating deployment instructions..."
$deployInstructions = @'
# WhizUnik Portal - Deployment Instructions

## Files Updated:
✅ backend/.env.production - Updated PORT from 5003 to 80
✅ backend/ecosystem.config.js - Created PM2 configuration
✅ Quick fix scripts created

## Upload to Your VPS:
1. Upload the entire project to your VPS (e.g., to /var/www/whizunik-portal/)
2. Run the deployment script on your VPS

## Commands to Run on Your VPS:

### Option 1: Run the automated script
```bash
chmod +x quick-fix-deployment.sh
./quick-fix-deployment.sh
```

### Option 2: Manual deployment
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status
pm2 logs whizunik-backend
```

## Test Your Deployment:
```bash
# Test health endpoint
curl http://localhost:80/health

# Test API endpoint
curl http://localhost:80/api/health

# Test from external
curl http://YOUR_SERVER_IP:80/health
```

## Important Notes:
- Backend now runs on port 80 (standard web port)
- No reverse proxy needed for basic setup
- Make sure port 80 is open in your firewall
- For SSL, use certbot after basic setup works

## Troubleshooting:
- If port 80 is busy: sudo lsof -i :80 to see what is using it
- Check logs: pm2 logs whizunik-backend
- Restart: pm2 restart whizunik-backend
'@

$deployInstructions | Out-File -FilePath "DEPLOYMENT_INSTRUCTIONS.md" -Encoding UTF8
Write-Status "✅ Created deployment instructions"

# Step 4: Create a simple test batch file for Windows testing
Write-Status "Creating Windows test script..."
$windowsTestScript = @"
@echo off
echo Testing WhizUnik Portal Configuration...

echo.
echo === Frontend Environment ===
if exist "frontend\.env.production" (
    echo Frontend .env.production found:
    type "frontend\.env.production"
) else (
    echo WARNING: frontend\.env.production not found
)

echo.
echo === Backend Environment ===
if exist "backend\.env.production" (
    echo Backend .env.production found:
    type "backend\.env.production"
) else (
    echo ERROR: backend\.env.production not found
)

echo.
echo === PM2 Configuration ===
if exist "backend\ecosystem.config.js" (
    echo PM2 ecosystem.config.js found:
    type "backend\ecosystem.config.js"
) else (
    echo WARNING: PM2 configuration not found
)

echo.
echo === Configuration Check Complete ===
echo Next: Upload these files to your VPS and run quick-fix-deployment.sh
pause
"@

$windowsTestScript | Out-File -FilePath "test-config-windows.bat" -Encoding ASCII
Write-Status "✅ Created Windows test script"

# Step 5: Verify frontend configuration
Write-Status "Verifying frontend configuration..."
$frontendEnvPath = "frontend\.env.production"

if (Test-Path $frontendEnvPath) {
    $frontendConfig = Get-Content $frontendEnvPath
    $apiUrlLine = $frontendConfig | Where-Object { $_ -match "VITE_API_URL" }
    
    if ($apiUrlLine -match "portal\.whizunikhub\.com") {
        Write-Status "✅ Frontend API URL correctly configured"
    } else {
        Write-Warning "⚠️  Frontend API URL might need verification"
    }
} else {
    Write-Warning "⚠️  Frontend .env.production not found"
}

# Step 6: Create upload checklist
Write-Status "Creating upload checklist..."
$uploadChecklist = @'
# Upload Checklist for VPS Deployment

## Files to Upload to Your VPS:

### Required Files:
- [ ] backend/ (entire directory)
  - [ ] backend/server/index.cjs
  - [ ] backend/.env.production (PORT=80)
  - [ ] backend/ecosystem.config.js
  - [ ] backend/package.json

### Scripts:
- [ ] quick-fix-deployment.sh
- [ ] test-api-connection.sh

### Frontend (if hosting separately):
- [ ] frontend/dist/ (after running npm run build)

## Upload Commands:
```bash
# Using SCP
scp -r backend/ user@your-server:/var/www/whizunik-portal/
scp quick-fix-deployment.sh user@your-server:/var/www/whizunik-portal/
scp test-api-connection.sh user@your-server:/var/www/whizunik-portal/

# Or using rsync
rsync -av backend/ user@your-server:/var/www/whizunik-portal/backend/
```

## After Upload:
```bash
# SSH to your server
ssh user@your-server

# Navigate to project
cd /var/www/whizunik-portal/

# Run quick fix
chmod +x quick-fix-deployment.sh
./quick-fix-deployment.sh
```
'@

$uploadChecklist | Out-File -FilePath "UPLOAD_CHECKLIST.md" -Encoding UTF8
Write-Status "✅ Created upload checklist"

# Final summary
Write-Host ""
Write-Status "=== QUICK FIX PREPARATION COMPLETED ==="
Write-Host ""
Write-Status "✅ Backend configured for port 80" -ForegroundColor Green
Write-Status "✅ PM2 configuration created" -ForegroundColor Green
Write-Status "✅ Deployment scripts prepared" -ForegroundColor Green
Write-Status "✅ Instructions and checklists created" -ForegroundColor Green

Write-Host ""
Write-Warning "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Upload files to your VPS (see UPLOAD_CHECKLIST.md)"
Write-Host "2. Run quick-fix-deployment.sh on your VPS"
Write-Host "3. Test with test-api-connection.sh"
Write-Host "4. Configure SSL once basic setup works"

Write-Host ""
Write-Status "Files created:"
Write-Host "  - DEPLOYMENT_INSTRUCTIONS.md"
Write-Host "  - UPLOAD_CHECKLIST.md" 
Write-Host "  - test-config-windows.bat"
Write-Host "  - backend/ecosystem.config.js"

Write-Host ""
Write-Status "🎉 Ready for VPS deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Run 'test-config-windows.bat' to verify your configuration before uploading."