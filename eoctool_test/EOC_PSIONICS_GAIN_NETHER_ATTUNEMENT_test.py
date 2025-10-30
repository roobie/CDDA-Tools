from unittest import TestCase

from eoctool.builder import EOCBuilder
from eoctool.enums import GameEvent
from .MindOverMatter import Eocs, U
from .base_eoc_json_test import BaseEOCJsonTest
from .templates import condition_x_in_y, math, if_then_else

JSON_FILE_PATH = "eoctool_test/data/EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.json"

Y_BASE = 100

MATH_SET_LATEST = "u_latest_channeled_power_difficulty = _difficulty"
MATH_VITAMIN_CHECK = "u_vitamin('vitamin_psionic_drain') < 15"
MATH_BELOW = (
    "(u_latest_channeled_power_difficulty * u_latest_channeled_power_difficulty)"
    " + (u_nether_conduit_repeated_channeling_value / 3)"
    " + (u_vitamin('vitamin_maintained_powers') * 3)"
)
MATH_ABOVE = (
    "(u_latest_channeled_power_difficulty * u_latest_channeled_power_difficulty)"
    " + u_nether_conduit_repeated_channeling_value"
    " + (u_vitamin('vitamin_maintained_powers') * 3)"
    # ---^ and extra space removed here, because it was causing test failures since a diff showed up.
    # The explanation is that the serialization removed extra spaces, so the generated JSON didn't match the static file.
    # That is to say that the static JSON has been amended in the same way.
)


class Test_EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT(BaseEOCJsonTest, TestCase):
    def test_basics(self):
        super()._run_test(
            JSON_FILE_PATH,
            (
                EOCBuilder(Eocs.EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT)
                .with_event(GameEvent.SPELLCASTING_FINISH)
                .with_condition(
                    {
                        "test_eoc": Eocs.EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST
                    }
                )
                .with_effect(
                    [
                        {"math": [MATH_SET_LATEST]},
                        {
                            "run_eocs": [
                                {
                                    "id": Eocs.EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK,
                                    "condition": {"math": [MATH_VITAMIN_CHECK]},
                                    "effect": [
                                        {
                                            "run_eocs": [
                                                {
                                                    "id": Eocs.EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER,
                                                    "condition": {
                                                        "x_in_y_chance": {
                                                            "x": {"math": [MATH_BELOW]},
                                                            "y": Y_BASE,
                                                        }
                                                    },
                                                    "effect": [
                                                        {
                                                            "run_eocs": Eocs.EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD
                                                        }
                                                    ],
                                                }
                                            ]
                                        }
                                    ],
                                    "false_effect": [
                                        {
                                            "run_eocs": [
                                                if_then_else(
                                                    id=Eocs.EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER,
                                                    condition=condition_x_in_y(
                                                        x=math(MATH_ABOVE),
                                                        y=Y_BASE,
                                                        #     "x_in_y_chance": {
                                                        #         "x": {"math": [MATH_ABOVE]},
                                                        #         "y": Y_BASE,
                                                        #     }
                                                        # }
                                                    ),
                                                    effect=[
                                                        {
                                                            "run_eocs": Eocs.EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD
                                                        }
                                                    ],
                                                )
                                            ]
                                        }
                                    ],
                                }
                            ]
                        },
                    ]
                )
            ),
        )
