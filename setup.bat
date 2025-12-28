@echo off
echo ========================================
echo    RetailPro - Setup Script
echo ========================================
echo.

echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start cmd /k "npm run dev"

echo.
echo Starting frontend server...
cd ..
cd frontend
start cmd /k "npx http-server -p 3000 --cors"

echo.
echo ========================================
echo Setup Complete!
echo.
echo Servers are starting in separate windows...
echo.
echo Backend API: http://localhost:5000
echo Frontend:    http://localhost:3000
echo.
echo Open your browser and visit:
echo - Signup: http://localhost:3000/signup.html
echo - Login:  http://localhost:3000/login.html
echo.
echo Note: MongoDB connection may show errors initially.
echo Install MongoDB locally or use MongoDB Atlas for full functionality.
echo ========================================
echo.
pause
