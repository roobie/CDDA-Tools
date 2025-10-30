# INFO

## Considerations

### 1. Template-Based Generation

Create parameterized templates for common EOC patterns and instantiate them with specific values:<cite/>

```python
def recurring_power_check(power_id: str, check_interval: str, condition_expr: str, success_message: str):
    """Template for recurring power availability checks"""
    return {
        "type": "effect_on_condition",
        "id": f"EOC_{power_id.upper()}_CHECK",
        "eoc_type": "RECURRING",
        "recurrence": check_interval,
        "condition": {"math": [condition_expr]},
        "effect": [{"u_message": success_message, "type": "good"}]
    }

# Usage
telekinesis_check = recurring_power_check(
    "telekinesis",
    "5 seconds", 
    "u_spell_level('telekinetic_lift') >= 3",
    "Your telekinetic powers are ready"
)
```

This is particularly useful for the MindOverMatter mod's learning EOCs, which follow consistent patterns across different power types as seen in `data/mods/MindOverMatter/powers/learning_eocs/telepathy.json:1-33` [1](#7-0)  and `data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json:334-373` [2](#7-1) .

### 2. Dataclass-Based Validation

Use Python dataclasses with type hints for compile-time validation while maintaining the 1:1 structure:<cite/>

```python
from dataclasses import dataclass, asdict
from typing import List, Dict, Union, Optional

@dataclass
class EOCEffect:
    u_message: Optional[str] = None
    type: Optional[str] = None
    math: Optional[List[str]] = None
    run_eocs: Optional[Union[str, List[str]]] = None
    
@dataclass
class EOCDefinition:
    type: str = "effect_on_condition"
    id: str = ""
    eoc_type: Optional[str] = None
    condition: Optional[Dict] = None
    effect: Optional[List[Dict]] = None
    recurrence: Optional[Union[int, str, List]] = None
    
    def to_json(self):
        return json.dumps(asdict(self), indent=2)
```

This provides IDE autocomplete and type checking while keeping the structure transparent.

### 3. Macro/Snippet System

