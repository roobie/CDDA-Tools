import { EffectOnCondition, EffectOnConditionValue, Expr } from "./data";

// Common constants and reusable template helpers for EOC builder specs and builders
export const PERCENT_MAX = 100;

export const MESSAGE_TYPE = {
  bad: "bad",
  good: "good",
} as const;

export function setField(field: string, expr: string): any {
  return { math: [`${field} = ${expr}`] };
}

export function test_eoc(name: string): any {
  return { test_eoc: name };
}

export function runEocs(value: EffectOnConditionValue): any {
  // Accepts either a single id string, an array of ids, or structured run_eocs items.
  return { run_eocs: value };
}

export function effectOnCondition(opts: {
  id?: string;
  condition?: Expr;
  effect?: Expr;
  false_effect?: Expr;
}): any {
  const out: EffectOnCondition = {};
  if (opts.id) out.id = opts.id;
  if (opts.condition) out.condition = opts.condition;
  if (opts.effect) out.effect = opts.effect;
  if (opts.false_effect) out.false_effect = opts.false_effect;
  return out;
}

export function mathExpr(expr: string | string[]): any {
  const exprArray = typeof expr === "string" ? [expr] : expr;
  return { math: exprArray };
}

export function xInYChance(xExpr: Expr, yExpr: Expr): any {
  const x = typeof xExpr === "string" ? mathExpr(xExpr) : xExpr;
  const y = typeof yExpr === "string" ? mathExpr(yExpr) : yExpr;
  return { x_in_y_chance: { x, y } };
}

// class CondBuilder {
//   private leftSide: string;
//   constructor(leftSide: string) {
//     this.leftSide = leftSide;
//   }

//   lessThan(value: string | number): any {
//     return { math: [`${this.leftSide} < ${value}`] };
//   }
// }
// function cond(leftSide: string): CondBuilder {
//   return new CondBuilder(leftSide);
// }

export function add(...args: (string | number)[]): string {
  return args.join(" + ");
}

export function mul(...args: (string | number)[]): string {
  return `(${args.join(" * ")})`;
}

export function div(
  numerator: string | number,
  denominator: string | number,
): string {
  return `(${numerator} / ${denominator})`;
}

// Small helpers for common game EOC actions seen in real mod JSON (misc_eoc.json)
export function uHasEffect(effect: string): any {
  return { u_has_effect: effect };
}

export function uMessage(message: string, type?: string): any {
  const out: any = { u_message: message };
  if (type) out.type = type;
  return out;
}

export function uAddEffect(
  effect: string,
  duration?: string | number | any,
): any {
  const out: any = { u_add_effect: effect };
  if (duration !== undefined) out.duration = duration;
  return out;
}

export function uCastSpell(
  opts: string | { id: string; min_level?: number },
): any {
  if (typeof opts === "string") return { u_cast_spell: { id: opts } };
  return { u_cast_spell: opts };
}

// Priority-A helpers (common idioms found in misc_eoc.json)
export function uSpawnItem(
  itemId: string,
  opts?: { count?: number; suppress_message?: boolean },
): any {
  const out: any = { u_spawn_item: itemId };
  if (opts && opts.count !== undefined) out.count = opts.count;
  if (opts && opts.suppress_message !== undefined)
    out.suppress_message = opts.suppress_message;
  return out;
}

export function uRemoveItemWith(itemId: string): any {
  return { u_remove_item_with: itemId };
}

export function uHasAnyTrait(...traits: string[]): any {
  return { u_has_any_trait: traits };
}

export function compareString(value: string, contextVal: string): any {
  return { compare_string: [value, { context_val: contextVal }] };
}

export function uIsWearing(itemId: string): any {
  return { u_is_wearing: itemId };
}

export function hours(numHours: number): string {
  return `${numHours} hours`;
}

export function makeEoc(
  mutator: (eoc: EffectOnCondition) => void,
): EffectOnCondition {
  const result: EffectOnCondition = {};
  mutator(result);
  return result;
}

// Additional small helpers used by specs
export function expectsVars(...vars: string[]): any {
  return { expects_vars: vars };
}

export function oneInChance(contextVal: string): any {
  return { one_in_chance: { context_val: contextVal } };
}

export function uNearOmLocation(contextVal: string, range?: number): any {
  const out: any = { u_near_om_location: { context_val: contextVal } };
  if (range !== undefined) out.range = range;
  return out;
}

export function getCondition(name: string): any {
  return { get_condition: name };
}

export function uLocationVariable(
  globalVal: string,
  omTerrainContextVal?: string,
): any {
  const out: any = { u_location_variable: { global_val: globalVal } };
  if (omTerrainContextVal)
    out.target_params = { om_terrain: { context_val: omTerrainContextVal } };
  return out;
}

export function copyVar(contextVal: string, targetGlobalVal: string): any {
  return {
    copy_var: { context_val: contextVal },
    target_var: { global_val: targetGlobalVal },
  };
}

export function mapgenUpdate(
  mapUpdateContextVal: string,
  omTerrainContextVal: string,
): any {
  return {
    mapgen_update: [{ context_val: mapUpdateContextVal }],
    om_terrain: { context_val: omTerrainContextVal },
  };
}

export function not(condition: any) {
  return { not: condition };
}
export function hasFlag(flag: string) {
  return { u_has_flag: flag };
}
export function and(conditions: any[]) {
  return { and: conditions };
}
export function case_(cas: string | number, effect: any) {
  return {
    case: cas,
    effect
  };
}
export function runEocsWithDelay(eocId: string, delay: number | string) {
  return { run_eocs: eocId, time_in_future: delay };
}
export function addMorale(moraleType: string, bonus: number, duration: string) {
  return {
    u_add_morale: moraleType,
    bonus,
    max_bonus: bonus,
    duration,
    decay_start: duration
  };
}
export function switchCases(expr: string, cases: any[]) {
  return {
    switch: { math: [expr] },
    cases
  };
}
