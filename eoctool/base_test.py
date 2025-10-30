import json
import unittest

from .builder import EOCBuilder
from .data import EOCType
from .serialization import EOCSerializer


class TestEOCGeneration(unittest.TestCase):
    """Basic EOC creation and serialization tests."""

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


class TestEventTypeEOCs(unittest.TestCase):
    """Tests for EVENT type EOCs with complex conditions."""

    def test_spellcasting_event_with_nested_conditions(self):
        """EVENT type EOC triggered on spellcasting_finish with nested conditions."""
        eoc = (
            EOCBuilder("EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT")
            .with_type(EOCType.EVENT)
            .with_event("spellcasting_finish")
            .with_condition({"test_eoc": "EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST"})
            .with_effect([
                {"math": ["u_latest_channeled_power_difficulty = _difficulty"]},
                {"run_eocs": ["EOC_NESTED_EFFECT_1", "EOC_NESTED_EFFECT_2"]}
            ])
            .build()
        )
        
        self.assertEqual(eoc.eoc_type, EOCType.EVENT)
        self.assertEqual(eoc.required_event, "spellcasting_finish")
        self.assertIsNotNone(eoc.condition)
        self.assertIsInstance(eoc.effect, list)

    def test_character_damage_tracking_event(self):
        """EVENT type EOC triggered on character_takes_damage."""
        eoc = (
            EOCBuilder("EOC_XEDRA_TRACK_LAST_HIT")
            .with_type(EOCType.EVENT)
            .with_event("character_takes_damage")
            .with_effect([
                {"math": ["u_xedra_last_damage_taken = _damage"]},
                {"math": ["u_xedra_last_pain_taken = _pain"]},
                {"copy_var": {"context_val": "bodypart"}, "target_var": {"u_val": "xedra_last_damage_taken_bodypart"}}
            ])
            .build()
        )
        
        self.assertEqual(eoc.required_event, "character_takes_damage")
        self.assertEqual(len(eoc.effect), 3)

    def test_character_kills_monster_event(self):
        """EVENT type EOC triggered on character_kills_monster."""
        eoc = (
            EOCBuilder("EOC_XEDRA_CHRONOMANCER_KILLED_DIFFICULT_TIME_ENEMY")
            .with_type(EOCType.EVENT)
            .with_event("character_kills_monster")
            .with_condition({
                "and": [
                    {"u_has_trait": "XEDRA_CHRONOMANCER"},
                    {"or": [{"compare_string": ["mon_id", {"context_val": "monster"}]}]}
                ]
            })
            .with_effect([
                {"math": ["u_vitamin('xedra_chronomancer_insight') += 50"]},
                {
                    "if": {"math": ["global_xedra_chronomancy_setting_hide_insight_messages != 1"]},
                    "then": {"u_message": "You gain a large amount of insight into the workings of time!", "type": "info"}
                }
            ])
            .build()
        )
        
        self.assertEqual(eoc.eoc_type, EOCType.EVENT)
        self.assertIn("and", eoc.condition)


class TestRecurringEOCs(unittest.TestCase):
    """Tests for recurring EOCs with time-based execution."""

    def test_periodic_adjustment_with_recurrence(self):
        """Recurring EOC with fixed recurrence interval."""
        eoc = (
            EOCBuilder("EOC_NETHER_CONDUIT_VALUE_DECREASER")
            .with_type(EOCType.RECURRING)
            .with_recurrence(["3 seconds", "15 seconds"])
            .as_global(run_for_npcs=True)
            .with_condition({"math": ["u_nether_conduit_repeated_channeling_value > 0"]})
            .with_effect({"math": ["u_nether_conduit_repeated_channeling_value -= 1"]})
            .with_false_effect({"math": ["u_nether_conduit_repeated_channeling_value = 0"]})
            .build()
        )
        
        self.assertEqual(eoc.eoc_type, EOCType.RECURRING)
        self.assertIsNotNone(eoc.recurrence)
        self.assertTrue(eoc.global_)
        self.assertTrue(eoc.run_for_npcs)
        self.assertIsNotNone(eoc.false_effect)

    def test_variable_decreaser_with_time_range(self):
        """Recurring EOC with deactivation condition and time range."""
        eoc = (
            EOCBuilder("EOC_PSI_NETHER_ATTUNEMENT_PERIODIC_ADJUSTMENT")
            .with_type(EOCType.RECURRING)
            .with_recurrence(["30 seconds", "30 seconds"])
            .with_condition({
                "and": [
                    {"u_has_trait": "PSI_TRAIT"},
                    {"math": ["u_vitamin('vitamin_psionic_drain') > 0"]}
                ]
            })
            .with_effect({"run_eocs": "EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST_2"})
            .build()
        )
        
        self.assertEqual(eoc.recurrence, ["30 seconds", "30 seconds"])
        self.assertIsNotNone(eoc.condition)


