#!/bin/bash
# Start FastAPI backend on 127.0.0.1:8000

PORT=8000
HOST=127.0.0.1

# Kill any process on port 8000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -ti:$PORT)
    echo "Stopping process $PID on port $PORT..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

echo "Starting FastAPI server on $HOST:$PORT..."
echo "API: http://$HOST:$PORT"
echo "Docs: http://$HOST:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 -m uvicorn app.main:app --reload --host $HOST --port $PORT
