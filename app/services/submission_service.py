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
    def get_submission_by_id(db: Session, submission_id: int) -> Optional[Submission]:
        """Get submission by ID"""
        return db.query(Submission).filter(Submission.id == submission_id).first()

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

        # Note: We don't determine next page here because multiple fields might be submitted
        # on the same page. The renderForm service will determine the next page after all
        # fields on the current page are submitted.
        
        return SubmitAnswerResponse(
            success=True,
            next_page_id=None,  # Will be determined by renderForm
            is_complete=False,  # Will be determined by renderForm
            message="Answer submitted successfully"
        )

    @staticmethod
    def complete_submission(db: Session, session_id: str) -> bool:
        """Mark submission as completed"""
        submission = db.query(Submission).filter(Submission.session_id == session_id).first()
        if not submission:
            return False
        
        submission.status = "completed"
        from datetime import datetime, timezone
        submission.completed_at = datetime.now(timezone.utc)
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

    @staticmethod
    def get_form_submissions(db: Session, form_id: int):
        """Get all completed submissions for a form"""
        submissions = db.query(Submission).options(
            joinedload(Submission.responses).joinedload(FieldResponse.field)
        ).filter(
            Submission.form_id == form_id,
            Submission.status == "completed"
        ).order_by(Submission.completed_at.desc()).all()
        
        result = []
        for submission in submissions:
            responses_dict = {}
            for response in submission.responses:
                field = response.field
                responses_dict[field.name] = {
                    "field_id": field.id,
                    "label": field.label,
                    "value": response.value,
                    "field_type": field.field_type.value
                }
            
            result.append({
                "id": submission.id,
                "session_id": submission.session_id,
                "status": submission.status,
                # Store in UTC, frontend will convert to local timezone
                "created_at": submission.created_at.isoformat() if submission.created_at else None,
                "completed_at": submission.completed_at.isoformat() if submission.completed_at else None,
                "responses": responses_dict
            })
        
        return result

    @staticmethod
    def delete_submission(db: Session, submission_id: int) -> bool:
        """Delete a submission and all its responses"""
        submission = db.query(Submission).filter(Submission.id == submission_id).first()
        if not submission:
            return False
        
        # Cascade delete will handle FieldResponse deletion
        db.delete(submission)
        db.commit()
        return True

