import { Type, Static } from "@sinclair/typebox";
import { EOCType } from "./enums";

export const RecurrenceSchema = Type.Union([
  Type.Integer(),
  Type.Object({
    name: Type.String(),
    type: Type.String(),
    context: Type.String(),
    default: Type.Optional(Type.Union([Type.String(), Type.Integer()])),
    global: Type.Optional(Type.Boolean()),
  }),
  Type.Array(Type.Union([Type.Integer(), Type.Object({})])),
]);

export const EffectOnConditionSchema = Type.Object({
  id: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  EOC_TYPE: Type.Optional(
    Type.Union(Object.values(EOCType).map((v) => Type.Literal(v)) as any)
  ),
  recurrence: Type.Optional(RecurrenceSchema),
  required_event: Type.Optional(Type.String()),
  condition: Type.Optional(Type.Any()),
  deactivate_condition: Type.Optional(Type.Any()),
  effect: Type.Optional(Type.Any()),
  false_effect: Type.Optional(Type.Any()),
  global: Type.Optional(Type.Boolean()),
  run_for_npcs: Type.Optional(Type.Boolean()),
  comments: Type.Optional(Type.Array(Type.String())),
});

export type EffectOnCondition = Static<typeof EffectOnConditionSchema>;

export function createDefaultEoc(id: string): EffectOnCondition {
  return {
    id,
    type: "effect_on_condition",
    comments: [],
  };
}
