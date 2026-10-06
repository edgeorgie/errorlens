"use client";

import { useState } from "react";
import type { ErrorReport } from "@/lib/report";
import { searchUrl } from "@/lib/report";

function Copy({ text, dark }: { text: string; dark?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 ${dark ? "bg-white/10 text-white hover:bg-white/20" : "bg-ink text-white hover:bg-pink"}`}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

const label = "font-mono text-[11px] uppercase tracking-widest";

export default function Tiles({ report }: { report: ErrorReport }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="tile-in relative overflow-hidden rounded-[2rem] bg-ink p-7 text-white shadow-[0_30px_80px_-30px_rgba(255,46,136,0.55)] md:col-span-2">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <p className={`${label} text-pink`}>The error{report.stack ? ` · ${report.stack}` : ""}</p>
          <Copy text={report.error} dark />
        </div>
        <p className="relative mt-3 break-words font-mono text-xl font-medium leading-snug sm:text-2xl">{report.error}</p>
        <p className="relative mt-5 max-w-2xl text-[17px] leading-relaxed text-white/80">{report.plain}</p>
      </section>

      {report.causes.length > 0 && (
        <section className="tile-in rounded-[2rem] bg-lemon p-6" style={{ animationDelay: "90ms" }}>
          <p className={`${label} text-ink/60`}>Likely causes</p>
          <ul className="mt-4 space-y-4">
            {report.causes.map((c, i) => (
              <li key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold leading-snug">{c.title}</p>
                  <span className="font-mono text-xs">{Math.round(c.likelihood * 100)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div className="bar h-full rounded-full bg-ink" style={{ width: `${c.likelihood * 100}%` }} />
                </div>
                <p className="mt-1.5 text-sm text-ink/70">{c.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.searches.length > 0 && (
        <section className="tile-in rounded-[2rem] bg-pink-soft p-6" style={{ animationDelay: "170ms" }}>
          <p className={`${label} text-pink`}>Look it up</p>
          <div className="mt-4 flex flex-col gap-2">
            {report.searches.map((s, i) => (
              <a
                key={i}
                href={searchUrl(s)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="line-clamp-2">{s}</span>
                <span className="text-pink transition group-hover:translate-x-1">&rarr;</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {report.fixes.length > 0 && (
        <section className="tile-in rounded-[2rem] bg-mint p-6 md:col-span-2" style={{ animationDelay: "250ms" }}>
          <p className={`${label} text-ink/60`}>Fix it</p>
          <ol className="mt-4 space-y-4">
            {report.fixes.map((f, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="pt-0.5 font-semibold leading-snug">{f.step}</p>
                  {f.code && (
                    <div className="mt-2 flex items-start justify-between gap-3 rounded-2xl bg-ink p-3.5">
                      <pre className="min-w-0 overflow-x-auto font-mono text-[13px] leading-relaxed text-white/90">{f.code}</pre>
                      <Copy text={f.code} dark />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
