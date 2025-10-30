from dataclasses import dataclass, field, asdict  
from typing import Optional, Union, List, Dict, Any  
from enum import Enum  
  
class EOCType(Enum):  
    ACTIVATION = "ACTIVATION"  
    RECURRING = "RECURRING"  
    AVATAR_DEATH = "AVATAR_DEATH"  
    NPC_DEATH = "NPC_DEATH"  
    PREVENT_DEATH = "PREVENT_DEATH"  
    EVENT = "EVENT"  
  
@dataclass  
class EffectOnCondition:  
    type: str = "effect_on_condition"  
    id: str = ""  
    eoc_type: Optional[EOCType] = None  
    recurrence: Optional[Union[int, Dict, List]] = None  
    condition: Optional[Dict] = None  
    deactivate_condition: Optional[Dict] = None  
    required_event: Optional[str] = None  
    effect: Optional[Union[Dict, List[Dict]]] = None  
    false_effect: Optional[Union[Dict, List[Dict]]] = None  
    global_: Optional[bool] = field(default=None, metadata={"json_key": "global"})  
    run_for_npcs: Optional[bool] = None

@dataclass  
class Condition:  
    """Base class for all conditions"""  
    pass  
  
@dataclass  
class AndCondition(Condition):  
    and_: List[Union[Condition, Dict]] = field(default_factory=list, metadata={"json_key": "and"})  
  
@dataclass  
class OrCondition(Condition):  
    or_: List[Union[Condition, Dict]] = field(default_factory=list, metadata={"json_key": "or"})  
  
@dataclass  
class NotCondition(Condition):  
    not_: Union[Condition, Dict] = field(metadata={"json_key": "not"})  
  
@dataclass  
class HasTraitCondition(Condition):  
    u_has_trait: str  
  
@dataclass  
class HasAnyTraitCondition(Condition):  
    u_has_any_trait: List[str]

@dataclass  
class Effect:  
    """Base class for all effects"""  
    pass  
  
@dataclass  
class MessageEffect(Effect):  
    u_message: str  
    type: Optional[str] = None  # "good", "bad", "neutral", etc.  
    popup: Optional[bool] = None  
  
@dataclass  
class RunEOCsEffect(Effect):  
    run_eocs: Union[str, List[str], Dict]  
    iterations: Optional[Union[int, Dict]] = None  
    time_in_future: Optional[Union[int, str, Dict, List]] = None  
    variables: Optional[Dict[str, Any]] = None  
  
@dataclass  
class AddTraitEffect(Effect):  
    u_add_trait: str  
  
@dataclass  
class GiveAchievementEffect(Effect):  
    give_achievement: str

@dataclass  
class VariableObject:  
    """Base for variable objects"""  
    pass  
  
@dataclass  
class GlobalVal(VariableObject):  
    global_val: str  
  
@dataclass  
class UVal(VariableObject):  
    u_val: str  
  
@dataclass  
class ContextVal(VariableObject):  
    context_val: str  
  
@dataclass  
class MathExpression(VariableObject):  
    math: List[str]