class TestMathBasedConditions(unittest.TestCase):
    """Tests for complex math-based conditions with probability."""

    def test_probability_with_complex_jmath_expressions(self):
        """EOC with complex probability calculation using jmath."""
        eoc = (
            EOCBuilder("EOC_DRAIN_EFFECT_CHECK_HEADACHE")
            .with_condition({"math": ["u_vitamin('vitamin_psionic_drain') >= 15"]})
            .with_effect({
                "if": {
                    "math": [
                        "x_in_y_chance(psionic_power_success_formula(), 100) == 1"
                    ]
                },
                "then": {"u_add_effect": "effect_headache"}
            })
            .build()
        )
        
        self.assertIsNotNone(eoc.condition)
        self.assertIsInstance(eoc.effect, dict)
        self.assertIn("if", eoc.effect)

    def test_multi_stage_probability_calculations(self):
        """EOC with multiple probability stages and conditional effects."""
        eoc = (
            EOCBuilder("EOC_NETHER_EFFECT_CHECK_COLD_WIND")
            .with_condition({"math": ["u_vitamin('vitamin_psionic_drain') >= 15"]})
            .with_effect([
                {
                    "if": {"math": ["u_vitamin('vitamin_psionic_drain') < 50"]},
                    "then": {"u_add_effect": "effect_cold_wind", "intensity": 1}
                },
                {
                    "if": {"math": ["u_vitamin('vitamin_psionic_drain') >= 50"]},
                    "then": {"u_add_effect": "effect_cold_wind", "intensity": 2}
                }
            ])
            .build()
        )
        
        self.assertIsInstance(eoc.effect, list)
        self.assertEqual(len(eoc.effect), 2)


class TestWeightedListEOCs(unittest.TestCase):
    """Tests for weighted list EOCs with random selection."""

    def test_random_effect_selection_with_weights(self):
        """EOC with weighted list for random effect selection."""
        eoc = (
            EOCBuilder("EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES")
            .with_condition({"math": ["u_vitamin('vitamin_psionic_drain') >= 15"]})
            .with_effect({
                "weighted_list_eocs": [
                    ["EOC_DRAIN_EFFECT_CHECK_HEADACHE", 12],
                    ["EOC_DRAIN_EFFECT_CHECK_DIZZINESS", 8],
                    ["EOC_NETHER_EFFECT_CHECK_COLD_WIND", 5],
                    ["EOC_NETHER_EFFECT_CHECK_RIFT", 1]
                ]
            })
            .build()
        )
        
        self.assertIn("weighted_list_eocs", eoc.effect)
        weighted_list = eoc.effect["weighted_list_eocs"]
        self.assertEqual(len(weighted_list), 4)
        # Verify weight format: [eoc_id, weight]
        for entry in weighted_list:
            self.assertIsInstance(entry, list)
            self.assertEqual(len(entry), 2)

    def test_portal_storm_effects_weighted(self):
        """Recurring EOC with weighted list for portal storm effects."""
        eoc = (
            EOCBuilder("EOC_PORTAL_EFFECTS_ACTIVE")
            .with_type(EOCType.RECURRING)
            .with_recurrence(["20 seconds", "50 seconds"])
            .as_global()
            .with_condition({"is_weather": "portal_storm"})
            .with_effect({
                "weighted_list_eocs": [
                    ["EOC_PORTAL_MESSAGE", 50],
                    ["EOC_PORTAL_DAMAGE", 30],
                    ["EOC_PORTAL_TELEPORT", 15],
                    ["EOC_PORTAL_SPAWN_ENTITY", 5]
                ]
            })
            .build()
        )
        
        self.assertTrue(eoc.global_)
        self.assertIn("weighted_list_eocs", eoc.effect)


