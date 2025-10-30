## Core Architecture Overview

The solution should follow a layered architecture:

1. **Base Data Models (Dataclasses)**
2. **Condition Models**
3. **Effect Models** 
4. **Validation Layer**
5. **Serialization Layer**

## 1. Understanding the EOC Structure

The fundamental EOC structure includes these key fields: [1](#8-0) 

EOC types can be: [2](#8-1) 

## 2. Implementing Base EOC Dataclass

Create a base dataclass that maps 1:1 to the JSON structure:

```python
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
```

## 3. Implementing Condition Models

Conditions use boolean logic and various checks: [3](#8-2) 

Create condition builders:

```python
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
```

Example from MindOverMatter: [4](#8-3) [5](#8-4) 

## 4. Implementing Effect Models

Effects have numerous types: [6](#8-5) 

Create effect builders:

```python
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
```

Example from MindOverMatter showing complex effect chains: [7](#8-6) 

## 5. Variable Object Support

Variable objects are crucial for dynamic values: [8](#8-7) 

Implement variable object types:

```python
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
```

## 6. Validation Layer

Implement comprehensive validation:

```python
from typing import Protocol
import json

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
```

## 7. Serialization Layer

Handle Python to JSON conversion:

```python
import json
from typing import Any

class EOCSerializer:
    """Converts Python EOC objects to JSON"""
    
    def serialize(self, eoc: EffectOnCondition, indent: int = 2) -> str:
        """Serialize EOC to JSON string"""
        data = self._to_dict(eoc)
        return json.dumps(data, indent=indent, ensure_ascii=False)
    
    def _to_dict(self, obj: Any) -> Any:
        """Convert dataclass to dict, handling special cases"""
        if hasattr(obj, '__dataclass_fields__'):
            result = {}
            for field_name, field_def in obj.__dataclass_fields__.items():
                value = getattr(obj, field_name)
                
                # Skip None values
                if value is None:
                    continue
                
                # Handle metadata for JSON key mapping
                json_key = field_def.metadata.get('json_key', field_name)
                # Remove trailing underscore (for Python reserved keywords)
                if json_key.endswith('_'):
                    json_key = json_key[:-1]
                
                result[json_key] = self._to_dict(value)
            
            return result
        elif isinstance(obj, Enum):
            return obj.value
        elif isinstance(obj, (list, tuple)):
            return [self._to_dict(item) for item in obj]
        elif isinstance(obj, dict):
            return {k: self._to_dict(v) for k, v in obj.items()}
        else:
            return obj
```

## 8. Builder Pattern for Ergonomics

Implement a fluent builder interface:

```python
class EOCBuilder:
    """Fluent interface for building EOCs"""
    
    def __init__(self, id: str):
        self.eoc = EffectOnCondition(id=id)
    
    def with_type(self, eoc_type: EOCType) -> 'EOCBuilder':
        self.eoc.eoc_type = eoc_type
        return self
    
    def with_event(self, event: str) -> 'EOCBuilder':
        self.eoc.required_event = event
        self.eoc.eoc_type = EOCType.EVENT
        return self
    
    def with_recurrence(self, recurrence: Union[int, str, List]) -> 'EOCBuilder':
        self.eoc.recurrence = recurrence
        if not self.eoc.eoc_type:
            self.eoc.eoc_type = EOCType.RECURRING
        return self
    
    def with_condition(self, condition: Union[Dict, Condition]) -> 'EOCBuilder':
        if isinstance(condition, Condition):
            condition = EOCSerializer()._to_dict(condition)
        self.eoc.condition = condition
        return self
    
    def with_effect(self, effect: Union[Dict, List, Effect]) -> 'EOCBuilder':
        if isinstance(effect, Effect):
            effect = EOCSerializer()._to_dict(effect)
        self.eoc.effect = effect
        return self
    
    def with_false_effect(self, effect: Union[Dict, List, Effect]) -> 'EOCBuilder':
        if isinstance(effect, Effect):
            effect = EOCSerializer()._to_dict(effect)
        self.eoc.false_effect = effect
        return self
    
    def as_global(self, run_for_npcs: bool = False) -> 'EOCBuilder':
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
```

## 9. Usage Examples

Based on MindOverMatter patterns: [9](#8-8) 

```python
# Example 1: Simple recurring EOC
eoc = (EOCBuilder("EOC_PSI_NETHER_ATTUNEMENT_PERIODIC_ADJUSTMENT")
    .with_recurrence(["30 seconds", "30 seconds"])
    .with_condition(AndCondition(and_=[
        HasAnyTraitCondition(u_has_any_trait=["BIOKINETIC", "CLAIRSENTIENT"]),
        NotCondition(not_={"u_has_effect": "effect_noetic_resilience"})
    ]))
    .with_effect(RunEOCsEffect(run_eocs="EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST_2"))
    .build())

print(EOCSerializer().serialize(eoc))
``` [10](#8-9) 

```python
# Example 2: EVENT EOC with condition
eoc = (EOCBuilder("EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT")
    .with_event("character_gains_effect")
    .with_condition({
        "and": [
            {"compare_string": ["effect_disease_psionic_drain", {"context_val": "effect"}]},
            "u_is_avatar"
        ]
    })
    .with_effect([
        GiveAchievementEffect(give_achievement="mom_gain_any_nether_attunement"),
        RunEOCsEffect(run_eocs="EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT_FURTHER_CHECKS")
    ])
    .build())
```

## 10. Advanced Features

### Nested EOCs Support [11](#8-10) 

### Context Variables [12](#8-11) 

### EOC Chaining with time_in_future [13](#8-12) 

## 11. Testing Strategy

```python
import unittest

class TestEOCGeneration(unittest.TestCase):
    def test_basic_eoc_creation(self):
        eoc = EOCBuilder("TEST_EOC").with_effect({"u_message": "test"}).build()
        self.assertEqual(eoc.id, "TEST_EOC")
    
    def test_validation_catches_errors(self):
        with self.assertRaises(ValueError):
            EOCBuilder("TEST").with_type(EOCType.EVENT).build()  # Missing required_event
    
    def test_serialization_matches_expected(self):
        eoc = EOCBuilder("TEST").with_effect({"u_message": "test"}).build()
        json_str = EOCSerializer().serialize(eoc)
        data = json.loads(json_str)
        self.assertEqual(data["type"], "effect_on_condition")
```

## Notes

This comprehensive solution provides:

- **Type Safety**: Full type hints via dataclasses for IDE support and static analysis
- **Validation**: Multi-layer validation catching structural and logical errors before JSON generation
- **Ergonomics**: Builder pattern for readable, chainable EOC construction
- **1:1 Mapping**: Direct correspondence between Python objects and JSON structure
- **Extensibility**: Easy to add new condition/effect types by subclassing base classes
- **Reusability**: Modular components can be composed and shared across projects

The validation layer is particularly important given the complexity of EOC interactions (e.g., `run_for_npcs` requiring `global`, EVENT types requiring `required_event`). The builder pattern makes it easy to construct complex nested structures like those seen in the MindOverMatter mod while maintaining readability.

For production use, consider adding:
- Schema validation against game version
- Auto-completion of common patterns
- Import/export from existing JSON files
- Template system for common EOC patterns
- Integration with mod development workflows

### Citations

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L29-42)
```markdown
## Fields

| Identifier            | Type      | Description |
|--------------------- | --------- | ----------- |
|`recurrence`          | int or variable object or array | The effect_on_condition is automatically invoked (activated) with this many seconds in-between. If it is an object it must have strings `name`, `type`, and `context`. `default` can be either an int or a string describing a time span. `global` is an optional bool (default false), if it is true the variable used will always be from the player character rather than the target of the dialog.  If it is an array it must have two values which are either ints or variable_objects.
|`condition`           | condition  | The condition(s) under which this effect_on_condition, upon activation, will cause its effect.  See the "Dialogue conditions" section of [NPCs](NPCs.md) for the full syntax.
| `deactivate_condition`| condition  | *optional* When an effect_on_condition is automatically activated (invoked) and fails its condition(s), `deactivate_condition` will be tested if it exists and there is no `false_effect` entry.  If it returns true, this effect_on_condition will no longer be invoked automatically every `recurrence` seconds.  Whenever the player/npc gains/loses a trait or bionic all deactivated effect_on_conditions will have `deactivate_condition` run; on a return of false, the effect_on_condition will start being run again.  This is to allow adding effect_on_conditions for specific traits or bionics that don't waste time running when you don't have the target bionic/trait.  See the "Dialogue conditions" section of [NPCs](NPCs.md) for the full syntax.
| `required_event`      | cata_event | The event that when it triggers, this EOC does as well. Only relevant for an EVENT type EOC.
| `effect`              | effect     | The effect(s) caused if `condition` returns true upon activation.  See the "Dialogue Effects" section of [NPCs](NPCs.md) for the full syntax.
| `false_effect`        | effect     | The effect(s) caused if `condition` returns false upon activation.  See the "Dialogue Effects" section of [NPCs](NPCs.md) for the full syntax.
| `global`              | bool       | If this is true, this recurring eoc will be run on the player and every npc from a global queue.  Deactivate conditions will work based on the avatar. If it is false the avatar and every character will have their own copy and their own deactivated list. Defaults to false.
| `run_for_npcs`        | bool       | Can only be true if global is true. If false the EOC will only be run against the avatar. If true the eoc will be run against the avatar and all npcs.  Defaults to false.
| `EOC_TYPE`            | string     | Can be one of `ACTIVATION`, `RECURRING`, `AVATAR_DEATH`, `NPC_DEATH`, `PREVENT_DEATH`, `EVENT` (see details below). It defaults to `ACTIVATION` unless `recurrence` is provided in which case it defaults to `RECURRING`.

```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L43-53)
```markdown
 ### EOC types

`EOC_TYPE` can be any of:

* `ACTIVATION` - activated manually.
* `RECURRING` - activated automatically on schedule (see `recurrence`)
* `AVATAR_DEATH` - automatically invoked whenever the current avatar dies (it will be run with the avatar as `u`), if after it the player is no longer dead they will not die, if there are multiple EOCs they all be run until the player is not dead.
* `NPC_DEATH` - EOCs can only be assigned to run on the death of an npc, in which case u will be the dying npc and npc will be the killer. If after it npc is no longer dead they will not die, if there are multiple they all be run until npc is not dead.
* `PREVENT_DEATH` - whenever the current avatar dies it will be run with the avatar as `u`, if after it the player is no longer dead they will not die, if there are multiple they all be run until the player is not dead.
* `EVENT` - EOCs trigger when a specific event given by "required_event" takes place. 

```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L119-197)
```markdown
## Variable Object

Variable object is a value, that changes due some conditions. Variable can be int, time, string, `math` expression or location variable. Types of variables are:

- `u_val` - variable, that is stored in this character, and, if player dies, the variable is lost also (or if you swap the avatar, for example; the secret one NPC told to character A would be lost for character B); 
- `npc_val` - variable, that is stored in beta talker
- `global_val` - variable, that is store in the world, and won't be lost until you delete said world
- `context_val` - variable, that was delivered from some another entity; For example, EVENT type EoCs can deliver specific variables contributor can use to perform specific checks:
`character_casts_spell` event, that is called every time, you guess it, character cast spell, it also store information about spell name, difficulty and damage, so contributor can create a specific negative effect for every spell casted, depending on this values; Generalized EoCs can also create and use context variables; math equivalent is variable name with `_`
- `var_val` - var_val is a unique variable object in the fact that it attempts to resolve the variable stored inside a context variable. The values for var_val use the same syntax for scope that math [variables](NPCs.md#variables) do.

| Prefix of the value in var_val| Resolved as      |
|------------------|------------------|
| No Prefix or `g_`| global_val       |
| `_`              | context_val      |
| `u_`             | u_val            |
| `n_`             | npc_val          |
| `v_`             | var_val          |

In practice, `{ "var_val": "name" }` can be understood as `{ "global_val/context_val/u_val/npc_val": { "context_val": "name" } }`.

So if you had

| Name | Type | Value |
| --- | --- | --- |
| ref | context_val | key1 |
| ref2 | context_val | u_key2 |
| key1 | global_val | SOME TEXT |
| key2 | u_val | SOME OTHER TEXT |

- If you access "ref" as a context val it will have the value of "key1", if you access it as a var_val it will have a value of "SOME TEXT". 
- If you access "ref2" as a context val it will have the value of "u_key2", if you access it as a var_val it will have a value of "SOME OTHER TEXT". 

For example, imagine you have context variable `{ "context_val": "my_best_gun" }`, and this `my_best_gun` variable contain text `any_random_gun`; also you have a `{ "global_val": "any_random_gun" }`, and this `any_random_gun` variable happened to contain text `ak47`
With both of this, you can use effect `"u_spawn_item": { "var_val": "my_best_gun" }`, and the game will spawn `ak47`, since it is what is stored inside `my_best_gun` global variable

Examples:

you add morale equal to `how_good` variable
```jsonc
{ "u_add_morale": "morale_feeling_good", "bonus": { "u_val": "how_good" } }
```

you add morale random between u_`how_good` and u_`how_bad` variable
```jsonc
{ "u_add_morale": "morale_feeling_good", "bonus": [ { "u_val": "how_good" }, { "u_val": "how_bad" } ] }
```

You make sound `Wow, your'e smart` equal to beta talker's intelligence
```jsonc
{ "u_make_sound": "Wow, your'e smart", "volume": { "npc_val": "intelligence" } }
```

you add morale, equal to `ps_str` portal storm strength value
```jsonc
{ "u_add_morale": "global_val", "bonus": { "global_val": "ps_str" } }
```

you add morale, equal to `ps_str` portal storm strength value plus 1
```jsonc
{ "u_add_morale": "morale_feeling_good", "bonus": { "math": [ "ps_str + 1" ] } }
```

Effect on Condition, that is called every time player cast spell, and add thought `morale_from_spell_difficulty` with mood bonus equal to spell difficulty, and thought `morale_from_spell_damage` with mood bonus equal to damage difficulty
```jsonc
{
  "type": "effect_on_condition",
  "id": "EOC_morale_from_spell",
  "eoc_type": "EVENT",
  "required_event": "character_casts_spell",
  "effect": [
    { "u_add_morale": "morale_from_spell_difficulty", "bonus": { "context_val": "difficulty" } }
    { "u_add_morale": "morale_from_spell_damage", "bonus": { "math": [ "_damage" ] } }
  ]
}
```

TODO: add example of usage `context_val` in generalized EoC, and example for `var_val`

```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L225-290)
```markdown
## Boolean logic
Conditions can be combined into blocks using `"and"`, `"or"` and `"not"`

- `"and"` allow to check multiple conditions, and if each of them are `true`, condition return `true`, otherwise `false`
- `"or"` allow to check multiple conditions, and if at least one of them is `true`, condition return `true`, otherwise `false`
- `"not"` allow to check only one condition (but this condition could be `"and"` or `"or"`, that themselves can check multiple conditions), and swap the result of condition: if you get `true`, the condition return `false`

Examples:

Checks if weather is lightning, **and** you have effect `narcosis`
```jsonc
"condition": { "and": [ { "is_weather": "lightning" }, { "u_has_effect": "narcosis" } ] }
```

Checks if weather is portal storm **or** distant portal storm **or** close portal storm
```jsonc
"condition": { "or": [ { "is_weather": "portal_storm" }, { "is_weather": "distant_portal_storm" }, { "is_weather": "close_portal_storm" } ] }
```

Checks you are **not** close to refugee center (at least 4 overmap tiles afar)
```jsonc
"condition": { "not": { "u_near_om_location": "evac_center_18", "range": 4 } }
```

Checks you don't have any traits from the list
```jsonc
"condition": {
  "and": [
    { "not": { "u_has_trait": "HUMAN_ARMS" } },
    { "not": { "u_has_trait": "HUMAN_SKIN" } },
    { "not": { "u_has_trait": "HUMAN_EYES" } },
    { "not": { "u_has_trait": "HUMAN_HANDS" } },
    { "not": { "u_has_trait": "HUMAN_LEGS" } },
    { "not": { "u_has_trait": "HUMAN_MOUTH" } }
  ]
}
```

Same as previous, but with different syntax
```jsonc
"condition": {
  "not": {
    "or": [
      { "u_has_trait": "HUMAN_ARMS" },
      { "u_has_trait": "HUMAN_SKIN" },
      { "u_has_trait": "HUMAN_EYES" },
      { "u_has_trait": "HUMAN_HANDS" },
      { "u_has_trait": "HUMAN_LEGS" },
      { "u_has_trait": "HUMAN_MOUTH" }
    ]
  }
}
```

Checks there is portal storm **and** you have `MAKAYLA_MUTATOR` mutation **and** you do **not** have item with `PORTAL_PROOF` flag **and** you are outside
```jsonc
"condition": {
  "and": [
    { "is_weather": "portal_storm" },
    { "u_has_trait": "MAKAYLA_MUTATOR" },
    { "not": { "u_has_worn_with_flag": "PORTAL_PROOF" } },
    "u_is_outside"
  ]
}
```

```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1764-1791)
```markdown
# Effects

## General

#### `sound_effect`
Play a sound effect from sound pack `"type": "sound_effect"`


| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "sound_effect" | **mandatory** | string or [variable object](#variable-object) | sound effect, that would be used, respond to `variant` field in `"type": "sound_effect"` |
| "id" | optional | string or [variable object](#variable-object) | `id`, that would be used to play, respond to `id` field in `"type": "sound_effect"`  | 
| "outdoor_event" | optional | boolean | default false; if true, and player is underground, the player is less likely to hear the sound | 
| "volume" | optional | int or [variable object](#variable-object)  | default 80; volume at which the sound would be played; affected by hearing modifier | 

##### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- |
| ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

##### Examples

Plays sound `bionics`, variant `pixelated` with volume 50
```jsonc
{ "sound_effect": "pixelated", "id": "bionics", "volume": 50 },
```

```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2018-2056)
```markdown
Run inline `are_you_strong` EoC
```jsonc
"run_eocs": {
  "id": "are_you_strong",
  "condition": { "math": [ "u_val('strength') > 8" ] },
  "effect": [ { "u_message": "You are strong" } ],
  "false_effect": [ { "u_message": "You are normal" } ]
}
```

Inline EoCs could have their own inline EoCS
This EoC checks your str stat, and if it's less than 4, write `You are weak`; 
if it's bigger, `are_you_strong` EoC is run, that checks is your str is bigger than 8; if it's less, `You are normal` is written
if it's bigger, `are_you_super_strong` effect is run, that checks is your str is bigger than 12; If it's less, `You are strong` is written; if it's more, `You are super strong` is written
```jsonc
{
  "type": "effect_on_condition",
  "id": "are_you_weak",
  "//": "there is a variety of ways you can do the exact same effect that would work better",
  "//2": "but for the sake of example, let's ignore it",
  "condition": { "math": [ "u_val('strength') > 4" ] },
  "false_effect": [ { "u_message": "You are weak" } ],
  "effect": {
    "run_eocs": {
      "id": "are_you_strong",
      "condition": { "math": [ "u_val('strength') > 8" ] },
      "false_effect": [ { "u_message": "You are normal" } ],
      "effect": {
        "run_eocs": {
          "id": "are_you_super_strong",
          "condition": { "math": [ "u_val('strength') > 12" ] },
          "effect": [ { "u_message": "You are super strong" } ],
          "false_effect": [ { "u_message": "You are strong" } ]
        }
      }
    }
  }
}
```
```

**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2072-2113)
```markdown
The first EoC `EOC_I_NEED_AN_AR15` run another `EOC_GIVE_A_GUN` EoC, and give it two variables: variable `gun_name` with value `ar15_223medium` and variable `amount_of_guns` with value `5`;
Second EoC `EOC_I_NEED_AN_AK47` aslo run `EOC_GIVE_A_GUN` with the same variables, but now the values are `ak47` and `3`
`EOC_GIVE_A_GUN`, once called, will spawn a gun, depending on variables it got
```jsonc
{
  "type": "effect_on_condition",
  "id": "EOC_I_NEED_AN_AR15",
  "effect": [
    {
      "run_eocs": "EOC_GIVE_A_GUN",
      "variables": {
        "gun_name": "ar15_223medium",
        "amount_of_guns": "5"
      }
    }
  ]
},
{
  "type": "effect_on_condition",
  "id": "EOC_I_NEED_AN_AK47",
  "effect": [
    {
      "run_eocs": "EOC_GIVE_A_GUN",
      "variables": {
        "gun_name": "ak47",
        "amount_of_guns": "3"
      }
    }
  ]
},
{
  "type": "effect_on_condition",
  "id": "EOC_GIVE_A_GUN",
  "condition": { "expects_vars": [ "gun_name", "amount_of_guns" ] },
  "effect": [
    {
      "u_spawn_item": { "context_val": "gun_name" },
      "count": { "context_val": "amount_of_guns" }
    }
  ]
}
```
```

**File:** data/mods/MindOverMatter/effectoncondition/eoc_achievements.json (L2-12)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT",
    "eoc_type": "EVENT",
    "required_event": "character_gains_effect",
    "condition": { "and": [ { "compare_string": [ "effect_disease_psionic_drain", { "context_val": "effect" } ] }, "u_is_avatar" ] },
    "effect": [
      { "give_achievement": "mom_gain_any_nether_attunement" },
      { "run_eocs": "EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT_FURTHER_CHECKS" }
    ]
  },
```

**File:** data/mods/MindOverMatter/effectoncondition/eoc_achievements.json (L17-35)
```json
    "condition": {
      "and": [
        {
          "u_has_any_trait": [
            "BIOKINETIC",
            "CLAIRSENTIENT",
            "ELECTROKINETIC",
            "PHOTOKINETIC",
            "PYROKINETIC",
            "TELEKINETIC",
            "TELEPATH",
            "TELEPORTER",
            "VITAKINETIC",
            "PSYCHIC_KNACK"
          ]
        },
        { "u_has_effect": "effect_disease_psionic_drain" }
      ]
    },
```

**File:** data/mods/MindOverMatter/effectoncondition/eoc_achievements.json (L49-49)
```json
      { "run_eocs": "EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT_FURTHER_CHECKS", "time_in_future": 2 }
```

**File:** data/mods/MindOverMatter/effectoncondition/eoc_awakening.json (L14-23)
```json
    "effect": [
      { "math": [ "u_awakening_countup += 1" ] },
      { "math": [ "u_awakening_reducer = (matrix_awakening_odds(u_awakening_countup))" ] },
      { "u_lose_trait": "ALWAYS_GAIN_PSIONICS" },
      { "u_add_trait": "BIOKINETIC" },
      { "u_add_trait": "BIOKIN_NEEDS" },
      { "run_eocs": "EOC_TEACH_BIOKIN_CONTEMPLATE_RECIPES" },
      { "run_eocs": "EOC_BIOKINETIC_AWAKENING_KNACK_HANDLING" },
      { "if": "u_is_avatar", "then": { "give_achievement": "mom_psi_awakening_biokinesis" } }
    ]
```

**File:** data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json (L8-30)
```json
    "type": "effect_on_condition",
    "id": "EOC_PSI_NETHER_ATTUNEMENT_PERIODIC_ADJUSTMENT",
    "recurrence": [ "30 seconds", "30 seconds" ],
    "condition": {
      "and": [
        {
          "u_has_any_trait": [
            "BIOKINETIC",
            "CLAIRSENTIENT",
            "ELECTROKINETIC",
            "PHOTOKINETIC",
            "PYROKINETIC",
            "TELEKINETIC",
            "TELEPATH",
            "TELEPORTER",
            "VITAKINETIC"
          ]
        },
        { "not": { "u_has_effect": "effect_noetic_resilience" } }
      ]
    },
    "effect": [ { "run_eocs": "EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST_2" } ]
  },
```

