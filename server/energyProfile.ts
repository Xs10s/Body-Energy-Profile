import { execFile, spawn } from "node:child_process";
import { join } from "node:path";
import type { ProfileInput } from "@shared/schema";

export interface EnergyProfileResult {
  birth_utc_datetime: string;
  birth_local_datetime_resolved: string;
  tz_offset_minutes_at_birth: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  calc_versions: Record<string, string>;
  calculation_modes: Record<string, Record<string, string | boolean>>;
  western_tropical: unknown;
  western_sidereal: unknown;
  chinese_bazi: unknown;
}

// Windows often has "py" launcher; Unix has python3 or python
const pythonPathCandidates = process.platform === "win32"
  ? ["py", "python", "python3"]
  : ["python3", "python"];

async function resolvePythonExecutable(): Promise<string> {
  for (const candidate of pythonPathCandidates) {
    try {
      const args = candidate === "py" ? ["-3", "--version"] : ["--version"];
      await new Promise<void>((resolve, reject) => {
        execFile(candidate, args, (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      return candidate;
    } catch {
      continue;
    }
  }
  return pythonPathCandidates[0];
}

export async function calculateEnergyProfile(input: ProfileInput): Promise<EnergyProfileResult> {
  const pythonExecutable = await resolvePythonExecutable();
  const scriptPath = join(process.cwd(), "calc_core_py", "entrypoint.py");

  const lat = input.latitude != null ? Number(input.latitude) : 0;
  const lon = input.longitude != null ? Number(input.longitude) : 0;

  const payload = JSON.stringify({
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? null,
    timezone: input.timezone ?? "Europe/Amsterdam",
    latitude: lat,
    longitude: lon,
    altitude: null,
    timeUnknown: input.timeUnknown ?? false,
  });

  return new Promise<EnergyProfileResult>((resolve, reject) => {
    const spawnArgs = pythonExecutable === "py" ? ["-3", scriptPath] : [scriptPath];
    const child = spawn(pythonExecutable, spawnArgs, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(new Error(`calc_core_py spawn failed: ${err.message}. Is Python installed?`));
    });
    child.on("close", (code, signal) => {
      if (code !== 0 && code != null) {
        const detail = stderr.trim() || stdout.trim() || signal || "unknown";
        reject(new Error(`calc_core_py failed (exit ${code}): ${detail}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as EnergyProfileResult);
      } catch (error) {
        reject(new Error(`calc_core_py invalid output: ${(error as Error).message}. stderr: ${stderr}`));
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}
