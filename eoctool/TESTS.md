# Concrete EOC Examples from MindOverMatter and Xedra_Evolved Mods

Based on my examination of the Cataclysm: DDA codebase, here are comprehensive examples suitable for a Python EOC generation tool test suite:

## 1. EVENT Type EOCs with Complex Conditions

**Spellcasting Event with Nested Conditions:** [1](#9-0) 

**Character Damage Tracking Event:** [2](#9-1) 

**Character Kills Monster Events:** [3](#9-2) 

## 2. Recurring EOCs with Time-Based Execution

**Periodic Adjustment with Recurrence:** [4](#9-3) 

**Variable Decreaser with Time Range:** [5](#9-4) 

## 3. Complex Math-Based Conditions with x_in_y_chance

**Probability with Complex jmath Expressions:** [6](#9-5) 

**Multi-Stage Probability Calculations:** [7](#9-6) 

## 4. Switch Statements with Multiple Cases

**Nether Attunement Power Scaling Switch:** [8](#9-7) 

## 5. Weighted List EOCs

**Random Effect Selection with Weights:** [9](#9-8) 

**Portal Storm Effects:** [10](#9-9) 

## 6. Inventory EOCs with u_run_inv_eocs

**Equipment Scanner with Multiple Search Criteria:** [11](#9-10) 

**Iron Intolerance with Material Search:** [12](#9-11) 

**Shapeshifting Armor Check:** [13](#9-12) 

## 7. Complex Variable Manipulation

**Dynamic Variable Saving with String Parsing:** [14](#9-13) 

**Dynamic Variable Loading:** [15](#9-14) 

## 8. Complex Nested Inline EOCs

**Multi-Level Nested Decision Tree:** [16](#9-15) 

**Shapeshifter Activity Check:** [17](#9-16) 

## 9. Foreach Loops

**Body Part Healing Loop:** [18](#9-17) 

**Spell Selection with Foreach:** [19](#9-18) 

## 10. Complex jmath Functions

**Psionic Power Success Formula (Multi-Function Chain):** [20](#9-19) 

**Concentration Calculations:** [21](#9-20) 

**Nether Attunement Influence:** [22](#9-21) 

## 11. Time-Based EOCs with Scheduling

**Meditation with Ongoing Checks:** [23](#9-22) 

**Recursive Time Loop:** [24](#9-23) 

## 12. PREVENT_DEATH EOC Type

**Death Prevention with State Restoration:** [25](#9-24) 

## 13. Activity-Based EOCs

**Activity Start and End Events:** [26](#9-25) 

## 14. Run_eoc_selector for User Choice

**Spell Selection Interface:** [27](#9-26) 

## 15. Complex Condition Logic with Material Checks

**Multi-Material Steel Check:** [28](#9-27) 

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
