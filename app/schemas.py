from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from app.models import FieldType, ConditionOperator, ConditionAction


# Form Schemas
class FormBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True


class FormCreate(FormBase):
    pass


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class FormResponse(FormBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Page Schemas
class PageBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    is_first: bool = False


class PageCreate(PageBase):
    form_id: int


class PageUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_first: Optional[bool] = None


class PageResponse(PageBase):
    id: int
    form_id: int

    class Config:
        from_attributes = True


# Field Schemas
class FieldBase(BaseModel):
    name: str = Field(..., description="Unique field identifier (e.g., 'email', 'age')")
    label: str
    field_type: FieldType
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    order: int = 0
    is_required: bool = False
    is_visible: bool = True
    default_value: Optional[str] = None
    options: Optional[Dict[str, Any]] = None  # For select, radio, checkbox
    validation_rules: Optional[Dict[str, Any]] = None  # min, max, pattern, etc.


class FieldCreate(FieldBase):
    page_id: int


class FieldUpdate(BaseModel):
    name: Optional[str] = None
    label: Optional[str] = None
    field_type: Optional[FieldType] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    order: Optional[int] = None
    is_required: Optional[bool] = None
    is_visible: Optional[bool] = None
    default_value: Optional[str] = None
    options: Optional[Dict[str, Any]] = None
    validation_rules: Optional[Dict[str, Any]] = None


class FieldResponse(FieldBase):
    id: int
    page_id: int

    class Config:
        from_attributes = True


# Condition Schemas
class FieldConditionBase(BaseModel):
    source_field_id: int
    target_field_id: int
    operator: ConditionOperator
    value: Optional[str] = None
    action: ConditionAction


class FieldConditionCreate(FieldConditionBase):
    pass


class FieldConditionResponse(FieldConditionBase):
    id: int

    class Config:
        from_attributes = True


# Page Navigation Schemas
class PageNavigationRuleBase(BaseModel):
    source_field_id: Optional[int] = None
    operator: ConditionOperator
    value: Optional[str] = None
    target_page_id: Optional[int] = None
    is_default: bool = False


class PageNavigationRuleCreate(PageNavigationRuleBase):
    page_id: int


class PageNavigationRuleResponse(PageNavigationRuleBase):
    id: int
    page_id: int

    class Config:
        from_attributes = True


# Submission Schemas
class FieldResponseValue(BaseModel):
    field_id: int
    value: Optional[Union[str, int, float, bool, List[str]]] = None


class SubmissionCreate(BaseModel):
    form_id: int
    session_id: Optional[str] = None


class SubmissionResponse(BaseModel):
    field_id: int
    value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionStatus(BaseModel):
    id: int
    form_id: int
    session_id: str
    status: str
    current_page_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Renderer Schemas
class RenderedField(BaseModel):
    id: int
    name: str
    label: str
    field_type: FieldType
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    is_required: bool
    is_visible: bool
    default_value: Optional[str] = None
    options: Optional[Dict[str, Any]] = None
    validation_rules: Optional[Dict[str, Any]] = None
    current_value: Optional[Union[str, int, float, bool, List[str]]] = None  # If already answered (can be various types)


class RenderedPage(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    order: int
    fields: List[RenderedField]


class FormRenderRequest(BaseModel):
    form_id: int
    session_id: str
    current_answers: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Current field answers: {field_name: value}")


class FormRenderResponse(BaseModel):
    form_id: int
    form_title: str
    current_page: RenderedPage
    next_page_id: Optional[int] = None
    is_complete: bool = False
    progress: float = Field(..., ge=0, le=100, description="Completion percentage")


class SubmitAnswerRequest(BaseModel):
    session_id: str
    field_id: int
    value: Optional[Union[str, int, float, bool, List[str]]] = None


class SubmitAnswerResponse(BaseModel):
    success: bool
    next_page_id: Optional[int] = None
    is_complete: bool = False
    message: Optional[str] = None


