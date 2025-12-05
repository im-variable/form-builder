"""
Form Builder Router
CRUD operations for forms, pages, fields, and conditions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import (
    FormCreate, FormUpdate, FormResponse,
    PageCreate, PageUpdate, PageResponse,
    FieldCreate, FieldUpdate, FieldResponse as FieldResponseSchema,
    FieldConditionCreate, FieldConditionResponse,
    PageNavigationRuleCreate, PageNavigationRuleResponse
)
from app.services.form_builder_service import FormBuilderService

router = APIRouter()


# Form endpoints
@router.post("/forms", response_model=FormResponse, status_code=status.HTTP_201_CREATED)
def create_form(form_data: FormCreate, db: Session = Depends(get_db)):
    """Create a new form"""
    return FormBuilderService.create_form(db, form_data)


@router.get("/forms", response_model=List[FormResponse])
def get_forms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all forms"""
    return FormBuilderService.get_forms(db, skip=skip, limit=limit)


@router.get("/forms/{form_id}", response_model=FormResponse)
def get_form(form_id: int, db: Session = Depends(get_db)):
    """Get a form by ID"""
    form = FormBuilderService.get_form(db, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.put("/forms/{form_id}", response_model=FormResponse)
def update_form(form_id: int, form_data: FormUpdate, db: Session = Depends(get_db)):
    """Update a form"""
    form = FormBuilderService.update_form(db, form_id, form_data)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.delete("/forms/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: int, db: Session = Depends(get_db)):
    """Delete a form"""
    success = FormBuilderService.delete_form(db, form_id)
    if not success:
        raise HTTPException(status_code=404, detail="Form not found")


# Page endpoints
@router.post("/pages", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def create_page(page_data: PageCreate, db: Session = Depends(get_db)):
    """Create a new page"""
    return FormBuilderService.create_page(db, page_data)


@router.get("/pages/{page_id}", response_model=PageResponse)
def get_page(page_id: int, db: Session = Depends(get_db)):
    """Get a page by ID"""
    page = FormBuilderService.get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/forms/{form_id}/pages", response_model=List[PageResponse])
def get_pages_by_form(form_id: int, db: Session = Depends(get_db)):
    """Get all pages for a form"""
    return FormBuilderService.get_pages_by_form(db, form_id)


@router.put("/pages/{page_id}", response_model=PageResponse)
def update_page(page_id: int, page_data: PageUpdate, db: Session = Depends(get_db)):
    """Update a page"""
    page = FormBuilderService.update_page(db, page_id, page_data)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    """Delete a page"""
    success = FormBuilderService.delete_page(db, page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Page not found")


# Field endpoints
@router.post("/fields", response_model=FieldResponseSchema, status_code=status.HTTP_201_CREATED)
def create_field(field_data: FieldCreate, db: Session = Depends(get_db)):
    """Create a new field"""
    return FormBuilderService.create_field(db, field_data)


@router.get("/fields/{field_id}", response_model=FieldResponseSchema)
def get_field(field_id: int, db: Session = Depends(get_db)):
    """Get a field by ID"""
    field = FormBuilderService.get_field(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.get("/pages/{page_id}/fields", response_model=List[FieldResponseSchema])
def get_fields_by_page(page_id: int, db: Session = Depends(get_db)):
    """Get all fields for a page"""
    return FormBuilderService.get_fields_by_page(db, page_id)


@router.put("/fields/{field_id}", response_model=FieldResponseSchema)
def update_field(field_id: int, field_data: FieldUpdate, db: Session = Depends(get_db)):
    """Update a field"""
    field = FormBuilderService.update_field(db, field_id, field_data)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field(field_id: int, db: Session = Depends(get_db)):
    """Delete a field"""
    success = FormBuilderService.delete_field(db, field_id)
    if not success:
        raise HTTPException(status_code=404, detail="Field not found")


# Field condition endpoints
@router.post("/field-conditions", response_model=FieldConditionResponse, status_code=status.HTTP_201_CREATED)
def create_field_condition(condition_data: FieldConditionCreate, db: Session = Depends(get_db)):
    """Create a field condition"""
    return FormBuilderService.create_field_condition(db, condition_data)


@router.get("/fields/{field_id}/conditions", response_model=List[FieldConditionResponse])
def get_field_conditions(field_id: int, db: Session = Depends(get_db)):
    """Get all conditions for a field"""
    return FormBuilderService.get_field_conditions(db, field_id)


@router.put("/field-conditions/{condition_id}", response_model=FieldConditionResponse)
def update_field_condition(condition_id: int, condition_data: FieldConditionCreate, db: Session = Depends(get_db)):
    """Update a field condition"""
    condition = FormBuilderService.update_field_condition(db, condition_id, condition_data)
    if not condition:
        raise HTTPException(status_code=404, detail="Field condition not found")
    return condition


@router.delete("/field-conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_field_condition(condition_id: int, db: Session = Depends(get_db)):
    """Delete a field condition"""
    success = FormBuilderService.delete_field_condition(db, condition_id)
    if not success:
        raise HTTPException(status_code=404, detail="Field condition not found")


# Navigation rule endpoints
@router.post("/navigation-rules", response_model=PageNavigationRuleResponse, status_code=status.HTTP_201_CREATED)
def create_navigation_rule(rule_data: PageNavigationRuleCreate, db: Session = Depends(get_db)):
    """Create a page navigation rule"""
    return FormBuilderService.create_navigation_rule(db, rule_data)


@router.get("/pages/{page_id}/navigation-rules", response_model=List[PageNavigationRuleResponse])
def get_navigation_rules(page_id: int, db: Session = Depends(get_db)):
    """Get all navigation rules for a page"""
    return FormBuilderService.get_navigation_rules(db, page_id)


@router.delete("/navigation-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_navigation_rule(rule_id: int, db: Session = Depends(get_db)):
    """Delete a navigation rule"""
    success = FormBuilderService.delete_navigation_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Navigation rule not found")


