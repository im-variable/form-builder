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
    def get_answers_by_submission_id(db: Session, submission_id: int) -> Dict[str, Any]:
        """Get all current answers for a submission by submission ID"""
        responses = db.query(FieldResponse).options(
            joinedload(FieldResponse.field)
        ).filter(FieldResponse.submission_id == submission_id).all()
        
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
        # Query fresh from database to ensure we get the latest current_page_id
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
            # Force a fresh query by expiring all attributes and refreshing
            db.expire_all()
            # Query submission again to get fresh data
            submission = db.query(Submission).filter(
                Submission.session_id == session_id,
                Submission.form_id == form_id
            ).first()
            # If submission exists but has no answers, reset to first page
            existing_answers = FormRendererService.get_current_answers(db, session_id)
            if not existing_answers or len(existing_answers) == 0:
                submission.current_page_id = None
                db.commit()
            db.refresh(submission)

        # Get current answers from database
        db_answers = FormRendererService.get_current_answers(db, session_id)
        
        # Track if current_answers were originally passed (before merging)
        # This helps distinguish between real-time evaluation and submission
        original_current_answers_passed = current_answers is not None and isinstance(current_answers, dict) and len(current_answers) > 0
        
        # Merge answers: prioritize current_answers (from frontend) for real-time condition evaluation
        # but use db_answers as base to include all previously saved answers from other pages
        if original_current_answers_passed:
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
        
        # Use submission.current_page_id (already re-queried above)
        # This allows navigation back to previous pages
        # The submission object was re-queried fresh, so it should have the latest current_page_id
        if not is_new_submission and submission and submission.current_page_id:
            # Query the page, ensuring it belongs to this form
            current_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(
                Page.id == submission.current_page_id,
                Page.form_id == form_id
            ).first()
            
            if not current_page:
                pass  # Will fall back to first page below
        
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
            is_first=current_page.is_first,
            fields=rendered_fields
        )

        # Get all pages and sort them once (used for navigation and progress calculation)
        all_pages = db.query(Page).filter(Page.form_id == form_id).all()
        sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
        current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), 0)

        # Determine next page
        navigation_rules = current_page.navigation_rules
        next_page_id = None
        
        if navigation_rules:
            # IMPORTANT: Merge db_answers with current_answers for navigation rule evaluation
            # This ensures that when going back and updating fields, all answers are considered
            # Priority: current_answers (from current page) override db_answers
            navigation_answers = db_answers.copy() if db_answers else {}
            if current_answers:
                navigation_answers.update(current_answers)
            
            # Use navigation rules to determine next page
            # Conditions should take priority over sequential navigation
            next_page_id = ConditionEngine.determine_next_page(
                current_page.id,
                navigation_rules,
                navigation_answers,  # Use merged answers
                db
            )
            
            # Only fall back to sequential navigation if:
            # 1. No navigation rule matched (next_page_id is None)
            # 2. AND there's a next page in sequence
            # This ensures conditions always take priority
            if next_page_id is None and current_page_index < len(sorted_pages) - 1:
                # There's a next page
                next_page_id = sorted_pages[current_page_index + 1].id
        else:
            # No navigation rules, go to next page by order
            if current_page_index < len(sorted_pages) - 1:
                # There's a next page
                next_page_id = sorted_pages[current_page_index + 1].id

        # Calculate progress
        total_pages = len(sorted_pages)
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

        # Check if we should advance to the next page
        # Advance only if:
        # 1. There's a next page
        # 2. Current page has answers in the database (user has submitted via submitAnswer)
        # 3. No current_answers were passed (meaning it's not real-time condition evaluation)
        should_advance = False
        
        if next_page_id and not is_new_submission:
            # Check if current page has answers in database
            current_page_field_names = [f.name for f in fields]
            current_page_db_answers = {k: v for k, v in db_answers.items() if k in current_page_field_names} if db_answers else {}
            has_db_answers = len(current_page_db_answers) > 0 and any(
                v is not None and v != '' for v in current_page_db_answers.values()
            )
            
            # Check if current_answers were passed (indicates real-time evaluation)
            # If current_answers were passed, check if they match db_answers (means it's just condition evaluation)
            # If they don't match or weren't passed, it means answers were just submitted
            is_realtime_eval = False
            if current_answers and len(current_answers) > 0:
                # Compare current_answers with db_answers for current page fields
                # If they match, it's likely real-time evaluation, not a new submission
                current_page_current_answers = {k: v for k, v in current_answers.items() if k in current_page_field_names}
                if current_page_current_answers:
                    # Check if all non-empty values match
                    matches = all(
                        str(current_page_db_answers.get(k, '')) == str(v)
                        for k, v in current_page_current_answers.items()
                        if v is not None and v != ''
                    )
                    # If they match, it's likely real-time evaluation
                    # But if db_answers exist and current_answers match, it might be after submission
                    # So we check: if db has answers AND current_answers match, it's likely already submitted
                    # We should advance if db has answers for current page
                    is_realtime_eval = matches and len(current_page_current_answers) > 0
            
            # Advance if we have database answers and no current_answers were originally passed
            # (current_answers passed means it's real-time condition evaluation, not a submission)
            if has_db_answers and not original_current_answers_passed:
                should_advance = True
        
        if should_advance:
            # Advance to next page
            submission.current_page_id = next_page_id
            db.commit()
            db.refresh(submission)
            
            # Render the next page instead
            next_page = db.query(Page).options(
                joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
            ).filter(
                Page.id == next_page_id,
                Page.form_id == form_id
            ).first()
            
            if next_page:
                # Re-render with the next page
                current_page = next_page
                # Re-query fields for next page
                fields = db.query(Field).options(
                    joinedload(Field.conditions).joinedload(FieldCondition.source_field)
                ).filter(Field.page_id == next_page.id).order_by(Field.order).all()
                
                # Re-evaluate conditions for next page fields
                target_field_conditions_map = {}
                all_field_conditions = db.query(FieldCondition).options(
                    joinedload(FieldCondition.source_field),
                    joinedload(FieldCondition.target_field)
                ).filter(
                    FieldCondition.target_field_id.in_([f.id for f in fields])
                ).all()
                
                for condition in all_field_conditions:
                    if condition.target_field_id not in target_field_conditions_map:
                        target_field_conditions_map[condition.target_field_id] = []
                    target_field_conditions_map[condition.target_field_id].append(condition)
                
                # Re-render fields for next page
                rendered_fields = []
                for field in fields:
                    target_conditions = target_field_conditions_map.get(field.id, [])
                    is_visible = field.is_visible
                    is_required = field.is_required
                    
                    if target_conditions:
                        condition_result = ConditionEngine.evaluate_field_conditions(
                            field.id,
                            target_conditions,
                            condition_evaluation_answers
                        )
                        has_visibility_conditions = any(c.action.value in ["show", "hide"] for c in target_conditions)
                        has_require_conditions = any(c.action.value == "require" for c in target_conditions)
                        
                        if has_visibility_conditions:
                            is_visible = condition_result["show"] and not condition_result["hide"]
                        if has_require_conditions:
                            is_required = condition_result["require"]
                    
                    current_value = db_answers.get(field.name)
                    
                    field_conditions = []
                    if target_conditions:
                        for condition in target_conditions:
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
                    is_first=current_page.is_first,
                    fields=rendered_fields
                )
                
                # Recalculate next page for the advanced page
                navigation_rules = current_page.navigation_rules
                next_page_id = None
                current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), 0)
                
                if navigation_rules:
                    next_page_id = ConditionEngine.determine_next_page(
                        current_page.id,
                        navigation_rules,
                        db_answers,
                        db
                    )
                    if next_page_id is None and current_page_index < len(sorted_pages) - 1:
                        next_page_id = sorted_pages[current_page_index + 1].id
                else:
                    if current_page_index < len(sorted_pages) - 1:
                        next_page_id = sorted_pages[current_page_index + 1].id
                
                progress = ((current_page_index + 1) / total_pages * 100) if total_pages > 0 else 0
                current_page_field_names = [f.name for f in fields]
                current_page_has_answers = any(
                    db_answers.get(field_name) is not None and db_answers.get(field_name) != ''
                    for field_name in current_page_field_names
                )
                is_complete = next_page_id is None and current_page_has_answers
        
        # Update submission state for current page
        if not submission.current_page_id or submission.current_page_id != current_page.id:
            submission.current_page_id = current_page.id
            db.commit()
            db.refresh(submission)
        
        if is_complete:
            submission.status = "completed"
            from datetime import datetime, timezone
            submission.completed_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(submission)

        return FormRenderResponse(
            form_id=form_id,
            form_title=form.title,
            current_page=rendered_page,
            next_page_id=next_page_id,
            is_complete=is_complete,
            progress=round(progress, 2)
        )

    @staticmethod
    def render_page_for_submission(
        db: Session,
        submission_id: int,
        page_id: int
    ) -> FormRenderResponse:
        """
        Render a specific page for a submission with populated data
        
        This method:
        - Gets the submission by ID
        - Renders the specified page
        - Populates fields with existing answers from the submission
        - Returns next page ID
        """
        from app.services.submission_service import SubmissionService
        
        # Get submission
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")
        
        form_id = submission.form_id
        
        # Get form
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise ValueError(f"Form {form_id} not found")
        
        # Get the specified page
        page = db.query(Page).options(
            joinedload(Page.navigation_rules).joinedload(PageNavigationRule.source_field)
        ).filter(
            Page.id == page_id,
            Page.form_id == form_id
        ).first()
        
        if not page:
            raise ValueError(f"Page {page_id} not found for form {form_id}")
        
        # Get all answers for this submission
        db_answers = FormRendererService.get_answers_by_submission_id(db, submission_id)
        
        # Render fields for the page
        fields = db.query(Field).options(
            joinedload(Field.conditions).joinedload(FieldCondition.target_field)
        ).filter(Field.page_id == page.id).order_by(Field.order).all()
        
        # Load conditions
        all_field_conditions = db.query(FieldCondition).options(
            joinedload(FieldCondition.source_field),
            joinedload(FieldCondition.target_field)
        ).filter(
            FieldCondition.target_field_id.in_([f.id for f in fields])
        ).all()
        
        target_field_conditions_map = {}
        for condition in all_field_conditions:
            if condition.target_field_id not in target_field_conditions_map:
                target_field_conditions_map[condition.target_field_id] = []
            target_field_conditions_map[condition.target_field_id].append(condition)
        
        # Build answers dict for condition evaluation
        condition_evaluation_answers = db_answers.copy()
        
        # Ensure all fields from current page are included
        for field in fields:
            if field.name not in condition_evaluation_answers:
                if field.default_value is not None and field.default_value != "":
                    condition_evaluation_answers[field.name] = field.default_value
                else:
                    condition_evaluation_answers[field.name] = ""
        
        # Add default values for fields from other pages
        all_form_fields = db.query(Field).filter(Field.page_id.in_(
            db.query(Page.id).filter(Page.form_id == form_id)
        )).all()
        
        for form_field in all_form_fields:
            if form_field.name not in condition_evaluation_answers:
                if form_field.default_value is not None and form_field.default_value != "":
                    condition_evaluation_answers[form_field.name] = form_field.default_value
        
        # Render fields
        rendered_fields = []
        for field in fields:
            target_conditions = target_field_conditions_map.get(field.id, [])
            
            is_visible = field.is_visible
            is_required = field.is_required
            
            if target_conditions:
                condition_result = ConditionEngine.evaluate_field_conditions(
                    field.id,
                    target_conditions,
                    condition_evaluation_answers
                )
                
                has_visibility_conditions = any(c.action.value in ["show", "hide"] for c in target_conditions)
                has_require_conditions = any(c.action.value == "require" for c in target_conditions)
                
                if has_visibility_conditions:
                    is_visible = condition_result["show"] and not condition_result["hide"]
                
                if has_require_conditions:
                    is_required = condition_result["require"]
            
            # Get current value from submission answers
            current_value = db_answers.get(field.name)
            
            # Include conditions for frontend evaluation (only same-page conditions)
            field_conditions = []
            if target_conditions:
                for condition in target_conditions:
                    source_field_page_id = condition.source_field.page_id
                    if source_field_page_id == page.id:
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
            id=page.id,
            title=page.title,
            description=page.description,
            order=page.order,
            is_first=page.is_first,
            fields=rendered_fields
        )
        
        # Get all pages and determine previous/next
        all_pages = db.query(Page).filter(Page.form_id == form_id).all()
        sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
        current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == page.id), -1)
        
        # Determine next page
        # IMPORTANT: Navigation rules (conditions) should take priority over sequential navigation
        # This ensures that when going back and filling fields, conditions are properly evaluated
        next_page_id = None
        navigation_rules = page.navigation_rules
        
        if navigation_rules:
            # First, evaluate navigation rules with current answers
            # This will return a page ID if a condition matches, or None if no condition matches
            next_page_id = ConditionEngine.determine_next_page(
                page.id,
                navigation_rules,
                db_answers,
                db
            )
            
            # Only fall back to sequential navigation if:
            # 1. No navigation rule matched (next_page_id is None)
            # 2. AND there's a next page in sequence
            # This ensures conditions always take priority
            if next_page_id is None and current_page_index < len(sorted_pages) - 1:
                next_page_id = sorted_pages[current_page_index + 1].id
        else:
            # No navigation rules, use sequential navigation
            if current_page_index < len(sorted_pages) - 1:
                next_page_id = sorted_pages[current_page_index + 1].id
        
        # Calculate progress
        total_pages = len(sorted_pages)
        progress = ((current_page_index + 1) / total_pages * 100) if total_pages > 0 else 0

        # Check if complete
        current_page_field_names = [f.name for f in fields]
        current_page_has_answers = any(
            db_answers.get(field_name) is not None and db_answers.get(field_name) != ''
            for field_name in current_page_field_names
        )
        is_complete = next_page_id is None and current_page_has_answers
        
        # Update submission's current_page_id to reflect the page we're viewing
        # This is important for navigation rules to work correctly when going back
        if submission.current_page_id != page.id:
            submission.current_page_id = page.id
            db.commit()
            db.refresh(submission)

        return FormRenderResponse(
            form_id=form_id,
            form_title=form.title,
            current_page=rendered_page,
            next_page_id=next_page_id,
            is_complete=is_complete,
            progress=round(progress, 2)
        )

