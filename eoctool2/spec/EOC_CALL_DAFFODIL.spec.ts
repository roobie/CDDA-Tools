import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { EOCBuilder } from "@/builder";
import { describe, expect, it } from "vitest";
import { uHasEffect, uMessage, uAddEffect, uCastSpell } from "@/templates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("EOC_CALL_DAFFODIL", async () => {
  const pathToJson = path.join(__dirname, "EOC_CALL_DAFFODIL.json");
  const targetJson = await fs.readFile(pathToJson, "utf-8");
  const targetData = JSON.parse(targetJson);

  it("should build an EOC equivalent to the hand-crafted one.", () => {
    const builder = new EOCBuilder("EOC_CALL_DAFFODIL")
      .with_condition(uHasEffect("called_daffodil"))
      .with_effect([uMessage("You can't call more daffodil yet.", "bad")])
      .with_false_effect([
        uAddEffect("called_daffodil", "24 hours"),
        uCastSpell({ id: "call_daffodil_real" }),
      ]);

    expect(builder.build()).toEqual(targetData);
  });
});
