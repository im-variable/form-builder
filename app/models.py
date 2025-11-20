from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, JSON, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class FieldType(str, enum.Enum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    EMAIL = "email"
    PHONE = "phone"
    DATE = "date"
    DATETIME = "datetime"
    SELECT = "select"
    MULTISELECT = "multiselect"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    BOOLEAN = "boolean"
    FILE = "file"
    RATING = "rating"


class ConditionOperator(str, enum.Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_EQUAL = "greater_equal"
    LESS_EQUAL = "less_equal"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IN = "in"
    NOT_IN = "not_in"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"


class ConditionAction(str, enum.Enum):
    SHOW = "show"
    HIDE = "hide"
    ENABLE = "enable"
    DISABLE = "disable"
    REQUIRE = "require"
    SKIP = "skip"


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    pages = relationship("Page", back_populates="form", cascade="all, delete-orphan", order_by="Page.order")
    submissions = relationship("Submission", back_populates="form", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    is_first = Column(Boolean, default=False)

    form = relationship("Form", back_populates="pages")
    fields = relationship("Field", back_populates="page", cascade="all, delete-orphan", order_by="Field.order")
    navigation_rules = relationship("PageNavigationRule", foreign_keys="PageNavigationRule.page_id", back_populates="page", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Field identifier (e.g., "email", "age")
    label = Column(String(255), nullable=False)  # Display label
    field_type = Column(SQLEnum(FieldType), nullable=False)
    placeholder = Column(String(255), nullable=True)
    help_text = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    default_value = Column(Text, nullable=True)
    
    # Field-specific options (JSON)
    options = Column(JSON, nullable=True)  # For select, radio, checkbox options
    validation_rules = Column(JSON, nullable=True)  # min, max, pattern, etc.
    
    page = relationship("Page", back_populates="fields")
    conditions = relationship("FieldCondition", foreign_keys="FieldCondition.target_field_id", back_populates="target_field", cascade="all, delete-orphan")
    source_conditions = relationship("FieldCondition", foreign_keys="FieldCondition.source_field_id", back_populates="source_field")
    responses = relationship("FieldResponse", back_populates="field", cascade="all, delete-orphan")


class FieldCondition(Base):
    __tablename__ = "field_conditions"

    id = Column(Integer, primary_key=True, index=True)
    source_field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    target_field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    operator = Column(SQLEnum(ConditionOperator), nullable=False)
    value = Column(Text, nullable=True)  # Value to compare against
    action = Column(SQLEnum(ConditionAction), nullable=False)  # What to do when condition is met
    
    source_field = relationship("Field", foreign_keys=[source_field_id], back_populates="source_conditions")
    target_field = relationship("Field", foreign_keys=[target_field_id], back_populates="conditions")


class PageNavigationRule(Base):
    __tablename__ = "page_navigation_rules"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    source_field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)  # Field that triggers navigation
    operator = Column(SQLEnum(ConditionOperator), nullable=False)
    value = Column(Text, nullable=True)
    target_page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=True)  # Page to navigate to
    is_default = Column(Boolean, default=False)  # Default next page if no conditions match
    
    page = relationship("Page", foreign_keys=[page_id], back_populates="navigation_rules")
    target_page = relationship("Page", foreign_keys=[target_page_id])
    source_field = relationship("Field", foreign_keys=[source_field_id])


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), nullable=False, index=True)  # Unique session identifier
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    current_page_id = Column(Integer, ForeignKey("pages.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    form = relationship("Form", back_populates="submissions")
    current_page = relationship("Page")
    responses = relationship("FieldResponse", back_populates="submission", cascade="all, delete-orphan")


class FieldResponse(Base):
    __tablename__ = "field_responses"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    value = Column(Text, nullable=True)  # Store as text, parse based on field type
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    submission = relationship("Submission", back_populates="responses")
    field = relationship("Field", back_populates="responses")

