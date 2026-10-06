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
