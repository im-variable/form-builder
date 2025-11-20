"""
Submission Router
Handles form submissions and answer storage
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.schemas import (
    SubmissionCreate, SubmitAnswerRequest, SubmitAnswerResponse,
    SubmissionStatus
)
from app.services.submission_service import SubmissionService

router = APIRouter()


@router.post("/create", response_model=SubmissionStatus, status_code=201)
def create_submission(submission_data: SubmissionCreate, db: Session = Depends(get_db)):
    """Create a new form submission session"""
    submission = SubmissionService.create_submission(
        db=db,
        form_id=submission_data.form_id,
        session_id=submission_data.session_id
    )
    return submission


@router.get("/{session_id}", response_model=SubmissionStatus)
def get_submission(session_id: str, db: Session = Depends(get_db)):
    """Get submission status by session ID"""
    submission = SubmissionService.get_submission(db, session_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@router.post("/submit-answer", response_model=SubmitAnswerResponse)
def submit_answer(answer_data: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """
    Submit an answer for a field
    
    This endpoint:
    - Stores the field answer
    - Evaluates conditions to determine next page
    - Returns next page ID or completion status
    """
    try:
        return SubmissionService.submit_answer(
            db=db,
            session_id=answer_data.session_id,
            field_id=answer_data.field_id,
            value=answer_data.value
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/complete", status_code=200)
def complete_submission(session_id: str, db: Session = Depends(get_db)):
    """Mark a submission as completed"""
    success = SubmissionService.complete_submission(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"message": "Submission completed successfully"}


@router.get("/{session_id}/responses")
def get_submission_responses(session_id: str, db: Session = Depends(get_db)):
    """Get all responses for a submission"""
    responses = SubmissionService.get_submission_responses(db, session_id)
    if not responses:
        raise HTTPException(status_code=404, detail="Submission not found or no responses")
    return responses


