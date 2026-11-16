"""Direct-mode tests for the MatchFund contract: matching funds for Open Collective donations, counted by GenLayer
validators from Open Collective's public records."""

import json
import re
from datetime import datetime, timedelta, timezone

import pytest

from tests.direct.conftest import CONTRACT_PATH, llm_json, to_hex

GEN = 10**18
OC = "https://api.opencollective.com/graphql/v2"
SLUG, HOST = "webpack", "opensource"


def _day(n):
    """A date n days from today (UTC): the contract reads the transaction's own clock, so tests use real dates."""
    return (datetime.now(timezone.utc) + timedelta(days=n)).strftime("%Y-%m-%d")


STARTS, ENDS, EXPIRES = _day(-47), _day(-17), _day(134)
CUTOFF = _day(-77)  # 30 days before the window opens
RATE = GEN // 100  # 0.01 GEN per dollar
POT = 10 * GEN
STAKE = POT // 10
RULES = "No casino, betting or gambling sponsors, and no sellers of followers, likes or backlinks."
WALLET_LINE = "Support us on GenLayer too. GenLayer wallet: 0x{addr}"


def _owed(contract, who):
    return int(contract.owed_to(to_hex(who).lower()))


def _post(direct_vm, url, body, status=200):
    direct_vm.mock_web("^" + re.escape(url) + "$", {"method": "POST", "response": {
        "status": status, "headers": {"Content-Type": b"application/json"}, "body": json.dumps(body).encode()}})


def _account(kind="COLLECTIVE", active=True, description="Bundler", long_description="", currency="USD", slug=SLUG):
    return {"data": {"account": {"slug": slug, "name": "webpack", "type": kind, "currency": currency, "isActive": active,
                                 "createdAt": "2016-10-02T23:30:48Z", "description": description,
                                 "longDescription": long_description, "website": "https://webpack.js.org/",
                                 "host": {"slug": HOST}}}}


def _tx(i, cents, donor, created, refunded=False, kind="ORGANIZATION", website="", description="", currency="USD", day="2026-10-10"):
    return {"id": f"tx{i}", "createdAt": f"{day}T10:00:00Z", "isRefunded": refunded,
            "amount": {"valueInCents": cents, "currency": currency},
            "fromAccount": {"slug": donor, "name": donor.replace("-", " ").title(), "type": kind,
                            "createdAt": f"{created}T00:00:00Z", "website": website, "description": description}}


# One month of webpack-like giving: real patterns, made-up amounts.
ROWS = [
    _tx(1, 250_000, "ag-grid", "2018-01-01", kind="INDIVIDUAL", website="https://www.ag-grid.com"),  # $2,500, over a $1,000 cap
    _tx(2, 20_000, "elastic", "2017-05-01", website="https://elastic.co/", description="The company behind Elastic"),
    _tx(3, 20_000, "czech-casinos", "2024-03-01", website="https://czech-casinos.com/", description="Online casino reviews"),
    _tx(4, 20_000, "socialboosting", "2023-02-01", website="https://www.socialboosting.com/", description="Buy Instagram followers"),
    _tx(5, 20_000, "coinsmania", "2022-02-01", website="https://coinsmania.com/", description="Social gaming platform"),
    _tx(6, 500, "scott-wolf", "2019-05-13", kind="INDIVIDUAL"),
    _tx(7, 500, "scott-wolf", "2019-05-13", kind="INDIVIDUAL", day="2026-10-20"),
    _tx(8, 100, "guest-4c7a5289", _day(-17), kind="INDIVIDUAL"),  # card testing from guest checkouts
    _tx(9, 100, "guest-addbca89", _day(-18), kind="INDIVIDUAL"),
    _tx(10, 20_000, "youviews", _day(-22), website="https://youviews.com/", description="Buy YouTube views"),  # new account
    _tx(11, 2_000, "refunder", "2020-01-01", kind="INDIVIDUAL", refunded=True),
    _tx(12, 5_000, HOST, "2016-01-01"),  # the host's own money
]
# kept (not refunded): 250000+20000*4+500+500+100+100+20000+5000 = 356,200 cents
KEPT_N, KEPT_CENTS = 11, 356_200
# established, not own: ag-grid 100,000 (capped from 250,000), elastic, czech-casinos, socialboosting, coinsmania,
# scott-wolf 1,000. Excluded: czech-casinos, socialboosting. Unsure: coinsmania.
ELIGIBLE = 100_000 + 20_000 + 1_000  # 121,000 cents = $1,210
MATCH = ELIGIBLE * RATE // 100  # 12.1 GEN, capped at the 10 GEN pot below


