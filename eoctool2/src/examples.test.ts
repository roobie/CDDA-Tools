import { EOCBuilder } from "./builder";

import { describe, expect, it } from "vitest";
describe("EOCBuilder", () => {
  it("should build an EOC with event type", () => {
    // example; act
    const builder = new EOCBuilder("EOC_TEST_EVENT")
      .with_event("on_day_start")
      .with_effect({ u_message: "A new day begins!" })
      .with_comment("example event eoc");

    // assert
    expect(builder.build()).toEqual({
      id: "EOC_TEST_EVENT",
      type: "effect_on_condition",
      eoc_type: "EVENT",
      required_event: "on_day_start",
      effect: {
        u_message: "A new day begins!",
      },
      comments: ["example event eoc"],
    });
  });
});