For repetitive patterns like the nested conditions in `data/mods/Xedra_Evolved/mutations/paraclesians/paraclesian_magic_terrain_adjustments.json:121-180` [3](#7-2) , create reusable condition builders:<cite/>

```python
def terrain_check(*terrain_ids):
    """Generate OR condition for multiple terrain checks"""
    return {"or": [{"u_is_on_terrain": tid} for tid in terrain_ids]}

def trait_and_terrain(trait_id: str, *terrain_ids):
    """Common pattern: trait check + terrain validation"""
    return {
        "and": [
            {"u_has_trait": trait_id},
            terrain_check(*terrain_ids)
        ]
    }
```

### 4. JSON Schema + Validation Layer

Write EOCs as pure Python dicts but add a validation layer that checks against the EOC schema before output:<cite/>

```python
def validate_eoc(eoc_dict: Dict) -> bool:
    """Validate EOC structure against known patterns"""
    required_fields = ["type", "id"]
    if not all(field in eoc_dict for field in required_fields):
        raise ValueError(f"Missing required fields: {required_fields}")
    
    if "eoc_type" in eoc_dict:
        valid_types = ["ACTIVATION", "RECURRING", "EVENT", "AVATAR_DEATH", "NPC_DEATH"]
        if eoc_dict["eoc_type"] not in valid_types:
            raise ValueError(f"Invalid eoc_type: {eoc_dict['eoc_type']}")
    
    return True
```

This catches errors early without changing the authoring experience, similar to how the C++ code validates EOCs in `src/effect_on_condition.cpp:77-116` [4](#7-3) .

### 5. Composition via Dict Merging

For complex EOCs like those in `data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json:181-240` [5](#7-4) , use dict merging to compose from base patterns:<cite/>

```python
BASE_POWER_EOC = {
    "type": "effect_on_condition",
    "condition": {"u_has_effect": "effect_concentrating"}
}

def power_eoc(power_id: str, **overrides):
    """Merge base pattern with specific overrides"""
    return {
        **BASE_POWER_EOC,
        "id": f"EOC_{power_id.upper()}",
        **overrides
    }
```

### 6. Domain-Specific Helpers for Math Expressions

Since jmath is heavily used (as in `data/mods/MindOverMatter/powers/clairsentience_eoc.json:1-18` [6](#7-5) ), create helpers for common patterns:<cite/>

```python
def spell_level_check(spell_id: str, operator: str, value: int):
    """Generate spell level comparison"""
    return {"math": [f"u_spell_level('{spell_id}') {operator} {value}"]}

def duration_calc(base: float, scaling_var: str, multiplier: float = 1.0):
    """Generate duration calculation with scaling"""
    return {"math": [f"({base} * {scaling_var}) * {multiplier}"]}
```

## Recommendation

**Combine approaches**: Use the 1:1 data approach as your foundation, but layer on:
- **Templates** for repetitive patterns (learning EOCs, power checks)
- **Helper functions** for complex math expressions
- **Validation** to catch errors early
- **Constants** for shared values

This gives you the flexibility of raw dicts with the safety and convenience of higher-level abstractions where they add value.<cite/>

## Notes

The key insight is that EOCs are too varied for a single abstraction to work well. The MindOverMatter mod alone has dozens of distinct patterns across `data/mods/MindOverMatter/powers/` [7](#7-6) . A hybrid approach lets you use the right tool for each pattern—templates for common cases, raw dicts for unique ones, and helpers for gnarly jmath expressions.<cite/>

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)

### Citations

**File:** data/mods/Xedra_Evolved/mutations/paraclesians/paraclesian_magic_terrain_adjustments.json (L121-180)
```json
        { "not": { "u_is_on_terrain": "t_glassed_sand" } },
        { "not": { "u_is_on_terrain": "t_rubber_mulch" } },
        { "not": { "u_is_on_terrain": "t_swater_surf" } },
        { "not": { "u_is_on_terrain": "t_woodchips" } },
        { "u_has_trait": "IERDE" }
      ]
    },
    "effect": [
      {
        "math": [ "u_spellcasting_adjustment('difficulty', 'school': 'IERDE' ) = (u_sum_traits_of_category_char_has('IERDE') / -2)" ]
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_IERDE_ELEMENTAL_MAGIC_PENALTY_TOO_HIGH",
    "eoc_type": "EVENT",
    "required_event": "opens_spellbook",
    "condition": { "and": [ { "math": [ "u_val('pos_z') >= 1" ] }, { "u_has_trait": "IERDE" } ] },
    "effect": [ { "math": [ "u_school_level_adjustment('IERDE') -= 4" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_SALAMANDER_ELEMENTAL_MAGIC_ADJUSTMENT_IN_FIRE_OR_HEAT",
    "eoc_type": "EVENT",
    "required_event": "opens_spellbook",
    "condition": {
      "and": [
        {
          "or": [
            { "u_is_in_field": "fd_hot_air1" },
            { "u_is_in_field": "fd_hot_air2" },
            { "u_is_in_field": "fd_hot_air3" },
            { "u_is_in_field": "fd_hot_air4" },
            { "u_is_in_field": "fd_fire" },
            { "math": [ "weather('temperature') >= from_fahrenheit( 80 )" ] }
          ]
        },
        { "u_has_trait": "SALAMANDER" }
      ]
    },
    "effect": [
      {
        "math": [
          "u_spellcasting_adjustment('difficulty', 'school': 'SALAMANDER' ) = (u_sum_traits_of_category_char_has('SALAMANDER') / -2)"
        ]
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_SALAMANDER_ELEMENTAL_MAGIC_PENALTY_IN_CHILL",
    "eoc_type": "EVENT",
    "required_event": "opens_spellbook",
    "condition": {
      "and": [
        { "math": [ "weather('temperature') <= from_fahrenheit( 32 )" ] },
        {
          "and": [
            { "not": { "u_is_in_field": "fd_hot_air1" } },
```

**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L181-240)
```json
        "u_run_inv_eocs": "all",
        "true_eocs": [
          {
            "id": "EOC_XEDRA_CHRONOMANCER_REVERSE_ENTROPY_INV_SCANNER_DURABILITY",
            "effect": [
              { "math": [ "n_hp('ALL') += xedra_chron_spell_calc( u_spell_level('xedra_chronomancer_reverse_entropy'), 0.1, 1 )" ] }
            ]
          }
        ]
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY",
    "effect": [
      { "u_assign_activity": "ACT_XEDRA_CHRONOMANCER_MEDITATE", "duration": "200 days" },
      { "u_add_effect": "effect_xedra_rewrite_wound_causality", "duration": "PERMANENT" },
      {
        "run_eocs": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_MANA",
        "time_in_future": { "math": [ "180 + ( u_spell_level('xedra_chronomancer_rewrite_wound_causality') * 12 )" ] }
      },
      {
        "run_eocs": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_EXPERIENCE",
        "time_in_future": { "math": [ "900 - (u_spell_level('xedra_chronomancer_rewrite_wound_causality') * 12 )" ] }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_EXPERIENCE",
    "condition": { "u_has_effect": "effect_xedra_rewrite_wound_causality" },
    "effect": [
      {
        "math": [
          "u_spell_exp('xedra_chronomancer_rewrite_wound_causality') += (spell_exp_for_level('xedra_chronomancer_rewrite_wound_causality', u_spell_level('xedra_chronomancer_rewrite_wound_causality')+1) - spell_exp_for_level('xedra_chronomancer_rewrite_wound_causality', u_spell_level('xedra_chronomancer_rewrite_wound_causality'))) / 20 "
        ]
      },
      {
        "run_eocs": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_EXPERIENCE",
        "time_in_future": { "math": [ "900 - ( u_spell_level('xedra_chronomancer_rewrite_wound_causality') * 12 )" ] }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_MANA",
    "condition": {
      "and": [
        { "u_has_effect": "effect_xedra_rewrite_wound_causality" },
        { "math": [ "u_val('mana') >= 20" ] },
        { "math": [ "u_hp('ALL') < u_hp_max('bp_null')" ] }
      ]
    },
    "effect": [
      { "math": [ "u_val('mana') -= 20" ] },
      {
        "run_eocs": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_MANA",
        "time_in_future": { "math": [ "180 + ( u_spell_level('xedra_chronomancer_rewrite_wound_causality') * 12 )" ] }
      }
```

**File:** data/mods/MindOverMatter/powers/clairsentience_eoc.json (L1-18)
```json
[
  {
    "type": "effect_on_condition",
    "id": "EOC_CLAIR_DISCERN_WEAKNESS",
    "effect": [
      { "math": [ "u_discern_weakness_clear_intelligence = ( ( n_val('intelligence') + 10) / 20 )" ] },
      { "math": [ "u_discern_weakness_clear_power_level = n_spell_level('clair_spot_weakness')" ] },
      { "math": [ "u_nether_attunement_discern_weakness_scaling = n_nether_attunement_power_scaling" ] },
      {
        "u_add_effect": "effect_clair_weak_point",
        "duration": {
          "math": [
            "rng( ( ( (u_discern_weakness_clear_power_level * 1.5) + 13.5) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling),( ( (u_discern_weakness_clear_power_level * 2.5) + 30) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling) )"
          ]
        }
      }
    ]
  },
```

**File:** data/mods/MindOverMatter/powers/electrokinesis_concentration_eocs.json (L1-60)
```json
[
  {
    "type": "effect_on_condition",
    "id": "EOC_ELECTROKIN_SEE_ELECTRICITY_INITIATE",
    "condition": { "not": { "u_has_effect": "effect_electrokin_see_electricity" } },
    "effect": [
      { "u_message": "You open your senses to the flow of current.", "type": "good" },
      { "run_eocs": "EOC_POWER_MAINTENANCE_PLUS_ONE" },
      { "u_add_effect": "effect_electrokin_see_electricity", "duration": "PERMANENT" },
      {
        "run_eocs": "EOC_ELECTROKIN_SEE_ELECTRICITY_DRAIN",
        "time_in_future": [
          {
            "math": [
              "( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 150) + 900) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"
            ]
          },
          {
            "math": [
              "( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 300) + 1800) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"
            ]
          }
        ]
      }
    ],
    "false_effect": [ { "run_eocs": "EOC_ELECTROKIN_REMOVE_SEE_ELECTRICITY" } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_ELECTROKIN_REMOVE_SEE_ELECTRICITY",
    "condition": { "u_has_effect": "effect_electrokin_see_electricity" },
    "effect": [ { "run_eocs": "EOC_POWER_MAINTENANCE_MINUS_ONE" }, { "u_lose_effect": "effect_electrokin_see_electricity" } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_ELECTROKIN_SEE_ELECTRICITY_DRAIN",
    "condition": { "u_has_effect": "effect_electrokin_see_electricity" },
    "effect": [
      {
        "if": { "math": [ "u_spell_level('electrokinetic_see_electric') >= 1" ] },
        "then": { "math": [ "u_latest_channeled_power_difficulty = u_spell_difficulty('electrokinetic_see_electric')" ] },
        "else": { "math": [ "u_latest_channeled_power_difficulty = u_spell_difficulty('electrokinetic_see_electric_knack')" ] }
      },
      { "run_eocs": [ "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_2", "EOC_PSI_MAINTENANCE_CALORIE_COST_CALCULATOR" ] },
      {
        "if": { "math": [ "u_spell_level('electrokinetic_see_electric') >= 1" ] },
        "then": { "math": [ "u_spell_exp('electrokinetic_see_electric') += psionic_power_experience_formula()" ] },
        "else": { "math": [ "u_spell_exp('electrokinetic_see_electric_knack') += psionic_power_experience_formula()" ] }
      },
      { "run_eocs": "EOC_POWER_MAINTENANCE_CONCENTRATION_CHECK" },
      {
        "run_eocs": "EOC_ELECTROKIN_SEE_ELECTRICITY_DRAIN",
        "time_in_future": [
          {
            "math": [
              "( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 150) + 900) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"
            ]
          },
          {
            "math": [
```

==========================
see doc/JSON/EFFECT_ON_CONDITION.md