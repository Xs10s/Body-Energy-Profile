import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { supportedNode, commandArgs, REA_VERSION } from "./run.mjs";

test("runtime boundary excludes unsupported odd releases and prereleases", () => {
  for (const version of ["20.19.0", "22.18.9", "23.9.0", "24.10.9", "25.1.0", "26.0.0-rc.1"]) assert.equal(supportedNode(version), false);
  for (const version of ["22.19.0", "24.11.0", "26.0.0"]) assert.equal(supportedNode(version), true);
});

test("only static analysis and stdio MCP are admitted", () => {
  assert.deepEqual(commandArgs(["mcp"]), ["mcp"]);
  for (const args of [[], ["setup"], ["analyze"], ["mcp", "--port", "80"], ["analyze", "--help"], ["analyze", ".", "extra"]]) {
    assert.throws(() => commandArgs(args));
  }
});

test("explicit directory argument with spaces survives and child failures propagate", () => {
  const root = mkdtempSync(join(tmpdir(), "rea-tool-test-"));
  try {
    const target = join(root, "staged app & literal");
    mkdirSync(target);
    assert.deepEqual(commandArgs(["analyze", target]), ["analyze-javascript-application", target, "--json"]);
    const fake = join(root, "fake-npm.mjs");
    writeFileSync(fake, 'console.log(JSON.stringify(process.argv.slice(2))); process.exitCode = 7;');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./run.mjs", import.meta.url)), "analyze", target], {
      env: { ...process.env, npm_execpath: fake }, encoding: "utf8",
    });
    assert.equal(result.status, 7);
    assert.deepEqual(JSON.parse(result.stdout), [
      "exec", "--yes", "--package=rea-agents@" + REA_VERSION, "--", "rea",
      "analyze-javascript-application", target, "--json",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing target fails before package execution", () => {
  assert.throws(() => commandArgs(["analyze", join(tmpdir(), "rea-nonexistent-" + Date.now())]));
});
