"""
Example: Submitting Answers to a Dynamic Form

This example demonstrates:
1. Creating a submission session
2. Rendering the form to get the current page
3. Submitting answers
4. Navigating through pages based on conditions
5. Viewing final responses
"""

import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1"

# Assume form_id from previous example (or get it from the API)
FORM_ID = 1  # Update this with your actual form ID
SESSION_ID = str(uuid.uuid4())

print("=" * 60)
print("Form Submission Example")
print("=" * 60)
print(f"Form ID: {FORM_ID}")
print(f"Session ID: {SESSION_ID}\n")

# Step 1: Create a submission session
print("Step 1: Creating submission session...")
submission_data = {
    "form_id": FORM_ID,
    "session_id": SESSION_ID
}
response = requests.post(f"{BASE_URL}/submission/create", json=submission_data)
submission = response.json()
print(f"Created submission: {submission['id']}\n")

# Step 2: Render the form to get the first page
print("Step 2: Rendering form (getting first page)...")
render_request = {
    "form_id": FORM_ID,
    "session_id": SESSION_ID,
    "current_answers": {}
}
response = requests.post(f"{BASE_URL}/renderer/render", json=render_request)
form_state = response.json()
print(f"Form: {form_state['form_title']}")
print(f"Current Page: {form_state['current_page']['title']}")
print(f"Progress: {form_state['progress']}%")
print(f"Fields on this page:")
for field in form_state['current_page']['fields']:
    if field['is_visible']:
        print(f"  - {field['label']} ({field['field_type']}) {'[REQUIRED]' if field['is_required'] else ''}")
print()

# Step 3: Submit answers for Page 1
print("Step 3: Submitting answers for Page 1...")

# Get field IDs from the rendered page
field_map = {field['name']: field['id'] for field in form_state['current_page']['fields']}

# Answer: Name
answer1 = {
    "session_id": SESSION_ID,
    "field_id": field_map['name'],
    "value": "John Doe"
}
response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer1)
print(f"Submitted: name = 'John Doe'")

# Answer: Email
answer2 = {
    "session_id": SESSION_ID,
    "field_id": field_map['email'],
    "value": "john.doe@example.com"
}
response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer2)
print(f"Submitted: email = 'john.doe@example.com'")

# Answer: Age
answer3 = {
    "session_id": SESSION_ID,
    "field_id": field_map['age'],
    "value": 28
}
response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer3)
print(f"Submitted: age = 28")

# Answer: Customer Type (this determines next page!)
answer4 = {
    "session_id": SESSION_ID,
    "field_id": field_map['customer_type'],
    "value": "new"  # Try "returning" to see different flow
}
response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer4)
result = response.json()
print(f"Submitted: customer_type = 'new'")
print(f"Next Page ID: {result['next_page_id']}")
print(f"Is Complete: {result['is_complete']}\n")

# Step 4: Render form again to get next page
print("Step 4: Rendering form (getting next page)...")
render_request = {
    "form_id": FORM_ID,
    "session_id": SESSION_ID
}
response = requests.post(f"{BASE_URL}/renderer/render", json=render_request)
form_state = response.json()
print(f"Current Page: {form_state['current_page']['title']}")
print(f"Progress: {form_state['progress']}%")
print(f"Fields on this page:")
for field in form_state['current_page']['fields']:
    if field['is_visible']:
        print(f"  - {field['label']} ({field['field_type']}) {'[REQUIRED]' if field['is_required'] else ''}")
print()

# Step 5: Submit answers for Page 2 (or Page 3 if returning customer)
print("Step 5: Submitting answers for current page...")
field_map = {field['name']: field['id'] for field in form_state['current_page']['fields']}

# Check which page we're on
if 'how_heard' in field_map:
    # We're on Page 2 (New Customer)
    answer5 = {
        "session_id": SESSION_ID,
        "field_id": field_map['how_heard'],
        "value": "other"
    }
    response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer5)
    result = response.json()
    print(f"Submitted: how_heard = 'other'")
    print(f"Next Page ID: {result['next_page_id']}\n")
    
    # Render again to see conditional field
    response = requests.post(f"{BASE_URL}/renderer/render", json=render_request)
    form_state = response.json()
    print("After submitting 'other', checking for conditional field...")
    for field in form_state['current_page']['fields']:
        if field['name'] == 'other_source' and field['is_visible']:
            print(f"Conditional field is now visible: {field['label']}")
            answer6 = {
                "session_id": SESSION_ID,
                "field_id": field['id'],
                "value": "Found you on Google"
            }
            response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer6)
            print(f"Submitted: other_source = 'Found you on Google'")
            result = response.json()
            print(f"Next Page ID: {result['next_page_id']}\n")
            break

elif 'satisfaction' in field_map:
    # We're on Page 3 (Returning Customer)
    answer5 = {
        "session_id": SESSION_ID,
        "field_id": field_map['satisfaction'],
        "value": 2  # Low satisfaction - should trigger feedback field
    }
    response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer5)
    result = response.json()
    print(f"Submitted: satisfaction = 2")
    print(f"Next Page ID: {result['next_page_id']}\n")
    
    # Render again to see conditional field
    response = requests.post(f"{BASE_URL}/renderer/render", json=render_request)
    form_state = response.json()
    print("After submitting low satisfaction, checking for conditional field...")
    for field in form_state['current_page']['fields']:
        if field['name'] == 'feedback' and field['is_visible']:
            print(f"Conditional field is now visible: {field['label']}")
            answer6 = {
                "session_id": SESSION_ID,
                "field_id": field['id'],
                "value": "Response time could be faster"
            }
            response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer6)
            print(f"Submitted: feedback = 'Response time could be faster'")
            result = response.json()
            print(f"Next Page ID: {result['next_page_id']}\n")
            break

# Step 6: Final page
print("Step 6: Final page...")
response = requests.post(f"{BASE_URL}/renderer/render", json=render_request)
form_state = response.json()
print(f"Current Page: {form_state['current_page']['title']}")
print(f"Progress: {form_state['progress']}%")
print(f"Is Complete: {form_state['is_complete']}")

if not form_state['is_complete']:
    field_map = {field['name']: field['id'] for field in form_state['current_page']['fields']}
    if 'comments' in field_map:
        answer_final = {
            "session_id": SESSION_ID,
            "field_id": field_map['comments'],
            "value": "Great service overall!"
        }
        response = requests.post(f"{BASE_URL}/submission/submit-answer", json=answer_final)
        result = response.json()
        print(f"Submitted: comments = 'Great service overall!'")
        print(f"Is Complete: {result['is_complete']}\n")

# Step 7: Get all responses
print("Step 7: Retrieving all responses...")
response = requests.get(f"{BASE_URL}/submission/{SESSION_ID}/responses")
all_responses = response.json()
print("\nAll submitted responses:")
for field_name, field_data in all_responses.items():
    print(f"  {field_data['label']}: {field_data['value']}")

# Step 8: Complete submission
print("\nStep 8: Completing submission...")
response = requests.post(f"{BASE_URL}/submission/{SESSION_ID}/complete")
print(response.json()['message'])

print("\n" + "=" * 60)
print("Form submission complete!")
print("=" * 60)


