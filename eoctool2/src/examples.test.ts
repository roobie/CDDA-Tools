import { EOC, type EOC_ID } from "../generated/core";
import { EOCBuilder } from "./builder";

import { describe, expect, it } from "vitest";
describe("EOCBuilder", () => {
  it("should build an EOC with event type", () => {
    // example; act
    const mainEoc: EOC_ID = EOC.EOC_SMARTPHONE_RECOVERY;
    const builder = new EOCBuilder(mainEoc).effect([
      {
        run_eoc_selector: [
          EOC.EOC_SMARTPHONE_RECOVERY_BASIC,
          EOC.EOC_SMARTPHONE_RECOVERY_ADVANCED,
        ] satisfies EOC_ID[],
        allow_cancel: true,
        hilight_disabled: true,
        names: ["Simple recovery", "Advanced recovery"],
        title: "Pick the recovery type",
        descriptions: [
          "Reset the smartphone completely, erasing all the data inside, but allowing to use it without restrictions.",
          "Use your computer knowledge, computer, and hackPRO, to bypass the restrictions while preserving the data inside.  Requires computer skill 4, copy of hackPRO, and laptop with at least 10 charges.",
        ],
      },
    ]);

    // assert
    expect(builder.build()).toEqual({
      type: "effect_on_condition",
      id: "EOC_SMARTPHONE_RECOVERY",
      effect: [
        {
          run_eoc_selector: [
            "EOC_SMARTPHONE_RECOVERY_BASIC",
            "EOC_SMARTPHONE_RECOVERY_ADVANCED",
          ],
          allow_cancel: true,
          hilight_disabled: true,
          names: ["Simple recovery", "Advanced recovery"],
          title: "Pick the recovery type",
          descriptions: [
            "Reset the smartphone completely, erasing all the data inside, but allowing to use it without restrictions.",
            "Use your computer knowledge, computer, and hackPRO, to bypass the restrictions while preserving the data inside.  Requires computer skill 4, copy of hackPRO, and laptop with at least 10 charges.",
          ],
        },
      ],
    });
  });
});
