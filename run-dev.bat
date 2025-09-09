@echo off
echo 🚀 Starting PipLinePro Development Environment...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)

REM Check if main.py exists
if not exist main.py (
    echo ❌ main.py not found. Please run this from the project root directory.
    pause
    exit /b 1
)

REM Run the main script
echo 📦 Starting both backend and frontend...
python main.py

echo.
echo 👋 PipLinePro Development Environment stopped.
pause
