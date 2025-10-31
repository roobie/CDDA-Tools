import { EffectOnCondition } from "./data";

/**
 * Convert internal object (matching final JSON keys) to serialized JSON string.
 * Ensures `global`/`EOC_TYPE` keys are present/normalized.
 */
export class EOCSerializer {
  toPlain(eoc: EffectOnCondition): Record<string, unknown> {
    // This assumes the object already roughly matches JSON shape
    // Copy and normalize keys if necessary.
    const out: Record<string, unknown> = {};

    if (eoc.id !== undefined) out.id = eoc.id;
    if (eoc.type !== undefined) out.type = eoc.type;
    if (eoc.eoc_type !== undefined) out.eoc_type = eoc.eoc_type;
    if (eoc.recurrence !== undefined) out.recurrence = eoc.recurrence;
    if (eoc.required_event !== undefined)
      out.required_event = eoc.required_event;
    if (eoc.condition !== undefined) out.condition = eoc.condition;
    if (eoc.deactivate_condition !== undefined)
      out.deactivate_condition = eoc.deactivate_condition;
    if (eoc.effect !== undefined) out.effect = eoc.effect;
    if (eoc.false_effect !== undefined) out.false_effect = eoc.false_effect;
    if (eoc.global !== undefined) out.global = eoc.global;
    if (eoc.run_for_npcs !== undefined) out.run_for_npcs = eoc.run_for_npcs;

    return out;
  }

  serialize(eoc: EffectOnCondition, indent = 2): string {
    const plain = this.toPlain(eoc);
    return JSON.stringify(plain, null, indent);
  }
}
