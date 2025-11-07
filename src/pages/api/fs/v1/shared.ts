import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { APIRoute } from "astro";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = import.meta.env;

export const dataDir = path.join(env.PNPM_SCRIPT_SRC_DIR, env.DATA_DIRECTORY);

export const info = {
  directory: __dirname,
  env,
};

export function resolveDataPath(...segments: string[]) {
  return path.resolve(dataDir, ...segments);
}

export function json(data: any, responseInit?: ResponseInit | undefined) {
  return new Response(JSON.stringify(data, null, 2), responseInit);
}
