@echo off
echo 🚀 Starting PipLinePro Development Environment...
echo.

REM Check if virtual environment exists
if not exist .venv (
    echo ❌ Virtual environment not found. Please run setup first.
    pause
    exit /b 1
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call .venv\Scripts\activate.bat

REM Start Flask backend in background
echo 🐍 Starting Flask backend...
start "Flask Backend" cmd /c "python app.py"

REM Wait a moment for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Start React frontend
echo ⚛️ Starting React frontend...
cd frontend
npm run dev

echo.
echo ✅ Development environment started!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
pause
