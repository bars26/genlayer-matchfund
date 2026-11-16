"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { formatGen } from "@/lib/contracts/types";
import { useWallet } from "@/lib/genlayer/wallet";
import { useMatchContract, useMatchWrite } from "@/lib/hooks/useMatchFund";
import { currentNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import { Button } from "./ui/button";

/**
 * GEN credited to the connected wallet (deposits, returned pots, recount stakes, matches). GEN only leaves MatchFund
 * through `withdraw`, to the caller; on Bradbury the app prepays the fee of that transfer.
 */
export function OwedCard() {
  const { address, isConnected } = useWallet();
  const contract = useMatchContract();
  const { writeAsync, pending } = useMatchWrite();
  const net = useNetwork();
  const q = useQuery({
    queryKey: ["owed", net.id, address],
    enabled: !!contract && !!address,
    queryFn: () => contract!.owedTo(address!),
    staleTime: 20_000,
  });
  if (!isConnected || !address) return null;
  const owed = q.data ?? 0n;
  return (
    <div className="brand-card p-5 space-y-2 text-sm">
      <h3 className="display text-lg font-bold">Your GEN in MatchFund</h3>
      <p className="display text-3xl font-bold">{q.isLoading ? "…" : `${formatGen(owed, 4)} GEN`}</p>
      <p className="text-xs text-muted-foreground">
        Deposits, the unused part of a pot, recount stakes that changed a count, and a collective's match (to its wallet) are credited here; a pot or a recount stake is taken from here (the app deposits what is missing first). Withdraw sends them to this wallet
        {net.id === "bradbury" ? "; the transaction prepays the fee of that transfer" : ""}.
      </p>
      <Button size="sm" disabled={owed === 0n || !!pending} onClick={() => writeAsync({ kind: "withdraw" }).catch(() => {})}>
        {pending === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
        Withdraw
      </Button>
    </div>
  );
}
