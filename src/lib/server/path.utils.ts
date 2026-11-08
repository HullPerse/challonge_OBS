import { existsSync } from "node:fs";
import path from "node:path";

import { ROOT_MARKER } from "@/configs/server/path.config";

const normalize = (value: string): string => {
  if (process.platform === "win32") return value.toLowerCase();
  return value;
};

/** Path checks and project-root discovery for the server. */
export default class PathUtils {
  /** True when `candidate` resolves to `root` or a path inside it. */
  static isInsideDirectory(candidate: string, root: string): boolean {
    const resolvedRoot = normalize(path.resolve(root));
    const resolvedCandidate = normalize(path.resolve(candidate));

    return (
      resolvedCandidate === resolvedRoot ||
      resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)
    );
  }

  /** True when `candidate` is inside the project data directory. */
  static insideData(
    candidate: string,
    root: string = PathUtils.resolveProjectPath("data"),
  ): boolean {
    return PathUtils.isInsideDirectory(candidate, root);
  }

  /** True inside a compiled Bun executable with embedded assets. */
  static isStandalone(): boolean {
    return Bun.embeddedFiles.length > 0;
  }

  /** Resolves the project root from an env override, executable, or nearest package.json. */
  static resolveProjectRoot(start: string = import.meta.dirname): string {
    const override = Bun.env.BACKEND_ROOT?.trim() ?? Bun.env.PROJECT_ROOT?.trim();

    if (override) {
      const resolved = path.resolve(override);
      if (existsSync(path.join(resolved, ROOT_MARKER))) return resolved;

      throw new Error(`BACKEND_ROOT must point at a directory with ${ROOT_MARKER}: ${resolved}`);
    }

    if (PathUtils.isStandalone()) return path.dirname(process.execPath);

    let current = path.resolve(start);

    while (!existsSync(path.join(current, ROOT_MARKER))) {
      const parent = path.dirname(current);

      if (parent === current) {
        throw new Error(`Could not find ${ROOT_MARKER} above ${path.resolve(start)}`);
      }

      current = parent;
    }

    return current;
  }

  /** Resolves segments relative to the project root. */
  static resolveProjectPath(...segments: string[]): string {
    return path.resolve(PathUtils.resolveProjectRoot(), ...segments);
  }

  /** Resolves the built frontend, including Bun's embedded asset filesystem. */
  static resolveDistPath(): string {
    const override = Bun.env.BACKEND_ROOT?.trim() ?? Bun.env.PROJECT_ROOT?.trim();

    if (override || !PathUtils.isStandalone()) return PathUtils.resolveProjectPath("dist");

    return path.join(import.meta.dir, "dist");
  }
}
