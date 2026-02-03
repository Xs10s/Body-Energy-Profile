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

const pythonPathCandidates = ["python3", "python"];

async function resolvePythonExecutable(): Promise<string> {
  for (const candidate of pythonPathCandidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        execFile(candidate, ["--version"], (error) => {
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
  return "python3";
}

export async function calculateEnergyProfile(input: ProfileInput): Promise<EnergyProfileResult> {
  const pythonExecutable = await resolvePythonExecutable();
  const scriptPath = join(process.cwd(), "calc_core_py", "entrypoint.py");

  const payload = JSON.stringify({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    timezone: input.timezone,
    latitude: input.latitude,
    longitude: input.longitude,
    altitude: null,
    timeUnknown: input.timeUnknown,
  });

  return new Promise<EnergyProfileResult>((resolve, reject) => {
    const child = spawn(pythonExecutable, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`calc_core_py failed (${code}): ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as EnergyProfileResult);
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}
