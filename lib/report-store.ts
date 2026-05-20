import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";
import { DEFAULT_COMPARE_MODELS } from "@/lib/gemini-models";
import { sanitizeCompareModels } from "@/lib/gemini-models";
import type {
  AiOutputsMap,
  PersistedReportState,
  SubjectSummary,
} from "@/lib/report-storage-types";
import {
  countSavedOutputs,
  migrateAiOutputs,
  newSubjectId,
} from "@/lib/report-storage-types";
import {
  DEFAULT_USER_INPUT,
  type UserFormInput,
} from "@/lib/user-input";

const DEFAULT_COMPARE_JSON = JSON.stringify(DEFAULT_COMPARE_MODELS);

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function getStorageMode(): "turso" | "local-file" {
  return process.env.TURSO_DATABASE_URL?.trim() ? "turso" : "local-file";
}

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH?.trim()) {
    return process.env.DATABASE_PATH.trim();
  }
  const dir = process.env.DATABASE_DIR?.trim() || path.join(process.cwd(), "data");
  return path.join(dir, "bazi.db");
}

function getClient(): Client {
  if (client) return client;

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl) {
    client = createClient(
      tursoToken ? { url: tursoUrl, authToken: tursoToken } : { url: tursoUrl },
    );
  } else {
    const filePath = getDatabasePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    client = createClient({ url: `file:${filePath}` });
  }

  return client;
}

async function ensureSchema(): Promise<void> {
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS report_sessions (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      user_input TEXT NOT NULL,
      ai_outputs TEXT NOT NULL DEFAULT '{}',
      compare_models TEXT NOT NULL DEFAULT '${DEFAULT_COMPARE_JSON.replace(/'/g, "''")}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const info = await db.execute(`PRAGMA table_info(report_sessions)`);
  const cols = info.rows.map((r) => String(r.name ?? r[1] ?? ""));
  if (!cols.includes("display_name")) {
    await db.execute(
      `ALTER TABLE report_sessions ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`,
    );
    await db.execute(`
      UPDATE report_sessions
      SET display_name = COALESCE(
        NULLIF(json_extract(user_input, '$.name'), ''),
        '未命名命主'
      )
      WHERE display_name = '' OR display_name IS NULL
    `);
  }
  if (!cols.includes("created_at")) {
    await db.execute(
      `ALTER TABLE report_sessions ADD COLUMN created_at TEXT NOT NULL DEFAULT ''`,
    );
    await db.execute(
      `UPDATE report_sessions SET created_at = updated_at WHERE created_at = '' OR created_at IS NULL`,
    );
  }
}

async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  if (!schemaReady) schemaReady = ensureSchema();
  await schemaReady;
  return fn(getClient());
}

interface SessionRow {
  id: string;
  display_name: string;
  user_input: string;
  ai_outputs: string;
  compare_models: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: Record<string, unknown>): SessionRow {
  return {
    id: String(row.id),
    display_name: String(row.display_name ?? ""),
    user_input: String(row.user_input),
    ai_outputs: String(row.ai_outputs ?? "{}"),
    compare_models: String(row.compare_models ?? DEFAULT_COMPARE_JSON),
    created_at: String(row.created_at ?? row.updated_at ?? ""),
    updated_at: String(row.updated_at),
  };
}

function parseUserInput(raw: string): UserFormInput {
  const parsed = JSON.parse(raw) as Partial<UserFormInput>;
  return { ...DEFAULT_USER_INPUT, ...parsed };
}

function parseCompareModels(raw: string | undefined): string[] {
  if (!raw) return sanitizeCompareModels(undefined);
  try {
    const parsed = JSON.parse(raw) as string[];
    return sanitizeCompareModels(Array.isArray(parsed) ? parsed : undefined);
  } catch {
    return sanitizeCompareModels(undefined);
  }
}

function rowToState(row: SessionRow): PersistedReportState {
  let aiOutputs: AiOutputsMap = {};
  try {
    aiOutputs = migrateAiOutputs(JSON.parse(row.ai_outputs));
  } catch {
    aiOutputs = {};
  }
  const userInput = parseUserInput(row.user_input);
  return {
    sessionId: row.id,
    displayName: row.display_name || userInput.name || "未命名命主",
    userInput,
    compareModels: parseCompareModels(row.compare_models),
    aiOutputs,
    updatedAt: row.updated_at,
  };
}

