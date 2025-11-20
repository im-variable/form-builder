"""
Form Renderer Service
Handles rendering forms and determining next pages based on answers
"""
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, Optional, List
from app.models import Form, Page, Field, Submission, FieldResponse, FieldCondition, PageNavigationRule
from app.schemas import RenderedField, RenderedPage, FormRenderResponse
from app.services.condition_engine import ConditionEngine


class FormRendererService:
    """Service for rendering forms and determining navigation"""

    @staticmethod
    def get_current_answers(db: Session, session_id: str) -> Dict[str, Any]:
        """Get all current answers for a session"""
        submission = db.query(Submission).filter(Submission.session_id == session_id).first()
        if not submission:
            return {}
        
        responses = db.query(FieldResponse).options(
            joinedload(FieldResponse.field)
        ).filter(FieldResponse.submission_id == submission.id).all()
        
        answers = {}
        for response in responses:
            field = response.field
            answers[field.name] = response.value
        
        return answers

    @staticmethod
    def render_form(
        db: Session,
        form_id: int,
        session_id: str,
        current_answers: Optional[Dict[str, Any]] = None
    ) -> FormRenderResponse:
        """
        Render the form and determine the current page to show
        """
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")

        # Get or create submission
        submission = db.query(Submission).filter(
            Submission.session_id == session_id,
            Submission.form_id == form_id
        ).first()

        if not submission:
            # Create new submission
            submission = Submission(form_id=form_id, session_id=session_id, status="in_progress")
            db.add(submission)
            db.commit()
            db.refresh(submission)

        # Get current answers
        if current_answers is None:
            current_answers = FormRendererService.get_current_answers(db, session_id)

        # Determine current page
        current_page = None
        if submission.current_page_id:
            current_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(Page.id == submission.current_page_id).first()
        
        if not current_page:
            # Find first page
            current_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(
                Page.form_id == form_id,
                Page.is_first == True
            ).first()
            
            if not current_page:
                # Fallback to first page by order
                current_page = db.query(Page).options(
                    joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
                ).filter(
                    Page.form_id == form_id
                ).order_by(Page.order).first()

        if not current_page:
            raise ValueError("No pages found for this form")

        # Render fields for current page
        fields = db.query(Field).options(
            joinedload(Field.conditions).joinedload(FieldCondition.source_field)
        ).filter(Field.page_id == current_page.id).order_by(Field.order).all()
        
        rendered_fields = []
        for field in fields:
            # Check if field should be visible
            conditions = field.conditions
            is_visible = ConditionEngine.should_field_be_visible(
                field.id,
                conditions,
                current_answers
            )

            # Get current value if exists
            current_value = current_answers.get(field.name)

            rendered_field = RenderedField(
                id=field.id,
                name=field.name,
                label=field.label,
                field_type=field.field_type,
                placeholder=field.placeholder,
                help_text=field.help_text,
                is_required=field.is_required,
                is_visible=is_visible,
                default_value=field.default_value,
                options=field.options,
                validation_rules=field.validation_rules,
                current_value=current_value
            )
            rendered_fields.append(rendered_field)

        rendered_page = RenderedPage(
            id=current_page.id,
            title=current_page.title,
            description=current_page.description,
            order=current_page.order,
            fields=rendered_fields
        )

        # Determine next page
        navigation_rules = current_page.navigation_rules
        next_page_id = ConditionEngine.determine_next_page(
            current_page.id,
            navigation_rules,
            current_answers,
            db
        )

        # Calculate progress
        all_pages = db.query(Page).filter(Page.form_id == form_id).order_by(Page.order).all()
        total_pages = len(all_pages)
        current_page_index = next((i for i, p in enumerate(all_pages) if p.id == current_page.id), 0)
        progress = ((current_page_index + 1) / total_pages * 100) if total_pages > 0 else 0

        is_complete = next_page_id is None and len(navigation_rules) > 0

        return FormRenderResponse(
            form_id=form_id,
            form_title=form.title,
            current_page=rendered_page,
            next_page_id=next_page_id,
            is_complete=is_complete,
            progress=round(progress, 2)
        )

