import path from "path";
import fs, { WriteStream } from "fs";
import { scanConstants } from "./src/scan_constants";
import { Writable } from "stream";

const argv = process.argv.slice(2);

if (argv.length === 0) {
  console.log(
    "eoctool2 CLI\nUsage: node index.js scan-constants <rootDir> <outFile>",
  );
  process.exit(0);
}

const cmd = argv[0];
if (cmd === "scan-constants") {
  const rootDir = argv[1];
  const outFile = argv[2];
  let outstream: Writable = process.stdout;
  if (outFile != null && outFile.length > 0) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    outstream = fs.createWriteStream(outFile, { encoding: "utf-8" });
  }
  if (!rootDir) {
    console.error("scan-constants requires a root directory path");
    process.exit(2);
  }
  scanConstants(rootDir, outstream);
  console.log(`Wrote constants to ${outFile}`);
  process.exit(0);
}

// default: if single arg given, treat it as directoryRoot for backward compat
const directoryRoot = argv[0];
