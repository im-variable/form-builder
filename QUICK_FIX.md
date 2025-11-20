# Quick Fix: Port 8000 Conflict

## Problem
You're getting 404 errors because port 8000 is being used by a Django application, not your FastAPI Form Engine.

## Solution

### Option 1: Use Port 8001 (Recommended)

Start the FastAPI server on port 8001:

```bash
PORT=8001 python3 -m uvicorn app.main:app --reload --port 8001
```

Then update your frontend `.env` file:
```env
VITE_API_URL=http://localhost:8001/api/v1
```

### Option 2: Stop Django and Use Port 8000

Find and stop the Django process:
```bash
# Find the process
lsof -ti:8000

# Kill it (replace PID with actual number)
kill -9 <PID>

# Then start FastAPI
python3 -m uvicorn app.main:app --reload
```

### Option 3: Use the Updated run.sh Script

The `run.sh` script now automatically detects port conflicts:

```bash
./run.sh
```

It will ask if you want to use port 8001 instead.

## Verify It's Working

After starting the server, test these endpoints:

```bash
# Health check
curl http://localhost:8001/health

# Get forms (should return empty array if no forms)
curl http://localhost:8001/api/v1/builder/forms

# API docs
open http://localhost:8001/docs
```

## Update Frontend

If you changed the port, update `frontend/.env`:

```env
VITE_API_URL=http://localhost:8001/api/v1
```

Then restart the frontend dev server.

