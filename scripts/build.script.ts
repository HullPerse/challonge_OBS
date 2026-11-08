import { mkdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dir, "..");
const releaseDir = path.join(projectRoot, "release");
const executable = path.join(releaseDir, "PivoChallonge.exe");

const run = (args: string[]): number => {
  const result = Bun.spawnSync(args, {
    cwd: projectRoot,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  return result.exitCode;
};

const frontendStatus = run(["bun", "run", "build"]);
if (frontendStatus !== 0) {
  throw new Error(`Frontend build failed with exit code ${frontendStatus}`);
}

mkdirSync(releaseDir, { recursive: true });
rmSync(executable, { force: true });

const compileStatus = run([
  "bun",
  "build",
  "--compile",
  "--target=bun-windows-x64",
  "--minify",
  "--asset=./dist",
  "--windows-icon=./public/favicon.ico",
  "--windows-title=Challonge OBS",
  "--windows-description=Local Challonge bracket and OBS overlay",
  `--outfile=${executable}`,
  "server/index.server.ts",
]);

if (compileStatus !== 0) {
  throw new Error(`Executable build failed with exit code ${compileStatus}`);
}

const megabytes = (statSync(executable).size / 1024 / 1024).toFixed(1);
console.log(`Built ${executable} (${megabytes} MB)`);
console.log("Run it from a writable folder; data/ is created next to the executable.");
