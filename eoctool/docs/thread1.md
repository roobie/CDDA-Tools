# DeepWiki Q&A with Code Context for Repository: CleverRaven/Cataclysm-DDA
## Q1
what was the reasoning behing putting runtime code inside json values?
### Answer
You're asking about the design decision to embed runtime code (specifically math expressions and conditions) inside JSON values in the Effect on Condition (EOC) framework, rather than using a purely declarative JSON structure. Cataclysm-DDA:1-4 

## Answer

The EOC framework embeds runtime code in JSON to provide **data-driven scripting capabilities** without requiring C++ code changes for gameplay logic. Cataclysm-DDA:4-4 

### Key Design Rationale

**1. Modding Flexibility**

The system allows modders to create complex gameplay behaviors entirely through JSON files without touching C++ source code. Cataclysm-DDA:121-127  For example, modders can use math expressions like `{ "math": [ "u_spell_level('some_spell')" ] }` to check spell levels dynamically. Cataclysm-DDA:2352-2352 

**2. Runtime Expression Evaluation**

The `math` field accepts expressions that are parsed and evaluated at runtime using a dedicated math parser. Cataclysm-DDA:1996-2003  The `f_math` function creates a lambda that evaluates math expressions during dialogue execution. Cataclysm-DDA:1996-2003 

**3. Deferred Compilation**

Math expressions are stored in a deferred queue during JSON loading and compiled later to catch syntax errors with proper context. Cataclysm-DDA:161-166  This is finalized via `finalize_conditions()`. Cataclysm-DDA:545-560 

**4. Variable System Integration**

The framework supports dynamic variables (`u_val`, `npc_val`, `global_val`, `context_val`) that can be manipulated through math expressions. Cataclysm-DDA:121-128  For example: `{ "math": [ "u_val('stamina') == 500" ] }` checks character stamina at runtime. Cataclysm-DDA:506-507 

### Real Examples

Complex conditional logic in JSON: Cataclysm-DDA:525-533 

Event-driven scripting with context variables: Cataclysm-DDA:596-607 

## Notes

While embedding code in JSON may seem unconventional, it's a pragmatic solution for Cataclysm: DDA's modding ecosystem. The alternative would require either: (1) hardcoding all gameplay logic in C++, limiting modding, or (2) integrating a full scripting language like Lua, which adds complexity and dependencies. The current approach provides a middle ground—JSON remains the data format, but with embedded expressions parsed by a custom math engine that integrates tightly with the game's dialogue and condition systems.<cite />

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
### Citations
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1-4)
```markdown

# Effect On Condition

An effect_on_condition is an object allowing the combination of dialog conditions and effects with their usage outside of a dialog.  When invoked, they will test their condition; on a pass, they will cause their effect. They can be activated automatically with any given frequency.  (Note: effect_on_conditions use the npc dialog conditions and effects syntax, which allows checking related to, or targeting an effect at, an npc (for example: `npc_has_trait`).  Using these commands in an effect_on_condition is not supported.)
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L121-128)
```markdown
Variable object is a value, that changes due some conditions. Variable can be int, time, string, `math` expression or location variable. Types of variables are:

- `u_val` - variable, that is stored in this character, and, if player dies, the variable is lost also (or if you swap the avatar, for example; the secret one NPC told to character A would be lost for character B); 
- `npc_val` - variable, that is stored in beta talker
- `global_val` - variable, that is store in the world, and won't be lost until you delete said world
- `context_val` - variable, that was delivered from some another entity; For example, EVENT type EoCs can deliver specific variables contributor can use to perform specific checks:
`character_casts_spell` event, that is called every time, you guess it, character cast spell, it also store information about spell name, difficulty and damage, so contributor can create a specific negative effect for every spell casted, depending on this values; Generalized EoCs can also create and use context variables; math equivalent is variable name with `_`
- `var_val` - var_val is a unique variable object in the fact that it attempts to resolve the variable stored inside a context variable. The values for var_val use the same syntax for scope that math [variables](NPCs.md#variables) do.
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2352-2352)
```markdown
  "switch": { "math": [ "u_spell_level('some_spell')" ] },
```
**File:** src/condition.cpp (L161-166)
```cpp
std::shared_ptr<math_exp> &defer_math( JsonObject const &jo, std::string_view str,
                                       math_type_t type )
{
    get_deferred_math().emplace( jo, str, type );
    return get_deferred_math().back().exp;
}
```
**File:** src/condition.cpp (L545-560)
```cpp
void finalize_conditions()
{
    std::queue<deferred_math> &dfr = get_deferred_math();
    while( !dfr.empty() ) {
        deferred_math &math = dfr.front();
        try {
            math.exp->parse( math.str, false );
            math._validate_type();
        } catch( math::exception const &ex ) {
            JsonObject jo{ std::move( math.jo ) };
            clear_deferred_math();
            jo.throw_error_at( "math", ex.what() );
        }
        dfr.pop();
    }
}
```
**File:** src/condition.cpp (L1996-2003)
```cpp
conditional_t::func f_math( const JsonObject &jo, std::string_view member )
{
    eoc_math math;
    math.from_json( jo, member, math_type_t::compare );
    return [math = std::move( math )]( const_dialogue const & d ) ->bool {
        return math.act( d );
    };
}
```
**File:** data/mods/TEST_DATA/EOC.json (L506-507)
```json
    "condition": { "math": [ "u_val('stamina') == 500" ] },
    "effect": [ { "math": [ "math_test = -3^2" ] } ]
```
**File:** data/mods/TEST_DATA/EOC.json (L525-533)
```json
    "effect": {
      "switch": { "math": [ "math_test" ] },
      "cases": [
        { "case": -1, "effect": { "math": [ "math_test_result = 1" ] } },
        { "case": 9, "effect": { "math": [ "math_test_result = 2" ] } },
        { "case": 10, "effect": { "math": [ "math_test_result = 3" ] } }
      ]
    }
  },
```
**File:** data/mods/TEST_DATA/EOC.json (L596-607)
```json
    "id": "EOC_spell_event_test",
    "eoc_type": "EVENT",
    "required_event": "character_casts_spell",
    "effect": [
      { "copy_var": { "context_val": "spell" }, "target_var": { "global_val": "key1" } },
      { "copy_var": { "context_val": "school" }, "target_var": { "global_val": "key2" } },
      { "math": [ "key3 = _difficulty" ] },
      { "math": [ "key4 = _cost" ] },
      { "math": [ "key5 = _cast_time" ] },
      { "math": [ "key6 = _damage" ] }
    ]
  },
```
## Q2
help me come up with a tool that enables us to write EOC outside json (in a real programming language), which is the compiled to json
### Answer
You're asking about creating a tool that would allow writing Effect on Condition (EOC) definitions in a real programming language, which would then compile/transpile to the JSON format that Cataclysm: DDA currently uses.<cite/>

## Answer

Based on the codebase structure, here's a practical approach for building an EOC compiler:

### Understanding the Target Format

EOCs are defined in JSON with specific structure requirements: Cataclysm-DDA:29-42 

The core components you'd need to generate are:
- `type`: EOC type (ACTIVATION, RECURRING, EVENT, etc.)
- `condition`: Boolean logic expressions
- `effect`: Actions to execute
- `false_effect`: Alternative actions
- `recurrence`: For recurring EOCs

### Compilation Pipeline Architecture

Your tool would need to:

**1. Parse Source Language → AST**

Choose a language with good parsing support (Python, TypeScript, Rust). The language should support:
- Function definitions (map to EOC definitions)
- Conditional logic (map to `condition` blocks)
- Variable assignments (map to `math` expressions)
- Function calls (map to effects like `u_spawn_item`, `run_eocs`)

**2. Transform AST → EOC JSON**

The transformation would map language constructs to EOC primitives. For example:

```python
# Source language (hypothetical)
@eoc(type="RECURRING", recurrence="1 seconds")
def check_stamina(u):
    if u.stamina == 500:
        u.add_morale("morale_feeling_good", bonus=10)
    else:
        u.message("Low stamina")
```

Would compile to: Cataclysm-DDA:504-508 

**3. Handle Math Expressions**

The math parser supports complex expressions: Cataclysm-DDA:1996-2002 

Your compiler needs to translate language expressions to the `{ "math": [...] }` format, preserving variable scopes (`u_val`, `npc_val`, `global_val`, `context_val`). Cataclysm-DDA:120-128 

**4. Support Nested EOCs**

EOCs can call other EOCs with context variables: Cataclysm-DDA:2072-2100 

Your language should support function calls with named parameters that map to the `variables` field in `run_eocs`.

### Key Design Considerations

**Type Safety**: Add static type checking for:
- Valid effect names (validate against available effects)
- Correct parameter types for each effect
- Variable scope rules (u_val vs global_val)

**Validation**: The C++ code validates EOCs during loading: Cataclysm-DDA:78-117 

Your compiler should perform similar validation before generating JSON.

**Testing**: The codebase has extensive EOC tests: Cataclysm-DDA:275-323 

Generate test cases alongside your compiled JSON to verify correctness.

### Implementation Approach

1. **Start with a DSL**: Create a domain-specific language that closely mirrors EOC semantics but with better syntax
2. **Use existing tools**: Leverage parser generators (ANTLR, PEG.js) or embed in a host language (Python decorators, TypeScript types)
3. **Generate readable JSON**: Include comments and formatting in output for debugging
4. **Provide IDE support**: Create language server for autocomplete and error checking

### Example Tool Structure

```
eoc-compiler/
├── parser/          # Parse source language
├── validator/       # Type checking and validation
├── codegen/         # Generate JSON output
├── stdlib/          # Standard library of common patterns
└── tests/           # Compiler tests
```

## Notes

The main challenge is preserving the full expressiveness of the EOC system while providing better ergonomics. The math expression system is particularly complex, supporting hundreds of functions: Cataclysm-DDA:1-58 

Consider starting with a subset of EOC features (basic conditions and effects) and gradually expanding support. The deferred math compilation system means your tool should also validate math expressions early: Cataclysm-DDA:545-560 

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
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
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L120-128)
```markdown

Variable object is a value, that changes due some conditions. Variable can be int, time, string, `math` expression or location variable. Types of variables are:

- `u_val` - variable, that is stored in this character, and, if player dies, the variable is lost also (or if you swap the avatar, for example; the secret one NPC told to character A would be lost for character B); 
- `npc_val` - variable, that is stored in beta talker
- `global_val` - variable, that is store in the world, and won't be lost until you delete said world
- `context_val` - variable, that was delivered from some another entity; For example, EVENT type EoCs can deliver specific variables contributor can use to perform specific checks:
`character_casts_spell` event, that is called every time, you guess it, character cast spell, it also store information about spell name, difficulty and damage, so contributor can create a specific negative effect for every spell casted, depending on this values; Generalized EoCs can also create and use context variables; math equivalent is variable name with `_`
- `var_val` - var_val is a unique variable object in the fact that it attempts to resolve the variable stored inside a context variable. The values for var_val use the same syntax for scope that math [variables](NPCs.md#variables) do.
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2072-2100)
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
```
**File:** data/mods/TEST_DATA/EOC.json (L504-508)
```json
    "type": "effect_on_condition",
    "id": "EOC_math_test_equals_assign",
    "condition": { "math": [ "u_val('stamina') == 500" ] },
    "effect": [ { "math": [ "math_test = -3^2" ] } ]
  },
```
**File:** src/condition.cpp (L545-560)
```cpp
void finalize_conditions()
{
    std::queue<deferred_math> &dfr = get_deferred_math();
    while( !dfr.empty() ) {
        deferred_math &math = dfr.front();
        try {
            math.exp->parse( math.str, false );
            math._validate_type();
        } catch( math::exception const &ex ) {
            JsonObject jo{ std::move( math.jo ) };
            clear_deferred_math();
            jo.throw_error_at( "math", ex.what() );
        }
        dfr.pop();
    }
}
```
**File:** src/condition.cpp (L1996-2002)
```cpp
conditional_t::func f_math( const JsonObject &jo, std::string_view member )
{
    eoc_math math;
    math.from_json( jo, member, math_type_t::compare );
    return [math = std::move( math )]( const_dialogue const & d ) ->bool {
        return math.act( d );
    };
```
**File:** src/effect_on_condition.cpp (L78-117)
```cpp
void effect_on_condition::load( const JsonObject &jo, std::string_view src )
{
    mandatory( jo, was_loaded, "id", id );
    optional( jo, was_loaded, "eoc_type", type, eoc_type::NUM_EOC_TYPES );
    if( jo.has_member( "recurrence" ) ) {
        if( type != eoc_type::NUM_EOC_TYPES && type != eoc_type::RECURRING ) {
            jo.throw_error( "A recurring effect_on_condition must be of type RECURRING." );
        }
        type = eoc_type::RECURRING;
        recurrence = get_duration_or_var( jo, "recurrence", false );
    }
    if( type == eoc_type::NUM_EOC_TYPES ) {
        type = eoc_type::ACTIVATION;
    }

    if( jo.has_member( "deactivate_condition" ) ) {
        read_condition( jo, "deactivate_condition", deactivate_condition, false );
        has_deactivate_condition = true;
    }
    if( jo.has_member( "condition" ) ) {
        read_condition( jo, "condition", condition, false );
        has_condition = true;
    }
    true_effect.load_effect( jo, "effect", std::string( src ) );

    if( jo.has_member( "false_effect" ) ) {
        false_effect.load_effect( jo, "false_effect", std::string( src ) );
        has_false_effect = true;
    }

    optional( jo, was_loaded, "run_for_npcs", run_for_npcs, false );
    optional( jo, was_loaded, "global", global, false );
    if( !global && run_for_npcs ) {
        jo.throw_error( "run_for_npcs should only be true for global effect_on_conditions." );
    }

    if( type == eoc_type::EVENT ) {
        mandatory( jo, was_loaded, "required_event", required_event );
    }
}
```
**File:** tests/eoc_test.cpp (L275-323)
```cpp
TEST_CASE( "EOC_math_integration", "[eoc][math_parser]" )
{
    clear_avatar();
    dialogue d( get_talker_for( get_avatar() ), std::make_unique<talker>() );
    global_variables &globvars = get_globals();
    globvars.clear_global_values();
    REQUIRE( !globvars.maybe_get_global_value( "math_test" ) );
    REQUIRE( !globvars.maybe_get_global_value( "math_test_result" ) );
    calendar::turn = calendar::start_of_cataclysm;

    CHECK_FALSE( effect_on_condition_EOC_math_test_greater_increment->test_condition( d ) );
    effect_on_condition_EOC_math_test_greater_increment->activate( d );
    CHECK( globvars.get_global_value( "math_test" ) == -1 );
    effect_on_condition_EOC_math_switch_math->activate( d );
    CHECK( globvars.get_global_value( "math_test_result" ) == 1 );
    CHECK( effect_on_condition_EOC_math_duration->recurrence.evaluate( d ) == 1_turns );
    calendar::turn += 1_days;

    CHECK_FALSE( effect_on_condition_EOC_math_test_equals_assign->test_condition( d ) );
    CHECK_FALSE( effect_on_condition_EOC_math_test_inline_condition->test_condition( d ) );
    get_avatar().set_stamina( 500 );
    CHECK( effect_on_condition_EOC_math_test_equals_assign->test_condition( d ) );
    CHECK( effect_on_condition_EOC_math_test_inline_condition->test_condition( d ) );
    effect_on_condition_EOC_math_test_equals_assign->activate( d );
    CHECK( globvars.get_global_value( "math_test" ) == 9 );
    effect_on_condition_EOC_math_switch_math->activate( d );
    CHECK( globvars.get_global_value( "math_test_result" ) == 2 );
    CHECK( effect_on_condition_EOC_math_duration->recurrence.evaluate( d ) == 2_turns );

    CHECK( effect_on_condition_EOC_math_test_greater_increment->test_condition( d ) );
    effect_on_condition_EOC_math_test_greater_increment->activate( d );
    CHECK( globvars.get_global_value( "math_test" ) == 10 );
    effect_on_condition_EOC_math_switch_math->activate( d );
    CHECK( globvars.get_global_value( "math_test_result" ) == 3 );
    CHECK( effect_on_condition_EOC_math_duration->recurrence.evaluate( d ) == 3_turns );

    int const stam_pre = get_avatar().get_stamina();
    effect_on_condition_EOC_math_diag_assign->activate( d );
    CHECK( get_avatar().get_stamina() == stam_pre / 2 );

    get_avatar().set_pain( 0 );
    get_avatar().set_stamina( 9000 );
    effect_on_condition_EOC_math_weighted_list->activate( d );
    CHECK( globvars.get_global_value( "weighted_var" ) == -999 );
    get_avatar().set_pain( 9000 );
    get_avatar().set_stamina( 0 );
    effect_on_condition_EOC_math_weighted_list->activate( d );
    CHECK( globvars.get_global_value( "weighted_var" ) == 1 );
}
```
**File:** src/math_parser_diag.cpp (L1-58)
```cpp
#include "math_parser_diag.h"

#include <algorithm>
#include <cstddef>
#include <functional>
#include <list>
#include <memory>
#include <numeric>
#include <optional>
#include <string>
#include <type_traits>
#include <vector>

#include "bodypart.h"
#include "calendar.h"
#include "cata_utility.h"
#include "character.h"
#include "character_id.h"
#include "condition.h"
#include "coordinates.h"
#include "creature.h"
#include "damage.h"
#include "debug.h"
#include "dialogue.h"
#include "dialogue_helpers.h"
#include "effect.h"
#include "enum_conversions.h"
#include "enums.h"
#include "faction.h"
#include "field.h"
#include "game.h"
#include "item.h"
#include "item_location.h"
#include "magic.h"
#include "map.h"
#include "math_parser_diag_value.h"
#include "math_parser_type.h"
#include "mod_manager.h"
#include "mongroup.h"
#include "monster.h"
#include "mtype.h"
#include "npc.h"
#include "options.h"
#include "pimpl.h"
#include "point.h"
#include "proficiency.h"
#include "stomach.h"
#include "string_input_popup.h"
#include "talker.h"
#include "translations.h"
#include "type_id.h"
#include "units.h"
#include "weather.h"
#include "weather_gen.h"
#include "weather_type.h"
#include "worldfactory.h"

/*
```
## Q3
perhaps we could instead use another data language instead of json, (e.g. something that enables multiline strings to be used) which we then transpile
### Answer
You're asking about using an alternative data format (like YAML, TOML, or JSONC) that supports multiline strings and better readability, which would then be transpiled to the JSON format that Cataclysm: DDA currently uses.<cite/>

## Answer

This is a more practical approach than building a full programming language compiler. Here's how you could implement it:

### Alternative Data Formats

**YAML** would be the most natural choice for EOC definitions:<cite/>

```yaml
# YAML version of an EOC
- type: effect_on_condition
  id: EOC_spell_event_test
  eoc_type: EVENT
  required_event: character_casts_spell
  effect:
    - copy_var:
        context_val: spell
      target_var:
        global_val: key1
    - math: ["key3 = _difficulty"]
    - u_message: |
        You cast a spell with difficulty {_difficulty}
        This is a multiline message that's much easier
        to read and write in YAML format
```

This would transpile to the existing JSON format seen in `data/mods/TEST_DATA/EOC.json:595-606`. Cataclysm-DDA:595-606 

### Key Advantages

**1. Multiline Strings**

YAML's `|` and `>` operators enable readable multiline text, which is particularly useful for:
- Message effects (`u_message`, `npc_message`) as seen in `doc/JSON/EFFECT_ON_CONDITION.md:4141-4147` Cataclysm-DDA:4141-4147 
- Snippet content in `doc/JSON/JSON_INFO.md:811-847` Cataclysm-DDA:811-847 

**2. Comments**

YAML supports native comments (`#`), making EOC definitions self-documenting without JSON's workaround of using `"//"` fields.<cite/>

**3. Less Syntax Noise**

No need for excessive quotes and commas, making complex nested structures like those in `data/mods/TEST_DATA/EOC.json:181-240` more readable. Cataclysm-DDA:181-240 

### Implementation Strategy

**Simple Transpiler Tool:**

```
eoc-transpiler/
├── src/
│   ├── parser.py       # Parse YAML/TOML
│   ├── validator.py    # Validate EOC structure
│   └── generator.py    # Generate JSON
├── schemas/
│   └── eoc_schema.yaml # Schema for validation
└── tests/
```

The transpiler would:
1. Parse YAML/TOML files
2. Validate against EOC schema (types, required fields, valid effects)
3. Generate formatted JSON matching the game's expected structure
4. Preserve all semantic meaning while improving authoring experience

**Integration Options:**

- **Pre-commit hook**: Auto-transpile YAML to JSON before commits
- **Build step**: Part of mod packaging process
- **Watch mode**: Auto-regenerate JSON on YAML changes during development

### Validation Benefits

The transpiler can enforce constraints that are implicit in the current JSON format:<cite/>

- Validate effect names against known effects from `doc/JSON/EFFECT_ON_CONDITION.md:2935-2969` Cataclysm-DDA:2935-2969 
- Check variable scopes (`u_val`, `npc_val`, `global_val`, `context_val`) from `doc/JSON/EFFECT_ON_CONDITION.md:119-127` Cataclysm-DDA:119-127 
- Verify EOC type compatibility with fields (e.g., `required_event` only valid for EVENT type)
- Validate math expressions before runtime

### Example Comparison

**Current JSON** (`data/mods/Xedra_Evolved/eocs/item_eocs.json:1-60`): Cataclysm-DDA:1-60 

```json
{
  "type": "effect_on_condition",
  "id": "EOC_WINCH_INITIAL",
  "effect": [
    { "u_location_variable": { "u_val": "winch_teleport" }, "min_radius": 0, "max_radius": 0 },
    { "u_message": "You draw coordinates in a constructed beam.", "type": "good" }
  ]
}
```

**YAML equivalent:**

```yaml
type: effect_on_condition
id: EOC_WINCH_INITIAL
effect:
  - u_location_variable:
      u_val: winch_teleport
    min_radius: 0
    max_radius: 0
  - u_message: You draw coordinates in a constructed beam.
    type: good
```

## Notes

