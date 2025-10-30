from textwrap import dedent
from unittest import TestCase

from eoctool.enums import MessageType
from eoctool.builder import EOCBuilder
from .MindOverMatter import Eocs, Effects, U

from .base_eoc_json_test import BaseEOCJsonTest


JSON_FILE_PATH = "eoctool_test/data/EOC_DRAIN_EFFECT_CHECK_HEADACHE.json"


class Test_EOC_DRAIN_EFFECT_CHECK_HEADACHE(BaseEOCJsonTest, TestCase):
    MIN_ATTUNEMENT = 15
    BASE_CHANCE_Y = 1000
    MESSAGE = "Your head begins to throb."
    EFFECT_TYPE = MessageType.BAD
    ADD_EFFECT = Effects.PSIONIC_OVERLOAD
    DURATION_FORMULA = "time(' 30 s') * rng( ( {0} / 2 ), ( {0} * 2 ) )".format(
        U.Vitamin.PSIONIC_DRAIN
    )

    def test_basics(self):
        super()._run_test(
            JSON_FILE_PATH,
            (
                EOCBuilder(Eocs.EOC_DRAIN_EFFECT_CHECK_HEADACHE)
                .with_comment(
                    (
                        "Base is 0.5% chance from 15 attunement to 60 attunement, then scaling up 0.1% per attunement up to 10.5% chance at 160 attunement, "
                        "then scaling up 0.25% chance per attunement up to 33% chance at max, plus 1/10th the Difficulty squared."
                    )
                )
                .with_condition(
                    {"math": [f"{U.Vitamin.PSIONIC_DRAIN} >= {self.MIN_ATTUNEMENT}"]}
                )
                .with_effect(
                    [
                        {
                            "if": {
                                "x_in_y_chance": {
                                    "x": {
                                        "math": [
                                            dedent(f"""
                                            (
                                            clamp( ({U.Vitamin.PSIONIC_DRAIN} - 60), 0, 100)
                                            + clamp( ( ({U.Vitamin.PSIONIC_DRAIN} - 160) * 2.5 ), 0, 375)
                                            + (nether_attune_difficulty_scaler(u_latest_channeled_power_difficulty)) + 5)
                                            """)
                                        ]
                                    },
                                    "y": self.BASE_CHANCE_Y,
                                }
                            },
                            "then": [
                                {
                                    "u_message": self.MESSAGE,
                                    "type": self.EFFECT_TYPE,
                                },
                                {
                                    "u_add_effect": self.ADD_EFFECT,
                                    "duration": {"math": [self.DURATION_FORMULA]},
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
