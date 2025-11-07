import { Type as T, type Static } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export const MathSchema = T.Object({
  math: T.Union([T.Array(T.String()), T.String()]),
});
export const OneInChanceSchema = T.Object({
  one_in_chance: T.Number(),
});

export const LeafEocConditionSchema = T.Union([
  T.String(),
  MathSchema,
  OneInChanceSchema,
  T.Object({
    npc_has_species: T.String(),
  }),
  T.Object({
    u_has_trait: T.String(),
  }),
  T.Object({
    u_has_item: T.Optional(T.String()),
  }),
  T.Object({
    not: T.Optional(T.String()),
  }),
]);
export type LeafEocCondition = Static<typeof LeafEocConditionSchema>;
export const LeafEocConditionValidator = TypeCompiler.Compile(LeafEocConditionSchema);
export function isLeafEocCondition(data: unknown): data is LeafEocCondition {
  return LeafEocConditionValidator.Check(data);
}

// const RefCompundEocConditionSchema=Type.Ref("CompundEocCondition");
// export const CompundEocConditionSchema = Type.Object({
//   and: Type.Optional(Type.Array(RefCompundEocConditionSchema)),
//   or: Type.Optional(Type.Array(RefCompundEocConditionSchema)),
//   not: Type.Optional(RefCompundEocConditionSchema),
// }, { $id: "CompundEocCondition" });
export const CompundEocConditionSchema = T.Recursive((R) => {
  // return Type.Union([Type.Object({ and: Type.Array(R) }), Type.Object({ or: Type.Array(R) }), Type.Object({ not: R })]);
  return T.Object({
    and: T.Optional(T.Array(R)),
    or: T.Optional(T.Array(R)),
    not: T.Optional(R),
  });
});
export type CompundEocCondition = Static<typeof CompundEocConditionSchema>;
export const CompundEocConditionValidator = TypeCompiler.Compile(CompundEocConditionSchema);
export function isCompundEocCondition(data: unknown): data is CompundEocCondition {
  return CompundEocConditionValidator.Check(data);
}

// export const EocConditionSchema = Type.Object({
//   ...LeafEocConditionSchema.properties,
//   ...CompundEocConditionSchema.properties,
// });

export const EocConditionSchema = T.Recursive((R) => {
  return T.Union([
    T.String(),
    T.Object({
      ...LeafEocConditionSchema.properties,
      and: T.Optional(T.Array(R)),
      or: T.Optional(T.Array(R)),
      not: T.Optional(R),
    }),
  ]);
});

export type EocCondition = Static<typeof EocConditionSchema>;
export const EocConditionValidator = TypeCompiler.Compile(EocConditionSchema);
export function isEocCondition(data: unknown): data is EocCondition {
  return EocConditionValidator.Check(data);
}

export const EocEffectSchema = T.Recursive((R) => {
  const self = T.Union([T.Array(R), R]);
  return T.Union([
    EocConditionSchema,
    T.Object({ u_message: T.String(), type: T.Optional(T.String()) }),
    T.Object({ u_add_morale: T.String(), bonus: T.Number(), max_bonus: T.Number() }),
    T.Object({
      if: EocConditionSchema,
      then: self,
      else: T.Optional(self),
    }),
  ]);
});
type EocEffect = Static<typeof EocEffectSchema>;
export const EocEffectValidator = TypeCompiler.Compile(EocEffectSchema);
export function isEocEffect(data: unknown): data is EocEffect {
  return EocEffectValidator.Check(data);
}
const ArrayOfEocEffectSchema = T.Array(EocEffectSchema);
type ArrayOfEocEffect = Static<typeof ArrayOfEocEffectSchema>;
export const ArrayOfEocEffectValidator = TypeCompiler.Compile(ArrayOfEocEffectSchema);
export function isArrayOfEocEffect(data: unknown): data is ArrayOfEocEffect {
  return ArrayOfEocEffectValidator.Check(data);
}

// test cases
if (
  !isEocEffect({
    if: { math: ["rand(600) <= addiction_rational(600, 50, u_addiction_intensity('mutagen'))"] },
    then: { u_message: "You so miss the exquisite rainbow of post-humanity.", type: "warning" },
  })
) {
  console.error("EocEffect validation failed 1");
}
if (
  !isEocEffect({
    if: { math: ["rand(600) <= addiction_rational(600, 50, u_addiction_intensity('mutagen'))"] },
    then: [
      {
        if: { math: ["rand(6) < u_addiction_intensity('mutagen')"] },
        then: { u_message: "You so miss the exquisite rainbow of post-humanity.", type: "warning" },
        else: { u_message: "Your body is SOO booorrrring.  Just a little sip to liven things up?", type: "warning" },
      },
      { u_add_morale: "morale_craving_mutagen", bonus: -20, max_bonus: -200 },
    ],
  })
) {
  console.error("EocEffect validation failed 2");
}
if (
  !isEocEffect({
    if: {
      and: [
        { math: ["u_val('focus') > 40"] },
        { math: ["rand(800) <= addiction_rational(800, 20, u_addiction_intensity('mutagen'))"] },
      ],
    },
    then: [
      { math: ["u_val('focus') -= u_addiction_intensity('mutagen')"] },
      {
        u_message: "You daydream what it'd be like if you were *different*.  Different is good.",
        type: "warning",
      },
    ],
  })
) {
  console.error("EocEffect validation failed 3");
}

export const EocItemSchema = T.Object({
  id: T.String(),
  type: T.Optional(T.Literal("effect_on_condition")),
  condition: T.Optional(EocConditionSchema),
  effect: T.Optional(T.Array(EocEffectSchema)),
  false_effect: T.Optional(T.Array(EocEffectSchema)),
});

export type EocItem = Static<typeof EocItemSchema>;
export const EocItemValidator = TypeCompiler.Compile(EocItemSchema);
export function isEocItem(data: unknown): data is EocItem {
  return EocItemValidator.Check(data);
}
