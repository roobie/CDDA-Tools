## Quick orientation

- Purpose: This small repo (`eoctool2`) is a TypeScript toolkit for building and validating "effect_on_condition" (EOC) JSON objects used by Cataclysm-DDA. The codebase provides a Builder (`src/builder.ts`), schema/types (`src/data.ts`), serialization (`src/serializer.ts`), validation (`src/validator.ts`) and convenient template helpers (`src/templates.ts`).

## Key files to read first

- `src/builder.ts` — primary API used by tests and higher-level code (EOCBuilder.build()/to_json()).
- `src/data.ts` — authoritative TypeBox schema (EffectOnConditionSchema) and `createDefaultEoc()` factory.
- `src/templates.ts` — small helper functions used pervasively in specs (setField, runEocs, xInYChance, mathCondition, add/mul/div).
- `src/validator.ts` — uses Ajv + TypeBox compiled schema; `EOCValidator.validate` returns string[] of validation messages.
- `src/serializer.ts` — converts internal objects to plain JSON and stringifies with indentation.
- `spec/*.spec.ts` — example-driven canonical usage. Tests typically load a reference `.json` fixture next to the spec (see `spec/EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.spec.ts`).

## Project-level conventions and patterns (do not invent)

- Builder-centric: authors create EOCs through `new EOCBuilder(id)` and a chain of `with_*` calls, then call `.build()` (which by default runs validation). When building nested pieces prefer `src/templates.ts` helpers instead of raw literals.
- Validation: The project relies on TypeBox -> Ajv. Validators return an array of error messages (strings). Consumers expect `build()` to throw if validation fails; keep that behavior when changing builder logic.
- Test fixtures: For each `*.spec.ts` there is a matching `*.json` fixture in `spec/` that the test reads using `fs` (path built with `__dirname`). Keep this pairing when adding new examples.
- Path alias: imports use `@/...` mapped in `tsconfig.json` to `src/*`. Resolve imports with that alias (editors/agents should respect `tsconfig.json` paths).

## How to run & debug (Windows PowerShell examples)

Use the npm scripts from `package.json`:

```powershell
npm run build      # tsc compile
npm run run        # runs via tsx (runtime TypeScript)
npm run test       # runs vitest (in watch mode)
```

To run a single spec file during development (fast):

```powershell
npm run test -- spec/EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.spec.ts
```

To run vitest once:

```powershell
npx vitest run
```

## Small contract for modifications

- Inputs: builders take plain JS objects/strings produced by `src/templates.ts` helpers (e.g. `xInYChance(...)`, `runEocs(...)`).
- Outputs: `EOCBuilder.build()` returns an object matching `EffectOnConditionSchema`; `to_json()` returns a pretty JSON string.
- Errors: Validation errors come from `EOCValidator.validate()` as string[]. `build()` throws when validation fails.

## Representative examples to copy/paste

- Build an event EOC (see `spec/examples.test.ts`):
  - `new EOCBuilder('EOC_TEST').with_event('on_day_start').with_effect({ u_message: '...' }).build()`

- Use helpers to produce math/condition fragments (from `src/templates.ts`):
  - `setField('u_latest_x', '_value')`
  - `xInYChance(add('a','b'), 100)`
  - `runEocs([ effectOnCondition({ id: 'ID', condition: mathCondition('x < 10') }) ])`

## Integration & external deps

- Runs purely locally — no external network calls. Key dev dependencies: TypeScript, tsx, vitest, TypeBox, Ajv (+ ajv-formats).
- `tsconfig.json` defines the `@/*` path alias. Keep it in sync if you move `src` files.

## Common pitfalls seen in the repo

- Forgetting to use template helpers leads to subtle mismatches vs the hand-crafted JSON fixtures — prefer `src/templates.ts` for consistent shape.
- Tests compare deep-equality to the JSON fixture; whitespace/ordering in serialization isn't relevant (objects are compared), but shape and keys must match exactly (e.g., `run_eocs` vs `run_eocs: [id]`).

## If you need to change validation or schemas

- Update `src/data.ts` (TypeBox schema) first, then `src/validator.ts` usage will pick it up. Add/adjust tests in `spec/` with matching JSON fixtures.

---

## Mapping to the upstream game JSON (quick reference)

- The in-repo game spec `doc/JSON/EFFECT_ON_CONDITION.md` is the canonical reference for the final JSON shape. When creating or modifying EOCs here, make sure the produced JSON follows that spec.

- Key JSON fields and how they map to this repo:
  - `type` — always `"effect_on_condition"`; provided by `createDefaultEoc()` in `src/data.ts`.
  - `id` — string identifier; passed to `new EOCBuilder(id)` and appears on output.
  - `eoc_type` — one of the enum values (`EVENT`, `RECURRING`, ...); set via `.with_type()` or implicitly by `.with_event()` / `.with_recurrence()`.
  - `required_event` — event string like `"spellcasting_finish"`; set via `.with_event()`.
  - `recurrence` — integer, object or array per the TypeBox `RecurrenceSchema` in `src/data.ts`; set via `.with_recurrence()`.
  - `condition`, `deactivate_condition` — free-form condition blocks; use `mathCondition(...)`, `test_eoc(...)` and other helpers from `src/templates.ts` to construct them.
  - `effect`, `false_effect` — arrays of effect fragments. Use `setField(...)`, `runEocs(...)`, `effectOnCondition(...)`, `xInYChance(...)` helpers to build these consistently.

- Concrete example (from `spec/EOC_PSIONICS_GAIN_NETHER_ATTUNEMENT.spec.ts`):
  - Use `setField('u_latest_channeled_power_difficulty', '_difficulty')` to produce `{ math: ["u_latest_channeled_power_difficulty = _difficulty"] }`.
  - Use `xInYChance(add(a,b), 100)` to create percentage-style `x_in_y_chance` blocks.

If the game spec requires a key not currently represented by helpers, prefer adding a focused helper to `src/templates.ts` rather than using ad-hoc literals — tests rely on consistent shapes.
If anything above is unclear or you'd like more examples (e.g., a new spec/template to copy), tell me which section to expand and I'll iterate.
