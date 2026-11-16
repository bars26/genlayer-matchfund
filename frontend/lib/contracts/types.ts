/** Types and display helpers for the MatchFund contract. */

type Num = string | number | bigint;

export type MatchState = "open" | "tallied" | "awaiting_wallet" | "paid" | "returned" | "cancelled";

export interface Match {
  id: string;
  matcher: string;
  slug: string;
  name: string;
  kind: string;
  currency: string;
  host: string;
  starts: string;
  ends: string;
  /** wei of GEN per whole unit of the collective's currency */
  rate: Num;
  pot: Num;
  donor_cap: Num;
  min_age_days: Num;
  rules: string;
  expires: string;
  state: MatchState;
  wallet: string;
  tally_json: string;
  why: string;
  eligible_cents: Num;
  match_wei: Num;
  bonus: Num;
  held: Num;
  paid: Num;
  returned: Num;
  recounts: Num;
  window_from: string;
  history_json: string;
}

export type Bucket = [number, number]; // [cents, contributions or donors]

export interface Sponsor {
  slug: string;
  name: string;
  website?: string;
  cents: number;
  why?: string;
}

/** A count, as the validators agreed on it (the evidence packet stored with the match). */
export interface Tally {
  currency: string;
  listed: number;
  listed_cents: number;
  kept: number;
  kept_cents: number;
  totals_match: boolean;
  cutoff: string;
  donors: number;
  reviewed: number;
  eligible_cents: number;
  eligible_donors: number;
  buckets: Record<"refunded" | "own" | "new_account" | "over_cap" | "excluded" | "unsure" | "unreviewed", Bucket>;
  excluded: Sponsor[];
  n_excluded: number;
  unsure: Sponsor[];
  top: Sponsor[];
  rows_sha256: string;
  packet_sha256: string;
  read_at: string;
  wallet: string;
}

export interface HistoryStep {
  at: string;
  event: string;
  [k: string]: unknown;
}

/** What the app's preview (no validators, no model) finds for a collective and a window. */
export interface WindowPreview {
  slug: string;
  name: string;
  type: string;
  currency: string;
  active: boolean;
  host: string;
  wallet: string;
  starts: string;
  ends: string;
  listed: number;
  listed_cents: number;
  totals_match: boolean;
  too_many: boolean;
  cutoff: string;
  buckets: { refunded: Bucket; own: Bucket; new_account: Bucket; over_cap: Bucket };
  established_cents: number;
  established_donors: number;
  /** donors with a public profile (the ones the validators review against the rules), largest first */
  profiled: Sponsor[];
  plain_cents: number;
}

export const RECOUNT_WINDOW_SECONDS = 600;
export const MIN_POT_WEI = 10n ** 18n;
export const SETTLE_DAYS = 2;
export const MAX_WINDOW_DAYS = 92;
export const DEFAULT_RULES = "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.";

export function wei(v: Num | undefined): bigint {
  try {
    return BigInt(String(v ?? "0").split(".")[0]);
  } catch {
    return 0n;
  }
}

export function formatGen(v: Num | undefined, digits = 2): string {
  const n = Number(wei(v)) / 1e18;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function parseGen(input: string): bigint | null {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) return null;
  const [whole, frac = ""] = t.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18));
}

const SIGN: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };

/** Money in a collective's currency, from cents. */
export function money(cents: Num | undefined, currency = "USD"): string {
  const v = Number(cents ?? 0) / 100;
  const whole = Number.isInteger(v);
  const text = v.toLocaleString("en-US", { maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2 });
  return SIGN[currency] ? `${SIGN[currency]}${text}` : `${text} ${currency}`;
}

export function parseJson<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function utcMs(iso: string): number {
  if (!iso) return NaN;
  const t = iso.trim();
  return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : `${t}Z`);
}

export function windowLeftSeconds(m: Match, now = Date.now()): number {
  if (m.state !== "tallied" || !m.window_from) return 0;
  return Math.max(0, Math.ceil(RECOUNT_WINDOW_SECONDS - (now - utcMs(m.window_from)) / 1000));
}

export const todayUtc = () => new Date().toISOString().slice(0, 10);
export function addDays(day: string, n: number): string {
  const t = Date.parse(`${day}T00:00:00Z`);
  return Number.isNaN(t) ? "" : new Date(t + n * 86_400_000).toISOString().slice(0, 10);
}
export const countableFrom = (m: Pick<Match, "ends">) => addDays(m.ends, SETTLE_DAYS + 1);
export const tallyOf = (m: Match) => parseJson<Tally | null>(m.tally_json, null);
export const historyOf = (m: Match) => parseJson<HistoryStep[]>(m.history_json, []);
export const stakeFor = (m: Pick<Match, "pot">) => wei(m.pot) / 10n;
export const ocUrl = (slug: string) => `https://opencollective.com/${slug}`;
export const ocTransactionsUrl = (slug: string) => `https://opencollective.com/${slug}/transactions?kind=CONTRIBUTION&type=CREDIT`;

/** "1 GEN per $100" from wei per unit of currency. */
export function rateText(rate: Num, currency = "USD"): string {
  const r = wei(rate);
  if (r === 0n) return "—";
  const unitsPerGen = Number(10n ** 18n) / Number(r);
  if (unitsPerGen >= 1) return `1 GEN per ${money(Math.round(unitsPerGen * 100), currency)}`;
  return `${formatGen(r, 4)} GEN per ${money(100, currency)}`;
}

export const STATE_STYLE: Record<MatchState, { label: string; cls: string; help: string }> = {
  open: { label: "Window open", cls: "bg-[#E6F1EC] text-[#1F6B4C] border-[#BFDCCD]", help: "Counted from two days after the window ends." },
  tallied: { label: "Counted", cls: "bg-[#FFE9E1] text-[#B4462A] border-[#FFC9B8]", help: "Anyone can ask for a recount for 10 minutes." },
  awaiting_wallet: {
    label: "Held for the collective",
    cls: "bg-[#FFF4D6] text-[#8A6100] border-[#F2DC9B]",
    help: "The match waits until the collective publishes a GenLayer wallet on its Open Collective page.",
  },
  paid: { label: "Paid", cls: "bg-[#0E2A2F] text-white border-[#0E2A2F]", help: "Credited to the collective's wallet." },
  returned: { label: "Returned", cls: "bg-[#ECEFEA] text-[#4D5B57] border-[#D6DCD3]", help: "No wallet appeared before expiry: back to the matcher." },
  cancelled: { label: "Cancelled", cls: "bg-[#ECEFEA] text-[#4D5B57] border-[#D6DCD3]", help: "Cancelled before the window started." },
};

export const BUCKET_LABEL: Record<string, string> = {
  refunded: "Refunded",
  own: "The collective's own or its host's money",
  new_account: "New accounts and guest checkouts",
  over_cap: "Above the per-donor cap",
  excluded: "Sponsors the rules exclude",
  unsure: "Sponsors the validators were unsure about",
  unreviewed: "Sponsors beyond the 120 reviewed",
};
