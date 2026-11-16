"use client";

import { useState } from "react";
import { Coins, Loader2, RefreshCw, ScanSearch, ShieldCheck, Wallet } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { Navbar } from "@/components/Navbar";
import { OpenMatchModal } from "@/components/OpenMatchModal";
import { OwedCard } from "@/components/OwedCard";
import { TransactionPanel } from "@/components/TransactionPanel";
import { WindowCheck, type CheckTerms } from "@/components/WindowCheck";
import { Button } from "@/components/ui/button";
import { formatGen, wei } from "@/lib/contracts/types";
import { useRegistry } from "@/lib/hooks/useMatchFund";

const STEPS = [
  { icon: Coins, title: "Lock a match", body: "Pick a collective on Open Collective and a window. Say how much GEN matches each dollar, the most you will pay, and which donors you will not match." },
  { icon: ScanSearch, title: "Validators count every gift", body: "After the window, GenLayer validators read every contribution Open Collective lists for it and check the sum against its own totals." },
  { icon: ShieldCheck, title: "Only real donors count", body: "Guest checkouts and new accounts (card testing, self-matching) are dropped in code; sponsors your rules exclude, like casino link-buyers, are flagged by the validators." },
  { icon: Wallet, title: "The match goes to the collective", body: "To the GenLayer wallet it publishes on its Open Collective page, or held for it until then. Whatever the match does not use comes back to you." },
];

export default function HomePage() {
  const { matches, isLoading, isError, error, isFetching, refetch, fetchedAt } = useRegistry();
  const [modal, setModal] = useState<{ open: boolean; terms?: CheckTerms }>({ open: false });
  const ordered = [...matches].sort((a, b) => Number(b.id.split("_")[1]) - Number(a.id.split("_")[1]));
  const locked = matches.filter((m) => m.state === "open" || m.state === "tallied").reduce((t, m) => t + wei(m.pot), 0n);
  const matched = matches.reduce((t, m) => t + wei(m.paid) + wei(m.held), 0n);
  const collectives = new Set(matches.map((m) => m.slug)).size;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpen={() => setModal({ open: true })} />
      <main className="flex-grow pt-24 pb-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4 lg:pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C2502F]">Matching funds for open source</p>
              <h1 className="display text-5xl md:text-6xl leading-[1.02]">Double the real donors.</h1>
              <p className="text-lg text-muted-foreground">
                A matching pledge says &ldquo;every dollar you give, I give too&rdquo;. On a busy Open Collective page a large share of those dollars can
                come from casino link-buyers and one-dollar guest checkouts. MatchFund locks GEN behind the match, and GenLayer validators count only the
                donors it was meant for.
              </p>
              <dl className="flex gap-8 pt-1">
                <div>
                  <dt className="text-xs text-muted-foreground">GEN locked</dt>
                  <dd className="display text-3xl">{formatGen(locked, 1)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">collectives</dt>
                  <dd className="display text-3xl">{collectives}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">GEN matched</dt>
                  <dd className="display text-3xl">{formatGen(matched, 2)}</dd>
                </div>
              </dl>
            </div>
            <div className="lg:col-span-7">
              <WindowCheck onMatch={(terms) => setModal({ open: true, terms })} />
            </div>
          </section>

          <section>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="rounded-2xl border border-border bg-white/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="display flex h-7 w-7 items-center justify-center rounded-full bg-[#0E2A2F] text-sm text-white">{i + 1}</span>
                    <Icon className="w-4 h-4 text-[#C2502F]" />
                    <span className="font-semibold">{title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Looking needs no wallet. To open a match, connect MetaMask and press Test GEN for free GenLayer Studio tokens. The matches below are demo
              matches made by test wallets with test GEN, not offers to these collectives; the contributions they count are real.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="display text-3xl">Matches</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fetchedAt && <span>updated {new Date(fetchedAt).toLocaleTimeString()}</span>}
                  <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {isLoading && <p className="text-sm text-muted-foreground">Reading the matches from GenLayer Studio…</p>}
              {isError && (
                <p className="rounded-xl border border-[#F2C6B6] bg-[#FFF1EC] p-3 text-sm">Could not read the matches: {error?.message}. Try Refresh in a minute.</p>
              )}
              {!isLoading && !isError && ordered.length === 0 && (
                <p className="text-sm text-muted-foreground">No match is open yet. Look at a collective above and be the first.</p>
              )}
              {ordered.map((m) => (
                <div id={m.id} key={m.id}>
                  <MatchCard match={m} />
                </div>
              ))}
            </div>
            <aside className="lg:col-span-4 space-y-6">
              <div className="brand-card p-5 space-y-3 text-sm">
                <h3 className="display text-xl">How a count is made</h3>
                <p>
                  <strong>Every gift, or none.</strong> Validators page through every contribution Open Collective lists for the window (up to 2,000)
                  and count only if the sum equals Open Collective&apos;s own total for it. Refunds never count.
                </p>
                <p>
                  <strong>Rules in code first.</strong> The collective&apos;s own and its host&apos;s money is dropped, and so is money from accounts
                  created less than the chosen age before the window opened: guest checkouts, card testing and fresh accounts made to farm a match. A
                  per-donor cap stops one whale from draining the pot.
                </p>
                <p>
                  <strong>Your rules, read by validators.</strong> Sponsors with a public profile (up to 120, largest first) are labelled against your
                  plain-words rules: counted, excluded or unsure. Unsure is not matched. Validators accept the leader&apos;s count only if every number
                  made in code is identical and their own labels move the total by at most 5% (or $20).
                </p>
                <p>
                  <strong>Anyone can recount.</strong> For 10 minutes after a count, anyone stakes 10% of the pot for a fresh one. A different result
                  replaces the count and returns the stake; the same result sends the stake to the collective.
                </p>
                <p>
                  <strong>No GEN rides on a reading.</strong> Pots and stakes come from a deposit and are taken only after the validators agree. The
                  match is credited to the collective&apos;s published wallet (or held for it until it publishes one); the rest to the matcher. Only
                  Withdraw sends GEN, to the caller.
                </p>
              </div>
              <OwedCard />
              <TransactionPanel />
            </aside>
          </section>
        </div>
      </main>
      <footer className="border-t border-border py-4 px-4 text-center text-sm text-muted-foreground">
        Data:{" "}
        <a href="https://opencollective.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Open Collective public API
        </a>
        {" · "}
        <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Built on GenLayer
        </a>
        {" · "}
        <a href="https://github.com/bars26/genlayer-matchfund" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Source
        </a>
        {" · "}A count describes published contributions only, not any donor&apos;s intentions.
      </footer>
      <OpenMatchModal open={modal.open} terms={modal.terms} onOpenChange={(open) => setModal((m) => ({ ...m, open }))} />
    </div>
  );
}
