# Form Engine Examples

This directory contains example scripts demonstrating how to use the Dynamic Form Engine API.

## Examples

### 1. `create_form_example.py`

Demonstrates how to create a complete multi-page form with:
- Multiple pages with different fields
- Field conditions (show/hide fields based on other field values)
- Page navigation rules (conditional routing between pages)

**Usage:**
```bash
python examples/create_form_example.py
```

**What it creates:**
- A 4-page customer feedback survey
- Page 1: Basic information (name, email, age, customer type)
- Page 2: New customer questions (conditional on customer type)
- Page 3: Returning customer questions (conditional on customer type)
- Page 4: Final comments page

**Key features demonstrated:**
- Field condition: Show "other_source" field when "how_heard" = "other"
- Field condition: Show "feedback" field when "satisfaction" < 3
- Page navigation: Route to Page 2 if customer_type = "new"
- Page navigation: Route to Page 3 if customer_type = "returning"

### 2. `submit_form_example.py`

Demonstrates how to:
- Create a submission session
- Render forms and get current pages
- Submit answers
- Navigate through pages based on conditions
- View final responses

**Usage:**
```bash
# First, make sure you've created a form (run create_form_example.py)
# Update FORM_ID in submit_form_example.py with your form ID
python examples/submit_form_example.py
```

**What it does:**
1. Creates a new submission session
2. Renders the form to get the first page
3. Submits answers for all fields on Page 1
4. Automatically navigates to the next page based on answers
5. Submits answers for conditional fields
6. Completes the form and retrieves all responses

## Running the Examples

1. **Start the API server:**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Run the examples:**
   ```bash
   # Create a form
   python examples/create_form_example.py
   
   # Submit answers to the form
   python examples/submit_form_example.py
   ```

## Example Payloads

### Creating a Form
```json
{
  "title": "Customer Feedback Survey",
  "description": "A multi-page survey with conditional logic",
  "is_active": true
}
```

### Creating a Field with Options
```json
{
  "page_id": 1,
  "name": "customer_type",
  "label": "Are you a new or returning customer?",
  "field_type": "radio",
  "order": 1,
  "is_required": true,
  "options": {
    "choices": [
      {"value": "new", "label": "New Customer"},
      {"value": "returning", "label": "Returning Customer"}
    ]
  }
}
```

### Creating a Field Condition
```json
{
  "source_field_id": 1,
  "target_field_id": 2,
  "operator": "equals",
  "value": "other",
  "action": "show"
}
```

### Creating a Page Navigation Rule
```json
{
  "page_id": 1,
  "source_field_id": 4,
  "operator": "equals",
  "value": "new",
  "target_page_id": 2,
  "is_default": false
}
```

### Rendering a Form
```json
{
  "form_id": 1,
  "session_id": "unique-session-id",
  "current_answers": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Submitting an Answer
```json
{
  "session_id": "unique-session-id",
  "field_id": 1,
  "value": "John Doe"
}
```

## Testing Different Scenarios

### Test New Customer Flow
1. Run `create_form_example.py`
2. In `submit_form_example.py`, set `customer_type = "new"`
3. Run `submit_form_example.py`

### Test Returning Customer Flow
1. Run `create_form_example.py`
2. In `submit_form_example.py`, set `customer_type = "returning"` and `satisfaction = 2`
3. Run `submit_form_example.py`

### Test Conditional Field Visibility
- Submit "other" for "how_heard" field to see "other_source" field appear
- Submit satisfaction < 3 to see "feedback" field appear


