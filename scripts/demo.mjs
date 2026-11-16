// Live end-to-end demo of MatchFund on GenLayer Studio, on real Open Collective records (public API, no key).
//
//   node scripts/demo.mjs <contract-address>      # writes docs/demo-run.json
//
// The matches are DEMO matches made by test wallets with Studio test GEN, not offers from anyone to these
// collectives. The contributions, donors and totals they count are real.

import { writeFileSync } from "fs";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { GEN, client, field, fund, log, read, reconcile, reconciliations, setContract, sleep, write, WINDOW_MS } from "./studio.mjs";

const [CONTRACT] = process.argv.slice(2);
if (!CONTRACT) {
  console.error("usage: node scripts/demo.mjs <contract-address>");
  process.exit(1);
}
setContract(CONTRACT);
const keys = { matcher: generatePrivateKey(), counter: generatePrivateKey(), doubter: generatePrivateKey() };
if (process.env.DEMO_KEYS) writeFileSync(process.env.DEMO_KEYS, JSON.stringify(keys));
const acct = Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, createAccount(v)]));
const C = Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, client(a)]));
console.log("contract  ", CONTRACT);
for (const [k, a] of Object.entries(acct)) console.log(k.padEnd(10), a.address);
await fund(acct.matcher.address, 30n);
await fund(acct.counter.address, 1n);
await fund(acct.doubter.address, 2n);
await sleep(3000);

const first = (await read(C.matcher, "get_matches", [0, 100])).length;
const mid = (n) => `match_${first + n}`;
const RULES = "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.";
const show = async (id) => {
  const m = await read(C.matcher, "get_match", [id]);
  console.log(`  -> ${id} ${field(m, "state")}: match ${Number(field(m, "match_wei")) / 1e18} GEN. ${field(m, "why")}`);
  return m;
};

// The matcher deposits once; every pot is taken from this credit.
await write(C.matcher, "matcher", "deposit", [], 12n * GEN);
// Refused, taking nothing: a date that does not exist, an account that is a person, a slug Open Collective does not have.
await write(C.matcher, "matcher", "open_match", ["webpack", "2026-09-31", "2026-10-31", GEN / 1000n, 5n * GEN, 1000, 30, RULES, "2027-03-31"], 0n, { expectError: true });
await write(C.matcher, "matcher", "open_match", ["ag-grid-226", "2026-10-01", "2026-10-31", GEN / 1000n, 5n * GEN, 1000, 30, RULES, "2027-03-31"], 0n, { expectError: true });
await write(C.matcher, "matcher", "open_match", ["no-such-collective-matchfund", "2026-10-01", "2026-10-31", GEN / 1000n, 5n * GEN, 1000, 30, RULES, "2027-03-31"], 0n, { expectError: true });

// M0: webpack, October 2026, 0.001 GEN per dollar up to 5 GEN, at most $1,000 per donor, accounts 30+ days old, rules.
await write(C.matcher, "matcher", "open_match", ["webpack", "2026-10-01", "2026-10-31", GEN / 1000n, 5n * GEN, 1000, 30, RULES, "2027-03-31"]);
// M1: Babel, October 2026, the same rules, a 1 GEN pot that the month's giving more than uses up.
await write(C.matcher, "matcher", "open_match", ["babel", "2026-10-01", "2026-10-31", GEN / 1000n, 1n * GEN, 0, 30, RULES, "2027-03-31"]);
// M2: Vue.js, a window that has not started: the matcher may still cancel it.
await write(C.matcher, "matcher", "open_match", ["vuejs", "2026-12-01", "2026-12-31", GEN / 1000n, 1n * GEN, 1000, 30, RULES, "2027-03-31"]);
await reconcile(C.matcher, "three pots taken from the deposit, 5 GEN still credited");
await write(C.matcher, "matcher", "cancel", [mid(2)]);

// Anyone counts a settled window.
await write(C.counter, "counter", "tally", [mid(0)]);
await show(mid(0));
await write(C.counter, "counter", "tally", [mid(1)]);
await show(mid(1));
// M2 was cancelled: counting it is refused.
await write(C.counter, "counter", "tally", [mid(2)], 0n, { expectError: true });

// A doubter stakes 10% of the pot on a recount of M0; the fresh count agrees, so the stake goes to webpack.
await write(C.doubter, "doubter", "deposit", [], GEN / 2n);
await write(C.doubter, "doubter", "recount", [mid(0)]);
await show(mid(0));
await reconcile(C.matcher, "both windows counted, a recount stake added to webpack's match");

// After the 10-minute recount windows anyone finalizes. Neither collective publishes a GenLayer wallet on its
// Open Collective page yet, so their matches are held for them; the unused part of each pot goes back to the matcher.
await sleep(WINDOW_MS + 30_000);
await write(C.counter, "counter", "finalize", [mid(1)]);
await write(C.counter, "counter", "finalize", [mid(0)]);
await write(C.counter, "counter", "claim", [mid(0)], 0n, { expectError: true }); // no wallet published yet
await show(mid(0));
await show(mid(1));
await reconcile(C.matcher, "finalized: matches held for the collectives, the rest credited to the matcher");
await write(C.matcher, "matcher", "withdraw", []);
await write(C.doubter, "doubter", "withdraw", [], 0n, { expectError: true }); // its whole deposit was the recount stake
await write(C.matcher, "matcher", "withdraw", [], 0n, { expectError: true }); // nothing left to withdraw
await reconcile(C.matcher, "end of run, after the withdrawals");

const out = { network: "studio", contract: CONTRACT, accounts: Object.fromEntries(Object.entries(acct).map(([k, a]) => [k, a.address])), matches: {}, reconciliations, log };
for (const n of [0, 1, 2]) {
  const m = await read(C.matcher, "get_match", [mid(n)]);
  out.matches[mid(n)] = JSON.parse(JSON.stringify(m instanceof Map ? Object.fromEntries(m) : m, (k, v) => (typeof v === "bigint" ? v.toString() : v)));
}
writeFileSync(new URL("../docs/demo-run.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("wrote docs/demo-run.json");