class TestInventoryEOCs(unittest.TestCase):
    """Tests for inventory EOCs with u_run_inv_eocs."""

    def test_equipment_scanner_with_multiple_search_criteria(self):
        """Inventory EOC with multiple search criteria."""
        eoc = (
            EOCBuilder("EOC_XEDRA_CHRONOMANCER_REVERSE_ENTROPY_INV_SCANNER")
            .with_condition({"u_has_effect": "effect_xedra_chronomancer_reverse_entropy"})
            .with_effect({
                "u_run_inv_eocs": "all",
                "search_data": [
                    {"is_chargeable": True}
                ],
                "true_eocs": [
                    {"math": ["v_item_charge += 1"]}
                ]
            })
            .build()
        )
        
        self.assertIn("u_run_inv_eocs", eoc.effect)
        self.assertIn("search_data", eoc.effect)
        self.assertEqual(eoc.effect["u_run_inv_eocs"], "all")

    def test_iron_intolerance_with_material_search(self):
        """Inventory EOC searching for items with specific materials."""
        eoc = (
            EOCBuilder("EOC_XE_IRON_INTOLERANCE_WEARING_IRON_FOLLOWUP")
            .with_effect({
                "u_run_inv_eocs": "all",
                "search_data": [
                    {"material": "iron", "worn_only": True},
                    {"material": "iron", "wielded_only": True}
                ],
                "true_eocs": [
                    {"u_add_effect": "effect_iron_poisoning"}
                ],
                "false_eocs": [
                    {"u_lose_effect": "effect_iron_poisoning"}
                ]
            })
            .build()
        )
        
        self.assertIsInstance(eoc.effect["search_data"], list)
        self.assertEqual(len(eoc.effect["search_data"]), 2)
        self.assertIn("true_eocs", eoc.effect)
        self.assertIn("false_eocs", eoc.effect)

    def test_shapeshifting_armor_check(self):
        """Inventory EOC for equipment compatibility checking."""
        eoc = (
            EOCBuilder("EOC_SHAPESHIFTING_ARMOR_CHECK_SUBSUME_INTO_FORM")
            .with_effect({
                "u_run_inv_eocs": "all",
                "search_data": [{"is_armor": True}],
                "true_eocs": [
                    {"u_message": "This armor cannot be worn in this form.", "type": "bad"}
                ]
            })
            .build()
        )
        
        self.assertIsNotNone(eoc.effect)


class TestComplexVariableManipulation(unittest.TestCase):
    """Tests for complex variable manipulation and state management."""

    def test_dynamic_variable_saving_with_string_parsing(self):
        """EOC saving multiple character state variables dynamically."""
        eoc = (
            EOCBuilder("EOC_XEDRA_TIME_SAVE_VARIABLES_DYNAMIC")
            .with_condition({"expects_vars": ["xedra_chronomancer_prefix"]})
            .with_effect([
                {
                    "set_string_var": "u_xedra_location_before_<context_val:xedra_chronomancer_prefix>",
                    "value": {"u_location_variable": {"var_val": "target_var"}, "min_radius": 0, "max_radius": 0},
                    "parse_tags": True
                },
                {
                    "set_string_var": "u_xedra_pain_before_<context_val:xedra_chronomancer_prefix>",
                    "value": {"math": ["u_pain()"]},
                    "parse_tags": True
                },
                {
                    "set_string_var": "u_xedra_hp_all_before_<context_val:xedra_chronomancer_prefix>",
                    "value": {"math": ["u_hp('ALL')"]},
                    "parse_tags": True
                }
            ])
            .build()
        )
        
        self.assertEqual(len(eoc.effect), 3)
        for effect in eoc.effect:
            self.assertIn("set_string_var", effect)
            self.assertTrue(effect.get("parse_tags", False))

    def test_dynamic_variable_loading(self):
        """EOC loading and restoring character state from variables."""
        eoc = (
            EOCBuilder("EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC")
            .with_condition({"expects_vars": ["xedra_chronomancer_prefix"]})
            .with_effect([
                {
                    "u_teleport": {
                        "var_val": "u_xedra_location_before_<context_val:xedra_chronomancer_prefix>"
                    }
                },
                {
                    "math": [
                        "u_pain() = v_temp_var"
                    ]
                },
                {
                    "math": [
                        "u_hp('ALL') = v_temp_var"
                    ]
                }
            ])
            .build()
        )
        
        self.assertIsInstance(eoc.effect, list)
        self.assertGreaterEqual(len(eoc.effect), 3)


