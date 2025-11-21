"""
Form Builder Service
Handles CRUD operations for forms, pages, fields, and conditions
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from app.models import Form, Page, Field, FieldCondition, PageNavigationRule
from app.schemas import (
    FormCreate, FormUpdate,
    PageCreate, PageUpdate,
    FieldCreate, FieldUpdate,
    FieldConditionCreate,
    PageNavigationRuleCreate
)


class FormBuilderService:
    """Service for building and managing forms"""

    @staticmethod
    def create_form(db: Session, form_data: FormCreate) -> Form:
        """Create a new form"""
        form = Form(**form_data.dict())
        db.add(form)
        db.commit()
        db.refresh(form)
        return form

    @staticmethod
    def get_form(db: Session, form_id: int) -> Optional[Form]:
        """Get a form by ID"""
        return db.query(Form).filter(Form.id == form_id).first()

    @staticmethod
    def get_forms(db: Session, skip: int = 0, limit: int = 100) -> List[Form]:
        """Get all forms"""
        return db.query(Form).offset(skip).limit(limit).all()

    @staticmethod
    def update_form(db: Session, form_id: int, form_data: FormUpdate) -> Optional[Form]:
        """Update a form"""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            return None
        
        update_data = form_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(form, field, value)
        
        db.commit()
        db.refresh(form)
        return form

    @staticmethod
    def delete_form(db: Session, form_id: int) -> bool:
        """Delete a form"""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            return False
        
        db.delete(form)
        db.commit()
        return True

    # Page operations
    @staticmethod
    def create_page(db: Session, page_data: PageCreate) -> Page:
        """Create a new page"""
        # Check if there are any existing pages in this form
        existing_pages = db.query(Page).filter(Page.form_id == page_data.form_id).count()
        
        # If this is the first page in the form, it must be marked as first
        if existing_pages == 0:
            page_data.is_first = True
        
        # If this page is marked as first, unmark all other first pages
        if page_data.is_first:
            db.query(Page).filter(
                and_(Page.form_id == page_data.form_id, Page.is_first == True)
            ).update({"is_first": False})
        
        page = Page(**page_data.dict())
        db.add(page)
        db.commit()
        db.refresh(page)
        return page

    @staticmethod
    def get_page(db: Session, page_id: int) -> Optional[Page]:
        """Get a page by ID"""
        return db.query(Page).filter(Page.id == page_id).first()

    @staticmethod
    def get_pages_by_form(db: Session, form_id: int) -> List[Page]:
        """Get all pages for a form"""
        return db.query(Page).filter(Page.form_id == form_id).order_by(Page.order).all()

    @staticmethod
    def update_page(db: Session, page_id: int, page_data: PageUpdate) -> Optional[Page]:
        """Update a page"""
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return None
        
        update_data = page_data.dict(exclude_unset=True)
        
        # Handle is_first flag
        if page_data.is_first is not None:
            if page_data.is_first:
                # Setting this page as first: unmark all other first pages
                db.query(Page).filter(
                    and_(Page.form_id == page.form_id, Page.is_first == True, Page.id != page_id)
                ).update({"is_first": False})
            else:
                # Unsetting is_first: ensure at least one other page is first
                if page.is_first:
                    other_pages = db.query(Page).filter(
                        and_(Page.form_id == page.form_id, Page.id != page_id)
                    ).all()
                    if other_pages:
                        # Make the first other page (by order) the first page
                        first_other = min(other_pages, key=lambda p: p.order)
                        first_other.is_first = True
                    # If no other pages exist, keep this one as first (don't allow unsetting)
                    else:
                        update_data.pop('is_first', None)
        
        for field, value in update_data.items():
            setattr(page, field, value)
        
        db.commit()
        db.refresh(page)
        return page

    @staticmethod
    def delete_page(db: Session, page_id: int) -> bool:
        """Delete a page"""
        page = db.query(Page).filter(Page.id == page_id).first()
        if not page:
            return False
        
        form_id = page.form_id
        was_first = page.is_first
        
        db.delete(page)
        db.commit()
        
        # If the deleted page was the first page, make another page first
        if was_first:
            remaining_pages = db.query(Page).filter(Page.form_id == form_id).order_by(Page.order).all()
            if remaining_pages:
                remaining_pages[0].is_first = True
                db.commit()
        
        return True

    # Field operations
    @staticmethod
    def create_field(db: Session, field_data: FieldCreate) -> Field:
        """Create a new field"""
        field = Field(**field_data.dict())
        db.add(field)
        db.commit()
        db.refresh(field)
        return field

    @staticmethod
    def get_field(db: Session, field_id: int) -> Optional[Field]:
        """Get a field by ID"""
        return db.query(Field).filter(Field.id == field_id).first()

    @staticmethod
    def get_fields_by_page(db: Session, page_id: int) -> List[Field]:
        """Get all fields for a page"""
        return db.query(Field).filter(Field.page_id == page_id).order_by(Field.order).all()

    @staticmethod
    def update_field(db: Session, field_id: int, field_data: FieldUpdate) -> Optional[Field]:
        """Update a field"""
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            return None
        
        update_data = field_data.dict(exclude_unset=True)
        for field_name, value in update_data.items():
            setattr(field, field_name, value)
        
        db.commit()
        db.refresh(field)
        return field

    @staticmethod
    def delete_field(db: Session, field_id: int) -> bool:
        """Delete a field"""
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            return False
        
        db.delete(field)
        db.commit()
        return True

    # Condition operations
    @staticmethod
    def create_field_condition(db: Session, condition_data: FieldConditionCreate) -> FieldCondition:
        """Create a field condition"""
        condition = FieldCondition(**condition_data.dict())
        db.add(condition)
        db.commit()
        db.refresh(condition)
        return condition

    @staticmethod
    def get_field_conditions(db: Session, field_id: int) -> List[FieldCondition]:
        """Get all conditions for a field"""
        return db.query(FieldCondition).filter(
            FieldCondition.target_field_id == field_id
        ).all()

    @staticmethod
    def delete_field_condition(db: Session, condition_id: int) -> bool:
        """Delete a field condition"""
        condition = db.query(FieldCondition).filter(FieldCondition.id == condition_id).first()
        if not condition:
            return False
        
        db.delete(condition)
        db.commit()
        return True

    # Navigation rule operations
    @staticmethod
    def create_navigation_rule(db: Session, rule_data: PageNavigationRuleCreate) -> PageNavigationRule:
        """Create a page navigation rule"""
        rule = PageNavigationRule(**rule_data.dict())
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def get_navigation_rules(db: Session, page_id: int) -> List[PageNavigationRule]:
        """Get all navigation rules for a page"""
        return db.query(PageNavigationRule).filter(
            PageNavigationRule.page_id == page_id
        ).all()

    @staticmethod
    def delete_navigation_rule(db: Session, rule_id: int) -> bool:
        """Delete a navigation rule"""
        rule = db.query(PageNavigationRule).filter(PageNavigationRule.id == rule_id).first()
        if not rule:
            return False
        
        db.delete(rule)
        db.commit()
        return True


