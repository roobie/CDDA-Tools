import fs from "fs";
import path from "path";
import { Writable } from "stream";

type Collector = {
  ids: Set<string>;
  types: Set<string>;
  eoc_types: Set<string>;
  required_events: Set<string>;
  condition_keys: Set<string>;
  effect_keys: Set<string>;
  spawn_items: Set<string>;
  spawn_monsters: Set<string>;
  spells: Set<string>;
  missions: Set<string>;
  run_eocs: Set<string>;
  u_fields: Set<string>;
  u_functions: Map<string, Set<number>>;
};

function makeCollector(): Collector {
  return {
    ids: new Set(),
    types: new Set(),
    eoc_types: new Set(),
    required_events: new Set(),
    condition_keys: new Set(),
    effect_keys: new Set(),
    spawn_items: new Set(),
    spawn_monsters: new Set(),
    spells: new Set(),
    missions: new Set(),
    run_eocs: new Set(),
    u_fields: new Set(),
    u_functions: new Map(),
  };
}

function isObject(v: any): v is Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v);
}

function walkCondition(obj: any, collector: Collector) {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach((v) => walkCondition(v, collector));
    return;
  }
  if (!isObject(obj)) return;
  Object.keys(obj).forEach((k) => {
    collector.condition_keys.add(k);
    const v = (obj as any)[k];
    scanStringForUSymbols(v, collector);
    if (
      k === "compare_string" &&
      Array.isArray(v) &&
      typeof v[0] === "string"
    ) {
      // nothing extra
    }
    // Recurse into value
    walkCondition(v, collector);
  });
}

function walkEffectFragment(fragment: any, collector: Collector) {
  if (!fragment) return;
  if (Array.isArray(fragment)) {
    fragment.forEach((f) => walkEffectFragment(f, collector));
    return;
  }
  if (!isObject(fragment)) return;
  Object.keys(fragment).forEach((k) => {
    collector.effect_keys.add(k);
    const v = (fragment as any)[k];
    scanStringForUSymbols(v, collector);
    if (k === "u_spawn_item" && typeof v === "string")
      collector.spawn_items.add(v);
    if (k === "u_spawn_monster" && typeof v === "string")
      collector.spawn_monsters.add(v);
    if (
      (k === "u_cast_spell" || k === "npc_cast_spell") &&
      isObject(v) &&
      typeof v.id === "string"
    )
      collector.spells.add(v.id);
    if (k === "assign_mission" || k === "remove_active_mission") {
      if (typeof v === "string") collector.missions.add(v);
    }
    if (k === "run_eocs") {
      if (typeof v === "string") collector.run_eocs.add(v);
      else if (Array.isArray(v))
        v.forEach((id) => typeof id === "string" && collector.run_eocs.add(id));
      else if (isObject(v) && typeof v.id === "string")
        collector.run_eocs.add(v.id);
    }
    // recurse
    walkEffectFragment(v, collector);
  });
}

function processEoc(eoc: any, collector: Collector) {
  if (!isObject(eoc)) return;
  if (typeof eoc.id === "string") collector.ids.add(eoc.id);
  if (typeof eoc.type === "string") collector.types.add(eoc.type);
  if (typeof eoc.eoc_type === "string") collector.eoc_types.add(eoc.eoc_type);
  if (typeof eoc.required_event === "string")
    collector.required_events.add(eoc.required_event);
  // scan some top-level string fields for u_ symbols
  if (typeof eoc.id === "string") scanStringForUSymbols(eoc.id, collector);
  if (typeof eoc.type === "string") scanStringForUSymbols(eoc.type, collector);
  if (eoc.condition) walkCondition(eoc.condition, collector);
  if (eoc.deactivate_condition)
    walkCondition(eoc.deactivate_condition, collector);
  if (eoc.effect) walkEffectFragment(eoc.effect, collector);
  if (eoc.false_effect) walkEffectFragment(eoc.false_effect, collector);
}