class TestComplexNestedEOCs(unittest.TestCase):
    """Tests for complex nested inline EOCs."""

    def test_multi_level_nested_decision_tree(self):
        """EOC with nested if-then conditionals."""
        eoc = (
            EOCBuilder("EOC_MULTI_LEVEL_NESTED_DECISION")
            .with_condition({"math": ["u_val('test_var') > 0"]})
            .with_effect({
                "if": {"math": ["u_val('level1') > 10"]},
                "then": {
                    "if": {"math": ["u_val('level2') > 20"]},
                    "then": {
                        "if": {"math": ["u_val('level3') > 30"]},
                        "then": {"u_add_effect": "effect_deep_effect"},
                        "else": {"u_add_effect": "effect_mid_effect"}
                    },
                    "else": {"u_add_effect": "effect_shallow_effect"}
                }
            })
            .build()
        )
        
        self.assertIn("if", eoc.effect)
        self.assertIn("then", eoc.effect)

    def test_shapeshifter_activity_check(self):
        """EVENT EOC with activity condition and complex nested effects."""
        eoc = (
            EOCBuilder("EOC_XE_SHAPESHIFTED_ANIMALS_CANT_DO_THAT")
            .with_type(EOCType.EVENT)
            .with_event("character_starts_activity")
            .with_condition({
                "and": [
                    {"u_has_trait": "SHAPESHIFTER_ANIMAL_FORM"},
                    {
                        "or": [
                            {"compare_string": ["activity_id", "ACT_CRAFT"]},
                            {"compare_string": ["activity_id", "ACT_READ"]},
                            {"compare_string": ["activity_id", "ACT_MEDITATE"]}
                        ]
                    }
                ]
            })
            .with_effect([
                "u_cancel_activity",
                {"u_message": "You can't perform that activity while in the form of an animal.", "type": "bad"}
            ])
            .build()
        )
        
        self.assertEqual(eoc.eoc_type, EOCType.EVENT)
        self.assertIsInstance(eoc.effect, list)
        self.assertEqual(len(eoc.effect), 2)


class TestForeachLoops(unittest.TestCase):
    """Tests for foreach loop effects."""

    def test_body_part_healing_loop(self):
        """Foreach loop iterating over body parts for healing."""
        eoc = (
            EOCBuilder("EOC_BODY_PART_HEALING_LOOP")
            .with_effect({
                "foreach": "array",
                "target": ["arm_l", "arm_r", "leg_l", "leg_r", "torso", "head"],
                "var": {"context_val": "id"},
                "effect": [
                    {
                        "if": {"math": ["u_hp(_id) < u_hp_max(_id)"]},
                        "then": {"math": ["u_hp(_id) += 1"]}
                    }
                ]
            })
            .build()
        )
        
        effect = eoc.effect
        self.assertEqual(effect["foreach"], "array")
        self.assertIsInstance(effect["target"], list)
        self.assertEqual(len(effect["target"]), 6)

    def test_spell_selection_with_foreach(self):
        """Foreach loop for spell-based effects."""
        eoc = (
            EOCBuilder("EOC_SPELL_SELECTION_FOREACH")
            .with_effect({
                "foreach": "array",
                "target": ["spell_1", "spell_2", "spell_3"],
                "var": {"context_val": "spell_id"},
                "effect": [
                    {"math": ["u_spell_level(_spell_id) += 1"]}
                ]
            })
            .build()
        )
        
        self.assertIn("foreach", eoc.effect)
        self.assertIn("target", eoc.effect)
        self.assertIn("effect", eoc.effect)


