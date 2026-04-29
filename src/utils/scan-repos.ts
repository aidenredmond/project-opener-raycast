import { readdirSync, statSync } from "fs";
import { join } from "path";

// Dirs to never recurse into
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "Library",
  "Applications",
  ".Trash",
  ".npm",
  ".nvm",
  ".yarn",
  ".cache",
  ".local",
  "vendor",
  "dist",
  "build",
  "__pycache__",
  ".venv",
  "venv",
]);

export interface Repo {
  name: string;
  path: string;
  /** Path relative to the base dir, shown as subtitle */
  relativePath: string;
}

export function scanRepos(baseDir: string, maxDepth = 6): Repo[] {
  const repos: Repo[] = [];

  function scan(dir: string, depth: number): void {
    if (depth > maxDepth) return;

    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    if (entries.includes(".git")) {
      repos.push({
        name: dir.split("/").pop() ?? dir,
        path: dir,
        relativePath: dir.slice(baseDir.length + 1),
      });
      // Don't recurse into repos — submodules are a separate concern
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;

      const fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          scan(fullPath, depth + 1);
        }
      } catch {
        continue;
      }
    }
  }

  scan(baseDir, 0);
  return repos;
}