def _window(direct_vm, rows=None, total=None, stats=None, page=0, status=200, description="Bundler", long_description=""):
    rows = ROWS if rows is None else rows
    url = f"{OC}?op=window&slug={SLUG}" + (f"&page={page}" if page else "")
    data = {"transactions": {"totalCount": len(rows) if total is None else total, "nodes": rows}}
    if page == 0:
        kept = [r for r in rows if not r["isRefunded"]]
        n, cents = (len(kept), sum(r["amount"]["valueInCents"] for r in kept)) if stats is None else stats
        data["account"] = {"currency": "USD", "description": description, "longDescription": long_description,
                           "stats": {"contributionsAmount": [{"count": n, "amount": {"valueInCents": cents}}]}}
    _post(direct_vm, url, {"data": data}, status)


def _labels(direct_vm, exclude=None, unsure=None, raw=None):
    answer = raw if raw is not None else {
        "exclude": exclude if exclude is not None else {"czech-casinos": "online casino", "socialboosting": "sells followers"},
        "unsure": unsure if unsure is not None else ["coinsmania"]}
    direct_vm.mock_llm(r".*", llm_json(answer) if not isinstance(answer, str) else answer)


def _relabel(direct_vm, rows=None, **labels):
    """Replace the model's answer (mocks match in order, so the window is mocked again after clearing)."""
    direct_vm.clear_mocks()
    _post(direct_vm, f"{OC}?op=account&slug={SLUG}", _account())
    _window(direct_vm, rows=rows)
    _labels(direct_vm, **labels)


def _setup(direct_vm, account=None, account_status=200, **window):
    direct_vm.clear_mocks()
    _post(direct_vm, f"{OC}?op=account&slug={SLUG}", account or _account(), account_status)
    _window(direct_vm, **window)
    _labels(direct_vm)


def _deposit(direct_vm, contract, who, amount):
    if amount:
        direct_vm.sender, direct_vm.value = who, amount
        contract.deposit()
        direct_vm.value = 0


def _open(direct_vm, direct_deploy, matcher, deposit=POT, expect=None, account=None, account_status=200, **terms):
    direct_vm.sender = matcher
    contract = direct_deploy(CONTRACT_PATH)
    _setup(direct_vm, account=account() if callable(account) else account, account_status=account_status)
    _deposit(direct_vm, contract, matcher, deposit)
    args = dict(slug=SLUG, starts=STARTS, ends=ENDS, rate=RATE, pot=POT, donor_cap=1000, min_age_days=30, rules=RULES,
                expires=EXPIRES)
    args.update(terms)
    direct_vm.sender = matcher
    if expect:
        with direct_vm.expect_revert(expect):
            contract.open_match(*args.values())
        return contract, None
    return contract, contract.open_match(*args.values())


def _balance_ok(contract, direct_vm=None):
    t = json.loads(contract.totals())
    assert int(t["expected_balance"]) == int(t["pots"]) + int(t["held"]) + int(t["owed"])
    return t


def _close_window(contract, match_id):
    contract.matches[match_id].window_from = "2000-01-01T00:00:00"


# --- opening a match ----------------------------------------------------------


def test_open_freezes_the_collective_and_takes_the_pot_from_the_deposit(direct_vm, direct_deploy, direct_alice):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    assert match_id == "match_0"
    m = contract.get_match(match_id)
    assert (m.slug, m.name, m.kind, m.currency, m.host, m.state) == (SLUG, "webpack", "COLLECTIVE", "USD", HOST, "open")
    assert (int(m.pot), int(m.rate), int(m.donor_cap), int(m.min_age_days), m.rules) == (POT, RATE, 1000, 30, RULES)
    assert m.wallet == ""
    assert _owed(contract, direct_alice) == 0
    t = _balance_ok(contract)
    assert (int(t["pots"]), int(t["owed"])) == (POT, 0)


