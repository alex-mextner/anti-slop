import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src");
const guidesSource = join(root, "docs/rules");
const destination = join(root, "skills/install-anti-slop/assets/anti-slop");
const guidesDestination = join(destination, "docs/rules");
const check = process.argv.includes("--check");

function files(directory, extensions) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path, extensions);
    if (entry.name.endsWith(".test.ts")) return [];
    return extensions.has(extname(entry.name)) ? [path] : [];
  });
}

function relativeFiles(directory, extensions) {
  return files(directory, extensions).map((path) => relative(directory, path)).sort();
}

function assertMirror(sourceRoot, destinationRoot, extensions, label) {
  const expected = relativeFiles(sourceRoot, extensions);
  const actual = existsSync(destinationRoot) ? relativeFiles(destinationRoot, extensions) : [];
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`${label} differ from source; run \`pnpm sync:skill-assets\`.`);
  }
  for (const path of expected) {
    if (readFileSync(join(sourceRoot, path), "utf8") !== readFileSync(join(destinationRoot, path), "utf8")) {
      throw new Error(`${label} ${path} differs from source; run \`pnpm sync:skill-assets\`.`);
    }
  }
}

if (check) {
  assertMirror(source, destination, new Set([".ts"]), "Skill assets");
  assertMirror(guidesSource, guidesDestination, new Set([".md"]), "Rule guides");
  console.log("Skill assets and rule guides match canonical sources.");
} else {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    filter: (path) => !path.endsWith(".test.ts"),
  });
  mkdirSync(guidesDestination, { recursive: true });
  cpSync(guidesSource, guidesDestination, { recursive: true });
  console.log(`Synced ${relative(root, destination)} including docs/rules.`);
}
