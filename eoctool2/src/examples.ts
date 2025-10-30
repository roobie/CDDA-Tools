import { EOCBuilder } from "./builder";
import { EOCType } from "./enums";

const builder = new EOCBuilder("EOC_SPAWN_TREE")
  .with_recurrence(3600)
  .with_condition({ map_terrain_with_flag: "TREE" })
  .with_effect({ u_message: "A tree appears..." })
  .with_comment("example recurring eoc");

console.log(builder.to_json(2));
