"""
Example: Creating a Dynamic Multi-Page Form

This example demonstrates:
1. Creating a form with multiple pages
2. Adding fields with different types
3. Setting up field conditions (show/hide based on other fields)
4. Setting up page navigation rules (conditional page routing)
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Step 1: Create a Form
print("Step 1: Creating form...")
form_data = {
    "title": "Customer Feedback Survey",
    "description": "A multi-page survey with conditional logic",
    "is_active": True
}
response = requests.post(f"{BASE_URL}/builder/forms", json=form_data)
form = response.json()
form_id = form["id"]
print(f"Created form: {form_id} - {form['title']}\n")

# Step 2: Create Page 1 - Basic Information
print("Step 2: Creating Page 1...")
page1_data = {
    "form_id": form_id,
    "title": "Basic Information",
    "description": "Tell us about yourself",
    "order": 1,
    "is_first": True
}
response = requests.post(f"{BASE_URL}/builder/pages", json=page1_data)
page1 = response.json()
page1_id = page1["id"]
print(f"Created page: {page1_id} - {page1['title']}\n")

# Step 3: Add fields to Page 1
print("Step 3: Adding fields to Page 1...")

# Field 1: Name
name_field = {
    "page_id": page1_id,
    "name": "name",
    "label": "Full Name",
    "field_type": "text",
    "placeholder": "Enter your full name",
    "order": 1,
    "is_required": True,
    "validation_rules": {"min_length": 2, "max_length": 100}
}
response = requests.post(f"{BASE_URL}/builder/fields", json=name_field)
name_field_id = response.json()["id"]
print(f"Created field: name (ID: {name_field_id})")

# Field 2: Email
email_field = {
    "page_id": page1_id,
    "name": "email",
    "label": "Email Address",
    "field_type": "email",
    "placeholder": "your.email@example.com",
    "order": 2,
    "is_required": True
}
response = requests.post(f"{BASE_URL}/builder/fields", json=email_field)
email_field_id = response.json()["id"]
print(f"Created field: email (ID: {email_field_id})")

# Field 3: Age
age_field = {
    "page_id": page1_id,
    "name": "age",
    "label": "Age",
    "field_type": "number",
    "order": 3,
    "is_required": True,
    "validation_rules": {"min": 18, "max": 120}
}
response = requests.post(f"{BASE_URL}/builder/fields", json=age_field)
age_field_id = response.json()["id"]
print(f"Created field: age (ID: {age_field_id})")

# Field 4: Customer Type (this will control page navigation)
customer_type_field = {
    "page_id": page1_id,
    "name": "customer_type",
    "label": "Are you a new or returning customer?",
    "field_type": "radio",
    "order": 4,
    "is_required": True,
    "options": {
        "choices": [
            {"value": "new", "label": "New Customer"},
            {"value": "returning", "label": "Returning Customer"}
        ]
    }
}
response = requests.post(f"{BASE_URL}/builder/fields", json=customer_type_field)
customer_type_field_id = response.json()["id"]
print(f"Created field: customer_type (ID: {customer_type_field_id})\n")

# Step 4: Create Page 2 - New Customer Questions
print("Step 4: Creating Page 2 for new customers...")
page2_data = {
    "form_id": form_id,
    "title": "New Customer Information",
    "description": "Questions for new customers",
    "order": 2,
    "is_first": False
}
response = requests.post(f"{BASE_URL}/builder/pages", json=page2_data)
page2 = response.json()
page2_id = page2["id"]
print(f"Created page: {page2_id} - {page2['title']}\n")

# Add fields to Page 2
how_heard_field = {
    "page_id": page2_id,
    "name": "how_heard",
    "label": "How did you hear about us?",
    "field_type": "select",
    "order": 1,
    "is_required": True,
    "options": {
        "choices": [
            {"value": "social_media", "label": "Social Media"},
            {"value": "friend", "label": "Friend/Referral"},
            {"value": "advertisement", "label": "Advertisement"},
            {"value": "other", "label": "Other"}
        ]
    }
}
response = requests.post(f"{BASE_URL}/builder/fields", json=how_heard_field)
how_heard_field_id = response.json()["id"]
print(f"Created field: how_heard (ID: {how_heard_field_id})")

# Conditional field: If "other" is selected, show text field
other_source_field = {
    "page_id": page2_id,
    "name": "other_source",
    "label": "Please specify",
    "field_type": "text",
    "order": 2,
    "is_required": False,
    "is_visible": False  # Hidden by default
}
response = requests.post(f"{BASE_URL}/builder/fields", json=other_source_field)
other_source_field_id = response.json()["id"]
print(f"Created field: other_source (ID: {other_source_field_id})")

# Step 5: Create Page 3 - Returning Customer Questions
print("Step 5: Creating Page 3 for returning customers...")
page3_data = {
    "form_id": form_id,
    "title": "Returning Customer Feedback",
    "description": "Questions for returning customers",
    "order": 3,
    "is_first": False
}
response = requests.post(f"{BASE_URL}/builder/pages", json=page3_data)
page3 = response.json()
page3_id = page3["id"]
print(f"Created page: {page3_id} - {page3['title']}\n")

# Add fields to Page 3
satisfaction_field = {
    "page_id": page3_id,
    "name": "satisfaction",
    "label": "How satisfied are you with our service?",
    "field_type": "rating",
    "order": 1,
    "is_required": True,
    "options": {"max": 5, "min": 1}
}
response = requests.post(f"{BASE_URL}/builder/fields", json=satisfaction_field)
satisfaction_field_id = response.json()["id"]
print(f"Created field: satisfaction (ID: {satisfaction_field_id})")

# Conditional field: If satisfaction < 3, show feedback field
feedback_field = {
    "page_id": page3_id,
    "name": "feedback",
    "label": "Please tell us what we can improve",
    "field_type": "textarea",
    "order": 2,
    "is_required": False,
    "is_visible": False  # Hidden by default
}
response = requests.post(f"{BASE_URL}/builder/fields", json=feedback_field)
feedback_field_id = response.json()["id"]
print(f"Created field: feedback (ID: {feedback_field_id})\n")

# Step 6: Create Page 4 - Final Page (Common)
print("Step 6: Creating final page...")
page4_data = {
    "form_id": form_id,
    "title": "Thank You",
    "description": "Final questions",
    "order": 4,
    "is_first": False
}
response = requests.post(f"{BASE_URL}/builder/pages", json=page4_data)
page4 = response.json()
page4_id = page4["id"]
print(f"Created page: {page4_id} - {page4['title']}\n")

comments_field = {
    "page_id": page4_id,
    "name": "comments",
    "label": "Additional Comments",
    "field_type": "textarea",
    "order": 1,
    "is_required": False
}
response = requests.post(f"{BASE_URL}/builder/fields", json=comments_field)
comments_field_id = response.json()["id"]
print(f"Created field: comments (ID: {comments_field_id})\n")

# Step 7: Set up Field Conditions
print("Step 7: Setting up field conditions...")

# Condition 1: Show "other_source" field when "how_heard" equals "other"
condition1 = {
    "source_field_id": how_heard_field_id,
    "target_field_id": other_source_field_id,
    "operator": "equals",
    "value": "other",
    "action": "show"
}
response = requests.post(f"{BASE_URL}/builder/field-conditions", json=condition1)
print(f"Created condition: Show 'other_source' when 'how_heard' = 'other'")

# Condition 2: Show "feedback" field when "satisfaction" < 3
condition2 = {
    "source_field_id": satisfaction_field_id,
    "target_field_id": feedback_field_id,
    "operator": "less_than",
    "value": "3",
    "action": "show"
}
response = requests.post(f"{BASE_URL}/builder/field-conditions", json=condition2)
print(f"Created condition: Show 'feedback' when 'satisfaction' < 3\n")

# Step 8: Set up Page Navigation Rules
print("Step 8: Setting up page navigation rules...")

# Navigation Rule 1: From Page 1, if customer_type = "new", go to Page 2
nav_rule1 = {
    "page_id": page1_id,
    "source_field_id": customer_type_field_id,
    "operator": "equals",
    "value": "new",
    "target_page_id": page2_id,
    "is_default": False
}
response = requests.post(f"{BASE_URL}/builder/navigation-rules", json=nav_rule1)
print(f"Navigation rule: Page 1 -> Page 2 (if customer_type = 'new')")

# Navigation Rule 2: From Page 1, if customer_type = "returning", go to Page 3
nav_rule2 = {
    "page_id": page1_id,
    "source_field_id": customer_type_field_id,
    "operator": "equals",
    "value": "returning",
    "target_page_id": page3_id,
    "is_default": False
}
response = requests.post(f"{BASE_URL}/builder/navigation-rules", json=nav_rule2)
print(f"Navigation rule: Page 1 -> Page 3 (if customer_type = 'returning')")

# Navigation Rule 3: From Page 2, go to Page 4 (default)
nav_rule3 = {
    "page_id": page2_id,
    "operator": "is_not_empty",
    "value": "",
    "target_page_id": page4_id,
    "is_default": True
}
response = requests.post(f"{BASE_URL}/builder/navigation-rules", json=nav_rule3)
print(f"Navigation rule: Page 2 -> Page 4 (default)")

# Navigation Rule 4: From Page 3, go to Page 4 (default)
nav_rule4 = {
    "page_id": page3_id,
    "operator": "is_not_empty",
    "value": "",
    "target_page_id": page4_id,
    "is_default": True
}
response = requests.post(f"{BASE_URL}/builder/navigation-rules", json=nav_rule4)
print(f"Navigation rule: Page 3 -> Page 4 (default)")

# Navigation Rule 5: Page 4 is the final page (no next page)
print(f"Page 4 is the final page (no navigation rule)\n")

print("=" * 60)
print("Form creation complete!")
print(f"Form ID: {form_id}")
print("=" * 60)
print("\nYou can now:")
print(f"1. Render the form: POST /api/v1/renderer/render")
print(f"2. Create a submission: POST /api/v1/submission/create")
print(f"3. Submit answers: POST /api/v1/submission/submit-answer")
print("\nSee submit_form_example.py for usage examples")


