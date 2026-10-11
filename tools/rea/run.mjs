import { spawn } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REA_VERSION = "6.4.0";

export function supportedNode(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) return false;
  const [major, minor] = version.split(".").map(Number);
  return (major === 22 && minor >= 19) || (major === 24 && minor >= 11) || major >= 26;
}

export function commandArgs(args) {
  const [command, ...rest] = args;
  if (command === "mcp" && rest.length === 0) return ["mcp"];
  if (command === "analyze" && rest.length === 1 && !rest[0].startsWith("-")) {
    const target = resolve(rest[0]);
    if (!statSync(target).isDirectory()) throw new Error("Supply a staged JavaScript application directory.");
    return ["analyze-javascript-application", target, "--json"];
  }
  throw new Error("Use npm run analyze -- /absolute/staged/app or npm run mcp.");
}

export function main(args = process.argv.slice(2)) {
  try {
    if (!supportedNode(process.versions.node)) {
      throw new Error("REA needs Node 22.19+, 24.11+, or 26+ (odd 23/25 unsupported). Use a separate tooling runtime.");
    }
    const cliArgs = commandArgs(args);
    const npmCli = process.env.npm_execpath;
    if (!npmCli || !/\.(?:c?js|mjs)$/i.test(npmCli)) {
      throw new Error("Start through npm run so npm_execpath points to the npm CLI.");
    }
    // No shell interpolation. npm executes only this exact REA package version.
    const child = spawn(process.execPath, [
      npmCli, "exec", "--yes", "--package=rea-agents@" + REA_VERSION, "--", "rea", ...cliArgs,
    ], { stdio: "inherit", shell: false });
    child.once("error", (error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
    child.once("exit", (code, signal) => {
      process.exitCode = code ?? (signal ? 1 : 0);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
