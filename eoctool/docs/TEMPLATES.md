You're asking for **template functions for the top 10 most useful EOC patterns** based on the comprehensive EOC examples we've examined from the MindOverMatter and Xedra_Evolved mods.<cite/>

## Top 10 EOC Templates

Based on the patterns I've seen in the codebase, here are the most useful EOC templates:

### 1. Event-Triggered EOC with Context Variables

```python
def event_eoc_template(eoc_id: str, event_name: str, context_checks: Dict, effects: List[Dict]) -> Dict:
    """
    Template for EOCs triggered by game events (spell casting, damage, kills, etc.)
    Based on: data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json:21-75
    """
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "eoc_type": "EVENT",
        "required_event": event_name,
        "condition": context_checks,
        "effect": effects
    }

# Usage example
spell_cast_tracker = event_eoc_template(
    "EOC_TRACK_SPELL_CAST",
    "character_casts_spell",
    {"compare_string": ["fireball", {"context_val": "spell"}]},
    [
        {"copy_var": {"context_val": "difficulty"}, "target_var": {"global_val": "last_spell_difficulty"}},
        {"u_message": "You cast a powerful spell!"}
    ]
)
```
[1](#10-0) 

### 2. Recurring Power/Trait Check

```python
def recurring_trait_check_template(eoc_id: str, trait_id: str, check_interval: str, 
                                   success_effects: List[Dict], fail_effects: List[Dict] = None) -> Dict:
    """
    Template for recurring checks on character traits/powers
    Based on: data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json:6-29
    """
    eoc = {
        "type": "effect_on_condition",
        "id": eoc_id,
        "eoc_type": "RECURRING",
        "recurrence": check_interval,
        "condition": {"u_has_trait": trait_id},
        "effect": success_effects
    }
    if fail_effects:
        eoc["false_effect"] = fail_effects
    return eoc

# Usage example
psi_attunement_check = recurring_trait_check_template(
    "EOC_PSI_ATTUNEMENT_CHECK",
    "BIOKINETIC",
    ["30 seconds", "30 seconds"],
    [{"run_eocs": "EOC_APPLY_PSI_BOOST"}]
)
```
[2](#10-1) 

### 3. Inventory Scanner with Search Criteria

```python
def inventory_scanner_template(eoc_id: str, search_mode: str, search_criteria: List[Dict],
                               true_eocs: List[str], false_eocs: List[str] = None) -> Dict:
    """
    Template for scanning inventory and running EOCs on matching items
    Based on: data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json:158-190
    """
    effect = {
        "u_run_inv_eocs": search_mode,
        "search_data": search_criteria,
        "true_eocs": true_eocs
    }
    if false_eocs:
        effect["false_eocs"] = false_eocs
    
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": [effect]
    }

# Usage example
iron_detector = inventory_scanner_template(
    "EOC_DETECT_IRON_ITEMS",
    "all",
    [{"material": "iron"}, {"material": "steel"}],
    ["EOC_PROCESS_IRON_ITEM"],
    ["EOC_NO_IRON_FOUND"]
)
```
[3](#10-2) 

### 4. Weighted Random Effect Selector

```python
def weighted_random_template(eoc_id: str, weighted_eocs: List[tuple]) -> Dict:
    """
    Template for randomly selecting one EOC from a weighted list
    Based on: data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json:331-368
    """
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": {
            "weighted_list_eocs": [[eoc_id, weight] for eoc_id, weight in weighted_eocs]
        }
    }

# Usage example
random_mutation = weighted_random_template(
    "EOC_RANDOM_MUTATION",
    [
        ("EOC_GOOD_MUTATION", 3),
        ("EOC_NEUTRAL_MUTATION", 5),
        ("EOC_BAD_MUTATION", 2)
    ]
)
```
[4](#10-3) 

### 5. Conditional Switch Statement

```python
def switch_statement_template(eoc_id: str, switch_var: str, cases: List[tuple]) -> Dict:
    """
    Template for switch-case logic based on variable values
    Based on: data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json:243-297
    """
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": {
            "switch": {"math": [switch_var]},
            "cases": [{"case": value, "effect": effect} for value, effect in cases]
        }
    }

# Usage example
power_level_switch = switch_statement_template(
    "EOC_POWER_LEVEL_EFFECTS",
    "u_val('power_level')",
    [
        (1, {"u_message": "Weak power"}),
        (5, {"u_message": "Medium power"}),
        (10, {"u_message": "Strong power"})
    ]
)
```
[5](#10-4) 

### 6. Foreach Loop Over Body Parts

```python
def foreach_bodypart_template(eoc_id: str, bodyparts: List[str], per_part_effect: Dict) -> Dict:
    """
    Template for iterating over body parts and applying effects
    Based on: data/mods/Xedra_Evolved/eocs/shapeshifter_eocs.json:301-321
    """
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": {
            "foreach": "array",
            "target": bodyparts,
            "var": {"context_val": "bodypart"},
            "effect": [per_part_effect]
        }
    }

# Usage example
heal_all_parts = foreach_bodypart_template(
    "EOC_HEAL_ALL_BODYPARTS",
    ["arm_l", "arm_r", "leg_l", "leg_r", "torso", "head"],
    {"if": {"math": ["u_hp(_bodypart) < u_hp_max(_bodypart)"]}, 
     "then": {"math": ["u_hp(_bodypart) += 10"]}}
)
```
[6](#10-5) 

### 7. Time-Delayed EOC Chain

```python
def delayed_eoc_chain_template(eoc_id: str, target_eoc: str, delay_range: List[str],
                               variables: Dict = None) -> Dict:
    """
    Template for scheduling EOCs to run in the future
    Based on: data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json:194-242
    """
    effect = {
        "run_eocs": target_eoc,
        "time_in_future": delay_range
    }
    if variables:
        effect["variables"] = variables
    
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": [effect]
    }

# Usage example
delayed_message = delayed_eoc_chain_template(
    "EOC_DELAYED_WARNING",
    "EOC_SHOW_WARNING",
    ["5 seconds", "10 seconds"],
    {"warning_text": "Danger approaching!"}
)
```
[7](#10-6) 

### 8. Player Choice Menu (run_eoc_selector)

```python
def choice_menu_template(eoc_id: str, title: str, options: List[tuple]) -> Dict:
    """
    Template for presenting player with multiple EOC choices
    Based on: data/mods/Xedra_Evolved/eocs/spell_learning_eoc.json:132-153
    """
    eoc_ids, names, descriptions = zip(*options) if options else ([], [], [])
    
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "effect": {
            "run_eoc_selector": list(eoc_ids),
            "names": list(names),
            "descriptions": list(descriptions),
            "title": title,
            "allow_cancel": True
        }
    }

# Usage example
spell_choice = choice_menu_template(
    "EOC_CHOOSE_SPELL",
    "Select a spell to learn",
    [
        ("EOC_LEARN_FIREBALL", "Fireball", "A powerful fire spell"),
        ("EOC_LEARN_ICEBOLT", "Ice Bolt", "A freezing projectile"),
        ("EOC_LEARN_LIGHTNING", "Lightning", "Electric damage")
    ]
)
```
[8](#10-7) 

### 9. Complex Math-Based Probability Check

```python
def probability_check_template(eoc_id: str, chance_formula: str, 
                               success_effects: List[Dict], fail_effects: List[Dict] = None) -> Dict:
    """
    Template for probability-based effects using jmath
    Based on: data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json:369-397
    """
    eoc = {
        "type": "effect_on_condition",
        "id": eoc_id,
        "condition": {
            "x_in_y_chance": {
                "x": {"math": [chance_formula]},
                "y": 100
            }
        },
        "effect": success_effects
    }
    if fail_effects:
        eoc["false_effect"] = fail_effects
    return eoc

# Usage example
mutation_chance = probability_check_template(
    "EOC_MUTATION_CHANCE",
    "50 + u_val('radiation_level') * 2",
    [{"u_add_trait": "MUTATION_RANDOM"}],
    [{"u_message": "You resist the mutation"}]
)
```
[9](#10-8) 

### 10. Death Prevention EOC

```python
def death_prevention_template(eoc_id: str, prevention_condition: Dict, 
                              restoration_effects: List[Dict]) -> Dict:
    """
    Template for preventing character death and restoring state
    Based on: data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json:599-609
    """
    return {
        "type": "effect_on_condition",
        "id": eoc_id,
        "eoc_type": "PREVENT_DEATH",
        "condition": prevention_condition,
        "effect": restoration_effects
    }

# Usage example
chronomancer_revival = death_prevention_template(
    "EOC_CHRONOMANCER_PREVENT_DEATH",
    {"u_has_trait": "CHRONOMANCER"},
    [
        {"math": ["u_hp('ALL') = u_hp_max('ALL') * 0.5"]},
        {"u_message": "Time rewinds, saving you from death!", "type": "good"},
        {"u_lose_trait": "CHRONOMANCER"}  # One-time use
    ]
)
```
[10](#10-9) 

## Usage Pattern

These templates can be combined with the 1:1 data approach we discussed:

```python
# Constants
COMMON_TRAITS = {
    "BIOKINETIC": "BIOKINETIC",
    "TELEPATH": "TELEPATH"
}

# Generate multiple EOCs using templates
eocs = [
    event_eoc_template("EOC_SPELL_TRACKER", "character_casts_spell", ...),
    recurring_trait_check_template("EOC_PSI_CHECK", COMMON_TRAITS["BIOKINETIC"], ...),
    inventory_scanner_template("EOC_SCAN_WEAPONS", "all", ...)
]

# Output as JSON
print(json.dumps(eocs, indent=2))
```

## Notes

These templates cover the most common EOC patterns found in both mods:<cite/>

- **Event handling** (spell casting, damage, kills)
- **Recurring checks** (traits, powers, conditions)
- **Inventory manipulation** (searching, filtering, processing items)
- **Random selection** (weighted choices, probability)
- **Control flow** (switch statements, conditionals)
- **Iteration** (foreach loops over collections)
- **Time management** (delayed execution, scheduling)
- **Player interaction** (choice menus, selections)
- **Complex math** (jmath formulas, probability calculations)
- **Special mechanics** (death prevention, state restoration)

Each template maintains the 1:1 mapping to JSON while providing reusable patterns for common use cases. You can extend these with additional parameters or combine them to create more complex EOC structures.<cite/>

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)

### Citations