function scanStringForUSymbols(value: any, collector: Collector) {
  if (typeof value !== "string") return;
  // find tokens that start with 'u_' optionally followed by letters, numbers, dots or underscores
  // capture an optional parenthesis block to determine if it's a function and count args
  // regex explanation:
  // 1: (u_...) the symbol
  // 2: \s*\(([^)]*)\)? optional parenthesis with captured inner contents (args)
  const re = /\b(u_[A-Za-z0-9_.-]*)(?:\s*\(([^)]*)\))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const sym = m[1];
    const argsText = m[2];
    if (typeof argsText === "string") {
      // count arguments (comma-separated) but handle empty string
      const args =
        argsText.trim().length === 0 ? 0 : argsText.split(",").length;
      let set = collector.u_functions.get(sym);
      if (!set) {
        set = new Set<number>();
        collector.u_functions.set(sym, set);
      }
      set.add(args);
    } else {
      collector.u_fields.add(sym);
    }
  }
}

function emitFunctionGroup(
  set: Map<string, Set<number>>,
  asConstName: string,
  enumName: string,
): string {
  // produce a block of doc comments for functions and an identity enum object
  const entries = Array.from(set.keys()).sort();
  const enumObj: Record<string, string> = {};
  let docs = "";
  for (const k of entries) {
    enumObj[k] = k;
    const counts = Array.from(set.get(k) || []).sort((a, b) => a - b);
    docs += `// ${k} - observed arg counts: ${counts.join(", ") || "0"}\n`;
  }
  const enumJson = JSON.stringify(enumObj, null, 2);
  return `${docs}export const ${enumName} = ${enumJson} as const;\nexport type STRING = keyof typeof ${enumName};\n`;
}

function readJsonFileSync(filePath: string): any | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function walkDir(dir: string, collector: Collector) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let counter = 0;
  for (const ent of entries) {
    console.error(
      `Scanning ${++counter}/${entries.length} in ${dir}: ${ent.name}`,
    );
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(full, collector);
    else if (ent.isFile() && ent.name.endsWith(".json")) {
      const parsed = readJsonFileSync(full);
      if (!parsed) continue;
      // recursively scan parsed content for eocs or nested structures
      scanParsed(parsed, collector);
    }
  }
}

function scanParsed(parsed: any, collector: Collector) {
  if (!parsed) return;
  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (typeof item === "string") scanStringForUSymbols(item, collector);
      else scanParsed(item, collector);
    });
    return;
  }
  if (!isObject(parsed)) {
    if (typeof parsed === "string") scanStringForUSymbols(parsed, collector);
    return;
  }

  // If this object looks like an EOC (has id or type or eoc_type or condition/effect), process it
  const maybeEocKeys = ["id", "type", "eoc_type", "condition", "effect"];
  if (maybeEocKeys.some((k) => k in parsed)) {
    // if it's an array of eocs inside a field like { eocs: [...] }, handle that
    if (Array.isArray((parsed as any).eocs)) {
      (parsed as any).eocs.forEach((e: any) => processEoc(e, collector));
    }
    // if the object itself has the shape of an eoc, process it
    processEoc(parsed, collector);
  }

  // Recursively scan all child object properties in case of nested wrappers
  Object.keys(parsed).forEach((k) => {
    const v = (parsed as any)[k];
    if (typeof v === "string") scanStringForUSymbols(v, collector);
    else if (Array.isArray(v)) {
      v.forEach((item: any) => {
        if (typeof item === "string") scanStringForUSymbols(item, collector);
        else scanParsed(item, collector);
      });
    } else if (isObject(v)) scanParsed(v, collector);
  });
}

function toArrayLiteral(set: Set<string>): string {
  return JSON.stringify(Array.from(set).sort(), null, 2);
}
function toIdentityEnumObject(
  set: Set<string>,
  prefixToRemove?: string | undefined,
): string {
  const entries = Array.from(set).sort();
  const result: Record<string, string> = {};
  for (const v of entries) {
    if (prefixToRemove && v.startsWith(prefixToRemove)) {
      result[v.substring(prefixToRemove.length)] = v;
    } else {
      result[v] = v;
    }
  }
  return JSON.stringify(result, null, 2);
}

