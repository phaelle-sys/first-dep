"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { PropertyIcon } from "./PropertyIcon";

type Result = {
  id: string;
  name: string;
  type: string;
  kind: "bien" | "unit";
  href: string;
  subtitle?: string;
};

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Rechercher un bien, une unité…"
          className="input pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-ink-850 shadow-card">
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.id}`}
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQ("");
              }}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5"
            >
              <PropertyIcon
                type={r.type}
                className="h-4 w-4 shrink-0 text-brand-400"
              />
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-100">{r.name}</p>
                {r.subtitle && (
                  <p className="truncate text-xs text-slate-500">
                    {r.subtitle}
                  </p>
                )}
              </div>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-600">
                {r.kind === "bien" ? "Bien" : "Unité"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
