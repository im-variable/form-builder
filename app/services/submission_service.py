"""
Submission Service
Handles storing responses and managing form submissions
"""
from sqlalchemy.orm import Session, joinedload
from typing import Optional, Dict, Any
from app.models import Submission, FieldResponse, Field, Page
from app.schemas import SubmitAnswerResponse
from app.services.condition_engine import ConditionEngine
import uuid


class SubmissionService:
    """Service for handling form submissions"""

    @staticmethod
    def create_submission(db: Session, form_id: int, session_id: Optional[str] = None) -> Submission:
        """Create a new submission"""
        if not session_id:
            session_id = str(uuid.uuid4())
        
        submission = Submission(form_id=form_id, session_id=session_id, status="in_progress")
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission

    @staticmethod
    def get_submission(db: Session, session_id: str) -> Optional[Submission]:
        """Get submission by session ID"""
        return db.query(Submission).filter(Submission.session_id == session_id).first()

    @staticmethod
    def submit_answer(
        db: Session,
        session_id: str,
        field_id: int,
        value: Optional[Any] = None
    ) -> SubmitAnswerResponse:
        """
        Submit an answer for a field and determine next page
        """
        submission = db.query(Submission).filter(Submission.session_id == session_id).first()
        if not submission:
            raise ValueError(f"Submission with session_id {session_id} not found")

        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            raise ValueError(f"Field {field_id} not found")

        # Convert value to string for storage
        if value is not None:
            if isinstance(value, list):
                value_str = ",".join(str(v) for v in value)
            else:
                value_str = str(value)
        else:
            value_str = None

        # Get or create field response
        field_response = db.query(FieldResponse).filter(
            FieldResponse.submission_id == submission.id,
            FieldResponse.field_id == field_id
        ).first()

        if field_response:
            field_response.value = value_str
        else:
            field_response = FieldResponse(
                submission_id=submission.id,
                field_id=field_id,
                value=value_str
            )
            db.add(field_response)

        db.commit()

        # Get all current answers
        all_responses = db.query(FieldResponse).options(
            joinedload(FieldResponse.field)
        ).filter(
            FieldResponse.submission_id == submission.id
        ).all()

        answers = {}
        for resp in all_responses:
            answers[resp.field.name] = resp.value

        # Get current page
        current_page = db.query(Page).filter(Page.id == submission.current_page_id).first()
        if not current_page:
            # Find first page
            current_page = db.query(Page).filter(
                Page.form_id == submission.form_id,
                Page.is_first == True
            ).first()

        if not current_page:
            current_page = db.query(Page).filter(
                Page.form_id == submission.form_id
            ).order_by(Page.order).first()

        # Determine next page based on navigation rules
        next_page_id = None
        is_complete = False

        if current_page:
            navigation_rules = current_page.navigation_rules
            if navigation_rules:
                next_page_id = ConditionEngine.determine_next_page(
                    current_page.id,
                    navigation_rules,
                    answers,
                    db
                )
                is_complete = next_page_id is None
            else:
                # No navigation rules, go to next page by order
                next_page = db.query(Page).filter(
                    Page.form_id == submission.form_id,
                    Page.order > current_page.order
                ).order_by(Page.order).first()
                
                if next_page:
                    next_page_id = next_page.id
                else:
                    is_complete = True

            # Update submission current page
            if next_page_id:
                submission.current_page_id = next_page_id
            elif is_complete:
                submission.status = "completed"
                from datetime import datetime
                submission.completed_at = datetime.utcnow()
            
            db.commit()

        return SubmitAnswerResponse(
            success=True,
            next_page_id=next_page_id,
            is_complete=is_complete,
            message="Answer submitted successfully" if not is_complete else "Form completed!"
        )

    @staticmethod
    def complete_submission(db: Session, session_id: str) -> bool:
        """Mark submission as completed"""
        submission = db.query(Submission).filter(Submission.session_id == session_id).first()
        if not submission:
            return False
        
        submission.status = "completed"
        from datetime import datetime
        submission.completed_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def get_submission_responses(db: Session, session_id: str) -> Dict[str, Any]:
        """Get all responses for a submission"""
        submission = db.query(Submission).filter(Submission.session_id == session_id).first()
        if not submission:
            return {}
        
        responses = db.query(FieldResponse).options(
            joinedload(FieldResponse.field)
        ).filter(FieldResponse.submission_id == submission.id).all()
        
        result = {}
        for response in responses:
            field = response.field
            result[field.name] = {
                "field_id": field.id,
                "label": field.label,
                "value": response.value,
                "field_type": field.field_type.value
            }
        
        return result

