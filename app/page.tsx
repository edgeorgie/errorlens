"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Tiles from "@/components/Tiles";
import { DEMO_REPORT, drawSampleError } from "@/lib/demo";
import { prepareImage } from "@/lib/image";
import type { Prepared } from "@/lib/image";
import type { ErrorReport } from "@/lib/report";
import { PROVIDERS, analyze } from "@/lib/vision";
import type { Provider } from "@/lib/vision";

type Mode = "demo" | Provider;
const STORE = "errorlens.settings";

export default function Home() {
  const [image, setImage] = useState<Prepared | null>(null);
  const [report, setReport] = useState<ErrorReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<Mode>("demo");
  const [keys, setKeys] = useState<Partial<Record<Provider, string>>>({});
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(STORE);
        if (raw) {
          const s = JSON.parse(raw) as { mode: Mode; keys: Partial<Record<Provider, string>> };
          setMode(s.mode);
          setKeys(s.keys ?? {});
        }
      } catch {}
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ mode, keys }));
    } catch {}
  }, [mode, keys]);

  const load = useCallback(async (blob: Blob) => {
    setError("");
    setReport(null);
    try {
      setImage(await prepareImage(blob));
    } catch {
      setError("That file could not be read as an image.");
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        load(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [load]);

  const useSample = () => {
    const canvas = document.createElement("canvas");
    drawSampleError(canvas);
    canvas.toBlob((b) => b && load(b), "image/png");
  };

  const run = async () => {
    if (!image) return;
    setError("");
    setReport(null);
    setBusy(true);
    try {
      let result: ErrorReport;
      if (mode === "demo") {
        await new Promise((r) => setTimeout(r, 2200));
        result = DEMO_REPORT;
      } else {
        const key = keys[mode];
        if (!key) throw new Error(`Add your ${PROVIDERS[mode].label} key below, or switch to the demo.`);
        result = await analyze(mode, key, { base64: image.base64, mediaType: image.mediaType }, context);
      }
      setReport(result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-24 pt-7 sm:px-10"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = Array.from(e.dataTransfer.files).find((x) => x.type.startsWith("image/"));
        if (f) load(f);
      }}
    >
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink">
            <span className="iris h-4 w-4 rounded-full bg-pink shadow-[0_0_14px_var(--pink)]" />
          </span>
          errorlens
        </span>
        <div className="flex gap-1.5 rounded-full border border-line bg-white p-1">
          {(["demo", "anthropic", "openai"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${mode === m ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
            >
              {m === "demo" ? "Demo" : PROVIDERS[m].label}
            </button>
          ))}
        </div>
      </header>

      {!image ? (
        <section className="my-auto grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="headline text-6xl leading-[0.92] sm:text-8xl">
              Paste the
              <br />
              <span className="text-pink">error.</span>
              <br />
              Get the fix.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-soft">Screenshot a stack trace, a console, a build log. A vision model reads it, explains it in plain words and tells you what to change.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={useSample} className="rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-pink active:scale-95">
                Try a sample error
              </button>
              <button onClick={() => fileInput.current?.click()} className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white">
                Upload a screenshot
              </button>
            </div>
          </div>
          <button
            onClick={() => fileInput.current?.click()}
            className="group relative grid aspect-[4/3] place-items-center rounded-[2.5rem] border-2 border-dashed border-pink/60 bg-pink-soft/50 text-center transition hover:border-pink hover:bg-pink-soft"
            aria-label="Paste or drop a screenshot"
          >
            <div className="hint">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-lg">&#8984;</div>
              <p className="mt-4 text-xl font-extrabold">Press <kbd className="rounded-lg bg-ink px-2 py-0.5 font-mono text-base text-white">Ctrl</kbd> + <kbd className="rounded-lg bg-ink px-2 py-0.5 font-mono text-base text-white">V</kbd></p>
              <p className="mt-1 text-sm text-ink-soft">or drop an image anywhere on this page</p>
            </div>
          </button>
        </section>
      ) : (
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="tile-in">
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-3 shadow-xl shadow-ink/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt="Your screenshot" className="w-full rounded-[1.4rem]" />
              {busy && (
                <div className="pointer-events-none absolute inset-3 overflow-hidden rounded-[1.4rem]">
                  <div className="scan" />
                </div>
              )}
            </div>
            <button onClick={() => { setImage(null); setReport(null); }} className="mt-3 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-pink hover:underline">
              Use a different screenshot
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="headline text-4xl leading-tight">{busy ? "Reading it..." : report ? "Got it." : "Ready when you are."}</h2>
            <label className="text-sm font-semibold" htmlFor="ctx">What were you doing? <span className="font-normal text-ink-soft">(optional)</span></label>
            <textarea
              id="ctx"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="e.g. fetching products after the page loads"
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-pink focus:shadow-[0_0_0_4px_var(--pink-soft)]"
            />
            {mode !== "demo" && (
              <input
                type="password"
                value={keys[mode] ?? ""}
                onChange={(e) => setKeys((k) => ({ ...k, [mode]: e.target.value }))}
                placeholder={`${PROVIDERS[mode].label} API key (stays in this browser)`}
                className="rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-pink focus:shadow-[0_0_0_4px_var(--pink-soft)]"
              />
            )}
            <button
              onClick={run}
              disabled={busy}
              className="rounded-full bg-pink px-8 py-4 text-base font-extrabold text-white shadow-xl shadow-pink/30 transition hover:-translate-y-0.5 hover:brightness-105 active:scale-95 disabled:opacity-70"
            >
              {busy ? "Analyzing..." : report ? "Analyze again" : mode === "demo" ? "Analyze (demo)" : "Analyze"}
            </button>
            {mode === "demo" && <p className="text-xs text-ink-soft">Demo mode shows a prepared example without calling any model. Switch to Anthropic or OpenAI with your own key for real screenshots.</p>}
            {error && <p className="rounded-2xl bg-pink-soft px-4 py-3 text-sm font-semibold text-pink">{error}</p>}
          </div>
        </section>
      )}

      {report && (
        <div ref={resultRef} className="mt-10 scroll-mt-6">
          <Tiles report={report} />
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
      {dragging && (
        <div className="pointer-events-none fixed inset-4 z-50 grid place-items-center rounded-[2.5rem] border-4 border-dashed border-pink bg-pink-soft/80 backdrop-blur-sm">
          <p className="text-3xl font-extrabold">Drop the screenshot</p>
        </div>
      )}
    </main>
  );
}
