import type { ErrorReport } from "./report.ts";

export interface Entry {
  id: string;
  at: number;
  thumb: string;
  report: ErrorReport;
}

export const MAX_ENTRIES = 6;
const KEY = "errorlens.history.v1";

/** Adds an entry at the front, replacing an older one with the same error text, and keeps the newest MAX_ENTRIES. */
export function addEntry(list: Entry[], entry: Entry): Entry[] {
  const rest = list.filter((e) => e.report.error !== entry.report.error);
  return [entry, ...rest].slice(0, MAX_ENTRIES);
}

export function removeEntry(list: Entry[], id: string): Entry[] {
  return list.filter((e) => e.id !== id);
}

export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

// Stored only in this browser (localStorage), never uploaded.
export function loadHistory(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry[]).slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

export function saveHistory(list: Entry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full or unavailable: history is a convenience, so ignore
  }
}

/** Makes a small JPEG thumbnail of a data URL so history stays light. */
export function makeThumb(dataUrl: string, width = 360): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, width / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}
