# Quick Start Guide

## Installation

### Using pyenv (Recommended)

1. **Set Python version:**
   ```bash
   pyenv local 3.11.0  # or your preferred version
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

### Without pyenv

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   # Option 1: Using the run script
   ./run.sh
   
   # Option 2: Using uvicorn directly
   uvicorn app.main:app --reload
   ```

3. **Access the API:**
   - API Base URL: http://localhost:8000
   - Interactive Docs (Swagger): http://localhost:8000/docs
   - Alternative Docs (ReDoc): http://localhost:8000/redoc

## Quick Test

### 1. Create a Simple Form

```bash
curl -X POST "http://localhost:8000/api/v1/builder/forms" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Form",
    "description": "A simple test form",
    "is_active": true
  }'
```

Save the `form_id` from the response.

### 2. Create a Page

```bash
curl -X POST "http://localhost:8000/api/v1/builder/pages" \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": 1,
    "title": "First Page",
    "description": "Welcome page",
    "order": 1,
    "is_first": true
  }'
```

Save the `page_id` from the response.

### 3. Add a Field

```bash
curl -X POST "http://localhost:8000/api/v1/builder/fields" \
  -H "Content-Type: application/json" \
  -d '{
    "page_id": 1,
    "name": "name",
    "label": "Your Name",
    "field_type": "text",
    "order": 1,
    "is_required": true
  }'
```

### 4. Render the Form

```bash
curl -X POST "http://localhost:8000/api/v1/renderer/render" \
  -H "Content-Type: application/json" \
  -d '{
    "form_id": 1,
    "session_id": "test-session-123"
  }'
```

### 5. Submit an Answer

```bash
curl -X POST "http://localhost:8000/api/v1/submission/submit-answer" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "field_id": 1,
    "value": "John Doe"
  }'
```

## Using Python Examples

For more comprehensive examples, see the `examples/` directory:

1. **Create a complex form:**
   ```bash
   python examples/create_form_example.py
   ```

2. **Submit answers:**
   ```bash
   python examples/submit_form_example.py
   ```

## Key Concepts

### Field Types
- `text`, `textarea`, `number`, `email`, `phone`
- `date`, `datetime`
- `select`, `multiselect`, `radio`, `checkbox`
- `boolean`, `file`, `rating`

### Condition Operators
- `equals`, `not_equals`
- `greater_than`, `less_than`, `greater_equal`, `less_equal`
- `contains`, `not_contains`
- `in`, `not_in`
- `is_empty`, `is_not_empty`

### Condition Actions
- `show` / `hide` - Control field visibility
- `enable` / `disable` - Control field interactivity
- `require` - Make field required
- `skip` - Skip field

### Page Navigation
- Use navigation rules to route users to different pages based on answers
- Set `is_default: true` for fallback navigation
- Leave `target_page_id: null` to mark form as complete

## Architecture

The service is organized into three main components:

1. **Form Builder** (`/api/v1/builder`)
   - Create and manage forms, pages, fields
   - Define field conditions
   - Set up page navigation rules

2. **Form Renderer** (`/api/v1/renderer`)
   - Render forms based on current answers
   - Evaluate field visibility conditions
   - Determine next page to show

3. **Submission Service** (`/api/v1/submission`)
   - Create submission sessions
   - Store field answers
   - Track submission progress

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Check [examples/README.md](examples/README.md) for example usage
- Explore the interactive API docs at http://localhost:8000/docs

