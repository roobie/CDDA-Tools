from typing import Union, List, Dict

from eoctool.data import EffectOnCondition, EOCType, Condition, Effect
from eoctool.serialization import EOCSerializer
from eoctool.validation import EOCValidator


class EOCBuilder:
    """Fluent interface for building EOCs"""

    def __init__(self, id: str):
        self.eoc = EffectOnCondition(id=id)

    def with_type(self, eoc_type: EOCType) -> "EOCBuilder":
        self.eoc.eoc_type = eoc_type
        return self

    def with_comment(self, comment: str) -> "EOCBuilder":
        self.eoc.comments.append(comment)
        return self

    def with_event(self, event: str) -> "EOCBuilder":
        self.eoc.required_event = event
        self.eoc.eoc_type = EOCType.EVENT
        return self

    def with_recurrence(self, recurrence: Union[int, str, List]) -> "EOCBuilder":
        self.eoc.recurrence = recurrence
        if not self.eoc.eoc_type:
            self.eoc.eoc_type = EOCType.RECURRING
        return self

    def with_condition(self, condition: Union[Dict, Condition]) -> "EOCBuilder":
        if isinstance(condition, Condition):
            condition = EOCSerializer()._to_dict(condition)
        self.eoc.condition = condition
        return self

    def with_effect(self, effect: Union[Dict, List, Effect]) -> "EOCBuilder":
        if isinstance(effect, Effect):
            effect = EOCSerializer()._to_dict(effect)
        self.eoc.effect = effect
        return self

    def with_false_effect(self, effect: Union[Dict, List, Effect]) -> "EOCBuilder":
        if isinstance(effect, Effect):
            effect = EOCSerializer()._to_dict(effect)
        self.eoc.false_effect = effect
        return self

    def as_global(self, run_for_npcs: bool = False) -> "EOCBuilder":
        self.eoc.global_ = True
        self.eoc.run_for_npcs = run_for_npcs
        return self

    def build(self, validate: bool = True) -> EffectOnCondition:
        if validate:
            errors = EOCValidator().validate(self.eoc)
            if errors:
                raise ValueError(f"EOC validation failed: {errors}")
        return self.eoc

    def to_json(self, indent: int = 2, validate: bool = True) -> str:
        eoc = self.build(validate=validate)
        return EOCSerializer().serialize(eoc, indent=indent)