This approach is significantly simpler than building a full compiler and maintains 1:1 compatibility with the existing JSON format. The game engine doesn't need any changes—it continues reading JSON files. Modders get better authoring experience with multiline strings, comments, and cleaner syntax. Tools like `yq` or Python's `PyYAML` library make implementation straightforward. The transpiler could also support both directions (JSON→YAML) to help migrate existing EOCs.<cite/>

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
### Citations
**File:** data/mods/TEST_DATA/EOC.json (L181-240)
```json
    "id": "EOC_armor_math_test",
    "effect": [
      { "u_spawn_item": "backpack", "force_equip": true },
      {
        "u_run_inv_eocs": "all",
        "search_data": [ { "id": "backpack", "worn_only": true } ],
        "true_eocs": [ "EOC_armor_math_test_nested" ]
      },
      { "math": [ "u_key1 = u_coverage('torso')" ] },
      { "math": [ "u_key2 = u_encumbrance('torso')" ] }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_armor_math_test_nested",
    "effect": [ { "math": [ "n_key1 = n_coverage('torso')" ] }, { "math": [ "n_key2 = n_encumbrance('torso')" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_run_until_test",
    "effect": [
      { "math": [ "u_context = 0" ] },
      { "run_eocs": "EOC_until_nested", "condition": { "math": [ "u_context < 10000" ] }, "iterations": 10000 }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_until_nested",
    "effect": [ { "math": [ "u_context++" ] }, { "math": [ "key1 = u_context" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_stored_condition_test",
    "effect": [
      { "set_condition": "to_test", "condition": { "math": [ "_context > 0" ] } },
      { "run_eocs": "EOC_stored_condition_test_nested" },
      { "run_eocs": "EOC_stored_condition_test_nested_var", "variables": { "condition_name": "to_test" } }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_stored_condition_test_nested",
    "condition": { "get_condition": "to_test" },
    "effect": [ { "math": [ "context = _context" ] }, { "math": [ "key1 = 1" ] } ],
    "false_effect": [ { "math": [ "context = _context" ] }, { "math": [ "key1 = 0" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_stored_condition_test_nested_var",
    "condition": { "get_condition": { "context_val": "condition_name" } },
    "effect": [ { "math": [ "key2 = 1" ] } ],
    "false_effect": [ { "math": [ "key2 = 0" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_run_with_test",
    "effect": [
      { "math": [ "u_ukey = 3" ] },
      {
        "run_eocs": "EOC_run_with_test_nested",
```
**File:** data/mods/TEST_DATA/EOC.json (L595-606)
```json
    "type": "effect_on_condition",
    "id": "EOC_spell_event_test",
    "eoc_type": "EVENT",
    "required_event": "character_casts_spell",
    "effect": [
      { "copy_var": { "context_val": "spell" }, "target_var": { "global_val": "key1" } },
      { "copy_var": { "context_val": "school" }, "target_var": { "global_val": "key2" } },
      { "math": [ "key3 = _difficulty" ] },
      { "math": [ "key4 = _cost" ] },
      { "math": [ "key5 = _cast_time" ] },
      { "math": [ "key6 = _damage" ] }
    ]
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L119-127)
```markdown
## Variable Object

Variable object is a value, that changes due some conditions. Variable can be int, time, string, `math` expression or location variable. Types of variables are:

- `u_val` - variable, that is stored in this character, and, if player dies, the variable is lost also (or if you swap the avatar, for example; the secret one NPC told to character A would be lost for character B); 
- `npc_val` - variable, that is stored in beta talker
- `global_val` - variable, that is store in the world, and won't be lost until you delete said world
- `context_val` - variable, that was delivered from some another entity; For example, EVENT type EoCs can deliver specific variables contributor can use to perform specific checks:
`character_casts_spell` event, that is called every time, you guess it, character cast spell, it also store information about spell name, difficulty and damage, so contributor can create a specific negative effect for every spell casted, depending on this values; Generalized EoCs can also create and use context variables; math equivalent is variable name with `_`
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2935-2969)
```markdown
## Character effects

#### `u_deal_damage`, `npc_deal_damage`

Deal damage, the same way melee attack deals damage; it can't be dodged, but it can be mitigated by armor

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "u_deal_damage" / "npc_deal_damage" | **mandatory** | string or [variable object](#variable-object) | Damage type that would be dealt |
| "amount" | optional | int or [variable object](#variable-object) | Amount of damage that would be dealt; Default 0 | 
| "bodypart" | optional | string or [variable object](#variable-object) | Bodypart that take the damage. Reminder that only characters can have limbs. Default is RANDOM | 
| "arpen" | optional | int or [variable object](#variable-object) | Armor penetration of attack; Default 0 |
| "arpen_mult" | optional | int or [variable object](#variable-object) | Multiplier for armor penetration; Default 1 | 
| "dmg_mult" | optional | int or [variable object](#variable-object) | Multiplier for damage amount. Default 1 | 
| "min_hit" | optional | int or [variable object](#variable-object) | If bodypart is RANDOM, limit body part only to bodyparts that has `hit_size` bigger than this; default -1 |
| "max_hit" | optional | int or [variable object](#variable-object) | If bodypart is RANDOM, limit body part only to bodyparts that has `hit_size` smaller than this; default the size of your biggest body part |
| "can_attack_high" | optional | bool | If true, can attack limbs with flag LIMB_UPPER, if false, such limbs are discarded; Default true |
| "hit_roll" | optional | int or [variable object](#variable-object) | hit_roll |

##### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- | 
| ✔️ | ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ |

##### Examples

Deal 20 biological damage to your torso
```jsonc
  {
    "type": "effect_on_condition",
    "id": "TEST",
    "effect": [ { "u_deal_damage": "biological", "amount": 20, "bodypart": "torso" } ]
  },
```
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L4141-4147)
```markdown
 { "u_message": "uninvasive text", "popup": true, "popup_flag": "PF_ON_TOP" }
```

Print a text with a context variable
```jsonc
  { "u_message": "Test event with trait_id FIRE! <context_val:trait_id>", "type": "good" } 
```
```
**File:** doc/JSON/JSON_INFO.md (L811-847)
```markdown

------

Snippets can also be used in EoC, see [EFFECT_ON_CONDITION.md#u_message](EFFECT_ON_CONDITION.md#u_messagenpc_message)

------

Items, that uses effect on condition action to reveal a snippet, may utilize `conditional_names` syntax to change the name of an item, depending on it's description

`log_psych` is the category of snippet, `dream_1` is the id of a snippet, and `name` is the name of new item

```jsonc
{
  "type": "GENERIC",
  "id": "psych_file",
  "name": { "str": "lab report (psychology)", "str_pl": "lab reports (psychology)" },
  "conditional_names": [
    { "type": "SNIPPET_ID", "condition": "log_psych", "value": "dream_1", "name": { "str_sp": "Session S-3397-5" } },
    { "type": "SNIPPET_ID", "condition": "log_psych", "value": "dream_2", "name": { "str_sp": "Session T-1215-4" } },
    { "type": "SNIPPET_ID", "condition": "log_psych", "value": "dream_3", "name": { "str_sp": "Scrawled note" } }
  ],
  "description": "A folder full of what appear to be transcripts of confidential psychotherapy sessions.  Most of it is rather trivial, but certain passages catch your eye…",
  "copy-from": "file",
  "use_action": {
    "type": "effect_on_conditions",
    "description": "Activate to read the file",
    "effect_on_conditions": [
      {
        "id": "EOC_LAB_FILE_PSY",
        "effect": [ { "u_message": "log_psych", "snippet": true, "same_snippet": true, "popup": true } ]
      }
    ]
  }
}
```

Once the item would be activated, the description would be replaced with one of `log_psych` texts, and the `lab report (psychology)` name would be replaced with one of `conditional_names`
```
**File:** data/mods/Xedra_Evolved/eocs/item_eocs.json (L1-60)
```json
[
  {
    "type": "effect_on_condition",
    "id": "EOC_WINCH_INITIAL",
    "effect": [
      { "u_location_variable": { "u_val": "winch_teleport" }, "min_radius": 0, "max_radius": 0 },
      { "u_message": "You draw coordinates in a constructed beam.", "type": "good" }
    ]
  },
  {
    "id": "EOC_WINCH_TELEPORT",
    "type": "effect_on_condition",
    "effect": [ { "u_teleport": { "u_val": "winch_teleport" } } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_READ_LOCAL_FILES_XEDRA",
    "condition": {
      "and": [
        { "math": [ "u_skill('computer') >= 2" ] },
        { "roll_contested": { "math": [ "u_skill('deduction')" ] }, "difficulty": 12 }
      ]
    },
    "effect": [ { "u_message": "local_files_xedra", "snippet": true, "same_snippet": true, "popup": true, "store_in_lore": true } ],
    "false_effect": [ { "u_message": "You found nothing interesting." } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_WOLF_SLEDGE_TRHOW",
    "condition": { "math": [ "u_val('stamina') >= 3000" ] },
    "effect": [
      {
        "u_run_inv_eocs": "all",
        "search_data": [ { "id": "mace_magic", "wielded_only": true } ],
        "true_eocs": [
          {
            "id": "EOC_WOLF_SLEDGE_TRHOW_nested",
            "effect": [
              { "u_assign_activity": "ACT_GENERIC_EOC", "duration": "2 seconds" },
              { "math": [ "u_val('stamina') -= 400" ] },
              { "u_cast_spell": { "id": "mace_pipe_magic_throw" } }
            ]
          }
        ],
        "false_eocs": [ { "id": "EOC_ITEM_WIELDED", "effect": [ { "u_message": "You aren't wielding it." } ] } ]
      }
    ],
    "false_effect": [ { "u_message": "You don't have enough stamina to throw your Wolf Sledge.", "type": "bad" } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_RIP_TICKET_REMOVE",
    "eoc_type": "EVENT",
    "required_event": "character_casts_spell",
    "condition": { "or": [ { "compare_string": [ "rip_ticket", { "context_val": "spell" } ] } ] },
    "effect": [ { "u_consume_item": "rip_ticket" } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_DAGWOOD",
```
## Q4
instead, let's reson about not building a compiler, but an api that abstracts away the structure, but otherwise just juggles strings. E.g. in python we could use OO to enable a fluent api that, when executed, just prints the relevant json. Show example
### Answer
You're asking about creating a **Python fluent API** that uses object-oriented programming to build EOC JSON structures programmatically, where the API methods return strings that can be printed as valid JSON.<cite/>

## Answer

Here's how you could design a fluent API for EOC generation based on the existing JSON structure:

### Core API Design

The API would mirror the EOC structure from `doc/JSON/EFFECT_ON_CONDITION.md:29-41` Cataclysm-DDA:29-41 , providing builder methods for each component:

```python
class EOC:
    def __init__(self, id: str):
        self.data = {"type": "effect_on_condition", "id": id}
    
    def recurring(self, seconds):
        self.data["recurrence"] = seconds
        self.data["eoc_type"] = "RECURRING"
        return self
    
    def event(self, event_name: str):
        self.data["eoc_type"] = "EVENT"
        self.data["required_event"] = event_name
        return self
    
    def condition(self, cond):
        self.data["condition"] = cond
        return self
    
    def effect(self, *effects):
        self.data["effect"] = list(effects)
        return self
    
    def false_effect(self, *effects):
        self.data["false_effect"] = list(effects)
        return self
    
    def to_json(self):
        import json
        return json.dumps(self.data, indent=2)
```

### Effect Builders

Based on the effects in `doc/JSON/EFFECT_ON_CONDITION.md:2011-2100` Cataclysm-DDA:2011-2100 , create helper classes:

```python
class Effect:
    @staticmethod
    def u_message(text: str, msg_type: str = "neutral"):
        return {"u_message": text, "type": msg_type}
    
    @staticmethod
    def u_spawn_item(item_id: str, count: int = 1):
        return {"u_spawn_item": item_id, "count": count}
    
    @staticmethod
    def run_eocs(eoc_id: str, **variables):
        result = {"run_eocs": eoc_id}
        if variables:
            result["variables"] = variables
        return result
    
    @staticmethod
    def math(expression: str):
        return {"math": [expression]}

class Condition:
    @staticmethod
    def u_has_trait(trait_id: str):
        return {"u_has_trait": trait_id}
    
    @staticmethod
    def math(expression: str):
        return {"math": [expression]}
    
    @staticmethod
    def and_(*conditions):
        return {"and": list(conditions)}
    
    @staticmethod
    def or_(*conditions):
        return {"or": list(conditions)}
```

### Real-World Example

Recreating the test EOC from `data/mods/TEST_DATA/EOC.json:121-138` Cataclysm-DDA:121-138 :

```python
# Original JSON structure
eoc = (EOC("EOC_item_teleport_test")
    .effect(
        {"u_location_variable": {"u_val": "tele_test"}, "x_adjust": 1, "y_adjust": 1},
        {"u_run_inv_eocs": "all", "true_eocs": ["EOC_item_teleport_test_nested"]}
    ))

print(eoc.to_json())
```

### Complex Example with Variables

Based on the pattern in `doc/JSON/EFFECT_ON_CONDITION.md:2072-2100` Cataclysm-DDA:2072-2100 :

```python
# Create an EOC that passes variables to another EOC
give_gun = (EOC("EOC_I_NEED_AN_AR15")
    .effect(
        Effect.run_eocs("EOC_GIVE_A_GUN", 
                       gun_name="ar15_223medium",
                       amount_of_guns="5")
    ))

# The receiving EOC would use context variables
process_gun = (EOC("EOC_GIVE_A_GUN")
    .effect(
        Effect.u_spawn_item({"context_val": "gun_name"}),
        Effect.math("_amount_of_guns")
    ))

print(give_gun.to_json())
```

### Event EOC Example

Based on `data/mods/TEST_DATA/EOC.json:594-605` Cataclysm-DDA:594-605  and event types from `doc/JSON/EFFECT_ON_CONDITION.md:1642-1680` Cataclysm-DDA:1642-1680 :

```python
spell_event = (EOC("EOC_spell_event_test")
    .event("character_casts_spell")
    .effect(
        {"copy_var": {"context_val": "spell"}, "target_var": {"global_val": "key1"}},
        Effect.math("key3 = _difficulty"),
        Effect.u_message("You cast {_spell} with difficulty {_difficulty}")
    ))

print(spell_event.to_json())
```

### Advantages

1. **Type hints**: Python type annotations provide IDE autocomplete
2. **Validation**: Methods can validate parameters before building JSON
3. **Reusability**: Common effect patterns can be encapsulated in helper methods
4. **Readability**: Fluent API reads more naturally than nested JSON
5. **No transpilation**: Direct string manipulation, outputs valid JSON immediately

## Notes

This approach is simpler than both a compiler and a transpiler. It's just a thin wrapper around JSON string generation using Python's object-oriented features. The API can be extended to support all EOC features from `doc/JSON/EFFECT_ON_CONDITION.md` Cataclysm-DDA:1-100 , including complex conditions, nested EOCs, and all effect types. You could add validation methods that check against known effect names and variable scopes before generating the JSON output.<cite/>

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
### Citations
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1-100)
```markdown

# Effect On Condition

An effect_on_condition is an object allowing the combination of dialog conditions and effects with their usage outside of a dialog.  When invoked, they will test their condition; on a pass, they will cause their effect. They can be activated automatically with any given frequency.  (Note: effect_on_conditions use the npc dialog conditions and effects syntax, which allows checking related to, or targeting an effect at, an npc (for example: `npc_has_trait`).  Using these commands in an effect_on_condition is not supported.)

## Contents

- [Effect On Condition](#effect-on-condition)
  - [Fields](#fields)
  - [Alpha and Beta Talkers](#alpha-and-beta-talkers)
  - [Value types](#value-types)
  - [Variable Object](#variable-object)
  - [Examples:](#examples)
- [Condition:](#condition)
  - [Boolean logic](#boolean-logic)
  - [Possible conditions](#possible-conditions)
- [Reusable EOCs:](#reusable-eocs)
- [EVENT EOCs:](#event-eocs)
  - [Event Context Vars:](#event-context-vars)
  - [Event EOC Types:](#event-eoc-types)
  - [Context Variables For Other EOCs](#context-variables-for-other-eocs)
- [Effects](#effects)
  - [General](#general)
  - [Character effects](#character-effects)
  - [Item effects](#item-effects)
  - [Map effects](#map-effects)
  - [Map Updates](#map-updates)

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

 ### EOC types

`EOC_TYPE` can be any of:

* `ACTIVATION` - activated manually.
* `RECURRING` - activated automatically on schedule (see `recurrence`)
* `AVATAR_DEATH` - automatically invoked whenever the current avatar dies (it will be run with the avatar as `u`), if after it the player is no longer dead they will not die, if there are multiple EOCs they all be run until the player is not dead.
* `NPC_DEATH` - EOCs can only be assigned to run on the death of an npc, in which case u will be the dying npc and npc will be the killer. If after it npc is no longer dead they will not die, if there are multiple they all be run until npc is not dead.
* `PREVENT_DEATH` - whenever the current avatar dies it will be run with the avatar as `u`, if after it the player is no longer dead they will not die, if there are multiple they all be run until the player is not dead.
* `EVENT` - EOCs trigger when a specific event given by "required_event" takes place. 

## Alpha and Beta Talkers

Talker, in context of effect on condition, is any entity, that can use specific effect or be checked against specific condition. Some effects and conditions don't have talker whatsoever, so any entity can use it (like `mapgen_update` effect can be used no matter is it used by player, NPC, monster or item), other has only one talker (aka alpha talker, aka `u_`) - the entity that call the effect or check (like `u_know_recipe` or `u_has_mission`), and the third has two talkers - alpha and beta (aka `u_` and `npc_`), which allow to check both you and your interlocutor (or enemy, depending on context)

For example, `{ "npc_has_effect": "Shadow_Reveal" }`, used by shadow lieutenant, check the player as beta talker, despite the id imply it should be `npc_`; This is a legacy of dialogue system, from which EoC was extended, and won't be fixed, since dialogues still use it fully

### Typical Alpha and Beta Talkers by cases

| EOC                                              | Alpha (possible types)      | Beta (possible types)       | variables sent              |
| ------------------------------------------------ | ----------------------      | --------------------------- | --------------------------- |
| Talk with NPC                                    | player (Avatar)             | NPC (NPC)                   |                             |
| Talk with monster                                | player (Avatar)             | monster (monster)           |
| Use computer                                     | player (Avatar)             | computer (Furniture)        |
| furniture: "examine_action"                      | player (Avatar)             | NONE                        | `this`, string, furniture id; `pos`; string, coordinates of the furniture
| furniture: "mortar"                              | player (Avatar)             | NONE                        | `this`, string, furniture id; `pos`; string, coordinates of the furniture; `target`, string, coordinates of picked tile
| spell: "effect": "effect_on_condition"           | target (Character, Monster) | spell caster (Character, Monster) | `spell_location`, location variable, location of target for use primarily when the target isn't a creature
| spell: "description"                             | avatar                      | avatar                      | Used for tags
| trap: "action": "eocs"                           | triggerer (Creature, item not supported yet) | NONE | `trap_location`, location variable, location of the trap to use primarily with ranged traps
| monster_attack: "eoc"                            | attacker ( Monster)         | victim (Creature)           | `damage`, int, damage dealt by attack
| use_action: "type": "effect_on_conditions"       | user (Character)            | item (item)                 | `id`, string, stores item id
| tick_action: "type": "effect_on_conditions"      | carrier (Character)         | item (item)                 |
| countdown_action: "type": "effect_on_conditions" | carrier (Character)         | item (item)                 |
| COMESTIBLE: "consumption_effect_on_conditions"   | user (Character)            | item (item)                 |
| activity_type: "completion_eoc"                  | character (Character)       | NONE                        |
| activity_type: "do_turn_eoc"                     | character (Character)       | NONE                        |
| addiction_type: "effect_on_condition"            | character (Character)       | NONE                        |
| bionics: "activated_eocs"                        | character (Character)       | NONE                        | `act_cost`, int, cost of activation of item
| bionics: "deactivated_eocs"                      | character (Character)       | NONE                        |
| bionics: "processed_eocs"                        | character (Character)       | NONE                        |
| mutation: "activated_eocs"                       | character (Character)       | NONE                        |
| mutation: "deactivated_eocs"                     | character (Character)       | NONE                        |
| mutation: "processed_eocs"                       | character (Character)       | NONE                        |
| recipe: "result_eocs"                            | crafter (Character)         | NONE                        |
| monster weakpoint: "effect_on_conditions"        | attacker (Creature, if exists, otherwise NONE) | victim (Creature) | note that if weakpoint was hit without attacker, EoC would be built without alpha talker, so using EoC referencing `u_` would result in error. Use `has_alpha` condition before manipulating alpha talker
| monster death: "death_function"                  | killer (Creature, if exists, otherwise NONE)| victim (Creature) | Note that if monster was killed without a killer (falling anvil, explosion of a bomb etc), EoC would be built without alpha talker, so using EoC referencing `u_` would result in error. Use `has_alpha` condition before manipulating alpha talker
| ammo_effect: "eoc"                               | shooter (Creature)          | victim (if exist, otherwise NONE) (Creature) | `proj_damage`, int, amount of damage projectile dealt. Detonation via SPECIAL_COOKOFF ammo effect return `proj_damage` as 1. Note that if projectile miss the target, EoC would be built without beta talker, so using EoC referencing `npc_` or `n_` would result in error. Use `has_beta` condition before manipulating npc

Some actions sent additional context variables, that can be used in EoC, in format:

```jsonc
{ "compare_string": [ "bio_uncanny_dodge", { "context_val": "id" } ] }
```

```jsonc
{ "math": [ "_act_cost == 2000" ] }
```

```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1642-1680)
```markdown
| EVENT              | Description | Context Variables | Talker(alpha/beta) |
| ------------------ | ----------- | ----------------- | ------------------ |
| activates_artifact | Triggers when the player activates an artifact | { "character", `character_id` },<br/> { "item_name", `string` }, | character / NONE |
| activates_mininuke | Triggers when any character arms a mininuke | { "character", `character_id` } | character / NONE |
| administers_mutagen |  | { "character", `character_id` },<br/> { "technique", `mutagen_technique` }, | character / NONE |
| angers_amigara_horrors | Triggers when amigara horrors are spawned as part of a mine finale | NONE | avatar / NONE |
| avatar_enters_omt | Triggers when player crosses the overmap boundary, including when player spawns | { "pos", `tripoint` },<br/> { "oter_id", `oter_id` }, | avatar / NONE |
| avatar_moves |  | { "mount", `mtype_id` },<br/> { "terrain", `ter_id` },<br/> { "movement_mode", `move_mode_id` },<br/> { "underwater", `bool` },<br/> { "z", `int` }, | avatar / NONE |
| avatar_dies |  | NONE | avatar / NONE |
| awakes_dark_wyrms | Triggers when `pedestal_wyrm` examine action is used | NONE | avatar / NONE |
| becomes_wanted | Triggered when copbots/riot bots are spawned as part of a timed event after mon/char is photo'd by eyebot | { "character", `character_id` } | character / NONE |
| broken_bone | Triggered when any body part reaches 0 hp | { "character", `character_id` },<br/> { "part", `body_part` }, | character / NONE |
| broken_bone_mends | Triggered when `mending` effect is removed by expiry (Character::mend) | { "character", `character_id` },<br/> { "part", `body_part` }, | character / NONE |
| buries_corpse | Triggers when item with flag CORPSE is located on same tile as construction with post-special `done_grave` is completed | { "character", `character_id` },<br/> { "corpse_type", `mtype_id` },<br/> { "corpse_name", `string` }, | character / NONE |
| camp_taken_over | Triggers any faction's camp is taken over | { "old_owner", `faction_id` }, <br/> { "new_Owner", `faction_id` }, <br/> { "camp_name", `string` }, <br/> { "was_violent", `bool` }, | avatar / NONE |
| causes_resonance_cascade | Triggers when resonance cascade option is activated via "old lab" finale's computer | NONE | avatar / NONE |
| character_butchered_corpse | Triggers after succesful butchering action. Possible values of butcher_type are `ACT_BLEED`, `ACT_BUTCHER`, `ACT_BUTCHER_FULL`, `ACT_FIELD_DRESS`, `ACT_SKIN`, `ACT_QUARTER`, `ACT_DISMEMBER`, `ACT_DISSECT` | { "character", `character_id` }, { "monster_id", `mtype_id` }, { "butcher_type", `string` }, | character / NONE |
| character_casts_spell | Triggers when a character casts spells. When a spell with multiple effects is cast, the number of effects will be triggered | { "character", `character_id` },<br/> { "spell", `spell_id` },<br/> { "school", `trait_id` },<br/> { "difficulty", `int` },<br/> { "cost", `int` },<br/> { "cast_time", `int` },<br/> { "damage", `int` }, | character / NONE |
| character_consumes_item |  | { "character", `character_id` },<br/> { "itype", `itype_id` }, | character / NONE |
| character_dies |  | { "character", `character_id` }, | character / NONE |
| character_eats_item |  | { "character", `character_id` },<br/> { "itype", `itype_id` }, | character / NONE |
| character_finished_activity | Triggered when character finished or canceled activity | { "character", `character_id` },<br/> { "activity", `activity_id` },<br/> { "canceled", `bool` } | character / NONE |
| character_forgets_spell |  | { "character", `character_id` },<br/> { "spell", `spell_id` } | character / NONE |
| character_gains_effect |  | { "character", `character_id` },<br/> { "effect", `efftype_id` },<br/> { "bodypart", `bodypart_id` }, { "intensity", `int` }</br> | character / NONE |
| character_gets_headshot |  | { "character", `character_id` } | character / NONE |
| character_heals_damage |  | { "character", `character_id` },<br/> { "damage", `int` }, | character / NONE |
| character_kills_character |  | { "killer", `character_id` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character / NONE |
| character_kills_monster |  | { "killer", `character_id` },<br/> { "victim_type", `mtype_id` },<br/> { "exp", `int` }, | character / monster |
| character_learns_spell |  | { "character", `character_id` },<br/> { "spell", `spell_id` } | character / NONE |
| character_loses_effect |  | { "character", `character_id` },<br/> { "effect", `efftype_id` },<br/> { "bodypart", `bodypart_id` } | character / NONE |
| character_melee_attacks_character |  | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "hits", `bool` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character (attacker) / character (victim) |
| character_melee_attacks_monster | | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "hits", `bool` },<br/> { "victim_type", `mtype_id` },| character / monster |
| character_radioactively_mutates | triggered when a character mutates due to being irradiated | { "character", `character_id` }, | character / NONE |
| character_ranged_attacks_character | |  { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "ammo", `itype_id` },<br/> { "is_throw", `bool` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character (attacker) / character (victim) |
| character_ranged_attacks_monster | | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "ammo", `itype_id` },<br/> { "is_throw", `bool` },<br/>  { "victim_type", `mtype_id` }, | character / monster |
| character_smashes_tile | | { "character", `character_id` },<br/> { "terrain", `ter_str_id` },  { "furniture", `furn_str_id` }, | character / NONE |
| character_starts_activity | Triggered when character starts or resumes activity | { "character", `character_id` },<br/> { "activity", `activity_id` },<br/> { "resume", `bool` } | character / NONE |
| character_takeoff_item | triggers when character removes a worn item. If using `run_inv_eocs`, remember that the event fires before the items are actually removed | { "character", `character_id` },<br/> { "itype", `itype_id` } |
| character_takes_damage | triggers when character gets any damage from any creature | { "character", `character_id` },<br/> { "damage", `int` },<br/> { "bodypart", `bodypart_id` },<br/> { "pain", `int` }, | character / attacker if exists, otherwise NONE(character or monster) | use `has_beta` conditon before interacting with beta talker
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2011-2100)
```markdown
##### Examples

