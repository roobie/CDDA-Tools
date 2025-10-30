from textwrap import dedent
from unittest import TestCase

# from deepdiff import DeepDiff
from eoctool.enums import MessageType
from eoctool.builder import EOCBuilder
from .MindOverMatter import Vitamins, Eocs

from .base_eoc_json_test import BaseEOCJsonTest


class Test_EOC_DRAIN_EFFECT_CHECK_HEADACHE(BaseEOCJsonTest, TestCase):
    def test_basics(self):
        JSON_FILE_PATH = "eoctool_test/data/EOC_DRAIN_EFFECT_CHECK_HEADACHE.json"
        COMMENT = (
            "Base is 0.5% chance from 15 attunement to 60 attunement, then scaling up 0.1% per attunement up to 10.5% chance at 160 attunement, "
            "then scaling up 0.25% chance per attunement up to 33% chance at max, plus 1/10th the Difficulty squared."
        )
        super()._run_test(
            JSON_FILE_PATH,
            (
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
            ),
        )