class TestComplexJmathFunctions(unittest.TestCase):
    """Tests for complex jmath function chains."""

    def test_psionic_power_success_formula(self):
        """Complex chained jmath functions for power calculation."""
        eoc = (
            EOCBuilder("EOC_PSIONIC_POWER_SUCCESS")
            .with_condition({
                "math": [
                    "psionic_power_success_formula() > 0"
                ]
            })
            .build()
        )
        
        self.assertIsNotNone(eoc.condition)
        self.assertIn("math", eoc.condition)

    def test_concentration_calculations(self):
        """Concentration-based calculation with multiple modifiers."""
        eoc = (
            EOCBuilder("EOC_CONCENTRATION_CHECK")
            .with_condition({
                "math": [
                    "concentration_calculations() > concentration_trait_bonuses()"
                ]
            })
            .with_effect({
                "math": [
                    "u_spell_cast_success = concentration_nether_attunement_influences()"
                ]
            })
            .build()
        )
        
        self.assertIsNotNone(eoc.condition)
        self.assertIsNotNone(eoc.effect)

    def test_nether_attunement_influence(self):
        """Nether attunement influence calculation."""
        eoc = (
            EOCBuilder("EOC_NETHER_ATTUNEMENT_INFLUENCE")
            .with_effect({
                "math": [
                    "u_vitamin('vitamin_psionic_drain') += nether_attune_torrential_channeling_influence()"
                ]
            })
            .build()
        )
        
        self.assertIsNotNone(eoc.effect)


class TestTimeBasedEOCs(unittest.TestCase):
    """Tests for time-based EOCs with scheduling."""

    def test_meditation_with_ongoing_checks(self):
        """EOC with activity assignment and time-based recursion."""
        eoc = (
            EOCBuilder("EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY")
            .with_effect([
                {"u_assign_activity": "ACT_XEDRA_CHRONOMANCER_MEDITATE", "duration": "200 days"},
                {"u_add_effect": "effect_xedra_rewrite_wound_causality", "duration": "PERMANENT"},
                {
                    "run_eocs": "EOC_XEDRA_CHRONOMANCER_REWRITE_WOUND_CAUSALITY_ONGOING_MANA",
                    "time_in_future": {"math": ["180 + (u_spell_level('xedra_chronomancer_rewrite_wound_causality') * 12)"]}
                }
            ])
            .build()
        )
        
        self.assertIsInstance(eoc.effect, list)
        self.assertEqual(len(eoc.effect), 3)
        self.assertIn("time_in_future", eoc.effect[2])

    def test_recursive_time_loop(self):
        """EOC that recursively calls itself with time delay."""
        eoc = (
            EOCBuilder("EOC_XEDRA_TIME_LOOP_LOOP")
            .with_condition({"u_has_effect": "effect_xedra_time_loop"})
            .with_effect([
                {"run_eocs": "EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC", "variables": {"xedra_chronomancer_prefix": "time_loop"}},
                {
                    "run_eocs": "EOC_XEDRA_TIME_LOOP_LOOP",
                    "time_in_future": "5 seconds"
                }
            ])
            .build()
        )
        
        self.assertEqual(len(eoc.effect), 2)
        self.assertIn("time_in_future", eoc.effect[1])


class TestPreventDeathEOCs(unittest.TestCase):
    """Tests for PREVENT_DEATH type EOCs."""

    def test_death_prevention_with_state_restoration(self):
        """PREVENT_DEATH EOC that restores character state."""
        eoc = (
            EOCBuilder("EOC_XEDRA_CHRONOMANCER_STABLE_TIMELOOP_PREVENT_DEATH")
            .with_type(EOCType.PREVENT_DEATH)
            .with_condition({"u_has_effect": "effect_xedra_chronomancer_stable_timeloop"})
            .with_effect([
                {"math": ["u_vitamin('blood') = 0"]},
                "u_prevent_death",
                {"math": ["u_hp('ALL') = 1000"]},
                {"u_lose_effect": "effect_xedra_chronomancer_stable_timeloop"}
            ])
            .build()
        )
        
        self.assertEqual(eoc.eoc_type, EOCType.PREVENT_DEATH)
        self.assertIsInstance(eoc.effect, list)
        self.assertIn("u_prevent_death", eoc.effect)


