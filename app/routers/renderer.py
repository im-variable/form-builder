"""
Form Renderer Router
Handles rendering forms and determining next pages
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import FormRenderRequest, FormRenderResponse
from app.services.form_renderer_service import FormRendererService

router = APIRouter()


@router.post("/render", response_model=FormRenderResponse)
def render_form(request: FormRenderRequest, db: Session = Depends(get_db)):
    """
    Render a form and return the current page to display
    
    This endpoint:
    - Determines which page to show based on current answers
    - Evaluates field conditions to show/hide fields
    - Returns the next page ID if available
    - Calculates form completion progress
    """
    try:
        return FormRendererService.render_form(
            db=db,
            form_id=request.form_id,
            session_id=request.session_id,
            current_answers=request.current_answers
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/render/{form_id}/{session_id}", response_model=FormRenderResponse)
def render_form_get(form_id: int, session_id: str, db: Session = Depends(get_db)):
    """
    Render a form (GET version) - useful for retrieving current state
    """
    try:
        return FormRendererService.render_form(
            db=db,
            form_id=form_id,
            session_id=session_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/submission/{submission_id}/page/{page_id}", response_model=FormRenderResponse)
def render_page_for_submission(submission_id: int, page_id: int, db: Session = Depends(get_db)):
    """
    Render a specific page for a submission with populated data
    
    This endpoint:
    - Gets the submission by ID
    - Renders the specified page
    - Populates fields with existing answers from the submission
    - Returns next page ID
    """
    try:
        return FormRendererService.render_page_for_submission(
            db=db,
            submission_id=submission_id,
            page_id=page_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/submission/{submission_id}/previous-page", response_model=FormRenderResponse)
def get_previous_page_for_submission(submission_id: int, db: Session = Depends(get_db)):
    """
    Get the previous page for a submission with populated data
    """
    from app.services.submission_service import SubmissionService
    from app.models import Page, Field
    
    try:
        # Get submission
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")
        
        if not submission.current_page_id:
            raise HTTPException(status_code=400, detail="Submission has no current page")
        
        # Get current page
        current_page = db.query(Page).filter(Page.id == submission.current_page_id).first()
        if not current_page:
            raise HTTPException(status_code=404, detail="Current page not found")
        
        # Get all pages and find the ACTUAL previous page (based on navigation path, not sequential order)
        # This handles cases where pages were skipped due to conditions
        all_pages = db.query(Page).filter(Page.form_id == submission.form_id).all()
        sorted_pages = sorted(all_pages, key=lambda p: (not p.is_first, p.order or 0))
        current_page_index = next((i for i, p in enumerate(sorted_pages) if p.id == current_page.id), -1)
        
        if current_page_index <= 0:
            raise HTTPException(status_code=400, detail="No previous page available")
        
        # Get all answers for this submission to determine which pages were actually visited
        from app.services.form_renderer_service import FormRendererService
        db_answers = FormRendererService.get_answers_by_submission_id(db, submission_id)
        
        # Find the actual previous page by checking which pages have answers
        # Start from the page before current and go backwards
        previous_page_id = None
        for i in range(current_page_index - 1, -1, -1):
            candidate_page = sorted_pages[i]
            # Check if this page has any answers
            page_fields = db.query(Field).filter(Field.page_id == candidate_page.id).all()
            page_field_names = [f.name for f in page_fields]
            
            # Check if any field from this page has an answer
            has_answers = any(
                db_answers.get(field_name) is not None and db_answers.get(field_name) != ''
                for field_name in page_field_names
            ) if db_answers else False
            
            if has_answers:
                # This page was visited (has answers), so it's the actual previous page
                previous_page_id = candidate_page.id
                break
        
        # If no page with answers found, fall back to sequential previous page
        if previous_page_id is None:
            previous_page_id = sorted_pages[current_page_index - 1].id
        
        return FormRendererService.render_page_for_submission(
            db=db,
            submission_id=submission_id,
            page_id=previous_page_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/submission/{submission_id}/next-page", response_model=FormRenderResponse)
def get_next_page_for_submission(submission_id: int, db: Session = Depends(get_db)):
    """
    Get the next page for a submission with populated data
    """
    from app.services.submission_service import SubmissionService
    from app.models import Page
    
    try:
        # Get submission
        submission = SubmissionService.get_submission_by_id(db, submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail=f"Submission {submission_id} not found")
        
        if not submission.current_page_id:
            raise HTTPException(status_code=400, detail="Submission has no current page")
        
        # Get current page
        current_page = db.query(Page).filter(Page.id == submission.current_page_id).first()
        if not current_page:
            raise HTTPException(status_code=404, detail="Current page not found")
        
        # Render current page to get next_page_id
        form_response = FormRendererService.render_page_for_submission(
            db=db,
            submission_id=submission_id,
            page_id=current_page.id
        )
        
        if not form_response.next_page_id:
            raise HTTPException(status_code=400, detail="No next page available")
        
        # Render next page
        return FormRendererService.render_page_for_submission(
            db=db,
            submission_id=submission_id,
            page_id=form_response.next_page_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


