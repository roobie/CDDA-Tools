import testJson from "./EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.json";
import { EOCBuilder } from "@/builder";
import * as MOM from "@generated/mom";
import { describe, expect, it } from "vitest";
import {
  setField,
  test_eoc,
  runEocs,
  add,
  mul,
  div,
  effectOnCondition,
  mathExpr,
  xInYChance,
  PERCENT_MAX,
  makeEoc,
} from "@/templates";
import { MindOverMatter } from "./MindOverMatter";

describe(MOM.EOC.EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT, async () => {
  const targetData = testJson;

  it("should build an EOC equivalent to the hand-crafted one.", () => {
    // example; act
    const thresholds = {
      psionic_drain: 15,
    };
    const factors = {
      maintained_powers_multiplier: 3,
      repeated_channeling_below_threshold_divisor: 3,
    };

    // build nested pieces with intermediate variables for clarity
    // build math expressions from vars to avoid magic literals
    const latest = MOM.U.latest_channeled_power_difficulty;
    const repeated = MOM.U.nether_conduit_repeated_channeling_value;
    const countMaintainedActivePowers =
      MindOverMatter.u.vitamin.maintained_powers;
    const currentPsionicDrain = MindOverMatter.u.vitamin.psionic_drain;

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
      div(repeated, factors.repeated_channeling_below_threshold_divisor),
      mul(countMaintainedActivePowers, factors.maintained_powers_multiplier),
    );
    const aboveExpr = add(
      latestSq,
      repeated,
      mul(countMaintainedActivePowers, factors.maintained_powers_multiplier),
    );

    const belowCheckerRunEocs = runEocs([
      effectOnCondition({
        id: MOM.EOC.EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD_CHECKER,
        condition: xInYChance(belowExpr, PERCENT_MAX),
        effect: [runEocs(MOM.EOC.EOC_RAISE_ATTUNEMENT_BELOW_THRESHOLD)],
      }),
    ]);

    const aboveCheckerRunEocs = runEocs([
      makeEoc((eoc) => {
        eoc.id = MOM.EOC.EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD_CHECKER;
        eoc.condition = xInYChance(aboveExpr, PERCENT_MAX);
        eoc.effect = [
          runEocs(MOM.EOC.EOC_RAISE_ATTUNEMENT_ABOVE_THRESHOLD),
        ];
      }),
    ]);

    const scalingCheck = effectOnCondition({
      id: MOM.EOC.EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT_SCALING_CHECK,
      condition: mathExpr([
        `${currentPsionicDrain} < ${thresholds.psionic_drain}`,
      ]),
      effect: [belowCheckerRunEocs],
      false_effect: [aboveCheckerRunEocs],
    });

    const builder = new EOCBuilder(MOM.EOC.EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT)
      .with_event(MOM.EVENT.spellcasting_finish)
      .with_condition(
        test_eoc(
          MOM.EOC.EOC_CONDITION_SPELLCASTING_FINISH_TRAIT_AND_SCHOOL_LIST,
        ),
      )
      .with_effect([
        setField(
          MOM.U.latest_channeled_power_difficulty,
          MindOverMatter.placeholder.difficulty,
        ),
        runEocs([scalingCheck]),
      ]);

    // assert
    expect(builder.build()).toEqual(targetData);
  });
});
