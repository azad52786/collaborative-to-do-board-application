@echo off
echo 🐳 Starting CollabBoard MongoDB Environment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Start MongoDB and Mongo Express
echo 🚀 Starting MongoDB and Mongo Express...
docker-compose up -d

REM Wait for MongoDB to be ready
echo ⏳ Waiting for MongoDB to be ready...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB environment is ready!
    echo.
    echo 📊 Services:
    echo   • MongoDB: mongodb://localhost:27017
    echo   • Mongo Express: http://localhost:8081
    echo     - Username: admin
    echo     - Password: admin123
    echo.
    echo 🔐 Database Credentials:
    echo   • Database: collabboard
    echo   • Username: collabboard_user
    echo   • Password: collabboard_password
    echo.
    echo 🚀 You can now start the backend server with:
    echo   cd backend ^&^& npm run dev
) else (
    echo ❌ Failed to start MongoDB environment
    docker-compose logs
    exit /b 1
)
