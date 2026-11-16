// Renders docs/REPRODUCTION.md from docs/demo-run.json (written by scripts/demo.mjs), the matches as the contract
// reports them now and, when present, docs/ui-test.json (a MetaMask run from the live app).
//
//   node scripts/reproduction.mjs

import { readFileSync, writeFileSync } from "fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const run = JSON.parse(readFileSync(new URL("../docs/demo-run.json", import.meta.url), "utf8"));
const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function read(functionName, args = []) {
  for (let i = 0; ; i++) {
    try {
      return await client.readContract({ address: run.contract, functionName, args });
    } catch (err) {
      if (i >= 5) throw err;
      await sleep(20000);
    }
  }
}
const plain = (o) => JSON.parse(JSON.stringify(o instanceof Map ? Object.fromEntries(o) : o, (k, v) => (typeof v === "bigint" ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v)));
const EXPLORER = "https://explorer-studio.genlayer.com";
const tx = (h) => (h ? `[${h.slice(0, 10)}…](${EXPLORER}/tx/${h})` : "");
const gen = (w) => `${(Number(w) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 })} GEN`;
const money = (c, cur = "USD") => `${{ USD: "$", EUR: "€", GBP: "£" }[cur] ?? ""}${(Number(c) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}${{ USD: 1, EUR: 1, GBP: 1 }[cur] ? "" : ` ${cur}`}`;
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

const matches = {};
for (const id of Object.keys(run.matches)) matches[id] = plain(await read("get_match", [id]));
const totals = JSON.parse(await read("totals"));
const balance = BigInt(await client.getBalance({ address: run.contract }));

const counted = Object.values(matches).filter((m) => m.tally_json);
const summary = counted.map((m) => {
  const t = JSON.parse(m.tally_json);
  const b = t.buckets;
  const c = (k) => (b[k][0] ? `${money(b[k][0], t.currency)} (${b[k][1]})` : "—");
  return `| ${m.id} | [${m.name}](https://opencollective.com/${m.slug}) | ${m.starts} to ${m.ends} | ${t.listed} / ${money(t.listed_cents, t.currency)} | ${t.totals_match ? "equal" : "DIFFERENT"} | ${c("new_account")} | ${c("over_cap")} | ${c("excluded")} | ${c("unsure")} | **${money(t.eligible_cents, t.currency)}** (${t.eligible_donors} donors) | ${gen(m.match_wei)} of ${gen(m.pot)} | ${m.state} |`;
});

const details = counted.map((m) => {
  const t = JSON.parse(m.tally_json);
  const cur = t.currency;
  const ex = t.excluded.map((s) => `| ${money(s.cents, cur)} | ${esc(s.name)} | ${esc(s.website)} | ${esc(s.why)} |`).join("\n");
  const top = t.top.map((s) => `${esc(s.name)} ${money(s.cents, cur)}`).join(", ");
  const unsure = t.unsure.map((s) => `${esc(s.name)} ${money(s.cents, cur)}`).join(", ") || "none";
  const t1 = new Date(Date.parse(`${m.ends}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return `### ${m.id}: ${m.name}, ${m.starts} to ${m.ends}

Terms: ${(Number(m.rate) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 6 })} GEN per ${cur === "USD" ? "dollar" : cur} given, pot ${gen(m.pot)},
${Number(m.donor_cap) ? `at most ${money(Number(m.donor_cap) * 100, cur)} per donor` : "no per-donor cap"}, donor accounts created before ${t.cutoff}.
Rules: *${esc(m.rules) || "none (no sponsor review)"}*

> ${esc(m.why)}

Evidence packet: read ${t.read_at} UTC, rows sha256 \`${t.rows_sha256}\`, packet sha256 \`${t.packet_sha256}\`. Largest matched donors: ${top}.
Unsure (not matched): ${unsure}.

${t.excluded.length ? `Sponsors the rules exclude (${t.n_excluded}${t.n_excluded > t.excluded.length ? `; the ${t.excluded.length} largest` : ""}), with the validators' reason:

| Counted | Sponsor | Website | Reason |
|---|---|---|---|
${ex}
` : ""}
Check the raw numbers yourself (Open Collective's public API, no key):

\`\`\`bash
curl -s https://api.opencollective.com/graphql/v2 -H 'content-type: application/json' -d '{"query":"{ account(slug:\\"${m.slug}\\") { stats { contributionsAmount(dateFrom:\\"${m.starts}T00:00:00Z\\", dateTo:\\"${t1}T00:00:00Z\\") { count amount { valueInCents } } } } }"}'
\`\`\`
`;
});

const rows = run.log.map((r) => `| ${r.who} | \`${esc(r.call)}\` | ${r.value === "0" ? "" : r.value} | ${r.status} | ${r.exec} | ${esc(r.refused ? `refused: ${r.refused}` : r.returned ?? "").slice(0, 200)} | ${tx(r.hash)} |`);
const recon = [
  ...run.reconciliations,
  { label: "now (when this file was generated)", pots: totals.pots, held: totals.held, owed: totals.owed, expected: totals.expected_balance, balance: balance.toString(), ok: BigInt(totals.expected_balance) === balance },
].map((r) => `| ${r.label} | ${gen(r.pots)} | ${gen(r.held)} | ${gen(r.owed)} | ${gen(r.expected)} | ${gen(r.balance)} | ${r.ok ? "match" : "MISMATCH"} |`);

let uiTest = "";
try {
  const ui = JSON.parse(readFileSync(new URL("../docs/ui-test.json", import.meta.url), "utf8"));
  uiTest = `## Wallet test from the live app

${ui.note} Wallet \`${ui.wallet}\`.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
${ui.steps.map(([step, value, result, hash]) => `| ${esc(step)} | ${value} | ${esc(result)} | ${tx(hash)} |`).join("\n")}

`;
} catch {
  // no wallet test recorded
}

const md = `# MatchFund: reproduction

Every number below was produced by GenLayer validators on GenLayer Studio reading Open Collective's public records, and can be
checked against them. Contract \`${run.contract}\` ([explorer](${EXPLORER}/address/${run.contract})); \`node scripts/verify-code.mjs ${run.contract}\`
checks that the deployed code is byte-identical to \`contracts/match_fund.py\`.

The matches are **demo matches** made by test wallets with Studio test GEN, not offers to these collectives. The contributions,
donors and totals they count are real. A count describes published contributions only, not any donor's intentions.

## The counts

| Match | Collective | Window | Listed | Sum vs Open Collective's own total | New accounts, guest checkouts | Above the per-donor cap | Excluded by the rules | Unsure | Matched | Paid | State |
|---|---|---|---|---|---|---|---|---|---|---|---|
${summary.join("\n")}

${details.join("\n")}
${uiTest}## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the \`exec\` column (\`ERROR\` = the contract refused, on purpose here).
\`open_match\` and \`recount\` carry no GEN: pots and stakes come from a deposit and are taken only after the validators agree.

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
${rows.join("\n")}

Accounts: ${Object.entries(run.accounts).map(([k, a]) => `${k} \`${a}\``).join(", ")}.

## Balance reconciliation

\`totals()\` keeps running totals (pots of matches not yet final, matches held for a wallet, GEN credited but not withdrawn); their
sum must equal the contract's GEN balance on chain.

| When | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|
${recon.join("\n")}
`;
writeFileSync(new URL("../docs/REPRODUCTION.md", import.meta.url), md);
console.log(`wrote docs/REPRODUCTION.md (${run.log.length} transactions)`);
