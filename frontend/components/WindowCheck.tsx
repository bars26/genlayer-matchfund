"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Search, TriangleAlert } from "lucide-react";
import { BUCKET_LABEL, addDays, money, ocUrl, todayUtc, type WindowPreview } from "@/lib/contracts/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type CheckTerms = { slug: string; starts: string; ends: string; minAge: number; cap: number };

const PRESETS = [
  { slug: "webpack", label: "webpack" },
  { slug: "babel", label: "Babel" },
  { slug: "vuejs", label: "Vue.js" },
  { slug: "eslint", label: "ESLint" },
];

function lastMonth(): { starts: string; ends: string } {
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return { starts: first.toISOString().slice(0, 10), ends: last.toISOString().slice(0, 10) };
}

/** Preview a window from Open Collective's public records with the rules made in code; no wallet, no validators. */
export function WindowCheck({ onMatch }: { onMatch: (t: CheckTerms) => void }) {
  const lm = lastMonth();
  const [terms, setTerms] = useState<CheckTerms>({ slug: "webpack", starts: lm.starts, ends: lm.ends, minAge: 30, cap: 1000 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<WindowPreview | null>(null);

  const read = async (t = terms) => {
    setBusy(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ slug: t.slug, starts: t.starts, ends: t.ends, minAge: String(t.minAge), cap: String(t.cap) });
      const res = await fetch(`/api/window?${qs}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setData(body as WindowPreview);
    } catch (e: any) {
      setData(null);
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const cur = data?.currency ?? "USD";
  const kept = data ? data.listed_cents - data.buckets.refunded[0] : 0;
  const parts = data
    ? [
        { key: "established", cents: data.established_cents, cls: "bg-[#2F8F6A]", label: "Established donors (before the rules)" },
        { key: "new_account", cents: data.buckets.new_account[0], cls: "bg-[#E8613F]", label: BUCKET_LABEL.new_account },
        { key: "over_cap", cents: data.buckets.over_cap[0], cls: "bg-[#F2C6B6]", label: BUCKET_LABEL.over_cap },
        { key: "own", cents: data.buckets.own[0], cls: "bg-[#B9C4BF]", label: BUCKET_LABEL.own },
      ]
    : [];

  return (
    <div className="brand-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="display text-2xl flex items-center gap-2">
          <Search className="w-5 h-5 text-[#C2502F]" /> Look at a collective&apos;s month
        </h2>
        <span className="text-xs text-muted-foreground">no wallet needed</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => {
              const t = { ...terms, slug: p.slug };
              setTerms(t);
              read(t);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${terms.slug === p.slug ? "border-[#0E2A2F] bg-[#0E2A2F] text-white" : "border-border bg-white hover:bg-muted"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1 space-y-1">
          <Label htmlFor="wc-slug">Collective slug</Label>
          <Input id="wc-slug" value={terms.slug} onChange={(e) => setTerms({ ...terms, slug: e.target.value.trim().toLowerCase() })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wc-from">From</Label>
          <Input id="wc-from" type="date" value={terms.starts} onChange={(e) => setTerms({ ...terms, starts: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wc-to">To</Label>
          <Input id="wc-to" type="date" value={terms.ends} onChange={(e) => setTerms({ ...terms, ends: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wc-age">Min. account age (days)</Label>
          <Input id="wc-age" type="number" min={0} max={365} value={terms.minAge} onChange={(e) => setTerms({ ...terms, minAge: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wc-cap">Cap per donor ({cur})</Label>
          <Input id="wc-cap" type="number" min={0} value={terms.cap} onChange={(e) => setTerms({ ...terms, cap: Number(e.target.value) })} />
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => read()} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Read Open Collective
      </Button>

      {err && <p className="rounded-xl border border-[#F2C6B6] bg-[#FFF1EC] p-3 text-sm">{err}</p>}

      {data && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm">
            <a href={ocUrl(data.slug)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
              {data.name} <ExternalLink className="inline w-3 h-3" />
            </a>{" "}
            <span className="text-muted-foreground">
              {data.type.toLowerCase()} · {data.currency} · host {data.host || "none"} · {data.starts} to {data.ends}
            </span>
          </p>
          {data.too_many ? (
            <p className="text-sm text-[#B83A3A]">More than 2,000 contributions in this window: choose a shorter window.</p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-3">
                <p>
                  <span className="display text-4xl">{money(data.established_cents, cur)}</span>{" "}
                  <span className="text-sm text-muted-foreground">from {data.established_donors} established donors, before your rules</span>
                </p>
                <p className="text-right text-sm text-muted-foreground">
                  of {money(kept, cur)} in {data.listed - data.buckets.refunded[1]} contributions
                </p>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
                {parts.map((p) => (kept > 0 && p.cents > 0 ? <div key={p.key} className={p.cls} style={{ width: `${(100 * p.cents) / kept}%` }} /> : null))}
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {parts.map((p) => (
                  <li key={p.key} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${p.cls}`} />
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="ml-auto font-medium">{money(p.cents, cur)}</span>
                  </li>
                ))}
                {data.buckets.refunded[0] > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border border-dashed border-[#55635F]" />
                    <span className="text-muted-foreground">Refunded (never counted)</span>
                    <span className="ml-auto font-medium">{money(data.buckets.refunded[0], cur)}</span>
                  </li>
                )}
              </ul>
              <p className="flex items-center gap-1.5 text-xs">
                {data.totals_match ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2F8F6A]" /> Every contribution read; the sum equals Open Collective&apos;s own total for the window.
                  </>
                ) : (
                  <>
                    <TriangleAlert className="w-3.5 h-3.5 text-[#B83A3A]" /> What was read does not match Open Collective&apos;s own totals right now: validators would not count it.
                  </>
                )}
              </p>
              {data.profiled.length > 0 && (
                <details className="rounded-xl border border-border bg-[#F9FBF8] p-3 text-xs">
                  <summary className="cursor-pointer font-semibold">
                    Sponsors with a public profile ({money(data.established_cents - data.plain_cents, cur)}): validators review these against your rules
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {data.profiled.map((s) => (
                      <li key={s.slug} className="flex items-center gap-2">
                        <span className="mono w-16 text-right">{money(s.cents, cur)}</span>
                        <span className="font-medium">{s.name}</span>
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer nofollow" className="truncate text-muted-foreground hover:underline">
                            {s.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  onClick={() => onMatch(terms)}
                  disabled={!data.active || !["COLLECTIVE", "FUND", "PROJECT", "EVENT"].includes(data.type)}
                >
                  Match this window with GEN
                </Button>
                {data.wallet ? (
                  <span className="text-xs text-[#1F6B4C]">GenLayer wallet published: {data.wallet.slice(0, 10)}…</span>
                ) : (
                  <span className="text-xs text-muted-foreground">No GenLayer wallet on its page yet: a match is held for it.</span>
                )}
              </div>
              {terms.ends >= addDays(todayUtc(), -2) && (
                <p className="text-xs text-muted-foreground">This window can be counted from {addDays(terms.ends, 3)}.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
