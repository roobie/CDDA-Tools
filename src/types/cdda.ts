import { Type, type Static } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

export const MathSchema = Type.Object({
  math: Type.Union([Type.Array(Type.String()), Type.String()]),
});

export const LeafEocConditionSchema = Type.Union([
  Type.String(),
  Type.Object({
    math: Type.Optional(MathSchema.properties.math),
    one_in_chance: Type.Optional(Type.Number()),
    u_has_trait: Type.Optional(Type.String()),
    u_has_item: Type.Optional(Type.String()),
    not: Type.Optional(Type.String()),
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
export const CompundEocConditionSchema = Type.Recursive((R) => {
  // return Type.Union([Type.Object({ and: Type.Array(R) }), Type.Object({ or: Type.Array(R) }), Type.Object({ not: R })]);
  return Type.Object({
    and: Type.Optional(Type.Array(R)),
    or: Type.Optional(Type.Array(R)),
    not: Type.Optional(R),
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

export const EocConditionSchema = Type.Recursive((R) => {
  return Type.Union([
    Type.String(),
    Type.Object({
      ...LeafEocConditionSchema.properties,
      and: Type.Optional(Type.Array(R)),
      or: Type.Optional(Type.Array(R)),
      not: Type.Optional(R),
    }),
  ]);
});

export type EocCondition = Static<typeof EocConditionSchema>;
export const EocConditionValidator = TypeCompiler.Compile(EocConditionSchema);
export function isEocCondition(data: unknown): data is EocCondition {
  return EocConditionValidator.Check(data);
}

export const EocEffectSchema = Type.Recursive((R) => {
  const self = Type.Union([Type.Array(R), R]);
  return Type.Union([
    EocConditionSchema,
    Type.Object({ u_message: Type.String(), type: Type.Optional(Type.String()) }),
    Type.Object({ u_add_morale: Type.String(), bonus: Type.Number(), max_bonus: Type.Number() }),
    Type.Object({
      if: EocConditionSchema,
      then: self,
      else: Type.Optional(self),
    }),
  ]);
});
type EocEffect = Static<typeof EocEffectSchema>;
export const EocEffectValidator = TypeCompiler.Compile(EocEffectSchema);
export function isEocEffect(data: unknown): data is EocEffect {
  return EocEffectValidator.Check(data);
}
const ArrayOfEocEffectSchema = Type.Array(EocEffectSchema);
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

export const EocItemSchema = Type.Object({
  id: Type.String(),
  type: Type.Optional(Type.Literal("effect_on_condition")),
  condition: Type.Optional(EocConditionSchema),
  effect: Type.Optional(Type.Array(EocEffectSchema)),
  false_effect: Type.Optional(Type.Array(EocEffectSchema)),
});

export type EocItem = Static<typeof EocItemSchema>;
export const EocItemValidator = TypeCompiler.Compile(EocItemSchema);
export function isEocItem(data: unknown): data is EocItem {
  return EocItemValidator.Check(data);
}
