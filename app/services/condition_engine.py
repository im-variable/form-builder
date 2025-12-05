"""
Condition Evaluation Engine
Evaluates field conditions and page navigation rules based on current answers
"""
from typing import Dict, Any, Optional, List
from app.models import ConditionOperator, FieldCondition, PageNavigationRule
from sqlalchemy.orm import Session


class ConditionEngine:
    """Engine for evaluating conditions and determining field visibility/page navigation"""

    @staticmethod
    def evaluate_operator(operator: ConditionOperator, field_value: Any, condition_value: str) -> bool:
        """Evaluate a condition operator"""
        if operator == ConditionOperator.IS_EMPTY:
            return field_value is None or field_value == "" or (isinstance(field_value, list) and len(field_value) == 0)
        
        if operator == ConditionOperator.IS_NOT_EMPTY:
            return not (field_value is None or field_value == "" or (isinstance(field_value, list) and len(field_value) == 0))

        if field_value is None:
            return False

        # Convert field_value to string for comparison if needed
        field_str = str(field_value).lower() if isinstance(field_value, (str, int, float, bool)) else str(field_value)
        condition_str = str(condition_value).lower() if condition_value else ""

        if operator == ConditionOperator.EQUALS:
            return field_str == condition_str
        
        if operator == ConditionOperator.NOT_EQUALS:
            return field_str != condition_str
        
        if operator == ConditionOperator.CONTAINS:
            return condition_str in field_str
        
        if operator == ConditionOperator.NOT_CONTAINS:
            return condition_str not in field_str
        
        if operator == ConditionOperator.IN:
            values = [v.strip().lower() for v in condition_value.split(",")]
            return field_str in values
        
        if operator == ConditionOperator.NOT_IN:
            values = [v.strip().lower() for v in condition_value.split(",")]
            return field_str not in values

        # Numeric comparisons
        try:
            field_num = float(field_value) if not isinstance(field_value, (int, float)) else field_value
            condition_num = float(condition_value)
            
            if operator == ConditionOperator.GREATER_THAN:
                return field_num > condition_num
            
            if operator == ConditionOperator.LESS_THAN:
                return field_num < condition_num
            
            if operator == ConditionOperator.GREATER_EQUAL:
                return field_num >= condition_num
            
            if operator == ConditionOperator.LESS_EQUAL:
                return field_num <= condition_num
        except (ValueError, TypeError):
            return False

        return False

    @staticmethod
    def evaluate_field_conditions(
        field_id: int,
        conditions: List[FieldCondition],
        answers: Dict[str, Any]
    ) -> Dict[str, bool]:
        """
        Evaluate all conditions for a field and return action states
        Returns: Dict with action -> bool (e.g., {"show": True, "require": False})
        
        Logic:
        - Fields with "show" conditions: hidden by default, shown only if condition is met
        - Fields with "hide" conditions: visible by default, hidden if condition is met
        - Multiple conditions use OR logic (any condition met applies the action)
        """
        # Check what types of conditions exist
        has_show_conditions = any(c.action.value == "show" for c in conditions)
        has_hide_conditions = any(c.action.value == "hide" for c in conditions)
        
        # Set default values based on condition types
        # If conditions exist, they override defaults completely
        has_require_conditions = any(c.action.value == "require" for c in conditions)
        has_disable_conditions = any(c.action.value == "disable" for c in conditions)
        has_enable_conditions = any(c.action.value == "enable" for c in conditions)
        has_skip_conditions = any(c.action.value == "skip" for c in conditions)
        
        if has_show_conditions and not has_hide_conditions:
            # Field should be hidden by default, shown only if condition is met
            result = {
                "show": False,
                "hide": True,
                "enable": not has_disable_conditions,  # Enabled unless disable condition exists
                "disable": has_disable_conditions,
                "require": has_require_conditions,  # Required if require condition exists
                "skip": has_skip_conditions
            }
        else:
            # Default: visible (for hide conditions or no visibility conditions)
            result = {
                "show": True,
                "hide": False,
                "enable": not has_disable_conditions,  # Enabled unless disable condition exists
                "disable": has_disable_conditions,
                "require": has_require_conditions,  # Required if require condition exists
                "skip": has_skip_conditions
            }

        # Evaluate all conditions - if ANY condition is met, apply its action
        for condition in conditions:
            # Get source field value from answers
            # Source field can be from same page or different page - it's looked up by name
            # The answers dict contains all answers from all pages
            source_field_name = condition.source_field.name
            field_value = answers.get(source_field_name)
            
            # If source field not found in answers, treat as None/empty
            # This handles cases where source field is on a page not yet visited
            if field_value is None and source_field_name not in answers:
                # Source field not answered yet (might be on different page not yet visited)
                field_value = None

            # Evaluate condition
            condition_met = ConditionEngine.evaluate_operator(
                condition.operator,
                field_value,
                condition.value or ""
            )

            if condition_met:
                action = condition.action.value
                if action == "show":
                    result["show"] = True
                    result["hide"] = False
                elif action == "hide":
                    result["show"] = False
                    result["hide"] = True
                elif action == "enable":
                    result["enable"] = True
                    result["disable"] = False
                elif action == "disable":
                    result["enable"] = False
                    result["disable"] = True
                elif action == "require":
                    result["require"] = True
                elif action == "skip":
                    result["skip"] = True

        return result

    @staticmethod
    def determine_next_page(
        current_page_id: int,
        navigation_rules: List[PageNavigationRule],
        answers: Dict[str, Any],
        db: Session
    ) -> Optional[int]:
        """
        Determine the next page based on navigation rules and current answers
        Returns page_id or None if no next page (form complete)
        """
        # Sort rules: non-default first, then default
        sorted_rules = sorted(navigation_rules, key=lambda r: r.is_default)

        for rule in sorted_rules:
            # Default rule - use it if no other rule matches
            # But check non-default rules first
            if rule.is_default:
                # Only return default if we've checked all non-default rules
                # Since sorted_rules has non-default first, if we reach a default rule,
                # it means no non-default rules matched
                return rule.target_page_id

            # Evaluate condition-based rule
            if rule.source_field_id:
                source_field = rule.source_field
                field_value = answers.get(source_field.name)

                condition_met = ConditionEngine.evaluate_operator(
                    rule.operator,
                    field_value,
                    rule.value or ""
                )

                if condition_met:
                    return rule.target_page_id

        # No matching rule found
        return None

    @staticmethod
    def should_field_be_visible(
        field_id: int,
        field_conditions: List[FieldCondition],
        answers: Dict[str, Any]
    ) -> bool:
        """Determine if a field should be visible based on conditions"""
        if not field_conditions:
            return True

        result = ConditionEngine.evaluate_field_conditions(field_id, field_conditions, answers)
        return result["show"] and not result["hide"]


