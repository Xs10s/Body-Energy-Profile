import { access, constants } from "node:fs/promises";
import { spawn } from "node:child_process";

const vitestPath = new URL("../node_modules/.bin/vitest", import.meta.url);

const spawnPromise = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("close", (code) => resolve(code ?? 1));
  });

const hasAllowSkip = process.env.ALLOW_TEST_SKIP === "1";

const hasLocalVitest = async () => {
  try {
    await access(vitestPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const hasVitest = async () => {
  if (await hasLocalVitest()) {
    return true;
  }

  const code = await spawnPromise("npx", ["vitest", "--version"]);
  return code === 0;
};

const hasPytest = async () => {
  const code = await spawnPromise("python3", ["-m", "pytest", "--version"]);
  return code === 0;
};

const runVitest = async () => {
  const code = await spawnPromise("npx", ["vitest", "run"]);
  process.exit(code);
};

const main = async () => {
  if (await hasPytest()) {
    const pytestCode = await spawnPromise("python3", ["-m", "pytest", "calc_core_py/tests"]);
    if (pytestCode !== 0) {
      process.exit(pytestCode);
    }
  } else {
    console.warn("Pytest not available in this environment; skipping calc_core_py tests. CI will enforce tests.");
    if (!hasAllowSkip) {
      process.exit(1);
    }
  }

  if (await hasVitest()) {
    await runVitest();
    return;
  }

  console.warn("Vitest not available in this environment; skipping tests. CI will enforce tests.");
  if (hasAllowSkip) {
    process.exit(0);
  }
  process.exit(1);
};

main();
