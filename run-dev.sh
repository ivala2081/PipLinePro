#!/bin/bash

echo "🚀 Starting PipLinePro Development Environment..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python first."
    exit 1
fi

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo "❌ main.py not found. Please run this from the project root directory."
    exit 1
fi

# Make the script executable
chmod +x main.py

# Run the main script
echo "📦 Starting both backend and frontend..."
python3 main.py

echo
echo "👋 PipLinePro Development Environment stopped."
