import testJson from "./EOC_SHADOW_LOOT.json";
import { EOCBuilder } from "@/builder";
import { describe, expect, it } from "vitest";
import { uMessage, uSpawnItem, MESSAGE_TYPE } from "@/templates";
import { XedraEvolved } from "./XedraEvolved";

describe(XedraEvolved.eoc.SHADOW_LOOT, async () => {
  const targetData = testJson;

  it("should build an EOC equivalent to the hand-crafted one.", () => {
    const builder = new EOCBuilder(XedraEvolved.eoc.SHADOW_LOOT).effect([
      uMessage(
        "As the shadow dissipates, it leaves something behind.",
        MESSAGE_TYPE.good,
      ),
      uSpawnItem("shadow_singularity_piece", { count: 1 }),
    ]);

    expect(builder.build()).toEqual(targetData);
  });
});
