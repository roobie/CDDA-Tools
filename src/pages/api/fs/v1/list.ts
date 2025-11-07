import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";
import { json, resolveDataPath } from "./shared";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const name = resolveDataPath(params.path ?? "");
  const files = await fs.readdir(path.resolve(name));
  return json({ files });
};
