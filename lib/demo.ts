import type { ErrorReport } from "./report.ts";

export const DEMO_REPORT: ErrorReport = {
  error: "TypeError: Cannot read properties of undefined (reading 'map')",
  stack: "React 19 / TypeScript",
  plain:
    "Your component tried to loop over a list before that list existed. On the first render the data is still undefined, so calling .map on it crashes the page.",
  causes: [
    { title: "State starts as undefined", why: "The list is only filled after the fetch finishes, but the first render already calls .map.", likelihood: 0.82 },
    { title: "API returns a different shape", why: "The response may wrap the array in an object such as { data: [...] }.", likelihood: 0.46 },
    { title: "Wrong prop name", why: "A typo in the prop means the child never receives the list.", likelihood: 0.21 },
  ],
  fixes: [
    { step: "Give the state an empty array as its initial value.", code: "const [items, setItems] = useState<Item[]>([]);" },
    { step: "Guard the render so it only maps when the data is there.", code: "{items?.map((item) => <Row key={item.id} {...item} />)}" },
    { step: "Log the response to confirm the shape before setting state.", code: "console.log(await res.json());" },
  ],
  searches: ["react cannot read properties of undefined reading map", "useState initial value array fetch undefined map"],
};

const LINES: { text: string; color: string }[] = [
  { text: "~/shop-app $ npm run dev", color: "#8be9fd" },
  { text: "", color: "" },
  { text: "  ▲ Next.js 15.2.0", color: "#f8f8f2" },
  { text: "  ✓ Ready in 1.8s", color: "#50fa7b" },
  { text: "", color: "" },
  { text: " ⨯ TypeError: Cannot read properties of undefined (reading 'map')", color: "#ff5555" },
  { text: "    at ProductList (app/components/ProductList.tsx:14:22)", color: "#f1fa8c" },
  { text: "    at renderWithHooks (node_modules/react-dom/cjs/react-dom.js:5724:16)", color: "#6272a4" },
  { text: "    at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.js:8209:9)", color: "#6272a4" },
  { text: "", color: "" },
  { text: "  12 |   return (", color: "#6272a4" },
  { text: "  13 |     <ul>", color: "#6272a4" },
  { text: "> 14 |       {products.map((p) => (", color: "#ffb86c" },
  { text: "     |                ^", color: "#ff5555" },
];

/** Draws a fake terminal screenshot with a React error so the lens can be tried without any file. */
export function drawSampleError(canvas: HTMLCanvasElement) {
  canvas.width = 1200;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#1e1f29";
  ctx.fillRect(0, 0, 1200, 640);
  ctx.fillStyle = "#282a36";
  ctx.fillRect(0, 0, 1200, 46);
  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(28 + i * 28, 23, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = "22px ui-monospace, Menlo, Consolas, monospace";
  ctx.textBaseline = "top";
  LINES.forEach((l, i) => {
    ctx.fillStyle = l.color || "#f8f8f2";
    ctx.fillText(l.text, 32, 76 + i * 34);
  });
}
