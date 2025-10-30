import json
import sys
import unittest
from textwrap import dedent

from deepdiff import DeepDiff

from eoctool.builder import EOCBuilder
from eoctool.data import EOCType
from eoctool.serialization import EOCSerializer


class TestEOCJsonComparison(unittest.TestCase):
    """Tests for comparing EOCBuilder output with static JSON files."""

    def test_eoc_drain_effect_check_headache(self):
        """Test EOCBuilder for EOC_DRAIN_EFFECT_CHECK_HEADACHE against its JSON definition."""
        # Path to the static JSON file
        json_file_path = "eoctool_test/data/EOC_DRAIN_EFFECT_CHECK_HEADACHE.json"

        # Read the static JSON file
        with open(json_file_path, "r", encoding="utf-8") as file:
            expected_data: dict = json.load(file)

        # Build the EOC using EOCBuilder
        eoc = (
            EOCBuilder("EOC_DRAIN_EFFECT_CHECK_HEADACHE")
            .with_comment(
                "Base is 0.5% chance from 15 attunement to 60 attunement, then scaling up 0.1% per attunement up to 10.5% chance at 160 attunement, then scaling up 0.25% chance per attunement up to 33% chance at max, plus 1/10th the Difficulty squared."
            )
            .with_condition({"math": ["u_vitamin('vitamin_psionic_drain') >= 15"]})
            .with_effect(
                [
                    {
                        "if": {
                            "x_in_y_chance": {
                                "x": {
                                    "math": [
                                        dedent("""
                                        (
                                          clamp( (u_vitamin('vitamin_psionic_drain') - 60), 0, 100)
                                        + clamp( ( (u_vitamin('vitamin_psionic_drain') - 160) * 2.5 ), 0, 375)
                                        + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 5)
                                        """)
                                        # Another format for: "( clamp( (u_vitamin('vitamin_psionic_drain') - 60), 0, 100) + clamp( ( (u_vitamin('vitamin_psionic_drain') - 160) * 2.5 ), 0, 375) + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 5)"
                                    ]
                                },
                                "y": 1000,
                            }
                        },
                        "then": [
                            {"u_message": "Your head begins to throb.", "type": "bad"},
                            {
                                "u_add_effect": "psionic_overload",
                                "duration": {
                                    "math": [
                                        "time(' 30 s') * rng( ( u_vitamin('vitamin_psionic_drain') / 2 ), ( u_vitamin('vitamin_psionic_drain') * 2 ) )"
                                    ]
                                },
                            },
                        ],
                    }
                ]
            )
            .with_false_effect(
                [{"run_eocs": "EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES"}]
            )
            .build()
        )

        # Compare the built EOC with the expected JSON data
        to_compare = EOCSerializer()._to_dict(eoc)
        # dump to_compare to stdout
        json.dump(to_compare, fp=sys.stdout, indent=2)
        # self.assertEqual(to_compare, expected_data)
        diff = DeepDiff(to_compare, expected_data)
        self.assertEqual(diff, {}, f"Differences found: {diff}")
