import { EffectOnCondition, createDefaultEoc } from "./data";
import { EOCType } from "./enums";
import { EOCSerializer } from "./serializer";
import { EOCValidator } from "./validator";

export class EOCBuilder {
  private eoc: EffectOnCondition;

  constructor(id: string) {
    this.eoc = createDefaultEoc(id);
  }

  with_type(eocType: EOCType): EOCBuilder {
    this.eoc.eoc_type = eocType;
    return this;
  }

  with_event(event: string): EOCBuilder {
    this.eoc.required_event = event;
    this.eoc.eoc_type = EOCType.EVENT;
    return this;
  }

  with_recurrence(recurrence: number | string | any[]): EOCBuilder {
    this.eoc.recurrence = recurrence as any;
    if (!this.eoc.eoc_type) this.eoc.eoc_type = EOCType.RECURRING;
    return this;
  }

  with_condition(condition: any): EOCBuilder {
    this.eoc.condition = condition;
    return this;
  }

  with_effect(effect: any): EOCBuilder {
    this.eoc.effect = effect;
    return this;
  }

  with_false_effect(effect: any): EOCBuilder {
    this.eoc.false_effect = effect;
    return this;
  }

  as_global(run_for_npcs = false): EOCBuilder {
    this.eoc.global = true;
    this.eoc.run_for_npcs = run_for_npcs;
    return this;
  }

  build(validate = true): EffectOnCondition {
    if (validate) {
      const errors = new EOCValidator().validate(this.eoc);
      if (errors.length) {
        throw new Error(`EOC validation failed: ${errors.join("; ")}`);
      }
    }
    // return a shallow copy to avoid external mutation
    return { ...this.eoc };
  }

  to_json(indent = 2, validate = true): string {
    const eoc = this.build(validate);
    return new EOCSerializer().serialize(eoc, indent);
  }
}
