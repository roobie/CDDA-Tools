import testJson from "./EOC_CALL_DAFFODIL.json";
import { EOCBuilder } from "@/builder";
import { describe, expect, it } from "vitest";
import {
  uHasEffect,
  uMessage,
  uAddEffect,
  uCastSpell,
  MESSAGE_TYPE,
  hours,
} from "@/templates";
import { XedraEvolved } from "./XedraEvolved";

describe(XedraEvolved.eoc.CALL_DAFFODIL, async () => {
  const targetData = testJson;

  it("should build an EOC equivalent to the hand-crafted one.", () => {
    const builder = new EOCBuilder(XedraEvolved.eoc.CALL_DAFFODIL)
      .condition(uHasEffect("called_daffodil"))
      .effect([
        uMessage("You can't call more daffodil yet.", MESSAGE_TYPE.bad),
      ])
      .false_effect([
        uAddEffect("called_daffodil", hours(24)),
        uCastSpell({ id: "call_daffodil_real" }),
      ]);

    expect(builder.build()).toEqual(targetData);
  });
});
