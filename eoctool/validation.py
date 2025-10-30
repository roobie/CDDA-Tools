from typing import Protocol
from typing import Optional, Union, List, Dict, Any
import json

from eoctool.data import EOCType, EffectOnCondition


class EOCValidator:
    """Validates EOC structure and constraints"""

    def validate(self, eoc: EffectOnCondition) -> List[str]:
        """Returns list of validation errors"""
        errors = []

        # Required fields
        if not eoc.id:
            errors.append("EOC must have an 'id' field")

        # Type-specific validation
        if eoc.eoc_type == EOCType.EVENT and not eoc.required_event:
            errors.append("EVENT type EOCs must have 'required_event'")

        if eoc.eoc_type == EOCType.RECURRING and not eoc.recurrence:
            errors.append("RECURRING type EOCs must have 'recurrence'")

        # Conditional validation
        if eoc.deactivate_condition and not eoc.recurrence:
            errors.append("'deactivate_condition' only works with recurring EOCs")

        if eoc.run_for_npcs and not eoc.global_:
            errors.append("'run_for_npcs' can only be true if 'global' is true")

        return errors

    def validate_condition(self, condition: Dict) -> List[str]:
        """Validates condition structure"""
        errors = []
        # Add condition-specific validation
        return errors

    def validate_effect(self, effect: Union[Dict, List]) -> List[str]:
        """Validates effect structure"""
        errors = []
        # Add effect-specific validation
        return errors
