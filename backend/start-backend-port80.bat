@echo off
echo Starting WhizUnik Portal Backend on Port 80...

echo.
echo === Configuration Check ===
echo Checking PORT configuration...
findstr /C:"PORT=" .env
echo.
echo Checking PM2 configuration...
if exist "ecosystem.config.js" (
    echo ✅ PM2 config found
) else (
    echo ❌ PM2 config not found
)

echo.
echo === Starting Backend ===
echo Installing dependencies...
call npm install --production

echo.
echo Starting with PM2...
call pm2 start ecosystem.config.js --env production

echo.
echo === Status Check ===
call pm2 status

echo.
echo === Testing ===
echo Waiting 3 seconds for startup...
timeout /t 3 /nobreak > nul

echo Testing health endpoint...
curl -s http://localhost:80/health

echo.
echo === Backend Started ===
echo Backend should be running on port 80
echo Test with: curl http://localhost:80/health
echo Check logs with: pm2 logs whizunik-backend
echo Stop with: pm2 stop whizunik-backend

pause