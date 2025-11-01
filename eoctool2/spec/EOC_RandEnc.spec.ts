import testJson from "./EOC_RandEnc.json";
import { EOCBuilder } from "@/builder";
import { describe, expect, it } from "vitest";
import {
  expectsVars,
  oneInChance,
  uNearOmLocation,
  mathExpr,
  getCondition,
  mapgenUpdate,
  uLocationVariable,
  copyVar,
  setField,
} from "@/templates";

describe("EOC_RandEnc", () => {
  const targetData = testJson[0];

  it("should build an EOC equivalent to the hand-crafted one.", () => {
    const builder = new EOCBuilder("EOC_RandEnc")
      .condition({
        and: [
          expectsVars(
            "map_update",
            "omt",
            "map_removal",
            "chance",
            "days_till_spawn",
          ),
          oneInChance("chance"),
          uNearOmLocation("omt", 30),
          mathExpr([
            "time_since('cataclysm', 'unit':'days') >= _days_till_spawn",
          ]),
          mathExpr(["time_since(u_timer_caravan_RandEnc) >= time('1 d')"]),
          { not: uNearOmLocation("omt", 2) },
          getCondition("random_enc_condition"),
        ],
      })
      .effect([
        mapgenUpdate("map_update", "omt"),
        setField("u_timer_caravan_RandEnc", "time('now')"),
        // u_location_variable with target_params
        {
          u_location_variable: { global_val: "randenc_loc" },
          target_params: { om_terrain: { context_val: "omt" } },
        },
        setField("RandEnc", "1"),
        copyVar("omt", "random_encounter_omt"),
        copyVar("map_removal", "random_encounter_map_remove"),
      ]);

    expect(builder.build()).toEqual(targetData);
  });
});
