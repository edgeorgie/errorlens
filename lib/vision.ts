import { REPORT_SYSTEM, parseReport } from "./report.ts";
import type { ErrorReport } from "./report.ts";

export type Provider = "anthropic" | "openai";

export const PROVIDERS: Record<Provider, { label: string; model: string }> = {
  anthropic: { label: "Anthropic", model: "claude-haiku-4-5-20251001" },
  openai: { label: "OpenAI", model: "gpt-4o-mini" },
};

export interface ImagePayload {
  base64: string;
  mediaType: string;
}

export function userText(context: string): string {
  return context.trim() ? `Read the error in this screenshot. Extra context from the user: ${context.trim().slice(0, 500)}` : "Read the error in this screenshot.";
}

export function buildAnthropicBody(image: ImagePayload, context: string) {
  return {
    model: PROVIDERS.anthropic.model,
    max_tokens: 1500,
    system: REPORT_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } },
          { type: "text", text: userText(context) },
        ],
      },
    ],
  };
}

export function buildOpenAIBody(image: ImagePayload, context: string) {
  return {
    model: PROVIDERS.openai.model,
    max_tokens: 1500,
    messages: [
      { role: "system", content: REPORT_SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: userText(context) },
          { type: "image_url", image_url: { url: `data:${image.mediaType};base64,${image.base64}` } },
        ],
      },
    ],
  };
}

// Runs in the browser only. The key and the screenshot go straight to the provider, never through this app's server.
export async function analyze(provider: Provider, key: string, image: ImagePayload, context = ""): Promise<ErrorReport> {
  let reply: string;
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(buildAnthropicBody(image, context)),
    });
    if (!res.ok) throw providerError("Anthropic", res.status);
    const j = (await res.json()) as { content: { text?: string }[] };
    reply = j.content.map((c) => c.text ?? "").join("");
  } else {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(buildOpenAIBody(image, context)),
    });
    if (!res.ok) throw providerError("OpenAI", res.status);
    const j = (await res.json()) as { choices: { message: { content: string } }[] };
    reply = j.choices[0]?.message.content ?? "";
  }
  const report = parseReport(reply);
  if (!report) throw new Error("The model did not return a readable report. Try again or crop closer to the error.");
  return report;
}

export function providerError(label: string, status: number): Error {
  const hint =
    status === 401 || status === 403
      ? "Check your API key."
      : status === 429
        ? "Rate limit reached. Wait a moment and retry."
        : status >= 500
          ? "The provider is having problems. Try again later."
          : "The provider rejected the request.";
  return new Error(`${label} error ${status}. ${hint}`);
}
