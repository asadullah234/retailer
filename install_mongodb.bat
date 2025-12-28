@echo off
echo ========================================
echo    MongoDB Installation Helper
echo ========================================
echo.

echo Downloading MongoDB Community Server...
echo This will download MongoDB 7.0 for Windows
echo.

echo Please wait while we download MongoDB...
powershell -Command "& {Invoke-WebRequest -Uri 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.4-signed.msi' -OutFile 'mongodb-installer.msi'}"

if not exist mongodb-installer.msi (
    echo Error: Download failed. Please download MongoDB manually from:
    echo https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)

echo.
echo Download complete! Installing MongoDB...
echo Please follow the installation wizard...
echo.

echo Running installer...
start /wait mongodb-installer.msi

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Add MongoDB to PATH: C:\Program Files\MongoDB\Server\7.0\bin
echo 2. Create data directory: mkdir C:\data\db
echo 3. Start MongoDB: mongod
echo.

pause