export async function listSubjects(): Promise<SubjectSummary[]> {
  return withDb(async (db) => {
    const result = await db.execute(
      `SELECT id, display_name, user_input, ai_outputs, updated_at
       FROM report_sessions ORDER BY updated_at DESC`,
    );
    return result.rows.map((r) => {
      const row = rowToRecord(r as Record<string, unknown>);
      let aiOutputs: AiOutputsMap = {};
      try {
        aiOutputs = migrateAiOutputs(JSON.parse(row.ai_outputs));
      } catch {
        aiOutputs = {};
      }
      let birthDate: string | undefined;
      try {
        birthDate = parseUserInput(row.user_input).birthDate;
      } catch {
        birthDate = undefined;
      }
      return {
        id: row.id,
        displayName: row.display_name || "未命名命主",
        updatedAt: row.updated_at,
        birthDate,
        generatedCount: countSavedOutputs(aiOutputs),
      };
    });
  });
}

export async function loadSubject(
  subjectId: string,
): Promise<PersistedReportState | null> {
  return withDb(async (db) => {
    const result = await db.execute({
      sql: `SELECT id, display_name, user_input, ai_outputs, compare_models, created_at, updated_at
            FROM report_sessions WHERE id = ?`,
      args: [subjectId],
    });
    const row = result.rows[0];
    if (!row) return null;
    return rowToState(rowToRecord(row as Record<string, unknown>));
  });
}

export async function saveSubject(
  subjectId: string,
  displayName: string,
  userInput: UserFormInput,
  aiOutputs: AiOutputsMap,
  compareModels: string[],
): Promise<PersistedReportState> {
  const models = sanitizeCompareModels(compareModels);
  const name = displayName.trim() || userInput.name.trim() || "未命名命主";
  const updatedAt = new Date().toISOString();

  return withDb(async (db) => {
    const existing = await db.execute({
      sql: `SELECT created_at FROM report_sessions WHERE id = ?`,
      args: [subjectId],
    });
    const createdAt =
      existing.rows[0]?.created_at != null
        ? String(existing.rows[0].created_at)
        : updatedAt;

    await db.execute({
      sql: `INSERT INTO report_sessions
            (id, display_name, user_input, ai_outputs, compare_models, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              display_name = excluded.display_name,
              user_input = excluded.user_input,
              ai_outputs = excluded.ai_outputs,
              compare_models = excluded.compare_models,
              updated_at = excluded.updated_at`,
      args: [
        subjectId,
        name,
        JSON.stringify(userInput),
        JSON.stringify(aiOutputs),
        JSON.stringify(models),
        createdAt,
        updatedAt,
      ],
    });

    return {
      sessionId: subjectId,
      displayName: name,
      userInput,
      compareModels: models,
      aiOutputs,
      updatedAt,
    };
  });
}

export async function createSubject(
  displayName: string,
  userInput?: Partial<UserFormInput>,
): Promise<PersistedReportState> {
  const id = newSubjectId();
  const input: UserFormInput = {
    ...DEFAULT_USER_INPUT,
    ...userInput,
    name: userInput?.name?.trim() || displayName.trim() || DEFAULT_USER_INPUT.name,
  };
  return saveSubject(
    id,
    displayName.trim() || input.name,
    input,
    {},
    [...DEFAULT_COMPARE_MODELS],
  );
}

export async function deleteSubject(subjectId: string): Promise<boolean> {
  return withDb(async (db) => {
    const result = await db.execute({
      sql: `DELETE FROM report_sessions WHERE id = ?`,
      args: [subjectId],
    });
    return result.rowsAffected > 0;
  });
}

/** Ensure legacy single-row `default` exists when DB is empty */
export async function ensureDefaultSubject(): Promise<PersistedReportState> {
  const subjects = await listSubjects();
  if (subjects.length > 0) {
    const loaded = await loadSubject(subjects[0].id);
    if (loaded) return loaded;
  }
  return createSubject("温曉峰", DEFAULT_USER_INPUT);
}

export function getPersistInfo() {
  return {
    storageMode: getStorageMode(),
    databasePath: getStorageMode() === "turso" ? process.env.TURSO_DATABASE_URL : getDatabasePath(),
  };
}