Run `EOC_DO_GOOD_THING` EoC
```jsonc
{ "run_eocs": [ "EOC_DO_GOOD_THING" ] }
```

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

EOC_until_nested will run 10 times
```jsonc
  {
    "type": "effect_on_condition",
    "id": "EOC_run_until",
    "effect": { "run_eocs": "EOC_until_nested", "iterations": 10 }
  },
```

Run `EOC_BOOM` EoC at `where_my_enemy_is` location variable
```jsonc
{ "run_eocs": "EOC_BOOM", "beta_loc": { "global_val": "where_my_enemy_is" } },
```

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
```
**File:** data/mods/TEST_DATA/EOC.json (L121-138)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_item_math_test_nested",
    "effect": [ { "math": [ "n_hp('ALL') = 100" ] } ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_item_teleport_test",
    "effect": [
      { "u_location_variable": { "u_val": "tele_test" }, "x_adjust": 1, "y_adjust": 1 },
      { "u_run_inv_eocs": "all", "true_eocs": [ "EOC_item_teleport_test_nested" ] }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_item_teleport_test_nested",
    "effect": [ { "npc_teleport": { "u_val": "tele_test" } } ]
  },
```
**File:** data/mods/TEST_DATA/EOC.json (L594-605)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_spell_event_test",
    "eoc_type": "EVENT",
    "required_event": "character_casts_spell",
    "effect": [
      { "copy_var": { "context_val": "spell" }, "target_var": { "global_val": "key1" } },
      { "copy_var": { "context_val": "school" }, "target_var": { "global_val": "key2" } },
      { "math": [ "key3 = _difficulty" ] },
      { "math": [ "key4 = _cost" ] },
      { "math": [ "key5 = _cast_time" ] },
      { "math": [ "key6 = _damage" ] }
```
## Q5
try to come up with a full implementation in a single python file, that we can test
### Answer
You're asking for a complete, testable Python implementation of the fluent API for generating EOC JSON that we discussed in the previous messages.<cite/>

## Full Implementation

Here's a comprehensive single-file implementation based on the EOC structure from `doc/JSON/EFFECT_ON_CONDITION.md:29-41` Cataclysm-DDA:29-41  and the effect types from `doc/JSON/EFFECT_ON_CONDITION.md:2011-2130` Cataclysm-DDA:2011-2130 :

```python
#!/usr/bin/env python3
"""
EOC Builder - A fluent API for generating Cataclysm: DDA Effect on Condition JSON
"""

import json
from typing import Any, Dict, List, Union, Optional


class Condition:
    """Helper class for building condition objects"""
    
    @staticmethod
    def u_has_trait(trait_id: str) -> Dict[str, str]:
        return {"u_has_trait": trait_id}
    
    @staticmethod
    def npc_has_trait(trait_id: str) -> Dict[str, str]:
        return {"npc_has_trait": trait_id}
    
    @staticmethod
    def u_has_effect(effect_id: str, intensity: Optional[int] = None, 
                     bodypart: Optional[str] = None) -> Dict[str, Any]:
        result = {"u_has_effect": effect_id}
        if intensity is not None:
            result["intensity"] = intensity
        if bodypart is not None:
            result["bodypart"] = bodypart
        return result
    
    @staticmethod
    def u_has_bionic(bionic_id: str) -> Dict[str, str]:
        return {"u_has_bionics": bionic_id}
    
    @staticmethod
    def math(expression: str) -> Dict[str, List[str]]:
        return {"math": [expression]}
    
    @staticmethod
    def and_(*conditions: Dict) -> Dict[str, List[Dict]]:
        return {"and": list(conditions)}
    
    @staticmethod
    def or_(*conditions: Dict) -> Dict[str, List[Dict]]:
        return {"or": list(conditions)}
    
    @staticmethod
    def not_(condition: Dict) -> Dict[str, Dict]:
        return {"not": condition}
    
    @staticmethod
    def compare_string(str1: str, str2: Union[str, Dict]) -> List:
        return {"compare_string": [str1, str2]}
    
    @staticmethod
    def u_has_items_sum(items: List[Dict[str, Any]]) -> Dict:
        return {"u_has_items_sum": items}


class Effect:
    """Helper class for building effect objects"""
    
    @staticmethod
    def u_message(text: str, msg_type: str = "neutral") -> Dict[str, str]:
        return {"u_message": text, "type": msg_type}
    
    @staticmethod
    def npc_message(text: str, msg_type: str = "neutral") -> Dict[str, str]:
        return {"npc_message": text, "type": msg_type}
    
    @staticmethod
    def u_spawn_item(item_id: Union[str, Dict], count: Union[int, Dict] = 1) -> Dict[str, Any]:
        result = {"u_spawn_item": item_id}
        if count != 1:
            result["count"] = count
        return result
    
    @staticmethod
    def u_add_effect(effect_id: str, duration: Union[int, str], 
                     bodypart: Optional[str] = None, intensity: int = 1) -> Dict[str, Any]:
        result = {"u_add_effect": effect_id, "duration": duration}
        if intensity != 1:
            result["intensity"] = intensity
        if bodypart:
            result["bodypart"] = bodypart
        return result
    
    @staticmethod
    def u_add_morale(morale_type: str, bonus: Union[int, Dict]) -> Dict[str, Any]:
        return {"u_add_morale": morale_type, "bonus": bonus}
    
    @staticmethod
    def run_eocs(eoc_id: Union[str, List[str]], 
                 variables: Optional[Dict[str, str]] = None,
                 beta_loc: Optional[Dict] = None,
                 iterations: Optional[int] = None) -> Dict[str, Any]:
        result = {"run_eocs": eoc_id}
        if variables:
            result["variables"] = variables
        if beta_loc:
            result["beta_loc"] = beta_loc
        if iterations:
            result["iterations"] = iterations
        return result
    
    @staticmethod
    def math(expression: str) -> Dict[str, List[str]]:
        return {"math": [expression]}
    
    @staticmethod
    def u_location_variable(var_name: Union[str, Dict], 
                           x_adjust: int = 0, y_adjust: int = 0,
                           min_radius: int = 0, max_radius: int = 0) -> Dict[str, Any]:
        result = {"u_location_variable": var_name}
        if x_adjust != 0:
            result["x_adjust"] = x_adjust
        if y_adjust != 0:
            result["y_adjust"] = y_adjust
        if min_radius != 0:
            result["min_radius"] = min_radius
        if max_radius != 0:
            result["max_radius"] = max_radius
        return result
    
    @staticmethod
    def copy_var(source_var: Dict, target_var: Dict) -> Dict[str, Dict]:
        return {"copy_var": source_var, "target_var": target_var}
    
    @staticmethod
    def u_run_inv_eocs(mode: str, search_data: Optional[List[Dict]] = None,
                       true_eocs: Optional[List[str]] = None) -> Dict[str, Any]:
        result = {"u_run_inv_eocs": mode}
        if search_data:
            result["search_data"] = search_data
        if true_eocs:
            result["true_eocs"] = true_eocs
        return result
    
    @staticmethod
    def if_then_else(condition: Dict, then_effect: Union[Dict, List[Dict]], 
                     else_effect: Optional[Union[Dict, List[Dict]]] = None) -> Dict[str, Any]:
        result = {"if": condition, "then": then_effect}
        if else_effect:
            result["else"] = else_effect
        return result


class Variable:
    """Helper class for variable objects"""
    
    @staticmethod
    def u_val(var_name: str) -> Dict[str, str]:
        return {"u_val": var_name}
    
    @staticmethod
    def npc_val(var_name: str) -> Dict[str, str]:
        return {"npc_val": var_name}
    
    @staticmethod
    def global_val(var_name: str) -> Dict[str, str]:
        return {"global_val": var_name}
    
    @staticmethod
    def context_val(var_name: str) -> Dict[str, str]:
        return {"context_val": var_name}
    
    @staticmethod
    def math(expression: str) -> Dict[str, List[str]]:
        return {"math": [expression]}


class EOC:
    """Main EOC builder class with fluent interface"""
    
    def __init__(self, eoc_id: str):
        self.data: Dict[str, Any] = {
            "type": "effect_on_condition",
            "id": eoc_id
        }
    
    def activation(self) -> 'EOC':
        """Set EOC type to ACTIVATION"""
        self.data["eoc_type"] = "ACTIVATION"
        return self
    
    def recurring(self, seconds: Union[int, str, List]) -> 'EOC':
        """Set EOC type to RECURRING with recurrence interval"""
        self.data["eoc_type"] = "RECURRING"
        self.data["recurrence"] = seconds
        return self
    
    def event(self, event_name: str) -> 'EOC':
        """Set EOC type to EVENT with required event"""
        self.data["eoc_type"] = "EVENT"
        self.data["required_event"] = event_name
        return self
    
    def avatar_death(self) -> 'EOC':
        """Set EOC type to AVATAR_DEATH"""
        self.data["eoc_type"] = "AVATAR_DEATH"
        return self
    
    def npc_death(self) -> 'EOC':
        """Set EOC type to NPC_DEATH"""
        self.data["eoc_type"] = "NPC_DEATH"
        return self
    
    def condition(self, cond: Dict) -> 'EOC':
        """Set the condition for this EOC"""
        self.data["condition"] = cond
        return self
    
    def deactivate_condition(self, cond: Dict) -> 'EOC':
        """Set the deactivate condition for this EOC"""
        self.data["deactivate_condition"] = cond
        return self
    
    def effect(self, *effects: Union[Dict, List[Dict]]) -> 'EOC':
        """Set the effects to execute when condition is true"""
        if len(effects) == 1 and isinstance(effects[0], list):
            self.data["effect"] = effects[0]
        else:
            self.data["effect"] = list(effects)
        return self
    
    def false_effect(self, *effects: Union[Dict, List[Dict]]) -> 'EOC':
        """Set the effects to execute when condition is false"""
        if len(effects) == 1 and isinstance(effects[0], list):
            self.data["false_effect"] = effects[0]
        else:
            self.data["false_effect"] = list(effects)
        return self
    
    def global_eoc(self, run_for_npcs: bool = False) -> 'EOC':
        """Make this a global EOC"""
        self.data["global"] = True
        if run_for_npcs:
            self.data["run_for_npcs"] = True
        return self
    
    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string"""
        return json.dumps(self.data, indent=indent)
    
    def to_dict(self) -> Dict[str, Any]:
        """Get the raw dictionary"""
        return self.data


# Example usage and tests
if __name__ == "__main__":
    print("=== EOC Builder Examples ===\n")
    
    # Example 1: Simple recurring EOC with condition
    print("Example 1: Recurring EOC checking stamina")
    eoc1 = (EOC("EOC_stamina_check")
        .recurring("1 seconds")
        .condition(Condition.math("u_val('stamina') == 500"))
        .effect(
            Effect.u_add_morale("morale_feeling_good", 10)
        )
        .false_effect(
            Effect.u_message("Low stamina", "bad")
        ))
    print(eoc1.to_json())
    print()
    
    # Example 2: Event EOC for spell casting
    print("Example 2: Event EOC for spell casting")
    eoc2 = (EOC("EOC_spell_event_test")
        .event("character_casts_spell")
        .effect(
            Effect.copy_var(
                Variable.context_val("spell"),
                Variable.global_val("key1")
            ),
            Effect.math("key3 = _difficulty"),
            Effect.u_message("You cast a spell with difficulty {_difficulty}")
        ))
    print(eoc2.to_json())
    print()
    
    # Example 3: EOC with variables passed to another EOC
    print("Example 3: EOC calling another with variables")
    eoc3 = (EOC("EOC_I_NEED_AN_AR15")
        .effect(
            Effect.run_eocs("EOC_GIVE_A_GUN", variables={
                "gun_name": "ar15_223medium",
                "amount_of_guns": "5"
            })
        ))
    print(eoc3.to_json())
    print()
    
    # Example 4: Complex condition with AND/OR
    print("Example 4: Complex conditional logic")
    eoc4 = (EOC("EOC_complex_condition")
        .condition(
            Condition.and_(
                Condition.u_has_trait("SPIRITUAL"),
                Condition.or_(
                    Condition.u_has_effect("infected"),
                    Condition.math("u_val('health') < 50")
                )
            )
        )
        .effect(
            Effect.u_message("You feel spiritually troubled", "bad"),
            Effect.u_add_effect("infection", "1 hours")
        ))
    print(eoc4.to_json())
    print()
    
    # Example 5: EOC with if/then/else effect
    print("Example 5: If/then/else in effects")
    eoc5 = (EOC("EOC_strength_check")
        .effect(
            Effect.if_then_else(
                Condition.math("u_val('strength') > 8"),
                Effect.u_message("You are strong!"),
                Effect.u_message("You are normal")
            )
        ))
    print(eoc5.to_json())
    print()
    
    # Example 6: Location variable usage
    print("Example 6: Location variable")
    eoc6 = (EOC("EOC_teleport_test")
        .effect(
            Effect.u_location_variable(
                Variable.u_val("tele_test"),
                x_adjust=1,
                y_adjust=1
            ),
            Effect.u_run_inv_eocs("all", true_eocs=["EOC_nested"])
        ))
    print(eoc6.to_json())
    print()
    
    print("=== All examples generated successfully! ===")
```

## Usage

Save this as `eoc_builder.py` and run it:<cite/>

```bash
python eoc_builder.py
```

The script demonstrates six different EOC patterns based on real examples from `data/mods/TEST_DATA/EOC.json` Cataclysm-DDA:120-605 :

1. **Recurring EOC** with math condition checking stamina
2. **Event EOC** triggered by spell casting with context variables
3. **Variable passing** between EOCs
4. **Complex boolean logic** with AND/OR conditions
5. **If/then/else** effects
6. **Location variables** for teleportation

## Notes

This implementation covers the most common EOC patterns from the documentation Cataclysm-DDA:181-240 . You can extend it by adding more effect types from `doc/JSON/EFFECT_ON_CONDITION.md:2251-2340` Cataclysm-DDA:2251-2340 

Wiki pages you might want to explore:
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
### Citations
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L29-41)
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
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L181-240)
```markdown

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

### Reactivation Support
Important to remember that **reactivated EOCs currently lose all context variables and conditions**. Fixing this is a desired feature.

## Examples:
```jsonc
  {
    "type": "effect_on_condition",
    "id": "test_deactivate",
    "recurrence": 1,
    "condition": { "u_has_trait": "SPIRITUAL" },
    "deactivate_condition": { "not":{ "u_has_trait": "SPIRITUAL" } },
    "effect": { "u_add_effect": "infection", "duration": 1 }
  },
  {
    "type": "effect_on_condition",
    "id": "test_stats",
    "recurrence": [ 1, 10 ],
    "condition": { "not": { "u_has_strength": 7 } },
    "effect": { "u_add_effect": "infection", "duration": 1 }
  }
```

# Condition:

Dialogue conditions is a way to check is some specific statements are true or false. Conditions can be used both in dialogue with NPC, and in Effect on Conditions. 
The following keys and strings are available:

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
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2011-2130)
```markdown
##### Examples

Run `EOC_DO_GOOD_THING` EoC
```jsonc
{ "run_eocs": [ "EOC_DO_GOOD_THING" ] }
```

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

EOC_until_nested will run 10 times
```jsonc
  {
    "type": "effect_on_condition",
    "id": "EOC_run_until",
    "effect": { "run_eocs": "EOC_until_nested", "iterations": 10 }
  },
```

Run `EOC_BOOM` EoC at `where_my_enemy_is` location variable
```jsonc
{ "run_eocs": "EOC_BOOM", "beta_loc": { "global_val": "where_my_enemy_is" } },
```

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

Control a NPC and return to your original body.
By using `EOC_control_npc`, you can gain control of an NPC, and your original body's character_id will be stored in the global variable `"player_id"`.
Then, by using `EOC_return_to_player`, you can return to your original body.
```jsonc

{
  "type": "effect_on_condition",
  "id": "EOC_control_npc",
  "effect": [
    { "u_set_talker": { "global_val": "player_id" } },
    { "u_query_tile": "anywhere", "target_var": { "context_val": "loc" }, "message": "Select point" },
    {
      "if": { "math": [ "has_var(_loc)" ] },
      "then": {
        "run_eocs": {
          "id": "_EOC_control_npc_do",
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2251-2340)
```markdown
#### `u_set_talker`, `npc_set_talker`
Store the character_id of You or NPC into a variable object

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "u_set_talker" / "npc_set_talker" | **mandatory** | [variable object](#variable-object) | the variable object to store the character_id |

##### Examples

```jsonc
{
  "effect": [ 
    { "u_set_talker": { "global_val": "u_character_id" } }, 
    { "u_message": "Your character id is <global_val:u_character_id>" }
  ]
}
```

#### `u_roll_remainder`, `npc_roll_remainder`
If you or NPC does not have all of the listed bionics, mutations, spells or recipes, gives one randomly

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "u_roll_remainder" / "npc_roll_remainder" | **mandatory** | string, [variable](#variable-object) or array of both | thing, that would be rolled and given |
| "type" | **mandatory** | string or [variable object](#variable-object) | type of thing that would be given; can be one of `bionic`, `mutation`, `spell` or `recipe` | 
| "message" | optional | string or [variable object](#variable-object) | message, that would be displayed in log, once remainder is used; `%s` symbol can be used in this message to write the name of a thing, that would be given; message would be printed only if roll was successful | 
| "true_eocs", "false_eocs" | optional | string, [variable object](#variable-object), inline EoC, or range of all of them | If reminder was positive, all EoCs in `true_eocs` run, otherwise `false_eocs` run | 


##### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- |
| ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ❌ |

##### Examples
Tries to give you a mutation `A`, `B` or `C`, if you don't have one, with message `You got %s!`; If roll is successful, `EOC_SUCCESS` is run, otherwise `EOC_FAIL` is run
```jsonc
{
  "u_roll_remainder": [ "mutationA", "mutationB", "mutationC" ],
  "type": "mutation",
  "message": "You got %s!",
  "true_eocs": [ "EOC_SUCCESS" ],
  "false_eocs": [ "EOC_FAIL" ]
}
```


#### `if`
Set effects to be executed when conditions are met and when conditions are not met.

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "if" | **mandatory** | [dialogue condition](#dialogue-conditions) | condition itself | 
| "then" | **mandatory** | effect | Effect(s) executed when conditions are met. | 
| "else" | optional | effect | Effect(s) executed when conditions are not met. | 

##### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- |
| ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

##### Examples
Displays a different message the first time it is run and the second time onwards
```jsonc
{
  "if": { "compare_string": [ "yes", { "u_val": "eoc_sample_if_else_test" } ] },
  "then": { "u_message": "You have variable." },
  "else": [
    { "u_message": "You don't have variable." },
    {
      "if": { "not": { "compare_string": [ "yes", { "u_val": "eoc_sample_if_else_test" } ] } },
      "then": [
        { "u_add_var": "eoc_sample_if_else_test", "value": "yes" },
        { "u_message": "Vriable added." }
      ]
    }
  ]
}
```


#### `switch`
Check the value, and, depending on it, pick the case that would be run

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "switch" | **mandatory** | variable/math_expression | the value, that would be read; only numerical values can be used |
| "cases" | **mandatory** | `case` and `effect` | effects, that would be run, if the value of switch is higher or equal to this case | 
```
## Q6
let's simplify and just straight up write pseudo json in python. Ie only use dicts and lists and primitives plus leveraging multiline strings and any other programming facility need, such as reusing variables for constansts etc. Give and example from the mindovermatter mod, with some gnarly jmath
### Answer
You're asking to simplify the approach by writing EOC definitions directly as Python dictionaries and lists (pseudo-JSON), leveraging Python's multiline strings and variable reuse for constants, and you want an example from the MindOverMatter mod with complex jmath expressions.<cite/>

## Answer

Here's a practical example based on the MindOverMatter mod's learning EOCs, which use complex jmath function calls for recurrence timing:

```python
#!/usr/bin/env python3
"""
EOC definitions as pure Python dicts - MindOverMatter examples
"""

import json

# Constants for reuse
TIER_ONE_LOW = "global_tier_one_power_learning_time_low"
TIER_ONE_HIGH = "global_tier_one_power_learning_time_high"
TIER_TWO_LOW = "global_tier_two_power_learning_time_low"
TIER_TWO_HIGH = "global_tier_two_power_learning_time_high"
TIER_THREE_LOW = "global_tier_three_power_learning_time_low"
TIER_THREE_HIGH = "global_tier_three_power_learning_time_high"

# Reusable condition components
PSI_LEARNING_COUNTER_CHECK = {"math": ["u_vitamin('vitamin_psi_learning_counter') == 1"]}
PSI_LEARNING_BANNED = {"test_eoc": "EOC_PSI_LEARNING_BANNED_EFFECTS"}

def jmath_recurrence(power_type: str, time_var: str):
    """Helper to generate jmath recurrence expressions"""
    return {"math": [f"jmath_{power_type}_learning_eocs_modifiers({time_var})"]}

# Example 1: Telepathy Shield Learning (Tier 1)
# From data/mods/MindOverMatter/powers/learning_eocs/telepathy.json:1-33
telepathy_shield = {
    "type": "effect_on_condition",
    "id": "EOC_TELEPATH_LEARNING_SHIELD",
    "recurrence": [
        jmath_recurrence("telepathy", TIER_ONE_LOW),
        jmath_recurrence("telepathy", TIER_ONE_HIGH)
    ],
    "condition": {
        "and": [
            {"u_has_trait": "TELEPATH"},
            PSI_LEARNING_COUNTER_CHECK,
            {
                "or": [
                    {"test_eoc": "EOC_CONDITION_ODDS_OF_RANDOM_TIER_ONE_POWER_INSIGHT"},
                    {"and": [{"math": ["u_spell_level('telepathic_concentration') >= 5"]}]}
                ]
            },
            PSI_LEARNING_BANNED,
            {"math": ["u_spell_level('telepathic_shield') <= 0"]},
            {"not": {"u_know_recipe": "practice_telepathic_shield"}}
        ]
    },
    "deactivate_condition": {
        "or": [
            {"not": {"u_has_trait": "TELEPATH"}},
            {"math": ["u_spell_level('telepathic_shield') >= 1"]}
        ]
    },
    "effect": [
        {"math": ["u_vitamin('vitamin_psi_learning_counter') = 0"]},
        {"u_learn_recipe": "practice_telepathic_shield"},
        {
            "u_message": """Use of your powers has led to an insight.  You could invert the extreme focus of the concentration trance to make an impenetrable shell around your mind, protecting you from telepathic attack, if you can figure out the proper technique.""",
            "popup": True
        }
    ]
}

# Example 2: Biokinesis Reflex Enhancement (Tier 2) - Complex nested conditions
# From data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json:334-373
biokin_reflex = {
    "type": "effect_on_condition",
    "id": "EOC_BIOKIN_LEARNING_REFLEX_ENHANCE",
    "recurrence": [
        jmath_recurrence("biokinesis", TIER_TWO_LOW),
        jmath_recurrence("biokinesis", TIER_TWO_HIGH)
    ],
    "condition": {
        "and": [
            {"u_has_trait": "BIOKINETIC"},
            PSI_LEARNING_COUNTER_CHECK,
            {
                "or": [
                    {"test_eoc": "EOC_CONDITION_ODDS_OF_RANDOM_TIER_TWO_POWER_INSIGHT"},
                    {
                        "and": [
                            {"math": ["u_spell_level('biokin_physical_enhance') >= 6"]},
                            {"math": ["u_spell_level('biokin_adrenaline') >= 8"]},
                            {
                                "or": [
                                    {"math": ["u_spell_level('biokin_dash') >= 8"]},
                                    {"math": ["u_spell_level('biokin_flexibility') >= 8"]}
                                ]
                            }
                        ]
                    }
                ]
            },
            PSI_LEARNING_BANNED,
            {"math": ["u_spell_level('biokin_reflex_enhance') <= 0"]},
            {"not": {"u_know_recipe": "practice_biokin_reflex_enhance"}}
        ]
    },
    "deactivate_condition": {
        "or": [
            {"not": {"u_has_trait": "BIOKINETIC"}},
            {"math": ["u_spell_level('biokin_reflex_enhance') >= 1"]}
        ]
    },
    "effect": [
        {"math": ["u_vitamin('vitamin_psi_learning_counter') = 0"]},
        {"u_learn_recipe": "practice_biokin_reflex_enhance"},
        {
            "u_message": """Use of your powers has led to an insight.  You could enhance your sensory acuity and reaction time, spotting threats from further away and moving more quickly to counter them, if you can figure out the proper technique.""",
            "popup": True
        }
    ]
}

# Example 3: Clairsentience with gnarly jmath - nested math expressions
# From data/mods/MindOverMatter/powers/clairsentience_eoc.json:1-18
clair_discern_weakness = {
    "type": "effect_on_condition",
    "id": "EOC_CLAIR_DISCERN_WEAKNESS",
    "effect": [
        {"math": ["u_discern_weakness_clear_intelligence = ( ( n_val('intelligence') + 10) / 20 )"]},
        {"math": ["u_discern_weakness_clear_power_level = n_spell_level('clair_spot_weakness')"]},
        {"math": ["u_nether_attunement_discern_weakness_scaling = n_nether_attunement_power_scaling"]},
        {
            "u_add_effect": "effect_clair_weak_point",
            "duration": {
                "math": [
                    """rng( ( ( (u_discern_weakness_clear_power_level * 1.5) + 13.5) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling),( ( (u_discern_weakness_clear_power_level * 2.5) + 30) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling) )"""
                ]
            }
        }
    ]
}

# Example 4: Electrokinesis with complex time calculations
# From data/mods/MindOverMatter/powers/electrokinesis_concentration_eocs.json:1-27
electrokin_see_electricity = {
    "type": "effect_on_condition",
    "id": "EOC_ELECTROKIN_SEE_ELECTRICITY_INITIATE",
    "condition": {"not": {"u_has_effect": "effect_electrokin_see_electricity"}},
    "effect": [
        {"u_message": "You open your senses to the flow of current.", "type": "good"},
        {"run_eocs": "EOC_POWER_MAINTENANCE_PLUS_ONE"},
        {"u_add_effect": "effect_electrokin_see_electricity", "duration": "PERMANENT"},
        {
            "run_eocs": "EOC_ELECTROKIN_SEE_ELECTRICITY_DRAIN",
            "time_in_future": [
                {
                    "math": [
                        """( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 150) + 900) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"""
                    ]
                },
                {
                    "math": [
                        """( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 300) + 1800) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"""
                    ]
                }
            ]
        }
    ],
    "false_effect": [{"run_eocs": "EOC_ELECTROKIN_REMOVE_SEE_ELECTRICITY"}]
}

# Output all EOCs as a JSON array
eocs = [
    telepathy_shield,
    biokin_reflex,
    clair_discern_weakness,
    electrokin_see_electricity
]

if __name__ == "__main__":
    print(json.dumps(eocs, indent=2))
```

## Key Benefits

**1. Multiline Strings**: Python's triple-quoted strings make long messages readable without escape characters Cataclysm-DDA:28-31 

**2. Variable Reuse**: Constants like `TIER_ONE_LOW` eliminate repetition across multiple EOCs Cataclysm-DDA:6-7 

**3. Helper Functions**: The `jmath_recurrence()` function encapsulates the jmath pattern used throughout MindOverMatter Cataclysm-DDA:337-340 

**4. Shared Conditions**: Reusable condition dicts like `PSI_LEARNING_COUNTER_CHECK` reduce duplication Cataclysm-DDA:344-344 

**5. Complex Math**: The gnarly jmath expressions remain as strings but are more readable with Python's multiline support Cataclysm-DDA:12-14 

## Notes

This approach is simpler than the fluent API—just pure Python data structures that serialize to JSON. The MindOverMatter mod extensively uses jmath functions like `jmath_biokinesis_learning_eocs_modifiers()` for dynamic recurrence timing Cataclysm-DDA:122-123 , and complex nested math expressions for duration calculations Cataclysm-DDA:14-16 . The examples show real patterns from the mod including tier-based learning conditions Cataclysm-DDA:331-367  and power maintenance systems Cataclysm-DDA:103-109 .<cite/>
### Citations
**File:** data/mods/MindOverMatter/powers/learning_eocs/telepathy.json (L6-7)
```json
      { "math": [ "jmath_telepathy_learning_eocs_modifiers(global_tier_one_power_learning_time_low)" ] },
      { "math": [ "jmath_telepathy_learning_eocs_modifiers(global_tier_one_power_learning_time_high)" ] }
```
**File:** data/mods/MindOverMatter/powers/learning_eocs/telepathy.json (L28-31)
```json
      {
        "u_message": "Use of your powers has led to an insight.  You could invert the extreme focus of the concentration trance to make an impenetrable shell around your mind, protecting you from telepathic attack, if you can figure out the proper technique.",
        "popup": true
      }
```
**File:** data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json (L122-123)
```json
      { "math": [ "jmath_biokinesis_learning_eocs_modifiers(global_tier_two_power_learning_time_low)" ] },
      { "math": [ "jmath_biokinesis_learning_eocs_modifiers(global_tier_two_power_learning_time_high)" ] }
```
**File:** data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json (L337-340)
```json
    "recurrence": [
      { "math": [ "jmath_biokinesis_learning_eocs_modifiers(global_tier_two_power_learning_time_low)" ] },
      { "math": [ "jmath_biokinesis_learning_eocs_modifiers(global_tier_two_power_learning_time_high)" ] }
    ],
```
**File:** data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json (L344-344)
```json
        { "math": [ "u_vitamin('vitamin_psi_learning_counter') == 1" ] },
```
**File:** data/mods/MindOverMatter/powers/clairsentience_eoc.json (L12-14)
```json
          "math": [
            "rng( ( ( (u_discern_weakness_clear_power_level * 1.5) + 13.5) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling),( ( (u_discern_weakness_clear_power_level * 2.5) + 30) * u_discern_weakness_clear_intelligence * u_nether_attunement_discern_weakness_scaling) )"
          ]
```
**File:** data/mods/MindOverMatter/powers/electrokinesis_concentration_eocs.json (L14-16)
```json
            "math": [
              "( ( (u_spell_level('electrokinetic_see_electric') + u_spell_level('electrokinetic_see_electric_knack') ) * 150) + 900) * (scaling_factor(u_val('intelligence') ) ) * u_nether_attunement_power_scaling"
            ]
```
**File:** data/mods/MindOverMatter/powers/electrokinesis_concentration_eocs.json (L103-109)
```json
    "id": "EOC_ELECTROKIN_ZAP_ENEMIES_DRAIN",
    "condition": { "u_has_effect": "effect_electrokin_zap_enemies" },
    "effect": [
      { "math": [ "u_latest_channeled_power_difficulty = 2" ] },
      { "run_eocs": [ "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_2", "EOC_PSI_MAINTENANCE_CALORIE_COST_CALCULATOR" ] },
      { "math": [ "u_spell_exp('electrokinetic_zap_enemies') += psionic_power_experience_formula()" ] },
      { "run_eocs": "EOC_POWER_MAINTENANCE_CONCENTRATION_CHECK" },
```
**File:** data/mods/MindOverMatter/powers/learning_eocs/telekinesis.json (L331-367)
```json
    "condition": {
      "and": [
        { "u_has_trait": "TELEKINETIC" },
        { "math": [ "u_vitamin('vitamin_psi_learning_counter') == 1" ] },
        {
          "or": [
            { "test_eoc": "EOC_CONDITION_ODDS_OF_RANDOM_TIER_TWO_POWER_INSIGHT" },
            {
              "or": [
                {
                  "and": [
                    { "math": [ "u_spell_level('telekinetic_pull') >= 8" ] },
                    { "math": [ "u_spell_level('telekinetic_slowfall') >= 8" ] }
                  ]
                },
                { "math": [ "u_spell_level('telekinetic_strength') >= 10" ] },
                { "math": [ "u_spell_level(' telekinetic_lifting_field') >= 12" ] }
              ]
            }
          ]
        },
        { "test_eoc": "EOC_PSI_LEARNING_BANNED_EFFECTS" },
        { "math": [ "u_spell_level('telekinetic_vehicle_lift') <= 0" ] },
        { "not": { "u_know_recipe": "practice_telekinetic_vehicle_lift" } }
      ]
    },
    "deactivate_condition": {
      "or": [ { "not": { "u_has_trait": "TELEKINETIC" } }, { "math": [ "u_spell_level('telekinetic_vehicle_lift') >= 1" ] } ]
    },
    "effect": [
      { "math": [ "u_vitamin('vitamin_psi_learning_counter') = 0" ] },
      { "u_learn_recipe": "practice_telekinetic_vehicle_lift" },
      {
        "u_message": "Use of your powers has led to an insight.  Rather than smashing objects with your telekinetic strength, you could apply it to lifting a car, allowing you to work on the undercarriage without a jack, if you can figure out the proper technique.",
        "popup": true
      }
    ]
```
## Q7
what is your opinion on these approaches. I.e. the more 1:1 data approach or the OO-approach? With respect to the use case of EOC
### Answer
You're asking for my opinion on the **1:1 data approach** (pure Python dicts/lists) versus the **OO fluent API approach** for writing EOC definitions, specifically in the context of the Effect on Condition framework.<cite/>

## My Opinion

For the EOC use case, **the 1:1 data approach is superior**. Here's why:

### Advantages of 1:1 Data Approach

**1. Mental Model Alignment**

The pure dict/list approach maps directly to the JSON structure that the game engine expects Cataclysm-DDA:29-41 . When debugging or referencing documentation Cataclysm-DDA:1-120 , you can copy-paste examples directly without mental translation. The MindOverMatter examples I showed demonstrate this perfectly—the Python structure is nearly identical to the JSON output.<cite/>

**2. Flexibility Without Abstraction Overhead**

Complex EOCs like the werewolf regeneration system Cataclysm-DDA:57-90  or vampire blood mechanics Cataclysm-DDA:212-240  use deeply nested structures with conditional logic. The 1:1 approach handles arbitrary nesting naturally—you just write the dict. With OO, you'd need to add methods for every possible nesting pattern.<cite/>

**3. Easier Maintenance**

When the EOC spec changes (new fields, new effect types), the 1:1 approach requires zero code changes—just use the new fields. The OO approach requires updating class methods, which creates maintenance burden. Given that EOC is actively evolving Cataclysm-DDA:1621-1680 , this matters.<cite/>

**4. Python's Native Strengths**

The 1:1 approach leverages Python's best features for this use case:
- **Multiline strings** for readable messages (as shown in the MindOverMatter examples)
- **Variable reuse** for constants (`TIER_ONE_LOW`, `PSI_LEARNING_COUNTER_CHECK`)
- **Helper functions** for repeated patterns (`jmath_recurrence()`)
- **Dict/list comprehensions** for generating repetitive structures
- **Comments** inline with the data structure

These are more valuable than method chaining for EOC authoring.<cite/>

### Where OO Falls Short

**1. Incomplete Abstraction**

The fluent API I provided covers common cases, but EOCs support hundreds of effects Cataclysm-DDA:2551-2670  and conditions Cataclysm-DDA:751-810 . You'd need dozens of methods to cover everything, and you'd still fall back to raw dicts for edge cases. This creates an inconsistent authoring experience.<cite/>

**2. Cognitive Overhead**

With OO, you need to remember method names, parameter orders, and which class has which method. With 1:1, you just reference the EOC documentation Cataclysm-DDA:1231-1320  and write the structure directly. The documentation *is* your API reference.<cite/>

**3. Debugging Difficulty**

When an EOC doesn't work, you need to see the generated JSON. With 1:1, `json.dumps()` shows exactly what you wrote. With OO, you need to trace through method calls to understand what was generated, adding a layer of indirection.<cite/>

### Practical Recommendation

Use the **1:1 data approach** with these patterns:

```python
# Constants for reuse
COMMON_CONDITIONS = {
    "has_trait_and_effect": {
        "and": [
            {"u_has_trait": "SOME_TRAIT"},
            {"u_has_effect": "some_effect"}
        ]
    }
}

# Helper functions for complex patterns
def create_learning_eoc(power_type: str, tier: int, recipe: str):
    return {
        "type": "effect_on_condition",
        "id": f"EOC_{power_type.upper()}_LEARNING_{recipe.upper()}",
        "recurrence": [
            jmath_recurrence(power_type, f"tier_{tier}_low"),
            jmath_recurrence(power_type, f"tier_{tier}_high")
        ],
        # ... rest of structure
    }

# Use dict unpacking for composition
base_eoc = {"type": "effect_on_condition", "id": "EOC_BASE"}
specialized_eoc = {**base_eoc, "condition": {"u_has_trait": "SPECIAL"}}
```

This gives you the benefits of abstraction (reusable patterns) without losing the directness of the 1:1 mapping.<cite/>

## Notes

The OO approach has value for *generating* EOCs programmatically (e.g., creating 100 similar EOCs with slight variations), but for *authoring* individual EOCs, the 1:1 approach is more ergonomic. The MindOverMatter mod's extensive use of jmath Cataclysm-DDA:334-390  and complex nested conditions demonstrates that real-world EOCs are too varied for a fluent API to handle elegantly.<cite/>

Wiki pages you might want to explore:
- [Mutations and Traits (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#3.2)
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)
### Citations
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1-120)
```markdown

# Effect On Condition

An effect_on_condition is an object allowing the combination of dialog conditions and effects with their usage outside of a dialog.  When invoked, they will test their condition; on a pass, they will cause their effect. They can be activated automatically with any given frequency.  (Note: effect_on_conditions use the npc dialog conditions and effects syntax, which allows checking related to, or targeting an effect at, an npc (for example: `npc_has_trait`).  Using these commands in an effect_on_condition is not supported.)

## Contents

- [Effect On Condition](#effect-on-condition)
  - [Fields](#fields)
  - [Alpha and Beta Talkers](#alpha-and-beta-talkers)
  - [Value types](#value-types)
  - [Variable Object](#variable-object)
  - [Examples:](#examples)
- [Condition:](#condition)
  - [Boolean logic](#boolean-logic)
  - [Possible conditions](#possible-conditions)
- [Reusable EOCs:](#reusable-eocs)
- [EVENT EOCs:](#event-eocs)
  - [Event Context Vars:](#event-context-vars)
  - [Event EOC Types:](#event-eoc-types)
  - [Context Variables For Other EOCs](#context-variables-for-other-eocs)
- [Effects](#effects)
  - [General](#general)
  - [Character effects](#character-effects)
  - [Item effects](#item-effects)
  - [Map effects](#map-effects)
  - [Map Updates](#map-updates)

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

 ### EOC types

`EOC_TYPE` can be any of:

* `ACTIVATION` - activated manually.
* `RECURRING` - activated automatically on schedule (see `recurrence`)
* `AVATAR_DEATH` - automatically invoked whenever the current avatar dies (it will be run with the avatar as `u`), if after it the player is no longer dead they will not die, if there are multiple EOCs they all be run until the player is not dead.
* `NPC_DEATH` - EOCs can only be assigned to run on the death of an npc, in which case u will be the dying npc and npc will be the killer. If after it npc is no longer dead they will not die, if there are multiple they all be run until npc is not dead.
* `PREVENT_DEATH` - whenever the current avatar dies it will be run with the avatar as `u`, if after it the player is no longer dead they will not die, if there are multiple they all be run until the player is not dead.
* `EVENT` - EOCs trigger when a specific event given by "required_event" takes place. 

## Alpha and Beta Talkers

Talker, in context of effect on condition, is any entity, that can use specific effect or be checked against specific condition. Some effects and conditions don't have talker whatsoever, so any entity can use it (like `mapgen_update` effect can be used no matter is it used by player, NPC, monster or item), other has only one talker (aka alpha talker, aka `u_`) - the entity that call the effect or check (like `u_know_recipe` or `u_has_mission`), and the third has two talkers - alpha and beta (aka `u_` and `npc_`), which allow to check both you and your interlocutor (or enemy, depending on context)

For example, `{ "npc_has_effect": "Shadow_Reveal" }`, used by shadow lieutenant, check the player as beta talker, despite the id imply it should be `npc_`; This is a legacy of dialogue system, from which EoC was extended, and won't be fixed, since dialogues still use it fully

### Typical Alpha and Beta Talkers by cases

| EOC                                              | Alpha (possible types)      | Beta (possible types)       | variables sent              |
| ------------------------------------------------ | ----------------------      | --------------------------- | --------------------------- |
| Talk with NPC                                    | player (Avatar)             | NPC (NPC)                   |                             |
| Talk with monster                                | player (Avatar)             | monster (monster)           |
| Use computer                                     | player (Avatar)             | computer (Furniture)        |
| furniture: "examine_action"                      | player (Avatar)             | NONE                        | `this`, string, furniture id; `pos`; string, coordinates of the furniture
| furniture: "mortar"                              | player (Avatar)             | NONE                        | `this`, string, furniture id; `pos`; string, coordinates of the furniture; `target`, string, coordinates of picked tile
| spell: "effect": "effect_on_condition"           | target (Character, Monster) | spell caster (Character, Monster) | `spell_location`, location variable, location of target for use primarily when the target isn't a creature
| spell: "description"                             | avatar                      | avatar                      | Used for tags
| trap: "action": "eocs"                           | triggerer (Creature, item not supported yet) | NONE | `trap_location`, location variable, location of the trap to use primarily with ranged traps
| monster_attack: "eoc"                            | attacker ( Monster)         | victim (Creature)           | `damage`, int, damage dealt by attack
| use_action: "type": "effect_on_conditions"       | user (Character)            | item (item)                 | `id`, string, stores item id
| tick_action: "type": "effect_on_conditions"      | carrier (Character)         | item (item)                 |
| countdown_action: "type": "effect_on_conditions" | carrier (Character)         | item (item)                 |
| COMESTIBLE: "consumption_effect_on_conditions"   | user (Character)            | item (item)                 |
| activity_type: "completion_eoc"                  | character (Character)       | NONE                        |
| activity_type: "do_turn_eoc"                     | character (Character)       | NONE                        |
| addiction_type: "effect_on_condition"            | character (Character)       | NONE                        |
| bionics: "activated_eocs"                        | character (Character)       | NONE                        | `act_cost`, int, cost of activation of item
| bionics: "deactivated_eocs"                      | character (Character)       | NONE                        |
| bionics: "processed_eocs"                        | character (Character)       | NONE                        |
| mutation: "activated_eocs"                       | character (Character)       | NONE                        |
| mutation: "deactivated_eocs"                     | character (Character)       | NONE                        |
| mutation: "processed_eocs"                       | character (Character)       | NONE                        |
| recipe: "result_eocs"                            | crafter (Character)         | NONE                        |
| monster weakpoint: "effect_on_conditions"        | attacker (Creature, if exists, otherwise NONE) | victim (Creature) | note that if weakpoint was hit without attacker, EoC would be built without alpha talker, so using EoC referencing `u_` would result in error. Use `has_alpha` condition before manipulating alpha talker
| monster death: "death_function"                  | killer (Creature, if exists, otherwise NONE)| victim (Creature) | Note that if monster was killed without a killer (falling anvil, explosion of a bomb etc), EoC would be built without alpha talker, so using EoC referencing `u_` would result in error. Use `has_alpha` condition before manipulating alpha talker
| ammo_effect: "eoc"                               | shooter (Creature)          | victim (if exist, otherwise NONE) (Creature) | `proj_damage`, int, amount of damage projectile dealt. Detonation via SPECIAL_COOKOFF ammo effect return `proj_damage` as 1. Note that if projectile miss the target, EoC would be built without beta talker, so using EoC referencing `npc_` or `n_` would result in error. Use `has_beta` condition before manipulating npc

Some actions sent additional context variables, that can be used in EoC, in format:

```jsonc
{ "compare_string": [ "bio_uncanny_dodge", { "context_val": "id" } ] }
```

```jsonc
{ "math": [ "_act_cost == 2000" ] }
```

## Value types

Effect on Condition uses a huge variety of different values for effects or for conditions to check against, so to standardize it, most of them are explained here

| name | description | example |
| --- | --- | --- |
| simple string | technically lack of any type - you just write a sting, and effect is called or check is performed: "barber_beard", "u_female", "u_is_deaf" | N/A |
| int | simple number. Decimals also allowed most of the time | `0`, `10`, `-55`, `987`, `0.1`, `0.5`, `-0.00001`, `9.87654321` |
| string | anything within of quotation marks `"`, usually id's or plain text:  | `"mon_zombie"`, `"fd_blood"`, `"just generic text i want to print in message"` |
| boolean | just boolean | `true`, `false` |
| duration | string, that contain number and unit of time, that the game code transform into seconds and put into the game. It is possible to use int instead of duration, but it is recommended to use duration for the readability sake. Possible values are `s`/`seconds`, `m`/`minutes`, `h`/`hours`, `d`/`days` | `1`, `"1 s"`, `"1 seconds"`, `"60 minutes"`, `3600`, `"99 minutes"`, `"2 d"`, `"365 days"`   |
| value between two | not a separate format, it means the field can accept two values simultaneously, and pick a random between this two; only values, that uses int can utilize it (int, duration or variable object usually) | `[ 1, 10 ]`,</br>`[ "30 seconds", "50 seconds" ]`,</br>`[ -1, 1 ]`,</br>`[ { "global_val": "small_variable" }, { "global_val": "big_variable" } ]`,</br>`[ { "global_val": "small_variable" }, 100 ]` |
| array | not a separate format, it means the field can accept multiple values, and the game either will pick one random between them, or apply all of them simultaneously | `[ "Somewhere", "Nowhere", "Everywhere", "Yesterday", "Tomorrow" ]`  |
| variable object | any [variable object](#variable-object); can be int, time or string, stored in said variable, or math syntax | `{ "global_val": "some_value" }`,</br>`{ "u_val": "some_personal_value" }`,</br>`{ "math": [ "some_value * 5 + 1" ] }` |
| location variable | not a separate format, just any [variable object](#variable-object) that store location coordinates, usually obtained by using `u_location_variable` / `npc_location_variable`  | `{ "global_val": "some_location" }`,</br>`{ "u_val": "some_location_i_know" }` |

There is some amount of another types, that are not explained here, like "search_data" or "fake_spell", but since this one are rarely reused, they are described in the effects that utilize them

## Variable Object

```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L751-810)
```markdown
  {
    "type": "effect_on_condition",
    "id": "EOC_TEST",
    "condition": {
      "u_has_items_sum": [
        { "item": "blanket", "amount": 10 },
        { "item": "blanket_fur", "amount": 15 },
        { "item": "electric_blanket", "amount": 20 }
      ]
    },
    "effect": [ { "u_message": "true" } ],
    "false_effect": [ { "u_message": "false" } ]
  },
```

Variables are also supported
```jsonc
  {
    "type": "effect_on_condition",
    "id": "EOC_TEST",
    "condition": {
      "u_has_items_sum": [
        { "item": { "global_val": "foo" }, "amount": { "math": "20 + 2" } },
        { "item": "blanket_fur", "amount": 15 },
        { "item": "electric_blanket", "amount": 20 }
      ]
    },
    "effect": [ { "u_message": "true" } ],
    "false_effect": [ { "u_message": "false" } ]
  },
```

### `u_has_bionics`, `npc_has_bionics`
- type: string or [variable object](#variable-object)
- return true if alpha or beta talker has specific bionic; `ANY` can be used to return true if any bionic is presented

#### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- |
| ✔️ | ✔️ | ✔️ | ❌ | ❌ | ❌ | ❌ |

#### Examples
check do you have `bio_synlungs`
```jsonc
{ "u_has_bionics": "bio_synlungs" }
```

check do you have any bionic presented
```jsonc
{ "u_has_bionics": "ANY" }
```

### `u_has_effect`, `npc_has_effect`, `u_has_any_effect`, `npc_has_any_effect`
- type: string or [variable object](#variable-object)
- return true if alpha or beta talker has specific effect applied. `_has_effect` checks only one effect, when `_has_any_effect` check a range, and return true if at least one effect is applied;
- `intensity` can be used to check an effect of specific intensity;
- `bodypart` can be used to check effect applied on specific body part
- martial arts `static_buffs` can be checked in form `mabuff:buff_id`

```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1231-1320)
```markdown
```jsonc
{
  "type": "effect_on_condition",
  "id": "EOC_ter_furn_check",
  "effect": [
      { "set_string_var": { "mutator": "u_loc_relative", "target": "(0,-1,0)" }, "target_var": { "context_val": "loc" } },
      {
        "if": { "map_terrain_with_flag": "TRANSPARENT", "loc": { "context_val": "loc" } },
        "then": { "u_message": "North terrain: TRANSPARENT" },
        "else": { "u_message": "North terrain: Not TRANSPARENT" }
      },
      {
        "if": { "map_furniture_with_flag": "TRANSPARENT", "loc": { "context_val": "loc" } },
        "then": { "u_message": "North furniture: TRANSPARENT" },
        "else": { "u_message": "North furniture: Not TRANSPARENT" }
      }
  ]
},
```

### `map_terrain_id`, `map_furniture_id`, `map_field_id`
- type: string or [variable object](#variable-object)
- return true if the terrain, furniture or field has specific id
- `loc` will specify location of terrain or furniture (**mandatory**)

#### Valid talkers:

No talker is needed.

#### Examples
Runs a query, allowing you to pick specific tile around. When picked, stores coordinates of this tile in `check_terrain` variable, and then check is it a `t_grass`. If yes, `effect` is run, otherwise `false_effect` is run
```jsonc
{
  "type": "effect_on_condition",
  "id": "EOC_TEST_QUERY",
  "condition": {
    "and": [
      {
        "u_choose_adjacent_highlight": { "context_val": "check_terrain" },
        "message": "Select a tile"
      },
      { "map_terrain_id": "t_grass", "loc": { "context_val": "check_terrain" } }
    ]
  },
  "effect": [ { "u_message": "it is a grass" } ],
  "false_effect": [ { "u_message": "it is NOT a grass" } ]
}
```

### `map_in_city`
- type: location string or [variable object](#variable-object)
- return true if the location is in the bounds of a city at or above z-1

### `map_is_outside`
- type: location string or [variable object](#variable-object)
- return true if the location is outside. Currently always returns false if the location is outside the reality bubble.

#### Valid talkers:

No talker is needed.

#### Examples
Check the location is in a city.
```jsonc
{ "u_location_variable": { "context_val": "loc" } },
{
  "if": { "map_in_city": { "context_val": "loc" } },
  "then": { "u_message": "Inside city" },
  "else": { "u_message": "Outside city" }
},
```

Each time the avatar enters an OMT display a message as to whether or not they're in a city.
```jsonc
  {
    "type": "effect_on_condition",
    "id": "EOC_TEST_IS_IN_CITY",
    "eoc_type": "EVENT",
    "required_event": "avatar_enters_omt",
    "effect": [
      { "u_location_variable": { "context_val": "loc" } },
      {
        "if": { "map_in_city": { "context_val": "loc" } },
        "then": { "u_message": "You are in a city OMT.", "type": "good" },
        "else": { "u_message": "You are NOT in a city OMT.", "type": "bad" }
      }
    ]
  },
```

```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L1621-1680)
```markdown
#### Examples
Check whether the eoc `test_condition` would use its true or false effect 
```jsonc
{ "test_eoc": "test_condition" }
```

# Reusable EOCs:
The code base supports the use of reusable EOCs, you can use these to get guaranteed effects by passing in specific variables. The codebase supports the following:

| EOC Name | Description | Variables |
| --------------------- | --------- | ----------- |
| EOC_RandEnc | Spawns a random encounter at the specified `omt` with mapgen update `map_update` that is later removed with `map_removal`. It has a 1 in `chance` chance of happening and can only occur after `days_till_spawn`. Can optionally only happen if `random_enc_condition` is true | `map_update`: a mapgen update ID <br/> `omt`: overmap tile ID where this happens <br/> `map_removal`: a mapgen update ID <br/> `chance`: an integer <br/> `days_till_spawn`: an integer <br/> `random_enc_condition`: a set condition |

# EVENT EOCs:
EVENT EOCs trigger on in game events specified in the event_type enum in `event.h`. When an EVENT EOC triggers it tries to perform the EOC on the NPC that is the focus of the event and if it cannot determine one, triggers on the avatar. So any cata_event that has a field for "avatar_id", "character", "attacker", "killer", "npc" will potentially resolve to another npc rather than the avatar, based on who the event triggers for.

## Event Context Vars:
Every event EOC passes context vars with each of their key value pairs that the event has in C++.  They are all converted to strings when made context variables but their original types are included for reference below.  At some point this documentation may go out of sync, The up to date info for each event can be found in event.h

## Event EOC Types:

| EVENT              | Description | Context Variables | Talker(alpha/beta) |
| ------------------ | ----------- | ----------------- | ------------------ |
| activates_artifact | Triggers when the player activates an artifact | { "character", `character_id` },<br/> { "item_name", `string` }, | character / NONE |
| activates_mininuke | Triggers when any character arms a mininuke | { "character", `character_id` } | character / NONE |
| administers_mutagen |  | { "character", `character_id` },<br/> { "technique", `mutagen_technique` }, | character / NONE |
| angers_amigara_horrors | Triggers when amigara horrors are spawned as part of a mine finale | NONE | avatar / NONE |
| avatar_enters_omt | Triggers when player crosses the overmap boundary, including when player spawns | { "pos", `tripoint` },<br/> { "oter_id", `oter_id` }, | avatar / NONE |
| avatar_moves |  | { "mount", `mtype_id` },<br/> { "terrain", `ter_id` },<br/> { "movement_mode", `move_mode_id` },<br/> { "underwater", `bool` },<br/> { "z", `int` }, | avatar / NONE |
| avatar_dies |  | NONE | avatar / NONE |
| awakes_dark_wyrms | Triggers when `pedestal_wyrm` examine action is used | NONE | avatar / NONE |
| becomes_wanted | Triggered when copbots/riot bots are spawned as part of a timed event after mon/char is photo'd by eyebot | { "character", `character_id` } | character / NONE |
| broken_bone | Triggered when any body part reaches 0 hp | { "character", `character_id` },<br/> { "part", `body_part` }, | character / NONE |
| broken_bone_mends | Triggered when `mending` effect is removed by expiry (Character::mend) | { "character", `character_id` },<br/> { "part", `body_part` }, | character / NONE |
| buries_corpse | Triggers when item with flag CORPSE is located on same tile as construction with post-special `done_grave` is completed | { "character", `character_id` },<br/> { "corpse_type", `mtype_id` },<br/> { "corpse_name", `string` }, | character / NONE |
| camp_taken_over | Triggers any faction's camp is taken over | { "old_owner", `faction_id` }, <br/> { "new_Owner", `faction_id` }, <br/> { "camp_name", `string` }, <br/> { "was_violent", `bool` }, | avatar / NONE |
| causes_resonance_cascade | Triggers when resonance cascade option is activated via "old lab" finale's computer | NONE | avatar / NONE |
| character_butchered_corpse | Triggers after succesful butchering action. Possible values of butcher_type are `ACT_BLEED`, `ACT_BUTCHER`, `ACT_BUTCHER_FULL`, `ACT_FIELD_DRESS`, `ACT_SKIN`, `ACT_QUARTER`, `ACT_DISMEMBER`, `ACT_DISSECT` | { "character", `character_id` }, { "monster_id", `mtype_id` }, { "butcher_type", `string` }, | character / NONE |
| character_casts_spell | Triggers when a character casts spells. When a spell with multiple effects is cast, the number of effects will be triggered | { "character", `character_id` },<br/> { "spell", `spell_id` },<br/> { "school", `trait_id` },<br/> { "difficulty", `int` },<br/> { "cost", `int` },<br/> { "cast_time", `int` },<br/> { "damage", `int` }, | character / NONE |
| character_consumes_item |  | { "character", `character_id` },<br/> { "itype", `itype_id` }, | character / NONE |
| character_dies |  | { "character", `character_id` }, | character / NONE |
| character_eats_item |  | { "character", `character_id` },<br/> { "itype", `itype_id` }, | character / NONE |
| character_finished_activity | Triggered when character finished or canceled activity | { "character", `character_id` },<br/> { "activity", `activity_id` },<br/> { "canceled", `bool` } | character / NONE |
| character_forgets_spell |  | { "character", `character_id` },<br/> { "spell", `spell_id` } | character / NONE |
| character_gains_effect |  | { "character", `character_id` },<br/> { "effect", `efftype_id` },<br/> { "bodypart", `bodypart_id` }, { "intensity", `int` }</br> | character / NONE |
| character_gets_headshot |  | { "character", `character_id` } | character / NONE |
| character_heals_damage |  | { "character", `character_id` },<br/> { "damage", `int` }, | character / NONE |
| character_kills_character |  | { "killer", `character_id` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character / NONE |
| character_kills_monster |  | { "killer", `character_id` },<br/> { "victim_type", `mtype_id` },<br/> { "exp", `int` }, | character / monster |
| character_learns_spell |  | { "character", `character_id` },<br/> { "spell", `spell_id` } | character / NONE |
| character_loses_effect |  | { "character", `character_id` },<br/> { "effect", `efftype_id` },<br/> { "bodypart", `bodypart_id` } | character / NONE |
| character_melee_attacks_character |  | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "hits", `bool` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character (attacker) / character (victim) |
| character_melee_attacks_monster | | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "hits", `bool` },<br/> { "victim_type", `mtype_id` },| character / monster |
| character_radioactively_mutates | triggered when a character mutates due to being irradiated | { "character", `character_id` }, | character / NONE |
| character_ranged_attacks_character | |  { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "ammo", `itype_id` },<br/> { "is_throw", `bool` },<br/> { "victim", `character_id` },<br/> { "victim_name", `string` }, | character (attacker) / character (victim) |
| character_ranged_attacks_monster | | { "attacker", `character_id` },<br/> { "weapon", `itype_id` },<br/> { "ammo", `itype_id` },<br/> { "is_throw", `bool` },<br/>  { "victim_type", `mtype_id` }, | character / monster |
| character_smashes_tile | | { "character", `character_id` },<br/> { "terrain", `ter_str_id` },  { "furniture", `furn_str_id` }, | character / NONE |
| character_starts_activity | Triggered when character starts or resumes activity | { "character", `character_id` },<br/> { "activity", `activity_id` },<br/> { "resume", `bool` } | character / NONE |
| character_takeoff_item | triggers when character removes a worn item. If using `run_inv_eocs`, remember that the event fires before the items are actually removed | { "character", `character_id` },<br/> { "itype", `itype_id` } |
| character_takes_damage | triggers when character gets any damage from any creature | { "character", `character_id` },<br/> { "damage", `int` },<br/> { "bodypart", `bodypart_id` },<br/> { "pain", `int` }, | character / attacker if exists, otherwise NONE(character or monster) | use `has_beta` conditon before interacting with beta talker
```
**File:** doc/JSON/EFFECT_ON_CONDITION.md (L2551-2670)
```markdown
```
Pick a wooden item with `DURABLE_MELEE` and `ALWAYS_TWOHAND` flags, and run `EOC_DO_SOMETHING_WITH_ITEM` on it; if there is no such item, `EOC_NO_SUCH_ITEM` is run
```jsonc
{
  "type": "effect_on_condition",
  "id": "EOC_PICK_WOODEN_ITEM",
  "effect": [
    {
      "u_run_inv_eocs": "manual",
      "search_data": [ { "material": "wood", "flags": [ "DURABLE_MELEE", "ALWAYS_TWOHAND" ] } ],
      "true_eocs": [ "EOC_DO_SOMETHING_WITH_ITEM" ],
      "false_eocs": [ { "id": "EOC_NO_SUCH_ITEM", "effect": [ { "u_message": "You don't have an item i need" } ] } ]
    }
  ]
}
```
Pick all items with `RECHARGE` _or_ `ELECTRONIC` flags, and run `EOC_PRINT_ITEM_CHARGE` on them.
```jsonc
{
  "type": "effect_on_condition",
  "id": "eoc_print_inv_power",
  "effect": [
    {
      "u_run_inv_eocs": "all",
      "search_data": [ { "flags": [ "RECHARGE" ] }, { "flags": [ "ELECTRONIC" ] } ],
      "true_eocs": [ "EOC_PRINT_ITEM_CHARGE" ]
    }
  ]
}
```

#### `u_map_run_eocs`, `npc_map_run_eocs`
Picks all tiles around you, npc or target_var, stores it's coordinates in `store_coordinates_in`, and then checks EoC conditions for each tile picked
Used if you need to check if specific furniture or terrain is around

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "u_map_run_eocs", "npc_map_run_eocs" | **mandatory** | string, [variable object](#variable-object) or array | EoC or EoCs that would be run |
| "store_coordinates_in" | optional | [variable object](#variable-object) | variable, where tested coordinate is stored | 
| "condition" | optional | condition | condition that would be checked if eoc need to be run or not. Can (and intended to) use variable from `store_coordinates_in`. Default true (run always) | 
| "target_var" | optional | [variable object](#variable-object) | location variable, around which the game should scan; if omitted, sticks to `u_` or `npc_` position | 
| "range" | optional | int or [variable object](#variable-object) | how big the search radius should be; default 1 ( 3x3 square with character in the middle ) | 
| stop_at_first | optional | bool | If true, stops execution after the first `condition` is met; if false, runs EoC on all tiles that met condition. Default false | 

##### Examples

Picks range of 6 tiles around the player, and check is there any terrain with `TREE` flag
```jsonc
{
  "type": "effect_on_condition",
  "id": "SOME_TEST_EOC",
  "effect": [
    {
      "u_map_run_eocs": [ "SOME_ANOTHER_TEST_EOC" ],
      "range": 6,
      "store_coordinates_in": { "context_val": "loc" },
      "condition": { "map_terrain_with_flag": "TREE", "loc": { "context_val": "loc" } }
    }
  ]
},
{
  "type": "effect_on_condition",
  "id": "SOME_ANOTHER_TEST_EOC",
  "effect": [ { "u_message": "tripoint <context_val:loc> contains TREE" } ]
}
```

Picks all TREEs in 50 tiles range, and burn it
```jsonc
  {
    "type": "effect_on_condition",
    "id": "QWERTY",
    "effect": [
      {
        "u_map_run_eocs": [ "QWERTYYUIOP" ],
        "range": 50,
        "store_coordinates_in": { "context_val": "loc" },
        "stop_at_first": false,
        "condition": { "map_terrain_with_flag": "TREE", "loc": { "context_val": "loc" } }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "QWERTYYUIOP",
    "effect": [
      { "u_set_field": "fd_fire", "radius": 0, "intensity": 10, "target_var": { "context_val": "loc" } }
    ]
  }
```

#### `u_map_run_item_eocs`, `npc_map_run_item_eocs`
Search items around you on the map, and run EoC on them

| Syntax | Optionality | Value  | Info |
| --- | --- | --- | --- | 
| "u_map_run_item_eocs", "npc_map_run_item_eocs" | **mandatory** | string or [variable object](#variable-object) | way the item would be picked; <br/>values can be:<br/>`all` - all items that match the conditions are picked;<br/> `random` - from all items that match the conditions, one picked;<br/>`manual` - menu is open with all items that can be picked, and you can choose one;<br/>`manual_mult` - same as `manual`, but multiple items can be picked |
| "loc" | optional | location variable | location, where items would be scanned; lack of it would scan only tile the talker stands on | 
| "min_radius", "max_radius" | optional | int or [variable object](#variable-object) | radius around the location/talker that would be searched | 
| "title" | optional | string or [variable object](#variable-object) | name of the menu that would be shown, if `manual` or `manual_mult` values are used | 
| "search_data" | optional | `search_data` | sets the condition(s) for the target item; lack of search_data means any item can be picked; see [search_data](#search_data) for syntax | 
| "true_eocs", "false_eocs" | optional | string, [variable object](#variable-object), inline EoC, or range of all of them | if item was picked successfully, all EoCs from `true_eocs` are run, otherwise all EoCs from `false_eocs` are run; picked item is returned as npc | 

##### Valid talkers:

| Avatar | Character | NPC | Monster | Furniture | Item | Vehicle |
| ------ | --------- | --------- | ---- | ------- | --- | ---- |
| ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

##### Examples

Run `EOC_GOOD` on all items 5-10 tiles around you (but not tiles 1-4 tiles around you)
```jsonc
  {
    "type": "effect_on_condition",
    "id": "EOC_TEST",
    "effect": [
      {
        "u_map_run_item_eocs": "all",
        "min_radius": 5,
```
**File:** data/mods/Xedra_Evolved/mutations/werewolf_trait_eocs.json (L57-90)
```json
    "id": "EOC_WEREWOLF_SUPER_FAST_REGENERATION_activated",
    "effect": [
      { "if": { "math": [ "u_pain() >= 1" ] }, "then": { "math": [ "u_pain()--" ] } },
      { "if": { "math": [ "u_vitamin('redcells') < 0" ] }, "then": { "math": [ "u_vitamin('redcells') += 150" ] } },
      {
        "if": { "math": [ "u_vitamin('redcells') < -1000" ] },
        "then": { "math": [ "u_vitamin('redcells') += 500" ] }
      },
      {
        "if": { "math": [ "u_vitamin('redcells') < -10000" ] },
        "then": { "math": [ "u_vitamin('redcells') += 2500" ] }
      },
      { "if": { "math": [ "u_vitamin('blood') < 0" ] }, "then": { "math": [ "u_vitamin('blood') += 150" ] } },
      { "if": { "math": [ "u_vitamin('blood') < -1000" ] }, "then": { "math": [ "u_vitamin('blood') += 500" ] } },
      { "if": { "math": [ "u_vitamin('blood') < -10000" ] }, "then": { "math": [ "u_vitamin('blood') += 2500" ] } },
      {
        "if": {
          "or": [
            { "math": [ "u_hp('arm_l') < u_hp_max('arm_l')" ] },
            { "math": [ "u_hp('arm_r') < u_hp_max('arm_r')" ] },
            { "math": [ "u_hp('leg_l') < u_hp_max('leg_l')" ] },
            { "math": [ "u_hp('leg_r') < u_hp_max('leg_r')" ] },
            { "math": [ "u_hp('torso') < u_hp_max('torso')" ] },
            { "math": [ "u_hp('head') < u_hp_max('head')" ] }
          ]
        },
        "then": {
          "foreach": "array",
          "target": [ "arm_l", "arm_r", "leg_l", "leg_r", "torso", "head" ],
          "var": { "context_val": "id" },
          "effect": [
            {
              "if": { "math": [ "u_hp(_id) < u_hp_max(_id)" ] },
              "then": {
```
**File:** data/mods/Xedra_Evolved/npc/vampire_askblood.json (L212-240)
```json
    "type": "effect_on_condition",
    "id": "EOC_VAMPIRE_DRINK_FROM_HUMAN",
    "effect": [
      {
        "if": "has_beta",
        "then": { "if": { "npc_has_trait": "FAE_CREATURE" }, "then": { "math": [ "u_vampire_just_drank_fae_blood = 1" ] } }
      },
      { "run_eocs": [ "EOC_VAMPIRE_GAIN_BLOOD_VITAMIN", "EOC_DHAMPIR_GAIN_CALORIES_FROM_NON_BAGGED_BLOOD" ] }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_NPC_GOT_DRANK_FROM_FRIEND",
    "global": false,
    "effect": [
      { "npc_add_effect": "feed_from_recently", "duration": "5 d" },
      { "math": [ "n_vitamin('blood') -= 400 + rand(100)" ] },
      { "math": [ "n_vitamin('redcells') -= 400 + rand(100)" ] }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_NPC_GOT_DRANK_FROM_ALLY",
    "global": false,
    "effect": [
      { "npc_add_effect": "feed_from_recently", "duration": "10 d" },
      { "math": [ "n_vitamin('blood') -= 400 + rand(100)" ] },
      { "math": [ "n_vitamin('redcells') -= 400 + rand(100)" ] }
    ]
```
**File:** data/mods/Xedra_Evolved/eocs/inventor.json (L334-390)
```json
    "type": "effect_on_condition",
    "id": "EOC_INVENTOR_RESEARCH_DIMENSION_1",
    "condition": {
      "and": [
        { "math": [ "u_vitamin('creative_spark_research') >= base_difficulty_3" ] },
        { "math": [ "dimension_sparks >= dimension_difficulty_1" ] },
        { "test_eoc": "EOC_CONDITION_BANNED_DREAM_MAGIC_TRAITS" }
      ]
    },
    "effect": [
      { "math": [ "u_vitamin('creative_spark_research') -= base_difficulty_3" ] },
      { "math": [ "dimension_sparks += dimension_difficulty_1" ] },
      { "math": [ "base_difficulty_3 += 5" ] },
      { "math": [ "dimension_difficulty_1 += 5" ] },
      { "run_eocs": "EOC_INVENTOR_PROCESS_SPARKS" },
      {
        "u_roll_remainder": [
          "rip_ticket",
          "inventor_warp_grenade",
          "inventor_portal_closer",
          "teleporter_inventor",
          "xedra_inventor_time_pierce_tool",
          "xedra_inventor_damage_reversal_device"
        ],
        "type": "recipe",
        "true_eocs": [ "EOC_INVENTOR_MESSAGE_GOOD" ],
        "false_eocs": {
          "id": "EOC_REMOVE_RESEARCH_DIMENSION_1",
          "effect": [
            { "u_forget_recipe": "inventor_research_dimension_1" },
            {
              "u_message": "You reach the limit of what can be done at this level.  It is time to move forward.",
              "type": "info"
            }
          ]
        }
      }
    ],
    "false_effect": [
      { "u_message": "inventor_fail", "snippet": true, "type": "bad" },
      { "math": [ "u_vitamin('creative_spark_research') += 5" ] },
      { "math": [ "dimension_sparks += 4" ] }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_INVENTOR_PROCESS_SPARKS",
    "condition": {
      "and": [ { "math": [ "u_vitamin('creative_spark') > 0" ] }, { "test_eoc": "EOC_CONDITION_BANNED_DREAM_MAGIC_TRAITS" } ]
    },
    "effect": [
      {
        "math": [
          "u_vitamin('creative_spark_research')",
          "+=",
          "u_vitamin('creative_spark') * floor( (base_difficulty_1 + base_difficulty_2 + base_difficulty_3 + energy_difficulty_1 + energy_difficulty_2 + energy_difficulty_3 + AI_difficulty_1 + dimension_difficulty_1) / 8 )"
        ]
```
## Q8
do you have any other suggestion?
### Answer
You're asking if there are other approaches beyond the 1:1 data approach and OO fluent API for authoring EOC definitions.<cite/>

## Additional Suggestions

Yes, here are several other approaches worth considering:

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

This is particularly useful for the MindOverMatter mod's learning EOCs, which follow consistent patterns across different power types as seen in `data/mods/MindOverMatter/powers/learning_eocs/telepathy.json:1-33` Cataclysm-DDA:1-33  and `data/mods/MindOverMatter/powers/learning_eocs/biokinesis.json:334-373` Cataclysm-DDA:334-373 .

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

For repetitive patterns like the nested conditions in `data/mods/Xedra_Evolved/mutations/paraclesians/paraclesian_magic_terrain_adjustments.json:121-180` Cataclysm-DDA:121-180 , create reusable condition builders:<cite/>

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

This catches errors early without changing the authoring experience, similar to how the C++ code validates EOCs in `src/effect_on_condition.cpp:77-116` Cataclysm-DDA:77-116 .

### 5. Composition via Dict Merging

For complex EOCs like those in `data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json:181-240` Cataclysm-DDA:181-240 , use dict merging to compose from base patterns:<cite/>

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

Since jmath is heavily used (as in `data/mods/MindOverMatter/powers/clairsentience_eoc.json:1-18` Cataclysm-DDA:1-18 ), create helpers for common patterns:<cite/>

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

The key insight is that EOCs are too varied for a single abstraction to work well. The MindOverMatter mod alone has dozens of distinct patterns across `data/mods/MindOverMatter/powers/` Cataclysm-DDA:1-60 . A hybrid approach lets you use the right tool for each pattern—templates for common cases, raw dicts for unique ones, and helpers for gnarly jmath expressions.<cite/>

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
## Q9
suggest a comprehensive, reusable, robust and ergonomic python implementation based on our conversation thus far. I.e. we are going to go with the data 1:1 approach, but with dataclasses and validation.
### Answer
# Comprehensive Python Solution for Cataclysm: DDA EOC JSON Generation

Based on the EOC structure and examples, here's how to implement a robust Python solution:

## Core Architecture Overview

The solution should follow a layered architecture:

1. **Base Data Models (Dataclasses)**
2. **Condition Models**
3. **Effect Models** 
4. **Validation Layer**
5. **Serialization Layer**

## 1. Understanding the EOC Structure

The fundamental EOC structure includes these key fields: Cataclysm-DDA:29-42 

EOC types can be: Cataclysm-DDA:43-53 

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

Conditions use boolean logic and various checks: Cataclysm-DDA:225-290 

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

Example from MindOverMatter: Cataclysm-DDA:7-7 Cataclysm-DDA:17-35 

## 4. Implementing Effect Models

Effects have numerous types: Cataclysm-DDA:1764-1791 

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

Example from MindOverMatter showing complex effect chains: Cataclysm-DDA:14-23 

## 5. Variable Object Support

Variable objects are crucial for dynamic values: Cataclysm-DDA:119-197 

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

Based on MindOverMatter patterns: Cataclysm-DDA:8-30 

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
``` Cataclysm-DDA:2-12 

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

### Nested EOCs Support Cataclysm-DDA:2018-2056 

### Context Variables Cataclysm-DDA:2072-2113 

### EOC Chaining with time_in_future Cataclysm-DDA:49-49 

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
## Q10
i want to follow up on your suggestions on further improvements, but first i want you to suggest a comprehensive and thorough test suite for the code thus far. Use concrete examples from the code base, and specifically the mindovermatter mod and xedra_evolved
### Answer
# Concrete EOC Examples from MindOverMatter and Xedra_Evolved Mods

Based on my examination of the Cataclysm: DDA codebase, here are comprehensive examples suitable for a Python EOC generation tool test suite:

## 1. EVENT Type EOCs with Complex Conditions

**Spellcasting Event with Nested Conditions:** Cataclysm-DDA:22-76 

**Character Damage Tracking Event:** Cataclysm-DDA:374-384 

**Character Kills Monster Events:** Cataclysm-DDA:3-92 

## 2. Recurring EOCs with Time-Based Execution

**Periodic Adjustment with Recurrence:** Cataclysm-DDA:7-30 

**Variable Decreaser with Time Range:** Cataclysm-DDA:214-223 

## 3. Complex Math-Based Conditions with x_in_y_chance

**Probability with Complex jmath Expressions:** Cataclysm-DDA:370-398 

**Multi-Stage Probability Calculations:** Cataclysm-DDA:400-423 

## 4. Switch Statements with Multiple Cases

**Nether Attunement Power Scaling Switch:** Cataclysm-DDA:244-298 

## 5. Weighted List EOCs

**Random Effect Selection with Weights:** Cataclysm-DDA:332-369 

**Portal Storm Effects:** Cataclysm-DDA:2-40 

## 6. Inventory EOCs with u_run_inv_eocs

**Equipment Scanner with Multiple Search Criteria:** Cataclysm-DDA:159-191 

**Iron Intolerance with Material Search:** Cataclysm-DDA:100-194 

**Shapeshifting Armor Check:** Cataclysm-DDA:366-396 

## 7. Complex Variable Manipulation

**Dynamic Variable Saving with String Parsing:** Cataclysm-DDA:631-802 

**Dynamic Variable Loading:** Cataclysm-DDA:804-972 

## 8. Complex Nested Inline EOCs

**Multi-Level Nested Decision Tree:** Cataclysm-DDA:28-76 

**Shapeshifter Activity Check:** Cataclysm-DDA:3-108 

## 9. Foreach Loops

**Body Part Healing Loop:** Cataclysm-DDA:302-322 

**Spell Selection with Foreach:** Cataclysm-DDA:53-87 

## 10. Complex jmath Functions

**Psionic Power Success Formula (Multi-Function Chain):** Cataclysm-DDA:27-56 

**Concentration Calculations:** Cataclysm-DDA:139-156 

**Nether Attunement Influence:** Cataclysm-DDA:109-113 

## 11. Time-Based EOCs with Scheduling

**Meditation with Ongoing Checks:** Cataclysm-DDA:195-243 

**Recursive Time Loop:** Cataclysm-DDA:524-532 

## 12. PREVENT_DEATH EOC Type

**Death Prevention with State Restoration:** Cataclysm-DDA:600-610 

## 13. Activity-Based EOCs

**Activity Start and End Events:** Cataclysm-DDA:387-413 

## 14. Run_eoc_selector for User Choice

**Spell Selection Interface:** Cataclysm-DDA:133-154 

## 15. Complex Condition Logic with Material Checks

**Multi-Material Steel Check:** Cataclysm-DDA:196-312 

## Notes

These examples demonstrate the full range of EOC capabilities in Cataclysm: DDA:

- **EOC Types**: EVENT, recurring, PREVENT_DEATH, and standard conditional EOCs
- **Condition Complexity**: Nested and/or logic, math comparisons, probabilistic checks, string comparisons
- **Effect Types**: Variable manipulation, effect application, item spawning, teleportation, activity assignment
- **Advanced Features**: Dynamic variable names, inventory scanning, foreach loops, weighted lists, switch statements, run_eoc_selector
- **jmath Integration**: Complex mathematical formulas with multiple nested function calls
- **Time Management**: Scheduled EOCs, recursive calls with time_in_future, recurrence patterns

The MindOverMatter mod excels in complex mathematical formulas and probability-based effects, while Xedra_Evolved demonstrates advanced state management, time manipulation, and player choice mechanics. Together, they provide comprehensive coverage for testing an EOC generation tool.
### Citations
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L22-76)
```json
    "id": "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT",
    "eoc_type": "EVENT",
    "required_event": "spellcasting_finish",
    "condition": { "test_eoc": "EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST" },
    "effect": [
      { "math": [ "u_latest_channeled_power_difficulty = _difficulty" ] },
      {
        "run_eocs": [
          {
            "id": "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK",
            "condition": { "math": [ "u_vitamin('vitamin_psionic_drain') < 15" ] },
            "effect": [
              {
                "run_eocs": [
                  {
                    "id": "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER",
                    "condition": {
                      "x_in_y_chance": {
                        "x": {
                          "math": [
                            "(u_latest_channeled_power_difficulty * u_latest_channeled_power_difficulty) + (u_nether_conduit_repeated_channeling_value / 3) + (u_vitamin('vitamin_maintained_powers') * 3)"
                          ]
                        },
                        "y": 100
                      }
                    },
                    "effect": [ { "run_eocs": "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD" } ]
                  }
                ]
              }
            ],
            "false_effect": [
              {
                "run_eocs": [
                  {
                    "id": "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER",
                    "condition": {
                      "x_in_y_chance": {
                        "x": {
                          "math": [
                            "(u_latest_channeled_power_difficulty * u_latest_channeled_power_difficulty) + u_nether_conduit_repeated_channeling_value  + (u_vitamin('vitamin_maintained_powers') * 3)"
                          ]
                        },
                        "y": 100
                      }
                    },
                    "effect": [ { "run_eocs": "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD" } ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L214-223)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_NETHER_CONDUIT_VALUE_DECREASER",
    "recurrence": [ "3 seconds", "15 seconds" ],
    "global": true,
    "run_for_npcs": true,
    "condition": { "math": [ "u_nether_conduit_repeated_channeling_value > 0" ] },
    "effect": [ { "math": [ "u_nether_conduit_repeated_channeling_value -= 1" ] } ],
    "false_effect": [ { "math": [ "u_nether_conduit_repeated_channeling_value = 0" ] } ]
  },
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L244-298)
```json
    "type": "effect_on_condition",
    "id": "EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST",
    "eoc_type": "EVENT",
    "required_event": "opens_spellbook",
    "condition": { "not": { "u_has_effect": "effect_noetic_resilience" } },
    "effect": [
      {
        "run_eocs": [
          {
            "id": "EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST_2",
            "condition": { "not": { "u_has_trait": "PSI_TORRENTIAL_CHANNELING_active" } },
            "effect": {
              "switch": { "math": [ "u_vitamin('vitamin_psionic_drain')" ] },
              "cases": [
                { "case": 0, "effect": { "math": [ "u_nether_attunement_power_scaling = 0.75" ] } },
                { "case": 15, "effect": { "math": [ "u_nether_attunement_power_scaling = 1" ] } },
                { "case": 35, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.04" ] } },
                { "case": 55, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.08" ] } },
                { "case": 75, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.13" ] } },
                { "case": 95, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.19" ] } },
                { "case": 115, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.26" ] } },
                { "case": 135, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.35" ] } },
                { "case": 155, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.45" ] } },
                { "case": 175, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.60" ] } },
                { "case": 195, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.8" ] } },
                { "case": 215, "effect": { "math": [ "u_nether_attunement_power_scaling = 2.1" ] } },
                { "case": 235, "effect": { "math": [ "u_nether_attunement_power_scaling = 3" ] } },
                { "case": 245, "effect": { "math": [ "u_nether_attunement_power_scaling = 4" ] } }
              ]
            },
            "false_effect": {
              "switch": { "math": [ "u_vitamin('vitamin_psionic_drain')" ] },
              "cases": [
                { "case": 0, "effect": { "math": [ "u_nether_attunement_power_scaling = 1" ] } },
                { "case": 15, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.15" ] } },
                { "case": 35, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.3" ] } },
                { "case": 55, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.45" ] } },
                { "case": 75, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.6" ] } },
                { "case": 95, "effect": { "math": [ "u_nether_attunement_power_scaling = 1.8" ] } },
                { "case": 115, "effect": { "math": [ "u_nether_attunement_power_scaling = 2" ] } },
                { "case": 135, "effect": { "math": [ "u_nether_attunement_power_scaling = 2.25" ] } },
                { "case": 155, "effect": { "math": [ "u_nether_attunement_power_scaling = 2.6" ] } },
                { "case": 175, "effect": { "math": [ "u_nether_attunement_power_scaling = 3.0" ] } },
                { "case": 195, "effect": { "math": [ "u_nether_attunement_power_scaling = 3.5" ] } },
                { "case": 215, "effect": { "math": [ "u_nether_attunement_power_scaling = 4" ] } },
                { "case": 235, "effect": { "math": [ "u_nether_attunement_power_scaling = 4.8" ] } },
                { "case": 245, "effect": { "math": [ "u_nether_attunement_power_scaling = 6.5" ] } }
              ]
            }
          }
        ]
      }
    ],
    "false_effect": { "math": [ "u_nether_attunement_power_scaling = 1.05" ] }
  },
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L332-369)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES",
    "condition": { "math": [ "u_vitamin('vitamin_psionic_drain') >= 15" ] },
    "effect": {
      "weighted_list_eocs": [
        [ "EOC_DRAIN_EFFECT_CHECK_HEADACHE", 12 ],
        [ "EOC_DRAIN_EFFECT_CHECK_EXTRA_ATTUNEMENT", 9 ],
        [ "EOC_NETHER_EFFECT_CHECK_COLD_WIND", 6 ],
        [ "EOC_DRAIN_EFFECT_CHECK_HEALTH_CHANGE", 6 ],
        [ "EOC_NETHER_EFFECT_CHECK_VOMIT", 9 ],
        [ "EOC_DRAIN_EFFECT_CHECK_NOSEBLEED", 12 ],
        [ "EOC_DRAIN_EFFECT_CHECK_STAMINA_LOSS", 8 ],
        [ "EOC_DRAIN_EFFECT_CHECK_POWER_SURGE", 5 ],
        [ "EOC_DRAIN_EFFECT_CHECK_SLEEPINESS", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_ATTUNEMENT_RAISING_EFFECT", 9 ],
        [ "EOC_NETHER_EFFECT_CHECK_FEEDBACK", 9 ],
        [ "EOC_NETHER_EFFECT_CHECK_OBSERVED", 6 ],
        [ "EOC_NETHER_EFFECT_CHECK_TELEPORTATION_INCORPOREALITY", 4 ],
        [ "EOC_DRAIN_EFFECT_CHECK_TELEPORT_LOCK", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_BIOKIN_METABOLIC_INVERSION", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_ELECTROKINETIC_POWER_DRAIN", 5 ],
        [ "EOC_DRAIN_EFFECT_CHECK_WEAKNESS", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_EXTRA_KCAL", 6 ],
        [ "EOC_NETHER_EFFECT_CHECK_ATTENUATION", 8 ],
        [ "EOC_NETHER_EFFECT_CHECK_BREATHING", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_FORCE_WAVE", 5 ],
        [ "EOC_NETHER_EFFECT_CHECK_TELEPORT_MISJUMP", 4 ],
        [ "EOC_NETHER_EFFECT_CHECK_PHOTOKIN_EMP", 3 ],
        [ "EOC_NETHER_EFFECT_CHECK_NETHER_LIGHTNING", 3 ],
        [ "EOC_NETHER_EFFECT_CHECK_TEMPORARY_TEAR_IN_REALITY", 2 ],
        [ "EOC_NETHER_EFFECT_CHECK_NO_PSIONICS", 3 ],
        [ "EOC_NETHER_EFFECT_CHECK_SUMMON_HOUNDS", 2 ],
        [ "EOC_NETHER_EFFECT_CHECK_MUTATION", 2 ],
        [ "EOC_NETHER_EFFECT_CHECK_RIFT", 1 ]
      ]
    }
  },
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L370-398)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_DRAIN_EFFECT_CHECK_HEADACHE",
    "//": "Base is 0.5% chance from 15 attunement to 60 attunement, then scaling up 0.1% per attunement up to 10.5% chance at 160 attunement, then scaling up 0.25% chance per attunement up to 33% chance at max, plus 1/10th the Difficulty squared.",
    "condition": { "math": [ "u_vitamin('vitamin_psionic_drain') >= 15" ] },
    "effect": [
      {
        "if": {
          "x_in_y_chance": {
            "x": {
              "math": [
                "( clamp( (u_vitamin('vitamin_psionic_drain') - 60), 0, 100) + clamp( ( (u_vitamin('vitamin_psionic_drain') - 160) * 2.5 ), 0, 375) + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 5)"
              ]
            },
            "y": 1000
          }
        },
        "then": [
          { "u_message": "Your head begins to throb.", "type": "bad" },
          {
            "u_add_effect": "psionic_overload",
            "duration": {
              "math": [ "time(' 30 s') * rng( ( u_vitamin('vitamin_psionic_drain') / 2 ), ( u_vitamin('vitamin_psionic_drain') * 2 ) )" ]
            }
          }
        ]
      }
    ],
    "false_effect": [ { "run_eocs": "EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES" } ]
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_nether_attunement_events.json (L400-423)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_NETHER_EFFECT_CHECK_COLD_WIND",
    "//": "Base is 3% chance from 15 attunement to 50 attunement, then scaling up 0.1% per attunement up to 11% chance at 130 attunement, then scaling up 0.25% chance per attunement up to 41% chance at max, plus 1/10th the Difficulty squared.",
    "condition": { "math": [ "u_vitamin('vitamin_psionic_drain') >= 15" ] },
    "effect": [
      {
        "if": {
          "x_in_y_chance": {
            "x": {
              "math": [
                "( clamp( (u_vitamin('vitamin_psionic_drain') - 50), 0, 80) + clamp( ( (u_vitamin('vitamin_psionic_drain') - 130) * 2.5 ), 0, 375) + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 30) + nether_attune_torrential_channeling_influence()"
              ]
            },
            "y": 1000
          }
        },
        "then": [
          { "u_message": "The temperature suddenly drops!", "type": "bad" },
          { "u_cast_spell": { "id": "nether_attunement_cold_chill", "hit_self": true } }
        ]
      }
    ],
    "false_effect": [ { "run_eocs": "EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES" } ]
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L3-92)
```json
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_KILLED_DIFFICULT_TIME_ENEMY",
    "eoc_type": "EVENT",
    "required_event": "character_kills_monster",
    "//": "Add difficult time related enemies.",
    "condition": {
      "and": [
        { "u_has_trait": "XEDRA_CHRONOMANCER" },
        {
          "or": [
            {
              "compare_string": [ { "context_val": "victim_type" }, "mon_tindalos", "mon_zombie_monochrome_3", "mon_lieutenant_shadow" ]
            }
          ]
        }
      ]
    },
    "effect": [
      { "math": [ "u_vitamin('xedra_chronomancer_insight') += 50" ] },
      {
        "if": { "math": [ "global_xedra_chronomancy_setting_hide_insight_messages != 1" ] },
        "then": { "u_message": "You gain a large amount of insight into the workings of time!", "type": "info" }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_KILLED_MEDIUM_TIME_ENEMY",
    "eoc_type": "EVENT",
    "required_event": "character_kills_monster",
    "//": "Add medium difficulty time related enemies.",
    "condition": {
      "and": [
        { "u_has_trait": "XEDRA_CHRONOMANCER" },
        {
          "or": [
            {
              "compare_string": [
                { "context_val": "victim_type" },
                "mon_hound_tindalos",
                "mon_zombie_monochrome_2",
                "mon_skeleton_master",
                "mon_boomer_monochrome"
              ]
            }
          ]
        }
      ]
    },
    "effect": [
      { "math": [ "u_vitamin('xedra_chronomancer_insight') += 10" ] },
      {
        "if": { "math": [ "global_xedra_chronomancy_setting_hide_insight_messages != 1" ] },
        "then": { "u_message": "You gain a medium amount of insight into the workings of time.", "type": "info" }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_CHRONOMANCER_KILLED_NORMAL_TIME_ENEMY",
    "eoc_type": "EVENT",
    "required_event": "character_kills_monster",
    "//": "Add normal time related enemies.",
    "condition": {
      "and": [
        { "u_has_trait": "XEDRA_CHRONOMANCER" },
        {
          "or": [
            {
              "compare_string": [
                { "context_val": "victim_type" },
                "mon_zombie_monochrome",
                "mon_zombie_master",
                "mon_zombie_necro_boomer",
                "mon_xe_unicorn",
                "mon_xe_unicorn_foal"
              ]
            }
          ]
        }
      ]
    },
    "effect": [
      { "math": [ "u_vitamin('xedra_chronomancer_insight') += 5" ] },
      {
        "if": { "math": [ "global_xedra_chronomancy_setting_hide_insight_messages != 1" ] },
        "then": { "u_message": "You gain a small amount of insight into the workings of time.", "type": "info" }
      }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L159-191)
```json
    "id": "EOC_XEDRA_CHRONOMANCER_REVERSE_ENTROPY_INV_SCANNER",
    "condition": { "u_has_effect": "effect_xedra_chronomancer_reverse_entropy" },
    "effect": [
      {
        "run_eocs": "EOC_XEDRA_CHRONOMANCER_REVERSE_ENTROPY_INV_SCANNER",
        "time_in_future": { "math": [ "max( xedra_chron_spell_calc( u_spell_level('xedra_chronomancer_reverse_entropy'), -2, 60 ), 1 )" ] }
      },
      {
        "u_run_inv_eocs": "all",
        "search_data": [ { "is_chargeable": true } ],
        "true_eocs": [
          {
            "id": "EOC_XEDRA_CHRONOMANCER_REVERSE_ENTROPY_INV_SCANNER_ENERGY",
            "effect": [
              {
                "math": [ "n_val('power') += xedra_chron_spell_calc( u_spell_level('xedra_chronomancer_reverse_entropy'), 0.1, 1 )" ]
              }
            ]
          }
        ]
      },
      {
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
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L195-243)
```json
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
    ],
    "false_effect": [ "u_cancel_activity" ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L374-384)
```json
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_TRACK_LAST_HIT",
    "eoc_type": "EVENT",
    "required_event": "character_takes_damage",
    "//": "This value is intended to be used for time magic related powers.  It will get reset by their use, and should not be used for general purpose information.",
    "effect": [
      { "math": [ "u_xedra_last_damage_taken=_damage" ] },
      { "math": [ "u_xedra_last_pain_taken=_pain" ] },
      { "copy_var": { "context_val": "bodypart" }, "target_var": { "u_val": "xedra_last_damage_taken_bodypart" } }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L387-413)
```json
    "id": "eoc_xedra_time_freeze_character_start_activity",
    "eoc_type": "EVENT",
    "required_event": "character_gains_effect",
    "condition": { "compare_string": [ "effect_xedra_time_freeze", { "context_val": "effect" } ] },
    "//": "Activity duration doesn't truly align with time stops potentially lasting indefinitely, but players should never be time stopped longer than a day or two anyways so 200 days should be good enough.  If truly important making the activity based on neither rather than time and adding a blank do_turn function should allow >200 day durations",
    "effect": [
      { "u_assign_activity": "act_xedra_time_freeze", "duration": "200 days" },
      {
        "run_eocs": "EOC_XEDRA_TIME_SAVE_VARIABLES_DYNAMIC",
        "variables": { "xedra_chronomancer_prefix": "time_freeze" }
      }
    ]
  },
  {
    "type": "effect_on_condition",
    "id": "eoc_xedra_time_freeze_character_end_activity",
    "eoc_type": "EVENT",
    "required_event": "character_loses_effect",
    "condition": { "compare_string": [ "effect_xedra_time_freeze", { "context_val": "effect" } ] },
    "effect": [
      "u_cancel_activity",
      {
        "run_eocs": "EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC",
        "variables": { "xedra_chronomancer_prefix": "time_freeze" }
      }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L524-532)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_TIME_LOOP_LOOP",
    "condition": { "u_has_effect": "effect_xedra_time_loop" },
    "effect": [
      { "run_eocs": "EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC", "variables": { "xedra_chronomancer_prefix": "time_loop" } },
      { "run_eocs": "EOC_XEDRA_TIME_LOOP_LOOP", "time_in_future": "5 seconds" }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L600-610)
```json
    "id": "EOC_XEDRA_CHRONOMANCER_STABLE_TIMELOOP_PREVENT_DEATH",
    "type": "effect_on_condition",
    "eoc_type": "PREVENT_DEATH",
    "condition": { "u_has_effect": "effect_xedra_chronomancer_stable_timeloop" },
    "effect": [
      { "math": [ "u_vitamin('blood') = 0" ] },
      "u_prevent_death",
      { "math": [ "u_hp('ALL') = 1000" ] },
      { "u_lose_effect": "effect_xedra_chronomancer_stable_timeloop" }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L631-802)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_TIME_SAVE_VARIABLES_DYNAMIC",
    "condition": { "expects_vars": [ "xedra_chronomancer_prefix" ] },
    "effect": [
      {
        "set_string_var": "u_xedra_location_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "u_location_variable": { "var_val": "target_var" }, "min_radius": 0, "max_radius": 0 },
      {
        "set_string_var": "u_xedra_pain_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_pain()" ] },
      {
        "set_string_var": "u_xedra_kcal_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_calories()" ] },
      {
        "set_string_var": "u_xedra_thirst_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_val('thirst')" ] },
      {
        "set_string_var": "u_xedra_blood_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('blood')" ] },
      {
        "set_string_var": "u_xedra_redcells_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('redcells')" ] },
      {
        "set_string_var": "u_xedra_rad_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('rad')" ] },
      {
        "set_string_var": "u_xedra_calcium_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('calcium')" ] },
      {
        "set_string_var": "u_xedra_iron_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('iron')" ] },
      {
        "set_string_var": "u_xedra_vitC_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_vitamin('vitC')" ] },
      {
        "set_string_var": "u_xedra_sleepiness_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_val('sleepiness')" ] },
      {
        "set_string_var": "u_xedra_sleep_deprivation_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_val('sleep_deprivation')" ] },
      {
        "set_string_var": "u_xedra_stamina_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_val('stamina')" ] },
      {
        "set_string_var": "u_xedra_hp_all_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('ALL')" ] },
      {
        "set_string_var": "u_xedra_hp_torso_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('torso')" ] },
      {
        "set_string_var": "u_xedra_hp_head_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('head')" ] },
      {
        "set_string_var": "u_xedra_hp_eyes_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('eyes')" ] },
      {
        "set_string_var": "u_xedra_hp_mouth_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('mouth')" ] },
      {
        "set_string_var": "u_xedra_hp_arm_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('arm_l')" ] },
      {
        "set_string_var": "u_xedra_hp_hand_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('hand_l')" ] },
      {
        "set_string_var": "u_xedra_hp_arm_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('arm_r')" ] },
      {
        "set_string_var": "u_xedra_hp_hand_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('hand_r')" ] },
      {
        "set_string_var": "u_xedra_hp_leg_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('leg_l')" ] },
      {
        "set_string_var": "u_xedra_hp_foot_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('foot_l')" ] },
      {
        "set_string_var": "u_xedra_hp_leg_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('leg_r')" ] },
      {
        "set_string_var": "u_xedra_hp_foot_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      { "math": [ "v_target_var = u_hp('foot_r')" ] },
      {
        "set_string_var": "u_xedra_bleed_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "target_var" },
        "parse_tags": true
      },
      {
        "if": { "u_has_effect": "bleed" },
        "then": { "math": [ "v_target_var = 1" ] },
        "else": { "math": [ "v_target_var = 0" ] }
      }
    ]
```
**File:** data/mods/Xedra_Evolved/eocs/chronomancer_eocs.json (L804-972)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC",
    "condition": { "expects_vars": [ "xedra_chronomancer_prefix" ] },
    "effect": [
      {
        "set_string_var": "u_xedra_location_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "u_teleport": { "var_val": "temp_var" } },
      {
        "set_string_var": "u_xedra_pain_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_pain() = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_kcal_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_calories() = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_thirst_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_val('thirst') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_blood_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_vitamin('blood') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_redcells_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_vitamin('redcells') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_calcium_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_vitamin('calcium') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_iron_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_vitamin('iron') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_vitC_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_vitamin('vitC') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_rad_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_val('rad') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_sleepiness_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_val('sleepiness') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_sleep_deprivation_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_val('sleep_deprivation') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_stamina_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_val('stamina') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_all_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('ALL') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_torso_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('torso') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_head_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('head') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_eyes_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('eyes') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_mouth_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('mouth') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_arm_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('arm_l') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_hand_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('hand_l') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_arm_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('arm_r') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_hand_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('hand_r') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_leg_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('leg_r') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_foot_r_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('foot_r') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_leg_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('leg_l') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_hp_foot_l_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "math": [ "u_hp('foot_l') = v_temp_var" ] },
      {
        "set_string_var": "u_xedra_bleed_before_<context_val:xedra_chronomancer_prefix>",
        "target_var": { "context_val": "temp_var" },
        "parse_tags": true
      },
      { "if": { "math": [ "v_temp_var == 0" ] }, "then": { "u_lose_effect": "bleed" } }
    ]
  },
```
**File:** data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json (L7-30)
```json
  {
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
**File:** data/mods/MindOverMatter/effectoncondition/eoc_portal_storm_effects.json (L2-40)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_PORTAL_EFFECTS_ACTIVE",
    "//2": "Overwrite of data/json/effects_on_condition/nether_eocs/portal_storm_effects_on_condition.json",
    "//": "More dangerous portal effects, should cost IRE to do.",
    "recurrence": [ "20 seconds", "50 seconds" ],
    "global": true,
    "condition": {
      "and": [
        {
          "or": [
            { "and": [ { "is_weather": "distant_portal_storm" }, { "x_in_y_chance": { "x": 5, "y": 10 } } ] },
            { "and": [ { "is_weather": "near_portal_storm" }, { "x_in_y_chance": { "x": 7, "y": 10 } } ] },
            { "is_weather": "portal_storm" }
          ]
        },
        { "math": [ "portal_dungeon_level == 0" ] },
        { "math": [ "u_ire > 0" ] }
      ]
    },
    "deactivate_condition": { "not": { "is_weather": "portal_storm" } },
    "effect": [
      { "run_eocs": "EOC_PORTAL_MESSAGE" },
      {
        "weighted_list_eocs": [
          [ "EOC_PORTAL_TELEPORT_STUCK_START", 2 ],
          [ "EOC_PORTAL_PAIN", 2 ],
          [ "EOC_PORTAL_HALLUCINATOR", 2 ],
          [ "EOC_PORTAL_SMOKE", 2 ],
          [ "EOC_PORTAL_YRAX_ATTENTION", 1 ],
          [ "EOC_PORTAL_SWARM_STRUCTURE", 2 ],
          [ "EOC_PORTAL_TAUNT", 1 ],
          [ "EOC_PORTAL_SHIFTING_MASS", 1 ],
          [ "EOC_PORTAL_ARTIFACT_WEAK", 1 ],
          [ "EOC_PORTAL_TEMPORARY_TEARS_IN_REALITY", 1 ]
        ]
      }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/mutation_eocs.json (L100-194)
```json
    "id": "EOC_XE_IRON_INTOLERANCE_WEARING_IRON_FOLLOWUP",
    "effect": {
      "u_run_inv_eocs": "all",
      "search_data": [ { "material": "iron", "worn_only": true }, { "material": "iron", "wielded_only": true } ],
      "true_eocs": [
        {
          "id": "EOC_XE_IRON_INTOLERANCE_WEARING_IRON_RESULT_TRUE",
          "effect": [
            {
              "if": {
                "or": [
                  { "and": [ { "u_has_trait": "HOMULLUS" }, { "u_has_trait": "IRON_ALLERGY" } ] },
                  {
                    "and": [
                      {
                        "u_has_any_trait": [
                          "UNKNOWING_CHANGELING_NOBLE",
                          "FAIR_FOLK_COMMONER_SELECTOR",
                          "UNKNOWING_CHANGELING_COMMONER_BROWNIE",
                          "UNKNOWING_CHANGELING_COMMONER_POOKA",
                          "UNKNOWING_CHANGELING_COMMONER_SELKIE",
                          "UNKNOWING_CHANGELING_COMMONER_TROW"
                        ]
                      },
                      { "not": { "u_has_trait": "IRON_ALLERGY" } }
                    ]
                  }
                ]
              },
              "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_iron_tier_1", "duration": "PERMANENT" }
            },
            {
              "if": {
                "or": [
                  {
                    "and": [
                      { "u_has_trait": "IRON_ALLERGY" },
                      { "not": { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE", "IERDE", "SALAMANDER" ] } }
                    ]
                  },
                  {
                    "and": [ { "u_has_any_trait": [ "IERDE", "SALAMANDER" ] }, { "not": { "u_has_trait": "IRON_ALLERGY" } } ]
                  },
                  {
                    "and": [
                      {
                        "u_has_any_trait": [
                          "UNKNOWING_CHANGELING_NOBLE",
                          "FAIR_FOLK_COMMONER_SELECTOR",
                          "UNKNOWING_CHANGELING_COMMONER_BROWNIE",
                          "UNKNOWING_CHANGELING_COMMONER_POOKA",
                          "UNKNOWING_CHANGELING_COMMONER_SELKIE",
                          "UNKNOWING_CHANGELING_COMMONER_TROW"
                        ]
                      },
                      { "u_has_trait": "IRON_ALLERGY" }
                    ]
                  }
                ]
              },
              "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_iron_tier_2", "duration": "PERMANENT" }
            },
            {
              "if": {
                "or": [
                  { "and": [ { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE" ] }, { "not": { "u_has_trait": "IRON_ALLERGY" } } ] },
                  { "and": [ { "u_has_any_trait": [ "IERDE", "SALAMANDER" ] }, { "u_has_trait": "IRON_ALLERGY" } ] }
                ]
              },
              "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_iron_tier_3", "duration": "PERMANENT" }
            },
            {
              "if": { "and": [ { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE" ] }, { "u_has_trait": "IRON_ALLERGY" } ] },
              "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_iron_tier_4", "duration": "PERMANENT" }
            }
          ]
        }
      ],
      "false_eocs": [
        {
          "id": "EOC_XE_IRON_INTOLERANCE_WEARING_IRON_RESULT_FALSE",
          "effect": [
            {
              "u_lose_effect": [
                "effect_xe_iron_intolerance_wearing_iron_tier_1",
                "effect_xe_iron_intolerance_wearing_iron_tier_2",
                "effect_xe_iron_intolerance_wearing_iron_tier_3",
                "effect_xe_iron_intolerance_wearing_iron_tier_4"
              ]
            }
          ]
        }
      ]
    }
  },
```
**File:** data/mods/Xedra_Evolved/eocs/mutation_eocs.json (L196-312)
```json
    "type": "effect_on_condition",
    "id": "EOC_XE_IRON_INTOLERANCE_WEARING_STEEL_FOLLOWUP",
    "effect": [
      {
        "u_run_inv_eocs": "all",
        "search_data": [
          { "material": "steel", "worn_only": true },
          { "material": "lc_steel", "worn_only": true },
          { "material": "mc_steel", "worn_only": true },
          { "material": "hc_steel", "worn_only": true },
          { "material": "ch_steel", "worn_only": true },
          { "material": "lc_steel_chain", "worn_only": true },
          { "material": "mc_steel_chain", "worn_only": true },
          { "material": "hc_steel_chain", "worn_only": true },
          { "material": "ch_steel_chain", "worn_only": true },
          { "material": "steel", "wielded_only": true },
          { "material": "lc_steel", "wielded_only": true },
          { "material": "mc_steel", "wielded_only": true },
          { "material": "hc_steel", "wielded_only": true },
          { "material": "ch_steel", "wielded_only": true },
          { "material": "lc_steel_chain", "wielded_only": true },
          { "material": "mc_steel_chain", "wielded_only": true },
          { "material": "hc_steel_chain", "wielded_only": true },
          { "material": "ch_steel_chain", "wielded_only": true }
        ],
        "true_eocs": [
          {
            "id": "EOC_XE_IRON_INTOLERANCE_WEARING_STEEL_RESULT_TRUE",
            "effect": [
              {
                "if": {
                  "or": [
                    { "and": [ { "u_has_trait": "HOMULLUS" }, { "u_has_trait": "IRON_ALLERGY" } ] },
                    {
                      "and": [
                        {
                          "u_has_any_trait": [
                            "UNKNOWING_CHANGELING_NOBLE",
                            "FAIR_FOLK_COMMONER_SELECTOR",
                            "UNKNOWING_CHANGELING_COMMONER_BROWNIE",
                            "UNKNOWING_CHANGELING_COMMONER_POOKA",
                            "UNKNOWING_CHANGELING_COMMONER_SELKIE",
                            "UNKNOWING_CHANGELING_COMMONER_TROW"
                          ]
                        },
                        { "not": { "u_has_trait": "IRON_ALLERGY" } }
                      ]
                    }
                  ]
                },
                "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_steel_tier_1", "duration": "PERMANENT" }
              },
              {
                "if": {
                  "or": [
                    {
                      "and": [
                        { "u_has_trait": "IRON_ALLERGY" },
                        { "not": { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE", "IERDE", "SALAMANDER" ] } }
                      ]
                    },
                    {
                      "and": [ { "u_has_any_trait": [ "IERDE", "SALAMANDER" ] }, { "not": { "u_has_trait": "IRON_ALLERGY" } } ]
                    },
                    {
                      "and": [
                        {
                          "u_has_any_trait": [
                            "UNKNOWING_CHANGELING_NOBLE",
                            "FAIR_FOLK_COMMONER_SELECTOR",
                            "UNKNOWING_CHANGELING_COMMONER_BROWNIE",
                            "UNKNOWING_CHANGELING_COMMONER_POOKA",
                            "UNKNOWING_CHANGELING_COMMONER_SELKIE",
                            "UNKNOWING_CHANGELING_COMMONER_TROW"
                          ]
                        },
                        { "u_has_trait": "IRON_ALLERGY" }
                      ]
                    }
                  ]
                },
                "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_steel_tier_2", "duration": "PERMANENT" }
              },
              {
                "if": {
                  "or": [
                    { "and": [ { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE" ] }, { "not": { "u_has_trait": "IRON_ALLERGY" } } ] },
                    { "and": [ { "u_has_any_trait": [ "IERDE", "SALAMANDER" ] }, { "u_has_trait": "IRON_ALLERGY" } ] }
                  ]
                },
                "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_steel_tier_3", "duration": "PERMANENT" }
              },
              {
                "if": { "and": [ { "u_has_any_trait": [ "ARVORE", "SYLPH", "UNDINE" ] }, { "u_has_trait": "IRON_ALLERGY" } ] },
                "then": { "u_add_effect": "effect_xe_iron_intolerance_wearing_steel_tier_4", "duration": "PERMANENT" }
              }
            ]
          }
        ],
        "false_eocs": [
          {
            "id": "EOC_XE_IRON_INTOLERANCE_WEARING_STEEL_RESULT_FALSE",
            "effect": [
              {
                "u_lose_effect": [
                  "effect_xe_iron_intolerance_wearing_steel_tier_1",
                  "effect_xe_iron_intolerance_wearing_steel_tier_2",
                  "effect_xe_iron_intolerance_wearing_steel_tier_3",
                  "effect_xe_iron_intolerance_wearing_steel_tier_4"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/shapeshifter_eocs.json (L3-108)
```json
    "type": "effect_on_condition",
    "id": "EOC_XE_SHAPESHIFTED_ANIMALS_CANT_DO_THAT",
    "eoc_type": "EVENT",
    "required_event": "character_starts_activity",
    "condition": {
      "and": [
        {
          "u_has_any_trait": [
            "VAMPIRE_WOLF_FORM_TRAITS",
            "WEREWOLF_PRIMAL_FORM_TRAITS",
            "TURN_INTO_BEAR_TRAITS",
            "TURN_INTO_DEER_TRAITS",
            "TURN_INTO_COUGAR_TRAITS",
            "TURN_INTO_OWL_TRAITS",
            "TURN_INTO_RAVEN_TRAITS"
          ]
        },
        {
          "or": [
            { "compare_string": [ "ACT_LOCKPICK", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_REPAIR_ITEM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MEND_ITEM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_VEHICLE_REPAIR", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_RELOAD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FIRSTAID", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MILK", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_HACKSAW", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_BOLTCUTTING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_HAIRCUT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_SHAVE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_CRACKING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_READ", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_EBOOKSAVE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_TIDY_UP", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MOP", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_VEHICLE_DECONSTRUCTION", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_VEHICLE_FOLD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_VEHICLE_UNFOLD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_BIKERACK_UNRACKING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_BIKERACK_RACKING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_DIS", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_FISH", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_CRAFT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_CHOP_PLANKS", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_CHOP_TREES", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_MINE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_CONSTRUCTION", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_MOP", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_READ", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FISH", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_GENERIC_GAME", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_GAME", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_DISASSEMBLE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MULTIPLE_FARM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_HARVEST", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FIELD_DRESS", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_SKIN", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_QUARTER", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_DISSECT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_LONGSALVAGE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_BUILD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_PICKAXE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_HAND_CRANK", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_PICKUP", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_AUTODRIVE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FERTILIZE_PLOT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_MOVE_LOOT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_UNLOAD_LOOT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_INSERT_ITEM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_START_FIRE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_OPEN_GATE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FILL_LIQUID", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_SHEARING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_HOTWIRE_CAR", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_AIM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_ATM", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_START_ENGINES", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_OXYTORCH", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_TOOLMOD_ADD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_CLEAR_RUBBLE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_WASH", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_PRYING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_CHOP_LOGS", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_CHOP_PLANKS", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_JACKHAMMER", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_CHURN", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_PLANT_SEED", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_WEAR", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_PICKUP", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_WIELD", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_BINDER_COPY_RECIPE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_DATA_HANDLING", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_FURNITURE_MOVE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_TENT_PLACE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_TENT_DECONSTRUCT", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_REEL_CABLE", { "context_val": "activity" } ] },
            { "compare_string": [ "ACT_SALINE_INFUSE", { "context_val": "activity" } ] }
          ]
        }
      ]
    },
    "effect": [
      "u_cancel_activity",
      { "u_message": "You can't perform that activity while in the form of an animal.", "type": "bad" }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/shapeshifter_eocs.json (L302-322)
```json
              "foreach": "array",
              "target": [ "arm_l", "arm_r", "leg_l", "leg_r", "torso", "head" ],
              "var": { "context_val": "id" },
              "effect": [ { "if": { "math": [ "u_hp(_id) < u_hp_max(_id)" ] }, "then": { "math": [ "u_hp(_id) += 1" ] } } ]
            }
          },
          {
            "foreach": "array",
            "target": [ "arm_l", "arm_r", "leg_l", "leg_r", "torso", "head" ],
            "var": { "context_val": "id" },
            "effect": [
              {
                "if": { "u_has_effect": "bite", "bodypart": { "context_val": "id" } },
                "then": {
                  "if": { "x_in_y_chance": { "x": 1, "y": 100 } },
                  "then": { "u_lose_effect": "bite", "target_part": { "context_val": "id" } }
                }
              }
            ]
          },
          {
```
**File:** data/mods/Xedra_Evolved/eocs/shapeshifter_eocs.json (L366-396)
```json
    "id": "EOC_SHAPESHIFTING_ARMOR_CHECK_SUBSUME_INTO_FORM",
    "effect": [
      {
        "u_run_inv_eocs": "all",
        "search_data": [ { "worn_only": true } ],
        "true_eocs": [
          {
            "id": "EOC_SHAPESHIFTING_ARMOR_CHECK_SUBSUME_INTO_FORM_APPLY_FLAGS",
            "effect": [
              {
                "if": {
                  "and": [
                    { "not": { "npc_has_flag": "SEMITANGIBLE" } },
                    { "not": { "npc_has_flag": "UNRESTRICTED" } },
                    { "not": { "npc_has_flag": "INTEGRATED" } }
                  ]
                },
                "then": [
                  { "npc_set_flag": "SHAPESHIFTED_ARMOR" },
                  { "npc_set_flag": "SEMITANGIBLE" },
                  { "npc_set_flag": "UNRESTRICTED" },
                  { "npc_set_flag": "INTANGIBLE_ARMOR" },
                  { "npc_set_flag": "NO_TAKEOFF" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
```
**File:** data/mods/Xedra_Evolved/eocs/spell_learning_eoc.json (L53-87)
```json
    "effect": [
      {
        "foreach": "array",
        "var": { "context_val": "random_eater_spell" },
        "target": [ "_xe_spell_1", "_xe_spell_2", "_xe_spell_3", "_xe_spell_4" ],
        "effect": [
          {
            "set_string_var": [
              "spring_heeled_leap",
              "blood_boil",
              "self_healing",
              "supercoffee",
              "spell_rage",
              "spell_stamina_wonder",
              "spell_night_vision",
              "spell_dodge",
              "spell_endurance",
              "spell_invisibility",
              "spell_clairvoyance",
              "spell_melee_damage",
              "spell_spear",
              "spell_speed_wonder",
              "spell_weak",
              "spell_unbreakable",
              "point_blank",
              "xedra_eater_stabilize_reality",
              "xedra_eater_erosion"
            ],
            "target_var": { "var_val": "random_eater_spell" }
          }
        ]
      },
      { "math": [ "xe_eater_leveling--" ] },
      { "run_eocs": [ "EOC_XE_GIVE_SPELL_SELECTOR" ] }
    ]
```
**File:** data/mods/Xedra_Evolved/eocs/spell_learning_eoc.json (L133-154)
```json
  {
    "type": "effect_on_condition",
    "id": "EOC_XE_GIVE_SPELL_SELECTOR",
    "effect": [
      {
        "run_eoc_selector": [ "EOC_XE_GIVE_SPELL_1", "EOC_XE_GIVE_SPELL_2", "EOC_XE_GIVE_SPELL_3", "EOC_XE_GIVE_SPELL_4" ],
        "title": "Choose your Destiny",
        "names": [
          "<spell_name:<context_val:xe_spell_1>>",
          "<spell_name:<context_val:xe_spell_2>>",
          "<spell_name:<context_val:xe_spell_3>>",
          "<spell_name:<context_val:xe_spell_4>>"
        ],
        "keys": [ "1", "2", "3", "4" ],
        "descriptions": [
          "<spell_description:<context_val:xe_spell_1>>",
          "<spell_description:<context_val:xe_spell_2>>",
          "<spell_description:<context_val:xe_spell_3>>",
          "<spell_description:<context_val:xe_spell_4>>"
        ]
      }
    ]
```
**File:** data/mods/MindOverMatter/jmath.json (L27-56)
```json
    "type": "jmath_function",
    "id": "psionic_power_success_formula",
    "num_args": 0,
    "return": "psionic_power_success_formula_convert_to_decimal()"
  },
  {
    "type": "jmath_function",
    "id": "psionic_power_success_formula_convert_to_decimal",
    "num_args": 0,
    "return": "( (psionic_power_success_formula_prevent_out_of_bounds() - 40 ) / 40) ^ 2"
  },
  {
    "type": "jmath_function",
    "id": "psionic_power_success_formula_prevent_out_of_bounds",
    "num_args": 0,
    "return": "clamp( psionic_power_success_formula_proficiency_handling(), 0, 40 )"
  },
  {
    "type": "jmath_function",
    "id": "psionic_power_success_formula_proficiency_handling",
    "num_args": 0,
    "return": " u_has_proficiency('prof_concentration_basic') ? ( u_has_proficiency('prof_concentration_intermediate') ? ( u_has_proficiency('prof_concentration_master') ? min( ( psionic_power_success_formula_base_calc() ), 40 ) : min( ( psionic_power_success_formula_base_calc() ), (37 + (u_has_trait('PSI_EXTENDED_CHANNELING_active') * 3) ) ) ) : min( ( psionic_power_success_formula_base_calc() ), 31 + (u_has_trait('PSI_EXTENDED_CHANNELING_active') * 3) ) ) : min( ( psionic_power_success_formula_base_calc() ), 24 + (u_has_trait('PSI_EXTENDED_CHANNELING_active') * 7) )"
  },
  {
    "type": "jmath_function",
    "id": "psionic_power_success_formula_base_calc",
    "//": "Metaphysics is by far the most important factor, followed by intelligence, followed only after by power level.  At effective skill level 12 there's a 50% chance to fail",
    "num_args": 0,
    "return": "(2 * ( ( u_skill('metaphysics') * 2 ) - u_spell_difficulty(_spell_id) ) + ( u_val('intelligence') * 1.5 ) + (u_spell_level(_spell_id) * 0.6666666666) ) + psionic_power_success_formula_channeling_concentration_modifiers() + psionic_power_success_formula_weariness_modifiers() + psionic_power_success_formula_repeated_channeling_modifiers() + psionic_power_success_formula_modifiers() + psionic_power_success_formula_perks()"
  },
```
**File:** data/mods/MindOverMatter/jmath.json (L109-113)
```json
    "type": "jmath_function",
    "id": "nether_attune_torrential_channeling_influence",
    "num_args": 0,
    "return": "u_has_trait('PSI_TORRENTIAL_CHANNELING_active') * ( clamp( (u_vitamin('vitamin_psionic_drain') / 2), 0,50) + clamp( (u_vitamin('vitamin_psionic_drain') - 100), 0,100) + clamp( ( (u_vitamin('vitamin_psionic_drain') - 200) * 2), 0,100) )"
  },
```
**File:** data/mods/MindOverMatter/jmath.json (L139-156)
```json
    "type": "jmath_function",
    "id": "concentration_trait_bonuses",
    "num_args": 0,
    "//": "Effects with an intelligence penalty have not been included below to avoid double counting",
    "return": "(u_has_trait('CONCENTRATION_GOOD')) + (u_has_trait('CONCENTRATION_BAD') ? -1 : 0) + (u_has_trait('INT_ALPHA')) + (u_has_trait('NOMAD2') ? -1 : 0) + (u_has_trait('NOMAD3') ? -1 : 0) + (u_has_trait('PER_SLIME') ? -15 : 0) + (u_has_trait('CONCENTRATION_DEBUG') ? 50 : 0) + (u_has_proficiency('prof_concentration_basic')) + (u_has_proficiency('prof_concentration_intermediate')) + (u_has_proficiency('prof_concentration_master') * 2) + (u_effect_intensity('effect_disease_psionic_drain') > 4 ? -1 : 0) + (u_effect_intensity('effect_disease_psionic_drain') > 10 ? -1 : 0) + (u_effect_intensity('hallu') > 0 ? -1 : 0) + (u_effect_intensity('winded') > 0 ? -2 : 0) + (u_effect_intensity('nausea') > 0 ? -1 : 0) + (u_effect_intensity('nausea') > 3 ? -1 : 0) +  (u_effect_intensity('cold') > 1  ... (truncated)
  },
  {
    "type": "jmath_function",
    "id": "concentration_calculations",
    "num_args": 0,
    "return": "(u_val('intelligence') / 4) + u_bonus_concentration_powers + concentration_trait_bonuses()"
  },
  {
    "type": "jmath_function",
    "id": "concentration_nether_attunement_influences",
    "num_args": 0,
    "return": "(concentration_calculations() > 1 ? concentration_calculations(): 1) * (u_has_proficiency('prof_concentration_basic') ? 0.9: 1) + (u_has_proficiency('prof_concentration_intermediate') ? 0.9: 1) + (u_has_proficiency('prof_concentration_master') ? 0.8: 1)"
  },
```
## Q11
suggest templates for the top ten useful EOCs
### Answer
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
``` Cataclysm-DDA:21-75 

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
``` Cataclysm-DDA:6-29 

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
``` Cataclysm-DDA:158-190 

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
``` Cataclysm-DDA:331-368 

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
``` Cataclysm-DDA:243-297 

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
``` Cataclysm-DDA:301-321 

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
``` Cataclysm-DDA:194-242 

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
``` Cataclysm-DDA:132-153 

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
``` Cataclysm-DDA:369-397 

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
``` Cataclysm-DDA:599-609 

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
## Q12
elaborate on the Auto-completion of common patterns
### Answer
You're asking about implementing **auto-completion of common EOC patterns** in the Python EOC generation tool we've been designing.<cite/>

## Auto-Completion Implementation Strategy

Auto-completion would provide IDE support for discovering and using the EOC templates and patterns we've discussed. Here's how to implement it:

### 1. Type Hints and Docstrings

The templates I provided already include type hints, but we can enhance them with detailed docstrings that IDEs can parse:

```python
def event_eoc_template(
    eoc_id: str, 
    event_name: str, 
    context_checks: Dict[str, Any], 
    effects: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Create an EVENT-type EOC triggered by game events.
    
    Args:
        eoc_id: Unique identifier for the EOC (e.g., "EOC_SPELL_TRACKER")
        event_name: Game event that triggers this EOC. Common values:
            - "character_casts_spell"
            - "character_takes_damage" 
            - "character_kills_monster"
            - "character_gains_effect"
        context_checks: Condition dict to filter when EOC runs
        effects: List of effect dicts to execute
        
    Returns:
        Complete EOC definition dict ready for JSON serialization
        
    Example:
        >>> event_eoc_template(
        ...     "EOC_TRACK_FIREBALL",
        ...     "character_casts_spell",
        ...     {"compare_string": ["fireball", {"context_val": "spell"}]},
        ...     [{"u_message": "You cast fireball!"}]
        ... )
    """
