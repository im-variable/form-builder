#!/bin/bash

# Start the FastAPI server
# This script will check if port 8000 is available, if not, use 8001

PORT=8000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port $PORT is already in use. Using port 8001 instead."
    PORT=8001
fi

echo "Starting FastAPI server on port $PORT..."
echo "API will be available at: http://localhost:$PORT"
echo "API docs at: http://localhost:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT

