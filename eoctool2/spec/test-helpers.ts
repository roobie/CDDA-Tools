import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function loadJsonTestData(fileName: string) {
  const pathToJson = path.join(__dirname, fileName);
  const targetJson = await fs.readFile(pathToJson, "utf-8");
  const targetData = JSON.parse(targetJson);
  return targetData;
}

export async function loadEocJsonTestData(eocName: string) {
  return loadJsonTestData(`${eocName}.json`);
}
