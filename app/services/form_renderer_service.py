"""
Form Renderer Service
Handles rendering forms and determining next pages based on answers
"""
from sqlalchemy.orm import Session, joinedload
from typing import Dict, Any, Optional, List
from app.models import Form, Page, Field, Submission, FieldResponse, FieldCondition, PageNavigationRule
from app.schemas import RenderedField, RenderedPage, FormRenderResponse, FieldConditionRule
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

        # Get current answers from database
        db_answers = FormRendererService.get_current_answers(db, session_id)
        
        # Merge answers: prioritize current_answers (from frontend) for real-time condition evaluation
        # but use db_answers as base to include all previously saved answers from other pages
        if current_answers and isinstance(current_answers, dict) and len(current_answers) > 0:
            # Merge: db_answers as base (includes all saved answers), then override with current_answers (current page edits)
            merged_answers = {**(db_answers if db_answers else {}), **current_answers}
            current_answers = merged_answers
        elif db_answers:
            # Use database answers if no current_answers passed
            current_answers = db_answers
        else:
            # Fallback to empty dict
            current_answers = current_answers if current_answers else {}

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
        # Load conditions where this field is the source (affects other fields)
        fields = db.query(Field).options(
            joinedload(Field.conditions).joinedload(FieldCondition.target_field)
        ).filter(Field.page_id == current_page.id).order_by(Field.order).all()
        
        # Also load all conditions where fields on this page are targets (affected by other fields)
        all_field_conditions = db.query(FieldCondition).options(
            joinedload(FieldCondition.source_field),
            joinedload(FieldCondition.target_field)
        ).filter(
            FieldCondition.target_field_id.in_([f.id for f in fields])
        ).all()
        
        # Create a map of target_field_id -> list of conditions
        target_field_conditions_map = {}
        for condition in all_field_conditions:
            if condition.target_field_id not in target_field_conditions_map:
                target_field_conditions_map[condition.target_field_id] = []
            target_field_conditions_map[condition.target_field_id].append(condition)
        
        # Build answers dict for condition evaluation, including default values
        # CRITICAL: Start with current_answers to include real-time input from same page
        condition_evaluation_answers = current_answers.copy() if current_answers else {}
        
        # Ensure all fields from current page are included (even if empty) for same-page condition evaluation
        # This is critical: Field B on same page needs to see Field A's value in real-time
        for field in fields:
            if field.name not in condition_evaluation_answers:
                # Field not in current_answers - check if it has a default value, otherwise treat as empty string
                if field.default_value is not None and field.default_value != "":
                    condition_evaluation_answers[field.name] = field.default_value
                else:
                    # Explicitly set to empty string so IS_EMPTY conditions can evaluate correctly
                    condition_evaluation_answers[field.name] = ""
        
        # Add default values for fields from other pages that don't have answers yet
        all_form_fields = db.query(Field).filter(Field.page_id.in_(
            db.query(Page.id).filter(Page.form_id == form_id)
        )).all()
        
        for form_field in all_form_fields:
            if form_field.name not in condition_evaluation_answers:
                if form_field.default_value is not None and form_field.default_value != "":
                    condition_evaluation_answers[form_field.name] = form_field.default_value
        
        rendered_fields = []
        for field in fields:
            # Check if this field is affected by other fields' conditions (where field is target)
            target_conditions = target_field_conditions_map.get(field.id, [])
            
            # Start with default values
            is_visible = field.is_visible
            is_required = field.is_required
            
            # Evaluate conditions that affect THIS field (where field is the target)
            if target_conditions:
                condition_result = ConditionEngine.evaluate_field_conditions(
                    field.id,
                    target_conditions,
                    condition_evaluation_answers
                )
                
                # Apply condition results
                has_visibility_conditions = any(c.action.value in ["show", "hide"] for c in target_conditions)
                has_require_conditions = any(c.action.value == "require" for c in target_conditions)
                
                if has_visibility_conditions:
                    is_visible = condition_result["show"] and not condition_result["hide"]
                    print(f"[DEBUG] Field {field.id} ({field.name}): condition_result show={condition_result['show']}, hide={condition_result['hide']}, final is_visible={is_visible}")
                
                if has_require_conditions:
                    is_required = condition_result["require"]

            # Get current value if exists
            current_value = current_answers.get(field.name)

            # Include conditions for frontend evaluation (only same-page conditions)
            field_conditions = []
            if target_conditions:
                for condition in target_conditions:
                    # Only include conditions where source field is on the same page
                    source_field_page_id = condition.source_field.page_id
                    if source_field_page_id == current_page.id:
                        field_conditions.append({
                            "source_field_name": condition.source_field.name,
                            "operator": condition.operator.value,
                            "value": condition.value,
                            "action": condition.action.value
                        })

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
                current_value=current_value,
                conditions=field_conditions if field_conditions else None
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
            
            # If no rule matched, fall back to sequential navigation
            # This handles cases where:
            # 1. No answers yet (initial render)
            # 2. Navigation rules don't match current answers
            # 3. No default rule is set
            if next_page_id is None:
                # Fall back to sequential navigation
                all_pages = db.query(Page).filter(Page.form_id == form_id).all()
                sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
                current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), -1)
                
                if current_page_index >= 0 and current_page_index < len(sorted_pages) - 1:
                    # There's a next page
                    next_page_id = sorted_pages[current_page_index + 1].id
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

        # Form is complete only if:
        # 1. There's no next page (last page)
        # 2. AND the user has submitted answers for the current page's fields
        # Check if current page has any answers
        current_page_field_names = [f.name for f in fields]
        current_page_has_answers = any(
            current_answers.get(field_name) is not None and current_answers.get(field_name) != ''
            for field_name in current_page_field_names
        )
        is_complete = next_page_id is None and current_page_has_answers

        # IMPORTANT: Do NOT auto-advance in renderForm during real-time condition evaluation
        # Only advance if answers are actually saved in database (via submit_answer)
        # This prevents auto-advancing when frontend sends current_answers for condition evaluation
        
        # Check if current page answers are already saved in database
        # If they are, this is likely a real-time evaluation call, not a submission
        current_page_field_names = [f.name for f in fields]
        current_page_db_answers = {k: v for k, v in db_answers.items() if k in current_page_field_names} if db_answers else {}
        current_page_new_answers = {k: v for k, v in current_answers.items() if k in current_page_field_names} if current_answers else {}
        
        # Only advance if:
        # 1. There are non-empty answers
        # 2. AND those answers are already saved in the database (user submitted via submit_answer)
        # This means it's a real submission, not just condition evaluation
        should_advance = False
        if current_page_new_answers and next_page_id:
            # Check if all non-empty answers match what's in the database
            # If they match, it means they were already submitted, so we can advance
            non_empty_new = {k: v for k, v in current_page_new_answers.items() if v is not None and v != ''}
            if non_empty_new:
                all_match_db = all(
                    str(current_page_db_answers.get(k, '')) == str(v)
                    for k, v in non_empty_new.items()
                )
                # Only advance if answers are saved AND match database
                # This indicates a real submission, not real-time evaluation
                if all_match_db and len(non_empty_new) > 0:
                    should_advance = True
        
        if should_advance and next_page_id:
            # User has submitted NEW answers, advance to next page
            submission.current_page_id = next_page_id
            db.commit()
            
            # Render the next page instead of current page
            next_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(Page.id == next_page_id).first()
            
            if next_page:
                # Render fields for the next page
                next_page_fields = db.query(Field).options(
                    joinedload(Field.conditions).joinedload(FieldCondition.source_field)
                ).filter(Field.page_id == next_page.id).order_by(Field.order).all()
                
                next_rendered_fields = []
                for field in next_page_fields:
                    # Check if field should be visible
                    conditions = field.conditions
                    is_visible = ConditionEngine.should_field_be_visible(
                        field.id,
                        conditions,
                        current_answers
                    )

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
                next_progress = ((next_page_index + 1) / total_pages * 100) if total_pages > 0 else 0
                
                # Form is complete only if:
                # 1. There's no next page (last page)
                # 2. AND the user has submitted answers for the current page's fields
                # Check if current page has any answers
                next_page_field_names = [f.name for f in next_page_fields]
                next_page_has_answers = any(
                    current_answers.get(field_name) is not None and current_answers.get(field_name) != ''
                    for field_name in next_page_field_names
                )
                next_is_complete = next_next_page_id is None and next_page_has_answers
                
                return FormRenderResponse(
                    form_id=form_id,
                    form_title=form.title,
                    current_page=next_rendered_page,
                    next_page_id=next_next_page_id,
                    is_complete=next_is_complete,
                    progress=round(next_progress, 2)
                )

        # Update submission state for current page (initial render or no next page)
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