```

This enables IDE auto-completion to show parameter descriptions and examples as you type.<cite/>

### 2. Enum-Based Constants for Common Values

Create enums for frequently-used values that IDEs can auto-complete:

```python
from enum import Enum

class GameEvent(str, Enum):
    """Common game events that trigger EOCs"""
    CHARACTER_CASTS_SPELL = "character_casts_spell"
    CHARACTER_TAKES_DAMAGE = "character_takes_damage"
    CHARACTER_KILLS_MONSTER = "character_kills_monster"
    CHARACTER_GAINS_EFFECT = "character_gains_effect"
    CHARACTER_LOSES_EFFECT = "character_loses_effect"
    CHARACTER_WAKES_UP = "character_wakes_up"
    SPELLCASTING_FINISH = "spellcasting_finish"
    GAINS_MUTATION = "gains_mutation"
    
class MessageType(str, Enum):
    """Message display types"""
    GOOD = "good"
    BAD = "bad"
    NEUTRAL = "neutral"
    MIXED = "mixed"
    DEBUG = "debug"

class EOCSearchMode(str, Enum):
    """Inventory search modes for u_run_inv_eocs"""
    ALL = "all"
    RANDOM = "random"
    MANUAL = "manual"

# Usage with auto-completion
event_eoc_template(
    "EOC_SPELL_TRACKER",
    GameEvent.CHARACTER_CASTS_SPELL,  # IDE shows all available events
    {"compare_string": ["fireball", {"context_val": "spell"}]},
    [{"u_message": "Fireball!", "type": MessageType.GOOD}]  # IDE shows message types
)
```

These enums are based on the event types documented in `doc/JSON/EFFECT_ON_CONDITION.md:1642-1680`[link to Repo CleverRaven/Cataclysm-DDA: doc/JSON/EFFECT_ON_CONDITION.md:1641-1679] and message types used throughout the mods.<cite/>

### 3. Builder Classes with Method Chaining

Create builder classes that provide discoverable methods:

```python
class ConditionBuilder:
    """Fluent builder for EOC conditions with auto-completion support"""
    
    def u_has_trait(self, trait_id: str) -> Dict[str, str]:
        """Check if character has a specific trait"""
        return {"u_has_trait": trait_id}
    
    def u_has_any_trait(self, *trait_ids: str) -> Dict[str, List[str]]:
        """Check if character has any of the specified traits"""
        return {"u_has_any_trait": list(trait_ids)}
    
    def u_spell_level(self, spell_id: str, operator: str, level: int) -> Dict[str, List[str]]:
        """
        Check spell level with comparison operator.
        
        Args:
            spell_id: Spell identifier
            operator: Comparison operator (>=, <=, ==, !=, >, <)
            level: Level to compare against
        """
        return {"math": [f"u_spell_level('{spell_id}') {operator} {level}"]}
    
    def and_(self, *conditions: Dict) -> Dict[str, List[Dict]]:
        """Combine multiple conditions with AND logic"""
        return {"and": list(conditions)}
    
    def or_(self, *conditions: Dict) -> Dict[str, List[Dict]]:
        """Combine multiple conditions with OR logic"""
        return {"or": list(conditions)}

