import type { Bucket, Sponsor, WindowPreview } from "@/lib/contracts/types";

/**
 * A preview of what a match would count, read from Open Collective's public GraphQL API with the contract's own rules
 * made in code (refunds, the collective's and its host's own money, accounts younger than the minimum age, the
 * per-donor cap), and the same check against Open Collective's own totals. It does not ask the model about sponsors:
 * it lists the donors with a public profile that the validators would review against the matcher's rules.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OC = "https://api.opencollective.com/graphql/v2";
const HEADERS = { "content-type": "application/json", accept: "application/json", "user-agent": "MatchFund/1.0 (GenLayer)" };
const PAGE = 1000;
const MAX_PAGES = 2;
const DAY = 86_400_000;
const WALLET = /genlayer[^0-9a-zA-Z]{0,24}(?:wallet|address)?[^0-9a-zA-Z]{0,8}(0x[0-9a-fA-F]{40})/gi;

const q = (s: string) => JSON.stringify(s);
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);

async function oc(op: string, slug: string, query: string, page = 0) {
  const res = await fetch(`${OC}?op=${op}&slug=${encodeURIComponent(slug)}${page ? `&page=${page}` : ""}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.error) throw new Error(body?.error?.message || `Open Collective answered ${res.status}`);
  if (body?.errors?.length) {
    const msg = String(body.errors[0]?.message ?? "");
    if (msg.includes("No collective found")) throw Object.assign(new Error(`Open Collective has no account ${slug}`), { status: 404 });
    throw new Error(msg || "Open Collective error");
  }
  return body.data;
}

function walletIn(...texts: unknown[]): string {
  const found = new Set<string>();
  for (const t of texts) for (const m of String(t ?? "").matchAll(WALLET)) found.add(m[1].toLowerCase());
  return found.size === 1 ? [...found][0] : "";
}

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const slug = (p.get("slug") ?? "").trim().toLowerCase();
  const starts = p.get("starts") ?? "";
  const ends = p.get("ends") ?? "";
  const minAge = Math.max(0, Math.min(365, Number(p.get("minAge") ?? 30) | 0));
  const capCents = Math.max(0, Number(p.get("cap") ?? 0) | 0) * 100;
  if (!/^[a-z0-9][a-z0-9_-]{0,99}$/.test(slug)) return Response.json({ error: "Enter an Open Collective slug, like webpack" }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(starts) || !/^\d{4}-\d{2}-\d{2}$/.test(ends) || ends < starts)
    return Response.json({ error: "Choose a window: a start and an end date" }, { status: 400 });
  const s = Date.parse(`${starts}T00:00:00Z`);
  const e = Date.parse(`${ends}T00:00:00Z`);
  if ((e - s) / DAY + 1 > 92) return Response.json({ error: "A window lasts at most 92 days" }, { status: 400 });
  const t0 = `${starts}T00:00:00Z`;
  const t1 = `${day(e + DAY)}T00:00:00Z`;

  try {
    const acc = await oc(
      "account",
      slug,
      `{ account(slug:${q(slug)}) { slug name type currency isActive description longDescription ... on AccountWithHost { host { slug } } } }`
    );
    const a = acc?.account;
    if (!a) return Response.json({ error: `Open Collective has no account ${slug}` }, { status: 404 });
    const host = String(a.host?.slug ?? "");
    const rows: any[] = [];
    let total = 0;
    let stats: any[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const statsPart =
        page === 0
          ? `account(slug:${q(slug)}) { stats { contributionsAmount(dateFrom:${q(t0)}, dateTo:${q(t1)}) { count amount { valueInCents } } } } `
          : "";
      const data = await oc(
        "window",
        slug,
        `{ ${statsPart}transactions(account:{slug:${q(slug)}}, type:CREDIT, kind:[CONTRIBUTION], dateFrom:${q(t0)}, dateTo:${q(t1)}, limit:${PAGE}, offset:${page * PAGE}, orderBy:{field:CREATED_AT, direction:ASC}) { totalCount nodes { id createdAt isRefunded amount { valueInCents currency } fromAccount { slug name type createdAt website description } } } }`,
        page
      );
      if (page === 0) {
        total = Number(data?.transactions?.totalCount ?? 0);
        stats = data?.account?.stats?.contributionsAmount ?? [];
        if (total > MAX_PAGES * PAGE) break;
      }
      rows.push(...(data?.transactions?.nodes ?? []));
      if (rows.length >= total) break;
    }
    const cutoff = day(s - minAge * DAY);
    const buckets: WindowPreview["buckets"] = { refunded: [0, 0], own: [0, 0], new_account: [0, 0], over_cap: [0, 0] };
    const add = (b: Bucket, cents: number) => {
      b[0] += cents;
      b[1] += 1;
    };
    let keptN = 0;
    let keptCents = 0;
    const donors = new Map<string, Sponsor & { profiled: boolean; total: number }>();
    for (const r of rows) {
      const cents = Number(r?.amount?.valueInCents ?? 0);
      if (r?.isRefunded) {
        add(buckets.refunded, cents);
        continue;
      }
      keptN++;
      keptCents += cents;
      const f = r?.fromAccount ?? {};
      const d = String(f.slug ?? "");
      if (!d || d === slug || d === host) {
        add(buckets.own, cents);
        continue;
      }
      if (String(f.createdAt ?? "").slice(0, 10) >= cutoff) {
        add(buckets.new_account, cents);
        continue;
      }
      const prev = donors.get(d) ?? {
        slug: d,
        name: String(f.name ?? d),
        website: String(f.website ?? ""),
        cents: 0,
        total: 0,
        profiled: !!(f.website || f.description),
      };
      prev.total += cents;
      donors.set(d, prev);
    }
    let established = 0;
    let plain = 0;
    for (const d of donors.values()) {
      d.cents = capCents > 0 ? Math.min(d.total, capCents) : d.total;
      if (d.cents < d.total) add(buckets.over_cap, d.total - d.cents);
      established += d.cents;
      if (!d.profiled) plain += d.cents;
    }
    const statsN = stats.reduce((t, x) => t + Number(x?.count ?? 0), 0);
    const statsCents = stats.reduce((t, x) => t + Number(x?.amount?.valueInCents ?? 0), 0);
    const profiled = [...donors.values()]
      .filter((d) => d.profiled)
      .sort((x, y) => y.cents - x.cents || x.slug.localeCompare(y.slug))
      .slice(0, 30)
      .map(({ slug: sl, name, website, cents }) => ({ slug: sl, name, website, cents }));
    const preview: WindowPreview = {
      slug: String(a.slug ?? slug),
      name: String(a.name ?? slug),
      type: String(a.type ?? ""),
      currency: String(a.currency ?? "USD"),
      active: !!a.isActive,
      host,
      wallet: walletIn(a.description, a.longDescription),
      starts,
      ends,
      listed: total,
      listed_cents: keptCents + buckets.refunded[0],
      totals_match: total <= MAX_PAGES * PAGE && rows.length === total && statsN === keptN && statsCents === keptCents,
      too_many: total > MAX_PAGES * PAGE,
      cutoff,
      buckets,
      established_cents: established,
      established_donors: donors.size,
      profiled,
      plain_cents: plain,
    };
    return Response.json(preview, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? String(err) },
      { status: err?.status ?? 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
