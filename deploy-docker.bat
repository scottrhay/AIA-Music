@echo off
REM SunoApp Docker Deployment Script for Windows
REM Builds and deploys SunoApp containers with proper configuration

echo ====================================
echo    SunoApp Docker Deployment
echo ====================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it
    echo    copy .env.example .env
    exit /b 1
)
echo [OK] Environment file found

REM Check if frontend build exists
if not exist frontend\build (
    echo [WARNING] Frontend build directory not found
    echo Building frontend...
    cd frontend
    call npm install
    call npm run build
    cd ..
    echo [OK] Frontend built successfully
) else (
    echo [OK] Frontend build exists
)

echo.
echo Stopping existing containers...
docker-compose down 2>nul

echo.
echo Building Docker images...
docker-compose build --no-cache

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

echo.
echo Container Status:
docker-compose ps

echo.
echo Checking backend health...
docker exec sunoapp python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" 2>nul && echo [OK] Backend is healthy || echo [WARNING] Backend health check failed

echo.
echo Checking nginx...
docker exec sunoapp-nginx wget --no-verbose --tries=1 --spider http://localhost/ 2>nul && echo [OK] Nginx is healthy || echo [WARNING] Nginx health check failed

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo Your SunoApp is now running:
echo   - Backend: http://localhost:5000
echo   - Frontend: https://suno.aiacopilot.com
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop:
echo   docker-compose down
echo.
pause
