    #!/bin/bash

# SAB Needlepoint Application Startup Script
echo "🧵 Starting SAB Needlepoint Application..."

# Navigate to the backend directory
cd "$(dirname "$0")/backend"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if requirements are installed
if [ ! -f "needlepoint.db" ]; then
    echo "📦 Installing dependencies..."
    python3 -m pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies. Please check your Python installation."
        exit 1
    fi
fi

# Start the application
echo "🚀 Starting the web application..."
echo "📍 The application will be available at: http://localhost:5001"
echo "🛑 Press Ctrl+C to stop the application"
echo ""

python3 app.py