# Usage - IDE shows all available methods
cond = ConditionBuilder()
condition = cond.and_(
    cond.u_has_trait("BIOKINETIC"),  # Auto-complete shows method signature
    cond.u_spell_level("biokin_physical_enhance", ">=", 5)
)
```

This pattern is inspired by the complex conditions in `data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json:11-28`[link to Repo CleverRaven/Cataclysm-DDA: data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json:10-27].<cite/>

### 4. Snippet Library with Categorization

Organize common patterns into a discoverable library:

```python
class EOCSnippets:
    """Library of common EOC patterns for quick access"""
    
    @staticmethod
    def psionic_power_check(power_trait: str, power_spell: str, min_level: int) -> Dict:
        """
        Standard psionic power availability check pattern.
        Used extensively in MindOverMatter mod.
        """
        return {
            "and": [
                {"u_has_trait": power_trait},
                {"math": [f"u_spell_level('{power_spell}') >= {min_level}"]},
                {"not": {"u_has_effect": "effect_psi_too_much_pain_cant_channel"}}
            ]
        }
    
    @staticmethod
    def vampire_blood_check(min_blood: int) -> Dict:
        """
        Check vampire blood vitamin level.
        Pattern from Xedra_Evolved vampire system.
        """
        return {"math": [f"u_vitamin('human_blood_vitamin') >= {min_blood}"]}
    
    @staticmethod
    def time_delayed_eoc(target_eoc: str, min_seconds: int, max_seconds: int) -> Dict:
        """
        Schedule an EOC to run after a random delay.
        Common pattern for timed effects.
        """
        return {
            "run_eocs": target_eoc,
            "time_in_future": [f"{min_seconds} seconds", f"{max_seconds} seconds"]
        }

