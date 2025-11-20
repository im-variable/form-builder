# Troubleshooting Guide

## Common Issues and Solutions

### 1. Port 8000 Already in Use / 404 Errors

**Symptoms:**
- Getting 404 errors when accessing API endpoints
- Error shows Django URLs instead of FastAPI routes
- Port 8000 is already in use

**Solution:**

**Option 1: Use a different port**
```bash
PORT=8001 python3 -m uvicorn app.main:app --reload --port 8001
```

Then update your frontend `.env` file:
```env
VITE_API_URL=http://localhost:8001/api/v1
```

**Option 2: Stop the other application**
```bash
# Find what's using port 8000
lsof -ti:8000

# Kill it (replace PID with actual process ID)
kill -9 <PID>
```

**Option 3: Use the updated run script**
The `run.sh` script now automatically detects port conflicts and offers to use port 8001:
```bash
./run.sh
```

### 2. Import Errors / Module Not Found

**Symptoms:**
- `ModuleNotFoundError: No module named 'fastapi'`
- `Import "fastapi" could not be resolved` (IDE warning)

**Solution:**
```bash
pip install -r requirements.txt
```

If using pyenv for Python version management:
```bash
# Install Python version (if not already installed)
pyenv install 3.10.14

# Set local Python version for this project
pyenv local 3.10.14

# Install dependencies
pip install -r requirements.txt
```

Or if you prefer a virtual environment with pyenv:
```bash
# Create virtual environment using pyenv's Python
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Command Not Found: uvicorn

**Symptoms:**
- `pyenv: uvicorn: command not found`
- `uvicorn: command not found`
- Scripts installed but not on PATH

**Solution:**

**Option 1: Use python -m uvicorn (Recommended)**
```bash
python3 -m uvicorn app.main:app --reload
```

**Option 2: Update run.sh**
The `run.sh` script has been updated to use `python3 -m uvicorn` instead of just `uvicorn`.

**Option 3: Add to PATH**
If scripts are installed in a non-standard location:
```bash
# Find where pip installed scripts
python3 -m pip show -f uvicorn | grep Location

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="$PATH:/path/to/scripts"
```

### 4. Python Version Mismatch

**Symptoms:**
- `pyenv: version '3.11.0' is not installed`
- `.python-version` specifies a version you don't have

**Solution:**
```bash
# Check available versions
pyenv versions

# Install the required version
pyenv install 3.10.14  # or 3.11.0, etc.

# Or update .python-version to match an installed version
pyenv local 3.10.14
```

### 5. Database Connection Issues

**Symptoms:**
- `OperationalError: unable to open database file`
- SQLite database locked

**Solution:**
- Check file permissions on `form_builder.db`
- Ensure no other process is using the database
- Delete `form_builder.db` to recreate it (will lose data)

### 6. SQLAlchemy Relationship Errors

**Symptoms:**
- `Could not determine join condition between parent/child tables`
- Relationship errors

**Solution:**
This should be fixed in the current version. If you see this:
1. Delete `form_builder.db`
2. Restart the server (tables will be recreated)

### 7. CORS Issues (Frontend Integration)

**Symptoms:**
- CORS errors in browser console
- Requests blocked by browser

**Solution:**
CORS is already configured in `app/main.py` with `allow_origins=["*"]`. If you need specific origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 8. Field Condition Not Working

**Symptoms:**
- Fields not showing/hiding as expected
- Conditions not evaluating correctly

**Solution:**
1. Check that field names match exactly (case-sensitive)
2. Verify condition operator and value
3. Ensure answers are submitted before checking visibility
4. Check the render endpoint response for `is_visible` field

### 9. Page Navigation Not Working

**Symptoms:**
- Not navigating to next page
- Stuck on same page

**Solution:**
1. Verify navigation rules are created for the page
2. Check that source field value matches condition
3. Ensure `target_page_id` is set correctly
4. Check if `is_default` rule exists as fallback

### 10. Session Not Found

**Symptoms:**
- `Submission with session_id X not found`

**Solution:**
1. Create submission first: `POST /api/v1/submission/create`
2. Use the same `session_id` for all requests
3. Session persists in database, so it survives server restarts

## Verification Steps

Run the verification script:
```bash
python3 verify_setup.py
```

This checks:
- ✓ All imports
- ✓ Database connection
- ✓ API routes

## Getting Help

1. **Check the logs:**
   ```bash
   python3 -m uvicorn app.main:app --reload --log-level debug
   ```

2. **Test individual endpoints:**
   - Use the Swagger UI: http://localhost:8000/docs (or your port)
   - Or use curl/Postman

3. **Check database:**
   ```bash
   sqlite3 form_builder.db
   .tables
   SELECT * FROM forms;
   ```

4. **Run examples:**
   ```bash
   python3 examples/create_form_example.py
   python3 examples/submit_form_example.py
   ```

## Common Commands

```bash
# Start server (recommended - avoids PATH issues)
python3 -m uvicorn app.main:app --reload

# Start on different port (if 8000 is in use)
PORT=8001 python3 -m uvicorn app.main:app --reload --port 8001

# Start with debug logging
python3 -m uvicorn app.main:app --reload --log-level debug

# Verify setup
python3 verify_setup.py

# Check Python version
python3 --version  # Should be 3.8+

# Check installed packages
pip list | grep -E "(fastapi|sqlalchemy|pydantic)"

# Check pyenv version
pyenv version
pyenv versions

# Check what's using a port
lsof -i:8000
```

## Environment Variables

Create a `.env` file (optional):
```env
DATABASE_URL=sqlite:///./form_builder.db
SECRET_KEY=your-secret-key-here
DEBUG=True
```

Default database is SQLite. For PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost/dbname
```

## Frontend Configuration

If you change the backend port, update the frontend `.env` file:

```env
VITE_API_URL=http://localhost:8001/api/v1
```

Then restart the frontend dev server.
