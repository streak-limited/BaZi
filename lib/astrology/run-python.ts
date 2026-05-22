import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

const SCRIPT = path.join(process.cwd(), "python/astrology/cli.py");
const TIMEOUT_MS = Number(process.env.ASTROLOGY_PYTHON_TIMEOUT_MS) || 30_000;

/** Venv lives next to repo — not inside it (Turbopack cannot follow symlinks in project root) */
function siblingVenvPython(): string {
  return path.join(process.cwd(), "..", ".venv-bazi-astrology", "bin", "python");
}

async function pathExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function resolvePython(): Promise<string> {
  const fromEnv = process.env.ASTROLOGY_PYTHON?.trim();
  if (fromEnv) return fromEnv;

  const sibling = siblingVenvPython();
  if (await pathExists(sibling)) return sibling;

  return "python3";
}

interface EngineResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

function spawnOnce(
  python: string,
  json: string,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(python, [SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONPATH: path.join(process.cwd(), "python/astrology"),
      },
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(
        new Error(
          `占星 Python 計算逾時（${TIMEOUT_MS}ms）。請執行：npm run setup:astrology`,
        ),
      );
    }, TIMEOUT_MS);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    proc.stdin.write(json);
    proc.stdin.end();
  });
}

function friendlyMissingModule(stderr: string, python: string): string {
  if (stderr.includes("No module named 'swisseph'")) {
    return (
      `找不到 pyswisseph（目前 Python：${python}）。\n` +
      `請在專案根目錄執行：npm run setup:astrology\n` +
      `然後重啟 npm run dev`
    );
  }
  return stderr.trim() || "占星引擎執行失敗";
}

export async function runAstrologyEngine<T>(
  payload: Record<string, unknown>,
): Promise<T> {
  const json = JSON.stringify(payload);
  const primary = await resolvePython();
  const fallbacks =
    primary !== "python3" ? ["python3"] : [];

  let lastErr: Error | null = null;

  for (const python of [primary, ...fallbacks]) {
    try {
      const { stdout, stderr, code } = await spawnOnce(python, json);
      if (code !== 0) {
        lastErr = new Error(friendlyMissingModule(stderr, python));
        continue;
      }
      const parsed = JSON.parse(stdout) as EngineResponse<T>;
      if (!parsed.ok || parsed.data === undefined) {
        throw new Error(parsed.error ?? "占星引擎回傳錯誤");
      }
      return parsed.data;
    } catch (e) {
      if (e instanceof Error && !e.message.includes("spawn")) {
        if (e.message.includes("pyswisseph") || e.message.includes("setup:astrology")) {
          throw e;
        }
      }
      lastErr =
        e instanceof Error
          ? e
          : new Error(`無法啟動 ${python}：${String(e)}`);
    }
  }

  throw (
    lastErr ??
    new Error(
      "無法執行 Python 占星引擎。請執行：npm run setup:astrology",
    )
  );
}
