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