class TestActivityBasedEOCs(unittest.TestCase):
    """Tests for activity-based EOCs."""

    def test_activity_start_and_end_events(self):
        """Paired EOCs for activity start and end."""
        start_eoc = (
            EOCBuilder("eoc_xedra_time_freeze_character_start_activity")
            .with_type(EOCType.EVENT)
            .with_event("character_gains_effect")
            .with_condition({"compare_string": ["effect_xedra_time_freeze", {"context_val": "effect"}]})
            .with_effect([
                {"u_assign_activity": "act_xedra_time_freeze", "duration": "200 days"},
                {
                    "run_eocs": "EOC_XEDRA_TIME_SAVE_VARIABLES_DYNAMIC",
                    "variables": {"xedra_chronomancer_prefix": "time_freeze"}
                }
            ])
            .build()
        )

        end_eoc = (
            EOCBuilder("eoc_xedra_time_freeze_character_end_activity")
            .with_type(EOCType.EVENT)
            .with_event("character_loses_effect")
            .with_condition({"compare_string": ["effect_xedra_time_freeze", {"context_val": "effect"}]})
            .with_effect([
                "u_cancel_activity",
                {
                    "run_eocs": "EOC_XEDRA_TIME_LOAD_VARIABLES_DYNAMIC",
                    "variables": {"xedra_chronomancer_prefix": "time_freeze"}
                }
            ])
            .build()
        )

        self.assertEqual(start_eoc.required_event, "character_gains_effect")
        self.assertEqual(end_eoc.required_event, "character_loses_effect")


class TestComplexConditionLogic(unittest.TestCase):
    """Tests for complex condition logic including material checks."""

    def test_multi_material_steel_check(self):
        """Complex condition checking for multiple materials."""
        eoc = (
            EOCBuilder("EOC_XE_IRON_INTOLERANCE_WEARING_STEEL_FOLLOWUP")
            .with_condition({
                "and": [
                    {"u_has_trait": "IRON_INTOLERANCE"},
                    {
                        "or": [
                            {"u_has_effect": "effect_worn_item_steel"},
                            {"u_has_effect": "effect_wielded_item_steel"}
                        ]
                    }
                ]
            })
            .with_effect({
                "u_run_inv_eocs": "all",
                "search_data": [
                    {"material": "steel", "worn_only": True},
                    {"material": "steel", "wielded_only": True}
                ],
                "true_eocs": [
                    {"u_add_effect": "effect_steel_allergy", "duration": "30 minutes"}
                ]
            })
            .build()
        )
        
        self.assertIn("and", eoc.condition)
        self.assertIn("or", eoc.condition["and"][1])


class TestEOCSerialization(unittest.TestCase):
    """Tests for EOC JSON serialization."""

    def test_serialization_with_complex_structure(self):
        """Verify complex EOC serializes to valid JSON."""
        eoc = (
            EOCBuilder("EOC_COMPLEX_TEST")
            .with_type(EOCType.EVENT)
            .with_event("test_event")
            .with_condition({
                "and": [
                    {"u_has_trait": "TEST_TRAIT"},
                    {"math": ["u_val('test') > 5"]}
                ]
            })
            .with_effect([
                {"math": ["u_var = 1"]},
                {"u_message": "Test message"}
            ])
            .build()
        )
        
        json_str = EOCSerializer().serialize(eoc)
        data = json.loads(json_str)
        
        self.assertEqual(data["type"], "effect_on_condition")
        self.assertEqual(data["id"], "EOC_COMPLEX_TEST")
        self.assertEqual(data["eoc_type"], "EVENT")
        self.assertEqual(data["required_event"], "test_event")

    def test_global_eoc_serialization(self):
        """Verify global flag is properly serialized."""
        eoc = (
            EOCBuilder("EOC_GLOBAL_TEST")
            .as_global(run_for_npcs=True)
            .with_effect({"u_message": "Global effect"})
            .build()
        )
        
        json_str = EOCSerializer().serialize(eoc)
        data = json.loads(json_str)
        
        self.assertTrue(data.get("global"))
        self.assertTrue(data.get("run_for_npcs"))

    def test_serialization_omits_none_values(self):
        """Verify None values are not included in serialized output."""
        eoc = EOCBuilder("EOC_MINIMAL").with_effect({"u_message": "test"}).build()
        json_str = EOCSerializer().serialize(eoc)
        data = json.loads(json_str)
        
        # These fields should not be in the output if not set
        self.assertNotIn("condition", data)
        self.assertNotIn("false_effect", data)
        self.assertNotIn("recurrence", data)