export type GenerateDtsOptions = Partial<{
  ids: boolean;
  eoc_types: boolean;
  types: boolean;
  required_events: boolean;
  condition_keys: boolean;
  effect_keys: boolean;
  spawn_items: boolean;
  spawn_monsters: boolean;
  spells: boolean;
  missions: boolean;
  u_fields: boolean;
  u_functions: boolean;
}>;

function emitGroup(
  keyBase: string,
  set: Set<string>,
  asConstName: string,
  enumName: string,
  prefixToRemove?: string | undefined,
): string {
  // keyBase is used for comments and naming; asConstName is the exported const
  const arrLit = toArrayLiteral(set);
  const enumObj = toIdentityEnumObject(set, prefixToRemove);
  // omit
  // export const ${asConstName} = ${arrLit} as const;
  /*
  */
  return `
export const ${enumName} = ${enumObj} as const;
export type ${keyBase.toUpperCase()} = keyof typeof ${enumName};
`;
}

export async function generateDts(
  collector: Collector,
  outputStream: Writable,
  options: GenerateDtsOptions = {},
) {
  // default include all
  const include = {
    ids: options.ids ?? true,
    eoc_types: options.eoc_types ?? true,
    types: options.types ?? true,
    required_events: options.required_events ?? true,
    condition_keys: options.condition_keys ?? true,
    effect_keys: options.effect_keys ?? true,
    spawn_items: options.spawn_items ?? true,
    spawn_monsters: options.spawn_monsters ?? true,
    spells: options.spells ?? true,
    missions: options.missions ?? true,
    u_fields: options.u_fields ?? true,
    u_functions: options.u_functions ?? true,
  };

  let content = `// Generated by eoctool2 scan-constants\n`;

  if (include.ids)
    content += emitGroup("EOC_ID", collector.ids, "EOC_IDS", "EOC");

  if (include.eoc_types)
    content += emitGroup(
      "EOC_TYPE",
      collector.eoc_types,
      "EOC_TYPES",
      "EOC_TYPE_ENUM",
    );

  if (include.types)
    content += emitGroup(
      "TOP_LEVEL_TYPE",
      collector.types,
      "TOP_LEVEL_TYPES",
      "TOP_LEVEL_TYPE_ENUM",
    );

  if (include.required_events)
    content += emitGroup(
      "EVENT_ID",
      collector.required_events,
      "EVENTS",
      "EVENT",
    );

  if (include.condition_keys)
    content += emitGroup(
      "CONDITION_KEY",
      collector.condition_keys,
      "CONDITION_KEYS",
      "CONDITION_KEY_ENUM",
    );

  if (include.effect_keys)
    content += emitGroup(
      "EFFECT_KEY",
      collector.effect_keys,
      "EFFECT_KEYS",
      "EFFECT_KEY_ENUM",
    );

  if (include.spawn_items)
    content += emitGroup(
      "SPAWN_ITEM",
      collector.spawn_items,
      "SPAWN_ITEMS",
      "SPAWN_ITEM_ENUM",
    );

  if (include.spawn_monsters)
    content += emitGroup(
      "SPAWN_MONSTER",
      collector.spawn_monsters,
      "SPAWN_MONSTERS",
      "SPAWN_MONSTER_ENUM",
    );

  if (include.spells)
    content += emitGroup(
      "SPELL_ID",
      collector.spells,
      "SPELL_IDS",
      "SPELL_ID_ENUM",
    );

  if (include.missions)
    content += emitGroup(
      "MISSION_ID",
      collector.missions,
      "MISSION_IDS",
      "MISSION_ID_ENUM",
    );

  if (include.u_fields)
    content += emitGroup(
      "U_FIELD",
      new Set([...collector.u_fields, ...collector.u_functions.keys()]),
      "U_FIELDS",
      "U",
      "u_",
    );

  await new Promise((resolve, reject) => {
    outputStream.write(content, (err) => {
      if (err) reject(err);
      else resolve(null);
    });
  });
}

export async function scanConstants(rootDir: string, stream: Writable) {
  const collector = makeCollector();
  walkDir(rootDir, collector);
  await generateDts(collector, stream);
  stream.end();
}
