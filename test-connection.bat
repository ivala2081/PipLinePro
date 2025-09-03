@echo off
echo 🧪 Testing Backend Connection...
echo.

REM Check if backend is running
echo 🔍 Checking if Flask backend is running on port 5000...
netstat -an | find "5000" > nul
if %errorlevel% == 0 (
    echo ✅ Port 5000 is in use - Backend appears to be running
) else (
    echo ❌ Port 5000 is not in use - Backend is not running
    echo 💡 Please start the backend first with: python app.py
    pause
    exit /b 1
)

echo.
echo 🌐 Testing API endpoint...
curl -f http://127.0.0.1:5000/api/v1/health/ 2>nul
if %errorlevel% == 0 (
    echo ✅ API endpoint is responding
) else (
    echo ❌ API endpoint is not responding
    echo 💡 Check if the backend is properly configured
)

echo.
echo 🔍 Checking if frontend is running on port 3000...
netstat -an | find "3000" > nul
if %errorlevel% == 0 (
    echo ✅ Port 3000 is in use - Frontend appears to be running
) else (
    echo ❌ Port 3000 is not in use - Frontend is not running
    echo 💡 Please start the frontend with: cd frontend && npm run dev
)

echo.
echo 📊 Connection test complete!
pause
