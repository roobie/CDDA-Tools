import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { APIRoute } from "astro";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = import.meta.env;

export const dataDir = path.isAbsolute(env.DATA_DIRECTORY)
  ? env.DATA_DIRECTORY
  : path.join(env.PNPM_SCRIPT_SRC_DIR, env.DATA_DIRECTORY);

export const info = {
  directory: __dirname,
  env,
};

export function resolveDataPath(...segments: string[]) {
  const toJoin = path.normalize(segments.map((x) => decodeURIComponent(x)).join("/"));
  const combined = path.join(dataDir, toJoin);
  return path.resolve(combined);
}

export function json(data: any, responseInit?: ResponseInit | undefined) {
  return new Response(JSON.stringify(data, null, 2), responseInit);
}
