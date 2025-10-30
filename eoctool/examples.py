from eoctool.data import (
    AndCondition,
    GiveAchievementEffect,
    NotCondition,
    HasAnyTraitCondition,
    RunEOCsEffect,
)
from eoctool.builder import EOCBuilder
from eoctool.serialization import EOCSerializer


# Example 1: Simple recurring EOC
def example_simple_recurring_eoc():
    eoc = (
        EOCBuilder("EOC_PSI_NETHER_ATTUNEMENT_PERIODIC_ADJUSTMENT")
        .with_recurrence(["30 seconds", "30 seconds"])
        .with_condition(
            AndCondition(
                and_=[
                    HasAnyTraitCondition(
                        u_has_any_trait=["BIOKINETIC", "CLAIRSENTIENT"]
                    ),
                    NotCondition(not_={"u_has_effect": "effect_noetic_resilience"}),
                ]
            )
        )
        .with_effect(
            RunEOCsEffect(run_eocs="EOC_PSIONICS_SET_NETHER_ATTUNEMENT_BOOST_2")
        )
        .build()
    )

    print(EOCSerializer().serialize(eoc))


# Example 2: EVENT EOC with condition
def example_event_eoc_with_condition():
    eoc = (
        EOCBuilder("EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT")
        .with_event("character_gains_effect")
        .with_condition(
            {
                "and": [
                    {
                        "compare_string": [
                            "effect_disease_psionic_drain",
                            {"context_val": "effect"},
                        ]
                    },
                    "u_is_avatar",
                ]
            }
        )
        .with_effect(
            [
                GiveAchievementEffect(
                    give_achievement="mom_gain_any_nether_attunement"
                ),
                RunEOCsEffect(
                    run_eocs="EOC_PSI_GAIN_NETHER_ATTUNEMENT_ACHIEVEMENT_FURTHER_CHECKS"
                ),
            ]
        )
        .build()
    )

    print(EOCSerializer().serialize(eoc))


example_event_eoc_with_condition()
