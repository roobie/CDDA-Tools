import json
import unittest
from textwrap import dedent
#from deepdiff import DeepDiff
from eoctool.enums import MessageType
from eoctool.builder import EOCBuilder
from eoctool.serialization import EOCSerializer
from .MindOverMatter import Vitamins,Eocs

JSON_FILE_PATH = "eoctool_test/data/EOC_DRAIN_EFFECT_CHECK_HEADACHE.json"
COMMENT = (
    "Base is 0.5% chance from 15 attunement to 60 attunement, then scaling up 0.1% per attunement up to 10.5% chance at 160 attunement, "
    "then scaling up 0.25% chance per attunement up to 33% chance at max, plus 1/10th the Difficulty squared."
)


def read_json_file(file_path: str) -> dict:
    """Helper to read a JSON file and return its content as a dictionary."""
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def serialize_eoc(eoc: EOCBuilder) -> dict:
    """Helper to serialize an EOC object to a dictionary."""
    return EOCSerializer()._to_dict(eoc)


class TestEOCJsonComparison(unittest.TestCase):
    """Tests for comparing EOCBuilder output with static JSON files."""

    def test_eoc_drain_effect_check_headache_matches_static_json(self):
        """Test that EOCBuilder output for EOC_DRAIN_EFFECT_CHECK_HEADACHE matches the static JSON definition."""
        try:
            expected_data = read_json_file(JSON_FILE_PATH)
        except FileNotFoundError:
            self.fail(f"Static JSON file not found: {JSON_FILE_PATH}")
        except json.JSONDecodeError as e:
            self.fail(f"Failed to decode JSON file {JSON_FILE_PATH}: {e}")

        eoc = (
            EOCBuilder(Eocs.EOC_DRAIN_EFFECT_CHECK_HEADACHE)
            .with_comment(COMMENT)
            .with_condition({"math": [f"{Vitamins.U_VITAMIN_PSIONIC_DRAIN} >= 15"]})
            .with_effect(
                [
                    {
                        "if": {
                            "x_in_y_chance": {
                                "x": {
                                    "math": [
                                        dedent(f"""
                                        (
                                          clamp( ({Vitamins.U_VITAMIN_PSIONIC_DRAIN} - 60), 0, 100)
                                        + clamp( ( ({Vitamins.U_VITAMIN_PSIONIC_DRAIN} - 160) * 2.5 ), 0, 375)
                                        + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 5)
                                        """)
                                    ]
                                },
                                "y": 1000,
                            }
                        },
                        "then": [
                            {
                                "u_message": "Your head begins to throb.",
                                "type": MessageType.BAD,
                            },
                            {
                                "u_add_effect": "psionic_overload",
                                "duration": {
                                    "math": [
                                        f"time(' 30 s') * rng( ( {Vitamins.U_VITAMIN_PSIONIC_DRAIN} / 2 ), ( {Vitamins.U_VITAMIN_PSIONIC_DRAIN} * 2 ) )"
                                    ]
                                },
                            },
                        ],
                    }
                ]
            )
            .with_false_effect(
                [{"run_eocs": Eocs.EOC_PSIONICS_NETHER_ATTUNEMENT_CONSEQUENCES}]
            )
            .build()
        )

        to_compare = serialize_eoc(eoc)
        self.assertDictEqual(to_compare, expected_data, "Differences found in EOC output.")
