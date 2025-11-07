import fs from "fs/promises";
import path from "path";
import type { APIRoute } from "astro";
import { json, resolveDataPath } from "./shared";
import type { TreeNode } from "@/types/tree";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const name = resolveDataPath(params.path ?? "");
  // recursively list files and directories
  async function listDir(dir: string): Promise<TreeNode[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result: TreeNode[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          relativePath: path.relative(name, fullPath),
          type: "directory",
          children: await listDir(fullPath),
        });
      } else {
        result.push({
          name: entry.name,
          relativePath: path.relative(name, fullPath),
          type: "file",
        });
      }
    }
    return result;
  }

  const tree = await listDir(name);
  return json(tree);
};
