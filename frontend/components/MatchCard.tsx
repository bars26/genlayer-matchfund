"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import {
  BUCKET_LABEL,
  STATE_STYLE,
  countableFrom,
  formatGen,
  historyOf,
  money,
  ocTransactionsUrl,
  ocUrl,
  rateText,
  sameAddress,
  stakeFor,
  tallyOf,
  todayUtc,
  wei,
  windowLeftSeconds,
  type Match,
} from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useMatchWrite } from "@/lib/hooks/useMatchFund";
import { useNow } from "@/lib/hooks/useNow";
import { addressUrl, currentNetwork } from "@/lib/network";
import { Button } from "./ui/button";

const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

export function MatchCard({ match: m }: { match: Match }) {
  const now = useNow(m.state === "tallied" ? 1_000 : 30_000);
  const { address, isConnected } = useWallet();
  const { write, pending } = useMatchWrite();
  const t = tallyOf(m);
  const style = STATE_STYLE[m.state] ?? STATE_STYLE.open;
  const cur = m.currency || "USD";
  const left = windowLeftSeconds(m, now);
  const busy = (k: string) => pending === `${k}:${m.id}`;
  const net = currentNetwork();
  const kept = t ? t.kept_cents : 0;
  const bars = t
    ? [
        { key: "eligible", cents: t.eligible_cents, cls: "bg-[#2F8F6A]", label: "Matched" },
        { key: "excluded", cents: t.buckets.excluded[0], cls: "bg-[#B83A3A]", label: BUCKET_LABEL.excluded },
        { key: "new_account", cents: t.buckets.new_account[0], cls: "bg-[#E8613F]", label: BUCKET_LABEL.new_account },
        { key: "over_cap", cents: t.buckets.over_cap[0], cls: "bg-[#F2C6B6]", label: BUCKET_LABEL.over_cap },
        { key: "unsure", cents: t.buckets.unsure[0], cls: "bg-[#F2DC9B]", label: BUCKET_LABEL.unsure },
        { key: "unreviewed", cents: t.buckets.unreviewed[0], cls: "bg-[#D6DCD3]", label: BUCKET_LABEL.unreviewed },
        { key: "own", cents: t.buckets.own[0], cls: "bg-[#B9C4BF]", label: BUCKET_LABEL.own },
      ].filter((b) => b.cents > 0)
    : [];
  const act = (kind: "tally" | "recount" | "finalize" | "claim" | "reclaim" | "cancel") => write({ kind, matchId: m.id });

  return (
    <article className="brand-card overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0E2A2F] via-[#2F8F6A] to-[#E8613F]" />
      <div className="p-5 space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="mono text-muted-foreground">{m.id}</span>
              <span className={`rounded-full border px-2 py-0.5 font-medium ${style.cls}`}>{style.label}</span>
              {Number(m.recounts) > 0 && <span className="rounded-full border border-border px-2 py-0.5">recounted {String(m.recounts)}×</span>}
            </div>
            <h3 className="display text-2xl leading-tight">
              <a href={ocUrl(m.slug)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {m.name}
              </a>
            </h3>
            <p className="text-sm text-muted-foreground">
              Donations from {m.starts} to {m.ends} · {rateText(m.rate, cur)} · cap {wei(m.donor_cap) > 0n ? money(Number(m.donor_cap) * 100, cur) : "none"} per
              donor · accounts {String(m.min_age_days)}+ days old
            </p>
          </div>
          <div className="text-right">
            <p className="display text-3xl">
              {formatGen(m.state === "open" ? m.pot : m.match_wei, 3)} <span className="text-base text-muted-foreground">GEN</span>
            </p>
            <p className="text-xs text-muted-foreground">{m.state === "open" ? "pot (the most it pays)" : `matched, of a ${formatGen(m.pot, 2)} GEN pot`}</p>
          </div>
        </header>

        {m.rules && (
          <p className="rounded-xl bg-[#F9FBF8] border border-border px-3 py-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not matched:</span> {m.rules}
          </p>
        )}

        {t && (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <p>
                <span className="display text-3xl">{money(t.eligible_cents, cur)}</span>{" "}
                <span className="text-sm text-muted-foreground">matched from {t.eligible_donors} established donors</span>
              </p>
              <p className="text-right text-sm text-muted-foreground">
                of {money(kept, cur)} in {t.kept} contributions
              </p>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
              {bars.map((b) => (
                <div key={b.key} className={b.cls} style={{ width: `${(100 * b.cents) / Math.max(kept, 1)}%` }} />
              ))}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {bars.map((b) => (
                <li key={b.key} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${b.cls}`} />
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="ml-auto font-medium">{money(b.cents, cur)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm">{m.why}</p>
            <details className="rounded-xl border border-border p-3 text-xs">
              <summary className="cursor-pointer font-semibold">What the validators read</summary>
              <div className="mt-2 space-y-2">
                <p>
                  Read {t.read_at} UTC · {t.listed} contributions listed ({money(t.listed_cents, cur)}), {t.kept} after refunds — equal to Open
                  Collective&apos;s own total · rows sha256 <span className="mono">{t.rows_sha256.slice(0, 16)}…</span> · packet{" "}
                  <span className="mono">{t.packet_sha256.slice(0, 16)}…</span> ·{" "}
                  <a href={ocTransactionsUrl(m.slug)} target="_blank" rel="noopener noreferrer" className="underline">
                    contributions on Open Collective
                  </a>
                </p>
                {t.excluded.length > 0 && (
                  <div>
                    <p className="font-semibold">Sponsors the rules exclude ({t.n_excluded}{t.n_excluded > t.excluded.length ? `, largest ${t.excluded.length} shown` : ""})</p>
                    <ul className="mt-1 space-y-0.5">
                      {t.excluded.map((s) => (
                        <li key={s.slug}>
                          <span className="mono inline-block w-16 text-right">{money(s.cents, cur)}</span> {s.name}
                          {s.why ? <span className="text-muted-foreground"> — {s.why}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {t.unsure.length > 0 && (
                  <p>
                    <span className="font-semibold">Unsure (not matched):</span> {t.unsure.map((s) => `${s.name} (${money(s.cents, cur)})`).join(", ")}
                  </p>
                )}
                {t.top.length > 0 && (
                  <p>
                    <span className="font-semibold">Largest matched donors:</span> {t.top.map((s) => `${s.name} (${money(s.cents, cur)})`).join(", ")}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">Matcher</dt>
            <dd className="mono">
              <a href={addressUrl(net, m.matcher)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {short(m.matcher)}
              </a>
              {sameAddress(m.matcher, address) ? " (you)" : ""}
            </dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">Collective wallet</dt>
            <dd className="mono">{m.wallet ? short(m.wallet) : "not published yet"}</dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">{m.state === "awaiting_wallet" ? "Held for it" : "Paid to it"}</dt>
            <dd>{formatGen(m.state === "awaiting_wallet" ? m.held : m.paid, 4)} GEN{wei(m.bonus) > 0n ? ` (incl. ${formatGen(m.bonus, 2)} recount stake)` : ""}</dd>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <dt className="text-muted-foreground">Back to the matcher</dt>
            <dd>{formatGen(m.returned, 4)} GEN</dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">{style.help}{m.state === "awaiting_wallet" ? ` Held until ${m.expires}; then it goes back to the matcher.` : ""}</p>

        {isConnected && (
          <div className="flex flex-wrap gap-2">
            {m.state === "open" && todayUtc() >= countableFrom(m) && (
              <Button size="sm" onClick={() => act("tally")} disabled={!!pending}>
                {busy("tally") && <Loader2 className="w-4 h-4 animate-spin" />} Count the window
              </Button>
            )}
            {m.state === "open" && todayUtc() < countableFrom(m) && <span className="text-xs text-muted-foreground">Counted from {countableFrom(m)}.</span>}
            {m.state === "open" && todayUtc() < m.starts && sameAddress(m.matcher, address) && (
              <Button size="sm" variant="outline" onClick={() => act("cancel")} disabled={!!pending}>
                {busy("cancel") && <Loader2 className="w-4 h-4 animate-spin" />} Cancel
              </Button>
            )}
            {m.state === "tallied" && left > 0 && Number(m.recounts) < 2 && (
              <Button size="sm" variant="outline" onClick={() => act("recount")} disabled={!!pending}>
                {busy("recount") && <Loader2 className="w-4 h-4 animate-spin" />} Ask for a recount ({formatGen(stakeFor(m), 2)} GEN stake)
              </Button>
            )}
            {m.state === "tallied" && left > 0 && (
              <span className="self-center text-xs text-muted-foreground">
                recount window: {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
              </span>
            )}
            {m.state === "tallied" && left === 0 && (
              <Button size="sm" onClick={() => act("finalize")} disabled={!!pending}>
                {busy("finalize") && <Loader2 className="w-4 h-4 animate-spin" />} Finalize
              </Button>
            )}
            {m.state === "awaiting_wallet" && (
              <Button size="sm" variant="outline" onClick={() => act("claim")} disabled={!!pending}>
                {busy("claim") && <Loader2 className="w-4 h-4 animate-spin" />} Send to the collective&apos;s published wallet
              </Button>
            )}
            {m.state === "awaiting_wallet" && todayUtc() > m.expires && (
              <Button size="sm" variant="outline" onClick={() => act("reclaim")} disabled={!!pending}>
                {busy("reclaim") && <Loader2 className="w-4 h-4 animate-spin" />} Return to the matcher
              </Button>
            )}
          </div>
        )}

        <ol className="space-y-0.5 border-t border-border pt-3 text-xs text-muted-foreground">
          {historyOf(m).map((h, i) => (
            <li key={i}>
              <span className="mono">{String(h.at).replace("T", " ").slice(5, 16)}</span> {String(h.event).replaceAll("_", " ")}
            </li>
          ))}
        </ol>
        <a href={ocUrl(m.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          {m.name} on Open Collective <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
