// Common constants and reusable template helpers for EOC builder specs and builders
export const PERCENT_MAX = 100;

export function setField(field: string, expr: string): any {
  return { math: [`${field} = ${expr}`] };
}

export function test_eoc(name: string): any {
  return { test_eoc: name };
}

export function runEocs(value: any): any {
  // Accepts either a single id string, an array of ids, or structured run_eocs items.
  return { run_eocs: value };
}

export function runEocsSingle(id: string): any {
  return { run_eocs: id };
}

export function effectOnCondition(opts: {
  id?: string;
  condition?: any;
  effect?: any[];
  false_effect?: any[];
}): any {
  const out: any = {};
  if (opts.id) out.id = opts.id;
  if (opts.condition) out.condition = opts.condition;
  if (opts.effect) out.effect = opts.effect;
  if (opts.false_effect) out.false_effect = opts.false_effect;
  return out;
}

export function mathCondition(expr: string): any {
  return { math: [expr] };
}

export function xInYChance(xExpr: string | any, y: number): any {
  const x = typeof xExpr === "string" ? { math: [xExpr] } : xExpr;
  return { x_in_y_chance: { x, y } };
}

class CondBuilder {
  private leftSide: string;
  constructor(leftSide: string) {
    this.leftSide = leftSide;
  }

  lessThan(value: string | number): any {
    return { math: [`${this.leftSide} < ${value}`] };
  }
}
function cond(leftSide: string): CondBuilder {
  return new CondBuilder(leftSide);
}

export function add(...args: (string | number)[]): string {
  return args.join(" + ");
}

export function mul(...args: (string | number)[]): string {
  return `(${args.join(" * ")})`;
}

export function div(
  numerator: string | number,
  denominator: string | number
): string {
  return `(${numerator} / ${denominator})`;
}
