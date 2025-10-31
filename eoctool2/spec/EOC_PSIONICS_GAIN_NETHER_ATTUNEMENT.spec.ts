import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EOCBuilder } from "@/builder";
import { describe, expect, it } from "vitest";
import {
  setField,
  test_eoc,
  runEocs,
  add,
  mul,
  div,
  runEocsSingle,
  effectOnCondition,
  mathCondition,
  xInYChance,
  PERCENT_MAX,
} from "@/templates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT", async () => {
  const pathToJson = path.join(
    __dirname,
    "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.json"
  );
  const targetJson = await fs.readFile(pathToJson, "utf-8");
  const targetData = JSON.parse(targetJson);
  it("should build an EOC equivalent to the hand-crafted one.", () => {
    /* Hand-crafted EOC for reference:
{
    "type": "effect_on_condition",
    "id": "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT",
    "eoc_type": "EVENT",
    "required_event": "spellcasting_finish",
    "condition": {
        "test_eoc": "EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST"
    },
    "effect": [
        {
            "math": [
                "u_latest_channeled_power_difficulty = _difficulty"
            ]
        },
        {
            "run_eocs": [
                {
                    "id": "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK",
                    "condition": {
                        "math": [
                            "u_vitamin('vitamin_psionic_drain') < 15"
                        ]
                    },
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
                                    "effect": [
                                        {
                                            "run_eocs": "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD"
                                        }
                                    ]
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
                                                    "(u_latest_channeled_power_difficulty * u_latest_channeled_power_difficulty) + u_nether_conduit_repeated_channeling_value + (u_vitamin('vitamin_maintained_powers') * 3)"
                                                ]
                                            },
                                            "y": 100
                                        }
                                    },
                                    "effect": [
                                        {
                                            "run_eocs": "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
    */
    // example; act
    const vitamins = {
      psionic_drain: "vitamin_psionic_drain",
      maintained_powers: "vitamin_maintained_powers",
    };
    const vars = {
      vitamins,
      eoc: {
        PSIONICS_GAIN_NETHER_ATTUNEMENT: "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT",
        PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK:
          "EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK",
        RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER:
          "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER",
        RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER:
          "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER",
        RAISE_ATTUNEMENT_BELOW_THRESHOLD:
          "EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD",
        RAISE_ATTUNEMENT_ABOVE_THRESHOLD:
          "EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD",
        CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST:
          "EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST",
      },
      events: {
        ON_DAY_START: "on_day_start",
        SPELLCASTING_FINISH: "spellcasting_finish",
      },
      u: {
        latest_channeled_power_difficulty:
          "u_latest_channeled_power_difficulty",
        nether_conduit_repeated_channeling_value:
          "u_nether_conduit_repeated_channeling_value",
        vitamin: {
          psionic_drain: `u_vitamin('${vitamins.psionic_drain}')`,
          maintained_powers: `u_vitamin('${vitamins.maintained_powers}')`,
        },
      },
      placeholder: { difficulty: "_difficulty" },
      thresholds: {
        psionic_drain: 15,
      },
      factors: {
        maintained_powers_multiplier: 3,
        repeated_channeling_below_threshold_divisor: 3,
      },
    };

    // build nested pieces with intermediate variables for clarity
    // build math expressions from vars to avoid magic literals
    const latest = vars.u.latest_channeled_power_difficulty;
    const repeated = vars.u.nether_conduit_repeated_channeling_value;
    const countMaintainedActivePowers = vars.u.vitamin.maintained_powers;
    const currentPsionicDrain = vars.u.vitamin.psionic_drain;

    /*
    Summary of what the math actually does (gameplay perspective)

    - The expression computes a percentage-style chance to run an "increase attunement" EOC:
      - x_in_y_chance.x is the computed value; y = 100 should be interpreted as the value is treated as a percent chance.
    - Components and their gameplay meaning:
      - latest channeled power difficulty squared ((difficulty)^2)
        - Represents how hard the last channeled power was. Squaring makes harder casts contribute disproportionately more to the chance to gain attunement (i.e., big difficulties matter much more than small ones).
      - repeated channeling value (u_nether_conduit_repeated_channeling_value)
        - Captures how much the player has been repeatedly channeling. It increases the chance, but in the "below threshold" branch it is divided by 3 to reduce its impact (so repeated channeling is less potent there).
      - maintained powers vitamin (u_vitamin('vitamin_maintained_powers')) multiplied by 3
        - Counts powers the player is keeping active; multiplied to make maintained powers noticeably increase the chance to gain attunement.
    - Threshold logic (psionic drain vs threshold = 15)
      - If the player's psionic drain vitamin is below 15, the builder uses the "below" formula: repeated channeling contribution is scaled down (divided by 3). This makes gaining attunement harder when the player has low psionic drain.
      - If psionic drain is at/above 15, the "above" formula uses the repeated channeling value at full strength (no division), so repeated channeling gives a larger boost.
    - Net effect in play
      - Tougher channeled powers and keeping powers active meaningfully increase the chance to raise nether attunement.
      - Repeated channeling helps too, but its weight depends on the player's psionic drain: reduced impact when drain is low, full impact when drain is high.
      - The builder sets the latest difficulty first, then runs the scaling check which selects the appropriate attunement-raising EOC (below vs above threshold) so the result is applied as a follow-up event.
    */
    const latestSq = mul(latest, latest);
    const belowExpr = add(
      latestSq,
      div(repeated, vars.factors.repeated_channeling_below_threshold_divisor),
      mul(
        countMaintainedActivePowers,
        vars.factors.maintained_powers_multiplier
      )
    );
    const aboveExpr = add(
      latestSq,
      repeated,
      mul(
        countMaintainedActivePowers,
        vars.factors.maintained_powers_multiplier
      )
    );

    const belowCheckerRunEocs = runEocs([
      effectOnCondition({
        id: vars.eoc.RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER,
        condition: xInYChance(belowExpr, PERCENT_MAX),
        effect: [runEocs(vars.eoc.RAISE_ATTUNEMENT_BELOW_THRESHOLD)],
      }),
    ]);

    const aboveCheckerRunEocs = runEocs([
      effectOnCondition({
        id: vars.eoc.RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER,
        condition: xInYChance(aboveExpr, PERCENT_MAX),
        effect: [runEocs(vars.eoc.RAISE_ATTUNEMENT_ABOVE_THRESHOLD)],
      }),
    ]);

    const scalingCheck = effectOnCondition({
      id: vars.eoc.PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK,
      condition: mathCondition(
        `${currentPsionicDrain} < ${vars.thresholds.psionic_drain}`
      ),
      effect: [belowCheckerRunEocs],
      false_effect: [aboveCheckerRunEocs],
    });

    const builder = new EOCBuilder(vars.eoc.PSIONICS_GAIN_NETHER_ATTUNEMENT)
      .with_event(vars.events.SPELLCASTING_FINISH)
      .with_condition(
        test_eoc(vars.eoc.CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST)
      )
      .with_effect([
        setField(
          vars.u.latest_channeled_power_difficulty,
          vars.placeholder.difficulty
        ),
        runEocs([scalingCheck]),
      ]);

    // assert
    expect(builder.build()).toEqual(targetData);
  });
});
