import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EOCBuilder } from "../src/builder";
import { describe, expect, it } from "vitest";
import {
  setField,
  test_eoc,
  runEocs,
  runEocsSingle,
  effectOnCondition,
  mathCondition,
  xInYChance,
} from "../src/templates";

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
    const vars = {
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
        // helper function name prefix for vitamin access; used as string to build calls
        vitamin: "u_vitamin",
      },
      placeholder: { difficulty: "_difficulty" },
      vitamins: {
        psionic_drain: "vitamin_psionic_drain",
        maintained_powers: "vitamin_maintained_powers",
      },
      thresholds: {
        psionic_drain: 15,
      },
    };

    // build nested pieces with intermediate variables for clarity
    // build math expressions from vars to avoid magic literals
    const latest = vars.u.latest_channeled_power_difficulty;
    const repeated = vars.u.nether_conduit_repeated_channeling_value;
    const maintainedVitaminCall = `${vars.u.vitamin}('${vars.vitamins.maintained_powers}')`;
    const psionicDrainVitaminCall = `${vars.u.vitamin}('${vars.vitamins.psionic_drain}')`;

    const belowExpr = `(${latest} * ${latest}) + (${repeated} / 3) + (${maintainedVitaminCall} * 3)`;
    const aboveExpr = `(${latest} * ${latest}) + ${repeated} + (${maintainedVitaminCall} * 3)`;

    const belowCheckerRunEocs = runEocs([
      effectOnCondition({
        id: vars.eoc.RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER,
        condition: xInYChance(belowExpr, 100),
        effect: [runEocs(vars.eoc.RAISE_ATTUNEMENT_BELOW_THRESHOLD)],
      }),
    ]);

    const aboveCheckerRunEocs = runEocs([
      effectOnCondition({
        id: vars.eoc.RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER,
        condition: xInYChance(aboveExpr, 100),
        effect: [runEocs(vars.eoc.RAISE_ATTUNEMENT_ABOVE_THRESHOLD)],
      }),
    ]);

    const scalingCheck = effectOnCondition({
      id: vars.eoc.PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK,
      condition: mathCondition(
        `${psionicDrainVitaminCall} < ${vars.thresholds.psionic_drain}`
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
