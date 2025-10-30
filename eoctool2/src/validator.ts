import Ajv from "ajv";
import addFormats from "ajv-formats";
import { EffectOnConditionSchema } from "./data";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);

const schema = EffectOnConditionSchema as any;
const validateFn = ajv.compile(schema);

export class EOCValidator {
  validate(eoc: Static<typeof EffectOnConditionSchema>): string[] {
    const ok = validateFn(eoc);
    if (ok) return [];
    return (validateFn.errors || []).map(
      (e) => `${e.instancePath} ${e.message}`
    );
  }
}