# Usage - IDE shows categorized snippets
snippets = EOCSnippets()
condition = snippets.psionic_power_check("BIOKINETIC", "biokin_physical_enhance", 5)
```

These snippets are based on recurring patterns in `data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json`[link to Repo CleverRaven/Cataclysm-DDA: data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json:1-104] and `data/mods/Xedra_Evolved/mutations/vampire_trait_eocs.json`[link to Repo CleverRaven/Cataclysm-DDA: data/mods/Xedra_Evolved/mutations/vampire_trait_eocs.json:1-100].<cite/>

### 5. IDE Integration with Language Server Protocol

For advanced auto-completion, implement a Language Server Protocol (LSP) server:

```python
# eoc_language_server.py
from typing import List, Dict
import json

class EOCCompletionProvider:
    """Provides context-aware completions for EOC authoring"""
    
    def __init__(self):
        self.load_game_data()
    
    def load_game_data(self):
        """Load valid effect names, condition types, etc. from game data"""
        self.valid_effects = [
            "u_message", "u_spawn_item", "u_add_effect", "u_add_trait",
            "run_eocs", "u_cast_spell", "u_teleport", "math"
        ]
        self.valid_conditions = [
            "u_has_trait", "u_has_effect", "math", "and", "or", "not",
            "compare_string", "test_eoc", "x_in_y_chance"
        ]
        self.game_events = [
            "character_casts_spell", "character_takes_damage",
            "character_kills_monster", "character_gains_effect"
        ]
    
    def get_completions(self, context: str, position: int) -> List[Dict]:
        """Return completion suggestions based on cursor position"""
        if '"effect":' in context:
            return [{"label": effect, "kind": "function"} 
                   for effect in self.valid_effects]
        elif '"condition":' in context:
            return [{"label": cond, "kind": "function"} 
                   for cond in self.valid_conditions]
        elif '"required_event":' in context:
            return [{"label": event, "kind": "value"} 
                   for event in self.game_events]
        return []