def test_open_match_carries_no_gen(direct_vm, direct_deploy, direct_alice):
    contract, _ = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender, direct_vm.value = direct_alice, GEN
    with direct_vm.expect_revert(""):
        contract.open_match(SLUG, STARTS, ENDS, RATE, GEN, 0, 30, RULES, EXPIRES)
    direct_vm.value = 0


@pytest.mark.parametrize("terms, setup, reason", [
    (dict(slug="Not A Slug!"), {}, "slug must be an Open Collective slug"),
    (dict(starts="2026-02-31"), {}, "starts must be a real calendar date"),
    (dict(ends=_day(-48)), {}, "the window must end on or after it starts"),
    (dict(ends=_day(45)), {}, "last at most 92 days"),
    (dict(starts=_day(-400), ends=_day(-370), expires=_day(-300)), {}, "within 366 days back"),
    (dict(starts=_day(100), ends=_day(120), expires=_day(200)), {}, "92 days ahead"),
    (dict(expires=_day(-7)), {}, "expires must be 30 to 400 days after the window ends"),
    (dict(rules="x" * 401), {}, "rules must be at most 400 characters"),
    (dict(rate=10), {}, "rate must be a whole number"),
    (dict(pot=GEN // 2), {}, "pot must be a whole number"),
    (dict(donor_cap=-1), {}, "donor_cap must be a whole number"),
    (dict(min_age_days=400), {}, "min_age_days must be a whole number"),
    (dict(pot=20 * GEN), {}, "deposit first: 20 GEN needed, 10 GEN credited"),
    ({}, dict(account={"errors": [{"message": "No collective found with slug webpack"}], "data": {"account": None}}),
     "Open Collective has no account webpack"),
    ({}, dict(account=_account(kind="INDIVIDUAL")), "is a INDIVIDUAL account"),
    ({}, dict(account=_account(active=False)), "is not an active collective"),
    ({}, dict(account_status=500), "could not be read right now"),
    ({}, dict(account={"error": {"message": "Rate limit exceeded."}}), "could not be read right now"),
])
def test_invalid_matches_are_refused_and_take_nothing(direct_vm, direct_deploy, direct_alice, terms, setup, reason):
    contract, _ = _open(direct_vm, direct_deploy, direct_alice, expect=reason, **setup, **terms)
    assert _owed(contract, direct_alice) == POT
    assert int(contract.match_count) == 0


def test_a_published_wallet_is_read_at_opening(direct_vm, direct_deploy, direct_alice, direct_charlie):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, account=lambda: _account(
        long_description=f"<p>{WALLET_LINE.format(addr=to_hex(direct_charlie)[2:])}</p>"))
    assert contract.get_match(match_id).wallet == to_hex(direct_charlie).lower()


def test_two_different_wallets_count_as_none(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, account=lambda: _account(description=(
        WALLET_LINE.format(addr=to_hex(direct_charlie)[2:]) + " " + WALLET_LINE.format(addr=to_hex(direct_bob)[2:]))))
    assert contract.get_match(match_id).wallet == ""


# --- counting -----------------------------------------------------------------


def test_the_window_is_counted_after_it_settles(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, starts=_day(-20), ends=_day(-1))
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert(f"The window is counted from {_day(2)}"):
        contract.tally(match_id)


def test_tally_counts_only_established_donors_within_the_rules(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_bob
    assert contract.tally(match_id) == str(POT)  # 12.1 GEN earned, capped at the 10 GEN pot
    m = contract.get_match(match_id)
    t = json.loads(m.tally_json)
    assert m.state == "tallied" and int(m.eligible_cents) == ELIGIBLE and int(m.match_wei) == POT
    assert (t["listed"], t["kept"], t["kept_cents"], t["listed_cents"]) == (12, KEPT_N, KEPT_CENTS, KEPT_CENTS + 2_000)
    b = t["buckets"]
    assert b["refunded"] == [2_000, 1]
    assert b["own"] == [5_000, 1]
    assert b["new_account"] == [20_200, 3]  # two guest checkouts and a follower seller created in October
    assert b["over_cap"] == [150_000, 1]
    assert b["excluded"] == [40_000, 2] and b["unsure"] == [20_000, 1] and b["unreviewed"] == [0, 0]
    assert t["cutoff"] == CUTOFF and t["eligible_donors"] == 3 and t["reviewed"] == 5
    assert [e["slug"] for e in t["excluded"]] == ["czech-casinos", "socialboosting"]
    assert t["excluded"][0]["why"] == "online casino"
    assert [d["slug"] for d in t["top"]] == ["ag-grid", "elastic", "scott-wolf"]
    assert "exactly Open Collective's own total" in m.why and "$1,210 from 3 established donors" in m.why
    assert f"from accounts created after {CUTOFF}" in m.why
    _balance_ok(contract)


def test_a_small_month_pays_less_than_the_pot(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, rate=GEN // 1000)  # 0.001 GEN per dollar
    direct_vm.sender = direct_bob
    assert contract.tally(match_id) == str(ELIGIBLE * (GEN // 1000) // 100)  # 1.21 GEN


def test_without_rules_no_model_is_asked_and_every_established_donor_counts(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, rules="", donor_cap=0)
    _relabel(direct_vm, raw="this would fail if the model were asked")
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    t = json.loads(contract.get_match(match_id).tally_json)
    assert t["reviewed"] == 0 and t["eligible_cents"] == 250_000 + 4 * 20_000 + 1_000


@pytest.mark.parametrize("window, reason", [
    (dict(stats=(KEPT_N - 1, KEPT_CENTS)), "did not match its own totals"),
    (dict(stats=(KEPT_N, KEPT_CENTS + 1)), "did not match its own totals"),
    (dict(total=2_001), "Open Collective lists 2001 contributions in this window"),
    (dict(status=503), "could not be read right now"),
    (dict(rows=ROWS + [_tx(99, 100, "euro-donor", "2015-01-01", currency="EUR")]), "another currency"),
])
def test_unreliable_readings_count_nothing(direct_vm, direct_deploy, direct_alice, direct_bob, window, reason):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.clear_mocks()
    _window(direct_vm, **window)
    _labels(direct_vm)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert(reason):
        contract.tally(match_id)
    assert contract.get_match(match_id).state == "open"
    _balance_ok(contract)


def test_a_missing_second_page_is_not_counted_partially(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.clear_mocks()
    _window(direct_vm, total=1_500)  # 12 rows listed on page one, the rest never arrive
    _window(direct_vm, rows=[], page=1)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("did not match its own totals"):
        contract.tally(match_id)


def test_two_pages_are_read(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, rules="")
    first = [_tx(1000 + i, 100, f"donor-{i}", "2020-01-01", kind="INDIVIDUAL") for i in range(1000)]
    second = [_tx(2000 + i, 100, f"donor-{1000 + i}", "2020-01-01", kind="INDIVIDUAL") for i in range(200)]
    direct_vm.clear_mocks()
    _post(direct_vm, f"{OC}?op=window&slug={SLUG}", {"data": {
        "transactions": {"totalCount": 1200, "nodes": first},
        "account": {"currency": "USD", "description": "", "longDescription": "",
                    "stats": {"contributionsAmount": [{"count": 1200, "amount": {"valueInCents": 120_000}}]}}}})
    _window(direct_vm, rows=second, total=1200, page=1)
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    t = json.loads(contract.get_match(match_id).tally_json)
    assert (t["listed"], t["eligible_cents"], t["eligible_donors"]) == (1200, 120_000, 1200)


def test_a_review_that_is_not_json_counts_nothing(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    _relabel(direct_vm, raw=["not", "a", "dict"])
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("not JSON"):
        contract.tally(match_id)


def test_the_model_cannot_label_donors_it_was_not_shown(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    _relabel(direct_vm, exclude={"elastic": "x", "scott-wolf": "no profile", "guest-4c7a5289": "x"}, unsure=["nobody"])
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    t = json.loads(contract.get_match(match_id).tally_json)
    # scott-wolf has no public profile, so it is never reviewed and always counts
    assert t["eligible_cents"] == 100_000 + 20_000 * 3 + 1_000  # elastic excluded, the three others count


# --- validators ---------------------------------------------------------------


def _leader(contract, match_id):
    return json.loads(contract.get_match(match_id).tally_json)


def test_validators_accept_a_count_within_tolerance(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    leader = _leader(contract, match_id)
    for k in ("read_at", "packet_sha256"):
        leader.pop(k)
    assert direct_vm.run_validator(leader_result=json.dumps(leader, sort_keys=True))
    shifted = dict(leader, eligible_cents=leader["eligible_cents"] + 1_500)
    shifted["buckets"] = dict(leader["buckets"], unsure=[leader["buckets"]["unsure"][0] - 1_500, 1])
    assert direct_vm.run_validator(leader_result=json.dumps(shifted, sort_keys=True))  # $15 off: within 5% of the $1,810 labelled


@pytest.mark.parametrize("change", [
    lambda t: t.update(eligible_cents=t["eligible_cents"] + 20_000,
                       buckets=dict(t["buckets"], unsure=[0, 0])),  # counts the unsure sponsor: $200 off
    lambda t: t.update(eligible_cents=t["eligible_cents"] + 1),  # money appeared from nowhere
    lambda t: t.update(buckets=dict(t["buckets"], new_account=[0, 0])),  # a count made in code differs
    lambda t: t.update(kept=t["kept"] + 1),
    lambda t: t.update(wallet="0x" + "11" * 20),
    lambda t: t.update(state="error"),
])
def test_validators_reject_a_different_count(direct_vm, direct_deploy, direct_alice, direct_bob, change):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    leader = _leader(contract, match_id)
    change(leader)
    assert not direct_vm.run_validator(leader_result=json.dumps(leader, sort_keys=True))


def test_validators_reject_a_leader_error(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    assert not direct_vm.run_validator(leader_error=Exception("boom"))


# --- recounts, finalizing, wallets ------------------------------------------------


def _tallied(direct_vm, direct_deploy, matcher, counter, **terms):
    contract, match_id = _open(direct_vm, direct_deploy, matcher, **terms)
    direct_vm.sender = counter
    contract.tally(match_id)
    return contract, match_id


def test_an_upheld_recount_gives_the_stake_to_the_collective(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob)
    _deposit(direct_vm, contract, direct_bob, STAKE)
    direct_vm.sender = direct_bob
    assert contract.recount(match_id) == "UPHELD"
    m = contract.get_match(match_id)
    assert (int(m.bonus), int(m.recounts), _owed(contract, direct_bob)) == (STAKE, 1, 0)
    t = _balance_ok(contract)
    assert int(t["pots"]) == POT + STAKE


def test_a_changed_recount_replaces_the_count_and_returns_the_stake(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob, rate=GEN // 1000)
    before = int(contract.get_match(match_id).match_wei)
    direct_vm.clear_mocks()
    rows = [dict(r, isRefunded=True) if r["id"] == "tx2" else r for r in ROWS]  # elastic's $200 was refunded since
    _window(direct_vm, rows=rows)
    _labels(direct_vm)
    _deposit(direct_vm, contract, direct_bob, STAKE)
    direct_vm.sender = direct_bob
    assert contract.recount(match_id) == "CHANGED"
    m = contract.get_match(match_id)
    assert int(m.eligible_cents) == ELIGIBLE - 20_000 and int(m.match_wei) < before
    assert _owed(contract, direct_bob) == STAKE and int(m.bonus) == 0
    assert "recount_changed" in m.history_json
    _balance_ok(contract)


def test_recounts_need_a_stake_an_open_window_and_stop_at_two(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("deposit first: 1 GEN needed, 0 GEN credited"):
        contract.recount(match_id)
    _deposit(direct_vm, contract, direct_bob, 3 * STAKE)
    direct_vm.sender = direct_bob
    contract.recount(match_id)
    contract.recount(match_id)
    with direct_vm.expect_revert("recounted twice already"):
        contract.recount(match_id)
    _close_window(contract, match_id)
    with direct_vm.expect_revert("Recounts are open for 10 minutes"):
        contract.recount(match_id)
    assert _owed(contract, direct_bob) == STAKE


def test_finalize_holds_the_match_for_a_collective_without_a_wallet(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob, rate=GEN // 1000)
    match = ELIGIBLE * (GEN // 1000) // 100
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("after its 10-minute recount window"):
        contract.finalize(match_id)
    _close_window(contract, match_id)
    assert contract.finalize(match_id) == "awaiting_wallet"
    m = contract.get_match(match_id)
    assert (int(m.held), int(m.returned)) == (match, POT - match)
    assert _owed(contract, direct_alice) == POT - match
    t = _balance_ok(contract)
    assert (int(t["pots"]), int(t["held"])) == (0, match)
    with direct_vm.expect_revert("already been counted"):
        contract.tally(match_id)


def test_finalize_credits_a_published_wallet_and_it_withdraws(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, account=lambda: _account(
        description=WALLET_LINE.format(addr=to_hex(direct_charlie)[2:])))
    direct_vm.sender = direct_bob
    contract.tally(match_id)
    _close_window(contract, match_id)
    assert contract.finalize(match_id) == "paid"
    assert _owed(contract, direct_charlie) == POT and _owed(contract, direct_alice) == 0
    direct_vm.sender = direct_charlie
    assert contract.withdraw() == str(POT)
    t = _balance_ok(contract)
    assert (int(t["expected_balance"]), int(t["withdrawn"])) == (0, POT)
    with direct_vm.expect_revert("Nothing to withdraw"):
        contract.withdraw()


def test_a_held_match_is_claimed_once_the_wallet_is_published(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob, rate=GEN // 1000)
    _close_window(contract, match_id)
    contract.finalize(match_id)
    held = int(contract.get_match(match_id).held)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("does not publish one GenLayer wallet yet"):
        contract.claim(match_id)
    direct_vm.clear_mocks()
    _post(direct_vm, f"{OC}?op=account&slug={SLUG}", _account(long_description=WALLET_LINE.format(addr=to_hex(direct_charlie)[2:])))
    assert contract.claim(match_id) == to_hex(direct_charlie).lower()
    m = contract.get_match(match_id)
    assert (m.state, int(m.held), int(m.paid)) == ("paid", 0, held)
    assert _owed(contract, direct_charlie) == held
    _balance_ok(contract)
    with direct_vm.expect_revert("not waiting for a wallet"):
        contract.claim(match_id)


def test_an_unclaimed_match_goes_back_after_expiry(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _tallied(direct_vm, direct_deploy, direct_alice, direct_bob, rate=GEN // 1000)
    _close_window(contract, match_id)
    contract.finalize(match_id)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert(f"held for the collective until {EXPIRES}"):
        contract.reclaim(match_id)
    contract.matches[match_id].expires = _day(-1)  # the holding period has passed
    contract.reclaim(match_id)
    m = contract.get_match(match_id)
    assert (m.state, int(m.returned)) == ("returned", POT)
    assert _owed(contract, direct_alice) == POT
    t = _balance_ok(contract)
    assert int(t["held"]) == 0


def test_only_the_matcher_cancels_and_only_before_the_window(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice, starts=_day(14), ends=_day(44), expires=_day(120))
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Only the matcher can cancel"):
        contract.cancel(match_id)
    direct_vm.sender = direct_alice
    assert contract.cancel(match_id) == str(POT)
    assert _owed(contract, direct_alice) == POT and contract.get_match(match_id).state == "cancelled"
    _balance_ok(contract)


def test_a_started_window_cannot_be_cancelled(direct_vm, direct_deploy, direct_alice):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("before its window starts"):
        contract.cancel(match_id)


def test_matches_list_and_stake(direct_vm, direct_deploy, direct_alice):
    contract, match_id = _open(direct_vm, direct_deploy, direct_alice)
    assert [m.id for m in contract.get_matches(0, 100)] == [match_id]
    assert contract.stake_for(match_id) == str(STAKE)
    with direct_vm.expect_revert("No match with id match_9"):
        contract.get_match("match_9")
