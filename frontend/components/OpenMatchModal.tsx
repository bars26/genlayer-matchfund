"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DEFAULT_RULES, MAX_WINDOW_DAYS, MIN_POT_WEI, addDays, parseGen, todayUtc } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useMatchWrite } from "@/lib/hooks/useMatchFund";
import type { CheckTerms } from "./WindowCheck";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const DAY = 86_400_000;

export function OpenMatchModal({ open, terms, onOpenChange }: { open: boolean; terms?: CheckTerms; onOpenChange: (o: boolean) => void }) {
  const { isConnected } = useWallet();
  const { writeAsync, pending } = useMatchWrite();
  const [f, setF] = useState({
    slug: "webpack",
    starts: "",
    ends: "",
    perGen: "1000",
    pot: "5",
    cap: "1000",
    minAge: "30",
    rules: DEFAULT_RULES,
    expires: "",
  });

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const starts = terms?.starts ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
    const ends = terms?.ends ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).toISOString().slice(0, 10);
    setF((x) => ({
      ...x,
      slug: terms?.slug ?? x.slug,
      starts,
      ends,
      cap: String(terms?.cap ?? x.cap),
      minAge: String(terms?.minAge ?? x.minAge),
      expires: addDays(ends, 120),
    }));
  }, [open, terms]);

  const pot = parseGen(f.pot);
  const perGen = Number(f.perGen);
  const rate = perGen >= 0.000001 && perGen <= 1_000_000 ? BigInt(Math.round(1e18 / perGen)) : 0n;
  const days = f.starts && f.ends ? (Date.parse(f.ends) - Date.parse(f.starts)) / DAY + 1 : 0;
  const problems = [
    !/^[a-z0-9][a-z0-9_-]{0,99}$/.test(f.slug) && "Enter the collective's Open Collective slug.",
    (days < 1 || days > MAX_WINDOW_DAYS) && `The window must last 1 to ${MAX_WINDOW_DAYS} days.`,
    f.starts && f.starts < addDays(todayUtc(), -366) && "The window must start within the last year.",
    (!pot || pot < MIN_POT_WEI) && "The pot must be at least 1 GEN.",
    rate === 0n && "Enter how many dollars of giving one GEN matches.",
    !/^\d+$/.test(f.cap) && "The cap is a whole number (0 for none).",
    !(/^\d+$/.test(f.minAge) && Number(f.minAge) <= 365) && "Account age is 0 to 365 days.",
    f.rules.length > 400 && "Rules are at most 400 characters.",
    (f.expires < addDays(f.ends, 30) || f.expires > addDays(f.ends, 400)) && "Expiry is 30 to 400 days after the window ends.",
  ].filter(Boolean) as string[];

  const submit = async () => {
    try {
      await writeAsync({
        kind: "open",
        input: {
          slug: f.slug,
          starts: f.starts,
          ends: f.ends,
          rate,
          pot: pot!,
          donorCap: Number(f.cap),
          minAgeDays: Number(f.minAge),
          rules: f.rules.trim(),
          expires: f.expires,
        },
      });
      onOpenChange(false);
    } catch {
      // the toast and the transaction panel explain it
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="brand-card max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-2xl">Open a match</DialogTitle>
          <DialogDescription>
            Lock GEN to match what established donors give this collective in a window. Validators read Open Collective when the window has
            settled; what the match does not use comes back to you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="om-slug">Open Collective slug</Label>
            <Input id="om-slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.trim().toLowerCase() })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-from">Window from</Label>
            <Input id="om-from" type="date" value={f.starts} onChange={set("starts")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-to">to</Label>
            <Input id="om-to" type="date" value={f.ends} onChange={set("ends")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-rate">1 GEN matches ($ given)</Label>
            <Input id="om-rate" inputMode="decimal" value={f.perGen} onChange={set("perGen")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-pot">Pot (GEN, the most it pays)</Label>
            <Input id="om-pot" inputMode="decimal" value={f.pot} onChange={set("pot")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-cap">Cap per donor ($, 0 = none)</Label>
            <Input id="om-cap" inputMode="numeric" value={f.cap} onChange={set("cap")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-age">Donor accounts at least (days old)</Label>
            <Input id="om-age" inputMode="numeric" value={f.minAge} onChange={set("minAge")} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label htmlFor="om-rules">Donors you will not match (plain words; empty = no review)</Label>
            <textarea id="om-rules" className="field h-20 py-2" value={f.rules} onChange={set("rules")} maxLength={400} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="om-exp">Hold an unclaimed match until</Label>
            <Input id="om-exp" type="date" value={f.expires} onChange={set("expires")} />
          </div>
          <div className="text-xs text-muted-foreground self-end pb-1">
            Counted from {f.ends ? addDays(f.ends, 3) : "…"}. The pot comes from your deposit (the app deposits it first).
          </div>
        </div>
        {problems.length > 0 && (
          <ul className="list-disc pl-5 text-xs text-[#B83A3A]">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <Button className="w-full" disabled={!isConnected || problems.length > 0 || pending === "open"} onClick={submit}>
          {pending === "open" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isConnected ? `Deposit and open (${f.pot || 0} GEN)` : "Connect a wallet first"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
