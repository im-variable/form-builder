# Dynamic Form Engine API

A comprehensive FastAPI microservice for building dynamic, multi-page forms with conditional logic, field dependencies, and intelligent page navigation.

## Features

- ✅ **Dynamic Fields**: Support for multiple field types (text, number, select, checkbox, etc.)
- ✅ **Field Dependencies**: Fields can show/hide, enable/disable based on other field values
- ✅ **Conditional Page Rendering**: Next page determined by current answers
- ✅ **Cross-Page Dependencies**: Conditions can reference fields from any page
- ✅ **Real-time Validation**: Field-level validation rules
- ✅ **Progress Tracking**: Track form completion progress

## Architecture

The service is organized into three main components:

1. **Form Builder Service** (`/api/v1/builder`): CRUD operations for forms, pages, fields, and conditions
2. **Form Renderer Service** (`/api/v1/renderer`): Renders forms and determines which page/fields to show
3. **Submission Service** (`/api/v1/submission`): Handles storing responses and managing submissions

## Installation

### Backend Setup

#### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

#### Setup with pyenv (Recommended)

See [SETUP.md](SETUP.md) for detailed pyenv installation and setup instructions.

Quick setup:
```bash
pyenv install 3.10.14
pyenv local 3.10.14
pip install -r requirements.txt
```

#### Setup without pyenv

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run the application:**
   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:3000

   See [frontend/README.md](frontend/README.md) for more details.

4. Access the API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Form Builder (`/api/v1/builder`)

- `POST /forms` - Create a form
- `GET /forms` - List all forms
- `GET /forms/{form_id}` - Get form details
- `PUT /forms/{form_id}` - Update form
- `DELETE /forms/{form_id}` - Delete form

- `POST /pages` - Create a page
- `GET /pages/{page_id}` - Get page details
- `GET /forms/{form_id}/pages` - Get all pages for a form
- `PUT /pages/{page_id}` - Update page
- `DELETE /pages/{page_id}` - Delete page

- `POST /fields` - Create a field
- `GET /fields/{field_id}` - Get field details
- `GET /pages/{page_id}/fields` - Get all fields for a page
- `PUT /fields/{field_id}` - Update field
- `DELETE /fields/{field_id}` - Delete field

- `POST /field-conditions` - Create a field condition
- `GET /fields/{field_id}/conditions` - Get conditions for a field
- `DELETE /field-conditions/{condition_id}` - Delete condition

- `POST /navigation-rules` - Create a page navigation rule
- `GET /pages/{page_id}/navigation-rules` - Get navigation rules for a page
- `DELETE /navigation-rules/{rule_id}` - Delete navigation rule

### Form Renderer (`/api/v1/renderer`)

- `POST /render` - Render form and get current page
- `GET /render/{form_id}/{session_id}` - Get current form state

### Submission (`/api/v1/submission`)

- `POST /create` - Create a new submission session
- `GET /{session_id}` - Get submission status
- `POST /submit-answer` - Submit a field answer
- `POST /{session_id}/complete` - Mark submission as complete
- `GET /{session_id}/responses` - Get all responses for a submission

## Example Usage

See `examples/` directory for complete examples of:
- Creating a multi-page form
- Setting up field conditions
- Setting up page navigation rules
- Submitting answers and navigating through pages

## Field Types

Supported field types:
- `text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `email` - Email input
- `phone` - Phone number input
- `date` - Date picker
- `datetime` - Date and time picker
- `select` - Dropdown select
- `multiselect` - Multiple selection dropdown
- `radio` - Radio button group
- `checkbox` - Checkbox group
- `boolean` - Yes/No toggle
- `file` - File upload
- `rating` - Rating input

## Condition Operators

- `equals` - Field equals value
- `not_equals` - Field does not equal value
- `greater_than` - Field is greater than value
- `less_than` - Field is less than value
- `greater_equal` - Field is greater than or equal to value
- `less_equal` - Field is less than or equal to value
- `contains` - Field contains value (string)
- `not_contains` - Field does not contain value
- `in` - Field value is in comma-separated list
- `not_in` - Field value is not in comma-separated list
- `is_empty` - Field is empty
- `is_not_empty` - Field is not empty

## Condition Actions

- `show` - Show the target field
- `hide` - Hide the target field
- `enable` - Enable the target field
- `disable` - Disable the target field
- `require` - Make the target field required
- `skip` - Skip the target field

## Database

By default, the application uses SQLite. To use PostgreSQL or MySQL, update the `DATABASE_URL` in your `.env` file.

## License

MIT

