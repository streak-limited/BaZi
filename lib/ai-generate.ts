import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type AiProvider = "gemini" | "openai";

/**
 * Models that support generateContent for this API key (v1beta).
 * Order: free-tier friendly first — see https://ai.dev/rate-limit
 */
const GEMINI_FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
] as const;

export function getAiProvider(): AiProvider {
  const p = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (p === "openai") return "openai";
  return "gemini";
}

function parseRetrySeconds(message: string): number | null {
  const m = /retry in (\d+(?:\.\d+)?)\s*s/i.exec(message);
  return m ? Math.min(Math.ceil(Number(m[1])), 120) : null;
}

function isQuotaOrRateLimitError(message: string): boolean {
  return (
    message.includes("429") ||
    /quota exceeded/i.test(message) ||
    /too many requests/i.test(message)
  );
}

function isModelUnavailableError(message: string): boolean {
  return (
    message.includes("404") ||
    /not found/i.test(message) ||
    /not supported for generateContent/i.test(message)
  );
}

function friendlyGeminiError(raw: string): string {
  if (isQuotaOrRateLimitError(raw)) {
    const wait = parseRetrySeconds(raw);
    const waitHint = wait ? `約 ${wait} 秒後再試。` : "請稍後再試。";
    return (
      `Gemini 免費額度已用完或此模型 quota 為 0。${waitHint}\n` +
      `建議：① 改 GEMINI_MODEL=gemini-2.5-flash-lite（付費最便宜）② 間隔 5 秒再 Generate ` +
      `③ https://ai.dev/rate-limit ④ 開啟 Google Cloud billing`
    );
  }
  if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
    return "GEMINI_API_KEY 無效，請到 https://aistudio.google.com/app/apikey 重新建立。";
  }
  if (isModelUnavailableError(raw)) {
    return (
      `模型名稱無效或已下架。請在 .env.local 設 GEMINI_MODEL=gemini-2.5-flash-lite ` +
      `（勿用 gemini-1.5-flash，API 已不支援）`
    );
  }
  return raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
}

function geminiModelsToTry(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const list: string[] = [];
  if (preferred) list.push(preferred);
  for (const m of GEMINI_FALLBACK_MODELS) {
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

async function generateWithGemini(
  apiKey: string,
  prompt: string,
): Promise<{ text: string; model: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = geminiModelsToTry();
  const errors: string[] = [];

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 2048,
      },
    });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim() ?? "";
        if (!text) throw new Error("Empty response from Gemini");
        return { text, model: modelName };
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        errors.push(`[${modelName}] ${raw.slice(0, 180)}`);

        if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
          throw new Error(friendlyGeminiError(raw));
        }

        if (isQuotaOrRateLimitError(raw)) {
          const waitSec = parseRetrySeconds(raw);
          if (attempt === 0 && waitSec) {
            await new Promise((r) => setTimeout(r, waitSec * 1000));
            continue;
          }
          break;
        }

        if (isModelUnavailableError(raw)) {
          break;
        }

        throw new Error(friendlyGeminiError(raw));
      }
    }
  }

  throw new Error(
    errors.length > 0
      ? friendlyGeminiError(errors.join("\n"))
      : "All Gemini models failed",
  );
}

async function generateWithGeminiModel(
  apiKey: string,
  prompt: string,
  modelName: string,
): Promise<{ text: string; model: string }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 2048,
    },
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim() ?? "";
      if (!text) throw new Error("Empty response from Gemini");
      return { text, model: modelName };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
        throw new Error(friendlyGeminiError(raw));
      }
      if (isQuotaOrRateLimitError(raw)) {
        const waitSec = parseRetrySeconds(raw);
        if (attempt === 0 && waitSec) {
          await new Promise((r) => setTimeout(r, waitSec * 1000));
          continue;
        }
      }
      throw new Error(friendlyGeminiError(raw));
    }
  }

  throw new Error(friendlyGeminiError("Gemini request failed"));
}

export async function generateReportText(
  prompt: string,
  options?: { geminiModel?: string },
): Promise<{
  text: string;
  model: string;
  provider: AiProvider;
}> {
  const provider = getAiProvider();

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Use AI_PROVIDER=gemini or add the key to .env.local",
      );
    }
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o";
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 2048,
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("Empty response from OpenAI");
    return { text, model, provider };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/app/apikey",
    );
  }

  const requested = options?.geminiModel?.trim();
  if (requested) {
    const { text, model } = await generateWithGeminiModel(apiKey, prompt, requested);
    return { text, model, provider: "gemini" };
  }

  const { text, model } = await generateWithGemini(apiKey, prompt);
  return { text, model, provider: "gemini" };
}
