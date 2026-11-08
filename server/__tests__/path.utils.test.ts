import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import PathUtils from "@/lib/server/path.utils";

const projectRoot = PathUtils.resolveProjectRoot(import.meta.dirname);

describe("path containment", () => {
  test("accepts the root and its descendants", () => {
    const root = path.join(projectRoot, "data");

    expect(PathUtils.isInsideDirectory(root, root)).toBe(true);
    expect(PathUtils.isInsideDirectory(path.join(root, "avatars", "one.webp"), root)).toBe(true);
    expect(PathUtils.insideData(path.join(root, "avatars", "one.webp"), root)).toBe(true);
  });

  test("rejects parents and sibling prefixes", () => {
    const root = path.join(projectRoot, "data");

    expect(PathUtils.isInsideDirectory(path.join(root, "..", "package.json"), root)).toBe(false);
    expect(PathUtils.isInsideDirectory(`${root}-backup`, root)).toBe(false);
  });

  test("finds the project root by package.json", () => {
    expect(existsSync(path.join(projectRoot, "package.json"))).toBe(true);
    expect(PathUtils.resolveProjectPath("package.json")).toBe(
      path.join(projectRoot, "package.json"),
    );
  });

  test("honors BACKEND_ROOT and rejects a directory without package.json", () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), "challonge-obs-root-"));
    const emptyRoot = mkdtempSync(path.join(tmpdir(), "challonge-obs-empty-"));
    const previous = Bun.env.BACKEND_ROOT;

    try {
      writeFileSync(path.join(tempRoot, "package.json"), "{}");

      Bun.env.BACKEND_ROOT = tempRoot;
      expect(PathUtils.resolveProjectRoot()).toBe(path.resolve(tempRoot));

      Bun.env.BACKEND_ROOT = emptyRoot;
      expect(() => PathUtils.resolveProjectRoot()).toThrow("package.json");
    } finally {
      if (previous === undefined) {
        delete Bun.env.BACKEND_ROOT;
      } else {
        Bun.env.BACKEND_ROOT = previous;
      }
      rmSync(tempRoot, { recursive: true, force: true });
      rmSync(emptyRoot, { recursive: true, force: true });
    }
  });
});
