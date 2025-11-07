import fs from "fs/promises";
import type { APIRoute } from "astro";
import { json, resolveDataPath } from "./shared";

export const prerender = false;

// loads a file from the data directory
export const GET: APIRoute = async ({ params, request }) => {
  const name = resolveDataPath(params.name ?? "");

  if (!(await fs.stat(name).catch(() => false))) {
    // if does not exist, return 404
    return json({ message: "Not found" }, { status: 404 });
  } else if ((await fs.stat(name)).isDirectory()) {
    // if the item is a directory, return 400
    return json({ message: "Bad Request: is a directory" }, { status: 400 });
  }

  const content = await fs.readFile(name, "utf-8");
  return new Response(content);
};

// overwrites a file in the data directory
export const POST: APIRoute = async ({ params, request }) => {
  const name = resolveDataPath(params.name ?? "");
  const body = await request.text();
  await fs.writeFile(name, body, "utf-8");
  return new Response(null, { status: 204 });
};