```

### 6. Template Expansion with Placeholders

Provide templates with placeholders that IDEs can tab through:

```python
class EOCTemplateExpander:
    """Expand EOC templates with placeholder values"""
    
    TEMPLATES = {
        "event_spell": {
            "type": "effect_on_condition",
            "id": "${1:EOC_ID}",
            "eoc_type": "EVENT",
            "required_event": "character_casts_spell",
            "condition": {
                "compare_string": ["${2:spell_id}", {"context_val": "spell"}]
            },
            "effect": [
                {"u_message": "${3:message}", "type": "${4:good}"}
            ]
        },
        "recurring_check": {
            "type": "effect_on_condition",
            "id": "${1:EOC_ID}",
            "eoc_type": "RECURRING",
            "recurrence": ["${2:30} seconds", "${3:60} seconds"],
            "condition": {"u_has_trait": "${4:TRAIT_ID}"},
            "effect": [{"run_eocs": "${5:TARGET_EOC}"}]
        }
    }
    
    @classmethod
    def expand(cls, template_name: str) -> str:
        """Return template with numbered placeholders for IDE tab-through"""
        return json.dumps(cls.TEMPLATES[template_name], indent=2)
```

## Notes

Auto-completion significantly improves the EOC authoring experience by:

1. **Reducing errors**: Type hints and enums prevent typos in field names and values
2. **Discoverability**: Developers can explore available options without consulting documentation
3. **Consistency**: Templates ensure EOCs follow established patterns from the mods
4. **Speed**: Snippets and expansion reduce boilerplate typing

The implementation leverages Python's type system and IDE capabilities (VS Code, PyCharm) to provide IntelliSense-style completions. For the most comprehensive experience, combine this with the dataclass validation approach we discussed earlier, giving you both compile-time type checking and runtime validation.<cite/>

The patterns are drawn from real EOC usage in `data/mods/MindOverMatter/effectoncondition/`[link to Repo CleverRaven/Cataclysm-DDA: data/mods/MindOverMatter/effectoncondition/eoc_power_recurring.json:1-104] and `data/mods/Xedra_Evolved/eocs/`[link to Repo CleverRaven/Cataclysm-DDA: data/mods/Xedra_Evolved/eocs/spell_learning_eoc.json:31-90], ensuring the auto-completion suggestions match actual game usage.<cite/>

Wiki pages you might want to explore:
- [Psionics and Special Powers (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#3.4)
- [NPC and Dialogue System (CleverRaven/Cataclysm-DDA)](/wiki/CleverRaven/Cataclysm-DDA#6)