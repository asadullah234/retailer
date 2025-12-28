@echo off
echo ========================================
echo    RetailPro - Retail Management System
echo ========================================
echo.

echo Starting RetailPro...
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Starting backend server...
start cmd /k "npm run dev"

echo.
echo Step 3: Starting frontend server...
cd ..
cd frontend
start cmd /k "python -m http.server 3000"

echo.
echo ========================================
echo RetailPro is now running!
echo.
echo Backend API: http://localhost:5000
echo Frontend:    http://localhost:3000
echo.
echo Open your browser and navigate to:
echo - Signup: http://localhost:3000/signup.html
echo - Login:  http://localhost:3000/login.html
echo ========================================
echo.
pause
