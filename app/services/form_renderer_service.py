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
        current_answers: Optional[Dict[str, Any]] = None,
        auto_advance: bool = False
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

        is_new_submission = False
        if not submission:
            # Create new submission
            is_new_submission = True
            submission = Submission(form_id=form_id, session_id=session_id, status="in_progress", current_page_id=None)
            db.add(submission)
            db.commit()
            db.refresh(submission)
        else:
            # Refresh submission to get latest current_page_id
            db.refresh(submission)
            # If submission exists but has no answers, reset to first page
            existing_answers = FormRendererService.get_current_answers(db, session_id)
            if not existing_answers or len(existing_answers) == 0:
                submission.current_page_id = None
                db.commit()
                db.refresh(submission)

        # Get current answers
        # If current_answers is None or empty, get from database
        # This ensures we have the latest state after submissions
        if current_answers is None or (isinstance(current_answers, dict) and len(current_answers) == 0):
            current_answers = FormRendererService.get_current_answers(db, session_id)

        # Determine current page
        current_page = None
        
        # Only use submission.current_page_id if:
        # 1. It's not a new submission AND
        # 2. There are actual answers (user has progressed)
        # Otherwise, always start from the first page
        if not is_new_submission and submission.current_page_id and current_answers and len(current_answers) > 0:
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
        next_page_id = None
        
        if navigation_rules:
            # Use navigation rules to determine next page
            next_page_id = ConditionEngine.determine_next_page(
                current_page.id,
                navigation_rules,
                current_answers,
                db
            )
        else:
            # No navigation rules, go to next page by order
            # Sort pages: first page always first, then others by order
            all_pages = db.query(Page).filter(Page.form_id == form_id).all()
            sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
            current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), -1)
            
            if current_page_index >= 0 and current_page_index < len(sorted_pages) - 1:
                # There's a next page
                next_page_id = sorted_pages[current_page_index + 1].id
            # else: next_page_id remains None (last page)

        # If there's a next page and auto_advance is enabled, show the next page immediately
        # Only auto-advance if there are actual answers (not on initial render)
        if next_page_id and auto_advance and current_answers and len(current_answers) > 0:
            # Update submission to point to next page
            submission.current_page_id = next_page_id
            db.commit()
            
            # Get the next page and render it
            next_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(Page.id == next_page_id).first()
            
            if next_page:
                # Render fields for the next page
                next_page_fields = db.query(Field).filter(Field.page_id == next_page.id).order_by(Field.order).all()
                next_rendered_fields = []
                
                for field in next_page_fields:
                    # Evaluate field conditions
                    field_conditions = db.query(FieldCondition).filter(FieldCondition.target_field_id == field.id).all()
                    is_visible = ConditionEngine.should_field_be_visible(field.id, field_conditions, current_answers)
                    
                    # Get current value if exists
                    current_value = current_answers.get(field.name)
                    
                    next_rendered_fields.append(RenderedField(
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
                    ))
                
                next_rendered_page = RenderedPage(
                    id=next_page.id,
                    title=next_page.title,
                    description=next_page.description,
                    order=next_page.order,
                    fields=next_rendered_fields
                )
                
                # Determine next page for this page
                next_navigation_rules = next_page.navigation_rules
                next_next_page_id = None
                
                if next_navigation_rules:
                    next_next_page_id = ConditionEngine.determine_next_page(
                        next_page.id,
                        next_navigation_rules,
                        current_answers,
                        db
                    )
                else:
                    all_pages = db.query(Page).filter(Page.form_id == form_id).all()
                    sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
                    next_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == next_page.id), -1)
                    
                    if next_page_index >= 0 and next_page_index < len(sorted_pages) - 1:
                        next_next_page_id = sorted_pages[next_page_index + 1].id
                
                # Calculate progress for next page
                all_pages = db.query(Page).filter(Page.form_id == form_id).all()
                sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
                total_pages = len(sorted_pages)
                next_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == next_page.id), 0)
                progress = ((next_page_index + 1) / total_pages * 100) if total_pages > 0 else 0
                
                is_complete = next_next_page_id is None
                
                return FormRenderResponse(
                    form_id=form_id,
                    form_title=form.title,
                    current_page=next_rendered_page,
                    next_page_id=next_next_page_id,
                    is_complete=is_complete,
                    progress=round(progress, 2)
                )

        # Calculate progress
        # Sort pages: first page always first, then others by order
        all_pages = db.query(Page).filter(Page.form_id == form_id).all()
        sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
        total_pages = len(sorted_pages)
        current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), 0)
        progress = ((current_page_index + 1) / total_pages * 100) if total_pages > 0 else 0

        # Form is complete if there's no next page
        is_complete = next_page_id is None

        # Update submission state
        # Only update current_page_id to the current page we're showing (not the next page)
        # The next page will be set when we actually advance
        if not submission.current_page_id or submission.current_page_id != current_page.id:
            submission.current_page_id = current_page.id
        
        if is_complete:
            submission.status = "completed"
            from datetime import datetime
            submission.completed_at = datetime.utcnow()
        
        db.commit()

        return FormRenderResponse(
            form_id=form_id,
            form_title=form.title,
            current_page=rendered_page,
            next_page_id=next_page_id,
            is_complete=is_complete,
            progress=round(progress, 2)
        )

