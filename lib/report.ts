export interface Cause {
  title: string;
  why: string;
  likelihood: number;
}

export interface Fix {
  step: string;
  code?: string;
}

export interface ErrorReport {
  error: string;
  stack: string;
  plain: string;
  causes: Cause[];
  fixes: Fix[];
  searches: string[];
}

export const REPORT_SYSTEM = `You are a senior engineer who reads screenshots of errors (terminal output, browser console, IDE, build logs).
Read the error text in the image carefully, then reply with ONLY a JSON object, no prose and no markdown fences:
{
  "error": "the exact main error message as shown",
  "stack": "the tool, language or framework involved, for example 'Next.js 15 / TypeScript'",
  "plain": "2 or 3 sentences explaining what happened in plain language",
  "causes": [{"title": "short cause", "why": "one sentence", "likelihood": 0.0 to 1.0}],
  "fixes": [{"step": "what to do", "code": "optional code or command"}],
  "searches": ["2 or 3 precise search queries to find docs or answers"]
}
Order causes by likelihood (2 to 4 items). Give 2 to 5 concrete fix steps. If the image has no readable error, set "error" to "No error found" and explain in "plain". Never invent text that is not visible.`;

const str = (v: unknown, max = 600) => (typeof v === "string" ? v.slice(0, max) : "");

/** Extracts and validates the report from a model reply, tolerating fences and extra text. Returns null if unusable. */
export function parseReport(reply: string): ErrorReport | null {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(reply.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
  const plain = str(data.plain, 900);
  if (!plain && !str(data.error)) return null;
  const causes = (Array.isArray(data.causes) ? data.causes : [])
    .map((c) => c as Record<string, unknown>)
    .filter((c) => str(c.title))
    .slice(0, 4)
    .map((c) => ({
      title: str(c.title, 120),
      why: str(c.why, 300),
      likelihood: typeof c.likelihood === "number" ? Math.min(1, Math.max(0, c.likelihood)) : 0.5,
    }))
    .sort((a, b) => b.likelihood - a.likelihood);
  const fixes = (Array.isArray(data.fixes) ? data.fixes : [])
    .map((f) => f as Record<string, unknown>)
    .filter((f) => str(f.step))
    .slice(0, 5)
    .map((f) => ({ step: str(f.step, 300), code: str(f.code, 1200) || undefined }));
  const searches = (Array.isArray(data.searches) ? data.searches : []).map((s) => str(s, 140)).filter(Boolean).slice(0, 3);
  return { error: str(data.error, 300) || "Unknown error", stack: str(data.stack, 80), plain, causes, fixes, searches };
}

export function searchUrl(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}
