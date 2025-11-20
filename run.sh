#!/bin/bash

# Run the FastAPI application
# Use python -m uvicorn to avoid PATH issues

PORT=8000
HOST=127.0.0.1

# Check if port 8000 is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -ti:$PORT)
    echo "⚠️  Port $PORT is already in use by process $PID!"
    echo "   Another application (possibly Django) is running on port 8000."
    echo ""
    echo "To stop it, run:"
    echo "  kill -9 $PID"
    echo ""
    echo "Or use a different port:"
    echo "  PORT=8001 ./run.sh"
    echo ""
    read -p "Do you want to kill the process on port 8000 and start FastAPI? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping process $PID..."
        kill -9 $PID 2>/dev/null
        sleep 1
        echo "Process stopped."
    else
        echo "Exiting. Please stop the application on port 8000 manually."
        exit 1
    fi
fi

echo "Starting FastAPI server on $HOST:$PORT..."
echo "API: http://$HOST:$PORT"
echo "Docs: http://$HOST:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 -m uvicorn app.main:app --reload --host $HOST --port $PORT

