"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import MatchFund, { type OpenMatchInput, type TxProgress, type TxResult } from "../contracts/MatchFund";
import { countableFrom, formatGen, money, sameAddress, stakeFor, todayUtc, windowLeftSeconds, type Match } from "../contracts/types";
import { isOnGenLayerNetwork, switchToGenLayerNetwork } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { currentNetwork } from "../network";
import { TxError, classifyError } from "../utils/errors";
import { error, success } from "../utils/toast";
import { startTx, updateTx, type TxKind } from "./useTxLog";

export function useMatchContract(): MatchFund | null {
  const { address } = useWallet();
  const network = currentNetwork();
  return useMemo(() => (/^0x[0-9a-fA-F]{40}$/.test(network.contract) ? new MatchFund(network, address) : null), [network, address]);
}

const registryKey = () => ["registry", currentNetwork().id];

type Registry = { matches: Match[]; fetchedAt?: string };

async function fetchJson(url: string, timeoutMs = 60_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

/**
 * Every match, from the CDN-cached server snapshot (app/api/registry), so page loads spend none of the visitor's
 * Studio rate-limit budget. Falls back to one direct read.
 */
export function useRegistry() {
  const contract = useMatchContract();
  const query = useQuery<Registry, Error>({
    queryKey: registryKey(),
    queryFn: async () => {
      try {
        const body = await fetchJson(`/api/registry?network=${currentNetwork().id}`);
        if (!Array.isArray(body.matches)) throw new Error("Malformed snapshot");
        return body as Registry;
      } catch (snapshotErr) {
        if (!contract) throw classifyError(snapshotErr, "read");
        return { matches: await contract.getMatches(), fetchedAt: new Date().toISOString() };
      }
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
  return {
    matches: query.data?.matches ?? [],
    fetchedAt: query.data?.fetchedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/** Re-read the match a write touched and merge it into the cached registry. */
async function mergeFresh(qc: ReturnType<typeof useQueryClient>, contract: MatchFund, matchId?: string) {
  if (!matchId) return;
  try {
    const m = await contract.getMatch(matchId);
    qc.setQueryData<Registry>(registryKey(), (prev) => {
      const matches = prev?.matches ?? [];
      return {
        matches: matches.some((x) => x.id === m.id) ? matches.map((x) => (x.id === m.id ? m : x)) : [...matches, m],
        fetchedAt: prev?.fetchedAt,
      };
    });
  } catch {
    // Already confirmed on chain; the next snapshot refresh picks it up.
  }
}

export type WriteVars =
  | { kind: "open"; input: OpenMatchInput }
  | { kind: "cancel"; matchId: string }
  | { kind: "tally"; matchId: string }
  | { kind: "recount"; matchId: string }
  | { kind: "finalize"; matchId: string }
  | { kind: "claim"; matchId: string }
  | { kind: "reclaim"; matchId: string }
  | { kind: "withdraw" };

export const WRITE_LABEL: Record<TxKind, string> = {
  open: "Open a match",
  cancel: "Cancel the match",
  tally: "Count the window",
  recount: "Ask for a recount",
  finalize: "Finalize",
  claim: "Send to the collective",
  reclaim: "Return to the matcher",
  withdraw: "Withdraw your GEN",
};

/** One mutation for every MatchFund write, with a transaction log entry and typed errors. */
export function useMatchWrite() {
  const contract = useMatchContract();
  const { address } = useWallet();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (vars: WriteVars) => {
      const target = vars.kind === "withdraw" ? "your credited GEN" : vars.kind === "open" ? vars.input.slug : vars.matchId;
      const logId = startTx(vars.kind, target);
      setPending(vars.kind === "open" || vars.kind === "withdraw" ? vars.kind : `${vars.kind}:${vars.matchId}`);
      const onProgress = (p: TxProgress) =>
        updateTx(logId, {
          state: p.step === "awaiting_wallet" ? "awaiting_wallet" : p.step === "accepted" ? "accepted" : "confirming",
          txHash: p.txHash,
          progress: p.message,
        });
      const refuse = (message: string): never => {
        throw new TxError({ kind: "contract_revert", phase: "estimate", message, hint: "The data was refreshed; nothing was sent." });
      };
      try {
        if (!contract) throw new TxError({ kind: "unknown", phase: "send", message: "The contract address is not configured." });
        if (!address) throw new TxError({ kind: "wallet_missing", phase: "send", message: "No wallet is connected." });
        if (!(await isOnGenLayerNetwork())) {
          try {
            await switchToGenLayerNetwork();
          } catch (err) {
            throw classifyError(err, "send");
          }
        }
        const owedBefore = ["open", "recount", "withdraw"].includes(vars.kind) ? await contract.owedTo(address) : 0n;
        // Pots and stakes come from credit, so a call that needs a reading never carries GEN.
        const depositMissing = async (needed: bigint, what: string) => {
          if (owedBefore >= needed) return;
          onProgress({ step: "awaiting_wallet", message: `First, deposit the ${what}: approve it in your wallet.` });
          await contract.deposit(needed - owedBefore, onProgress);
        };

        let result: TxResult;
        let matchId = "matchId" in vars ? vars.matchId : undefined;
        let note = "Done.";
        // Re-read right before sending, so a stale list never sends a call the contract would refuse.
        const fresh = matchId ? await contract.getMatch(matchId) : null;
        switch (vars.kind) {
          case "open":
            await depositMissing(vars.input.pot, "pot");
            result = await contract.openMatch(vars.input, onProgress);
            if (contract.network.id === "bradbury") result.returned = (await contract.getMatches()).filter((m) => sameAddress(m.matcher, address)).at(-1)?.id;
            matchId = typeof result.returned === "string" ? result.returned : undefined;
            note = matchId ? `${matchId} is open: it is counted from ${countableFrom(vars.input)}.` : "Match opened.";
            break;
          case "cancel":
            if (!sameAddress(fresh!.matcher, address)) refuse("Only the matcher can cancel.");
            if (fresh!.state !== "open" || todayUtc() >= fresh!.starts) refuse("A match can only be cancelled before its window starts.");
            result = await contract.cancel(vars.matchId, onProgress);
            note = "The pot is credited back to you: take it out with Withdraw.";
            break;
          case "tally": {
            if (fresh!.state !== "open") refuse("This match has already been counted.");
            if (todayUtc() < countableFrom(fresh!)) refuse(`The window is counted from ${countableFrom(fresh!)}.`);
            result = await contract.tally(vars.matchId, onProgress);
            const m = await contract.getMatch(vars.matchId);
            note = `Matched ${money(m.eligible_cents, m.currency)}: ${formatGen(m.match_wei, 4)} GEN. Anyone can ask for a recount for 10 minutes.`;
            break;
          }
          case "recount": {
            if (fresh!.state !== "tallied" || windowLeftSeconds(fresh!) === 0) refuse("Recounts are open for 10 minutes after a count.");
            if (Number(fresh!.recounts) >= 2) refuse("This match has been recounted twice already.");
            await depositMissing(stakeFor(fresh!), "stake (10% of the pot)");
            result = await contract.recount(vars.matchId, onProgress);
            note =
              result.returned === "CHANGED"
                ? "The fresh count differed and replaced the old one; your stake is credited back."
                : "The fresh count agreed; your stake goes to the collective with the match.";
            break;
          }
          case "finalize": {
            if (fresh!.state !== "tallied" || windowLeftSeconds(fresh!) > 0) refuse("A match is finalized after its 10-minute recount window.");
            result = await contract.finalize(vars.matchId, onProgress);
            note =
              result.returned === "awaiting_wallet"
                ? "The match is held for the collective until it publishes a GenLayer wallet; the rest of the pot is credited back to the matcher."
                : "The match is credited to the collective's wallet; the rest of the pot to the matcher.";
            break;
          }
          case "claim":
            if (fresh!.state !== "awaiting_wallet") refuse("This match is not waiting for a wallet.");
            result = await contract.claim(vars.matchId, onProgress);
            note = `Sent to ${String(result.returned ?? "the collective's wallet")}, credited for it to withdraw.`;
            break;
          case "reclaim":
            if (fresh!.state !== "awaiting_wallet") refuse("This match is not waiting for a wallet.");
            if (todayUtc() <= fresh!.expires) refuse(`The match is held for the collective until ${fresh!.expires}.`);
            result = await contract.reclaim(vars.matchId, onProgress);
            note = "Credited back to the matcher.";
            break;
          case "withdraw":
            if (owedBefore === 0n) refuse("Nothing is credited to this wallet.");
            result = await contract.withdraw(onProgress);
            note = `${formatGen(owedBefore, 4)} GEN sent to your wallet.`;
            break;
        }
        updateTx(logId, { state: "accepted", txHash: result.txHash, status: result.status, executionResult: result.executionResult, progress: note });
        return { matchId, txHash: result.txHash, kind: vars.kind, note };
      } catch (err) {
        const e = classifyError(err, "send");
        if (contract) mergeFresh(qc, contract, "matchId" in vars ? vars.matchId : undefined);
        updateTx(logId, {
          state: "failed",
          txHash: e.txHash,
          error: { kind: e.kind, message: e.message, hint: e.hint, detail: e.detail, phase: e.phase },
        });
        error(`${WRITE_LABEL[vars.kind]} failed`, { description: [e.message, e.hint].filter(Boolean).join(" "), duration: 12000 });
        throw err;
      } finally {
        setPending(null);
      }
    },
    onSuccess: ({ matchId, txHash, kind, note }) => {
      if (contract) mergeFresh(qc, contract, matchId);
      qc.invalidateQueries({ queryKey: ["genBalance"] });
      qc.invalidateQueries({ queryKey: ["owed"] });
      success(`${WRITE_LABEL[kind]} confirmed`, {
        description: `${note} Tx ${txHash.slice(0, 10)}... is ACCEPTED by validator consensus.`,
        duration: 10000,
      });
    },
  });

  return { write: mutation.mutate, writeAsync: mutation.mutateAsync, pending, isPending: mutation.isPending };
}

