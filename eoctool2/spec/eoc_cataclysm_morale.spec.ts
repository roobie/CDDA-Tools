import testJson from "./eoc_cataclysm_morale.json";
import { describe, expect, it } from "vitest";
import { EOCBuilder } from "@/builder";
import {
  not, hasFlag, and, math, runEocsWithDelay, addMorale, switchCases, mathExpr, case_
} from "@/templates";

const C ={
  FLAG_PSYCHOPATH: "PSYCHOPATH",
  EOC_ID_CATACLYSM_MORALE_INITIAL: "EOC_CATACLYSM_MORALE_INITIAL",
  EOC_ID_CATACLYSM_MORALE_INITIAL_DELAY: "EOC_CATACLYSM_MORALE_INITIAL_DELAY",
  EOC_ID_CATACLYSM_MORALE_GRADUAL: "EOC_CATACLYSM_MORALE_GRADUAL",
  MORALE_CATACLYSM_IS_BAD: "morale_cataclysm_is_bad",
  EVENT_GAME_START: "game_start",
  EVENT_CHARACTER_WAKES_UP: "character_wakes_up"
}

describe("eoc_cataclysm_morale.json", async () => {
  const targetData = testJson;

  const notPsycho = not(hasFlag(C.FLAG_PSYCHOPATH));

  it("[0] should build an EOC equivalent to the hand-crafted one.", () => {
    // EOC_CATACLYSM_MORALE_INITIAL
    const EOC_CATACLYSM_MORALE_INITIAL = new EOCBuilder(C.EOC_ID_CATACLYSM_MORALE_INITIAL)
      .event(C.EVENT_GAME_START)
      .condition(notPsycho)
      .effect([
        runEocsWithDelay(C.EOC_ID_CATACLYSM_MORALE_INITIAL_DELAY, 2)
      ]);
    expect(EOC_CATACLYSM_MORALE_INITIAL.build()).toEqual(targetData[0]);
  });

  it("[1] should build an EOC equivalent to the hand-crafted one.", () => {
    // EOC_CATACLYSM_MORALE_INITIAL_DELAY
    const EOC_CATACLYSM_MORALE_INITIAL_DELAY = new EOCBuilder(C.EOC_ID_CATACLYSM_MORALE_INITIAL_DELAY)
      .effect([
        addMorale(C.MORALE_CATACLYSM_IS_BAD, -40, "1 days")
      ]);
    expect(EOC_CATACLYSM_MORALE_INITIAL_DELAY.build()).toEqual(targetData[1]);
  });

  it("[2] should build an EOC equivalent to the hand-crafted one.", () => {
    const timeSinceCataclysmDays = "time_since('cataclysm', 'unit':'days')";
    // EOC_CATACLYSM_MORALE_GRADUAL
    const EOC_CATACLYSM_MORALE_GRADUAL = new EOCBuilder(C.EOC_ID_CATACLYSM_MORALE_GRADUAL)
      .event(C.EVENT_CHARACTER_WAKES_UP)
      .condition(
        and([
          notPsycho,
          mathExpr(`${timeSinceCataclysmDays} < 180`)
        ])
      )
      .effect([
        switchCases(
          timeSinceCataclysmDays,
          [
            [0, -40],
            [30, -30],
            [60, -20],
            [120, -10],
          ].map(([day, morale]) => case_(day, [addMorale(C.MORALE_CATACLYSM_IS_BAD, morale, "1 days")]))
        )
      ]);

    expect(EOC_CATACLYSM_MORALE_GRADUAL.build()).toEqual(targetData[2]);
  });
});
