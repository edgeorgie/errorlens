import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReport, searchUrl } from "../lib/report.ts";
import { fitDims, splitDataUrl } from "../lib/image.ts";
import { buildAnthropicBody, buildOpenAIBody, userText } from "../lib/vision.ts";

const good = {
  error: "TypeError: Cannot read properties of undefined (reading 'map')",
  stack: "React / TypeScript",
  plain: "A list was used before it had loaded.",
  causes: [
    { title: "Data not loaded yet", why: "state starts undefined", likelihood: 0.5 },
    { title: "Wrong prop name", why: "typo in the prop", likelihood: 0.8 },
  ],
  fixes: [{ step: "Default to an empty array", code: "const [items, setItems] = useState<Item[]>([]);" }, { step: "Check the prop name" }],
  searches: ["react cannot read properties of undefined reading map"],
};

test("parseReport validates, sorts causes by likelihood and tolerates fences", () => {
  const r = parseReport("Here you go:\n```json\n" + JSON.stringify(good) + "\n```");
  assert.ok(r);
  assert.equal(r.causes[0].title, "Wrong prop name");
  assert.equal(r.fixes[0].code?.startsWith("const"), true);
  assert.equal(r.fixes[1].code, undefined);
  assert.equal(r.searches.length, 1);
});

test("parseReport rejects unusable replies and clamps values", () => {
  assert.equal(parseReport("no json"), null);
  assert.equal(parseReport("{broken"), null);
  assert.equal(parseReport("{}"), null);
  const r = parseReport(JSON.stringify({ ...good, causes: [{ title: "x", why: "y", likelihood: 7 }] }));
  assert.equal(r?.causes[0].likelihood, 1);
  assert.equal(parseReport(JSON.stringify({ plain: "ok" }))?.error, "Unknown error");
});

test("fitDims shrinks large images, keeps small ones and the aspect ratio", () => {
  assert.deepEqual(fitDims(3136, 1568, 1568), { width: 1568, height: 784 });
  assert.deepEqual(fitDims(800, 600), { width: 800, height: 600 });
  assert.deepEqual(fitDims(1000, 4000, 2000), { width: 500, height: 2000 });
});

test("splitDataUrl parses data URLs", () => {
  assert.deepEqual(splitDataUrl("data:image/jpeg;base64,AAAA"), { mediaType: "image/jpeg", base64: "AAAA" });
  assert.equal(splitDataUrl("nope"), null);
});

test("request bodies encode the image for each provider", () => {
  const img = { base64: "QUJD", mediaType: "image/jpeg" };
  const a = buildAnthropicBody(img, "");
  assert.equal(a.messages[0].content[0].type, "image");
  assert.equal((a.messages[0].content[0] as { source: { data: string } }).source.data, "QUJD");
  const o = buildOpenAIBody(img, "using vite");
  const parts = o.messages[1].content as { type: string; image_url?: { url: string }; text?: string }[];
  assert.equal(parts[1].image_url?.url, "data:image/jpeg;base64,QUJD");
  assert.ok(parts[0].text?.includes("using vite"));
  assert.ok(userText("").length > 0);
});

test("search url is encoded", () => {
  assert.equal(searchUrl("a b&c"), "https://www.google.com/search?q=a%20b%26c");
});

import { parseRegion } from "../lib/report.ts";
import { addEntry, removeEntry, timeAgo, MAX_ENTRIES } from "../lib/history.ts";
import type { Entry } from "../lib/history.ts";

test("parseRegion accepts sensible rectangles, clamps overshoot and rejects nonsense", () => {
  assert.deepEqual(parseRegion({ x: 0.1, y: 0.2, w: 0.5, h: 0.1 }), { x: 0.1, y: 0.2, w: 0.5, h: 0.1 });
  const clamped = parseRegion({ x: 0.7, y: 0.9, w: 0.6, h: 0.3 });
  assert.ok(clamped && Math.abs(clamped.w - 0.3) < 1e-9 && Math.abs(clamped.h - 0.1) < 1e-9);
  assert.equal(parseRegion({ x: 0, y: 0, w: 0, h: 0 }), undefined);
  assert.equal(parseRegion({ x: 1.2, y: 0.1, w: 0.2, h: 0.1 }), undefined);
  assert.equal(parseRegion("nope"), undefined);
  assert.equal(parseRegion({ x: "a", y: 0, w: 1, h: 1 }), undefined);
});

test("parseReport keeps a valid region and drops an invalid one", () => {
  const withRegion = parseReport(JSON.stringify({ ...good, region: { x: 0.1, y: 0.4, w: 0.8, h: 0.08 } }));
  assert.deepEqual(withRegion?.region, { x: 0.1, y: 0.4, w: 0.8, h: 0.08 });
  assert.equal(parseReport(JSON.stringify({ ...good, region: { x: 5 } }))?.region, undefined);
});

test("history keeps the newest entries, dedupes by error and removes by id", () => {
  const mk = (id: string, error: string, at: number): Entry => ({ id, at, thumb: "", report: { error, stack: "", plain: "p", causes: [], fixes: [], searches: [] } });
  let list: Entry[] = [];
  for (let i = 0; i < 8; i++) list = addEntry(list, mk(`e${i}`, `error ${i}`, i));
  assert.equal(list.length, MAX_ENTRIES);
  assert.equal(list[0].id, "e7");
  list = addEntry(list, mk("again", "error 5", 99));
  assert.equal(list.filter((e) => e.report.error === "error 5").length, 1);
  assert.equal(list[0].id, "again");
  assert.equal(removeEntry(list, "again").some((e) => e.id === "again"), false);
});

test("timeAgo is readable", () => {
  const now = 1_000_000_000;
  assert.equal(timeAgo(now - 20_000, now), "just now");
  assert.equal(timeAgo(now - 5 * 60_000, now), "5 min ago");
  assert.equal(timeAgo(now - 3 * 3_600_000, now), "3 h ago");
  assert.equal(timeAgo(now - 2 * 86_400_000, now), "2 d ago");
});
