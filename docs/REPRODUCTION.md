# MatchFund: reproduction

Every number below was produced by GenLayer validators on GenLayer Studio reading Open Collective's public records, and can be
checked against them. Contract `0x5D68226feaca834Bff45629835009eE43e9CfEB1` ([explorer](https://explorer-studio.genlayer.com/address/0x5D68226feaca834Bff45629835009eE43e9CfEB1)); `node scripts/verify-code.mjs 0x5D68226feaca834Bff45629835009eE43e9CfEB1`
checks that the deployed code is byte-identical to `contracts/match_fund.py`.

The matches are **demo matches** made by test wallets with Studio test GEN, not offers to these collectives. The contributions,
donors and totals they count are real. A count describes published contributions only, not any donor's intentions.

## The counts

| Match | Collective | Window | Listed | Sum vs Open Collective's own total | New accounts, guest checkouts | Above the per-donor cap | Excluded by the rules | Unsure | Matched | Paid | State |
|---|---|---|---|---|---|---|---|---|---|---|---|
| match_0 | [webpack](https://opencollective.com/webpack) | 2026-10-01 to 2026-10-31 | 361 / $9,443 | equal | $607 (204) | $1,500 (1) | $4,089 (66) | $604 (5) | **$2,603** (63 donors) | 10 GEN of 10 GEN | awaiting_wallet |
| match_1 | [webpack](https://opencollective.com/webpack) | 2026-10-01 to 2026-10-31 | 361 / $9,443 | equal | $607 (204) | $1,500 (1) | $4,495 (71) | $200 (1) | **$2,601** (62 donors) | 2.601 GEN of 5 GEN | awaiting_wallet |
| match_2 | [Babel](https://opencollective.com/babel) | 2026-10-01 to 2026-10-31 | 46 / $6,831 | equal | — | — | $500 (1) | — | **$6,331** (45 donors) | 1 GEN of 1 GEN | awaiting_wallet |

### match_0: webpack, 2026-10-01 to 2026-10-31

Terms: 0.01 GEN per dollar given, pot 10 GEN,
at most $1,000 per donor, donor accounts created before 2026-09-01.
Rules: *No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.*

> Open Collective lists 361 contributions ($9,443) to webpack from 2026-10-01 to 2026-10-31; without refunds that is 361 contributions, $9,443, exactly Open Collective's own total for the window. Matched: $2,603 from 63 established donors. Not matched: $607 from accounts created after 2026-09-01 (guest checkouts and new accounts) (204); $1,500 above the per-donor cap (1); $4,089 from sponsors the matcher's rules exclude (66); $604 from sponsors the validators were unsure about (5); $40 from sponsors beyond the 120 reviewed (21).

Evidence packet: read 2026-11-16T22:24:40 UTC, rows sha256 `e22636b2215777b7196552acf14d906efa1b77545b59574d25124074e47fe3df`, packet sha256 `600cf2c756dd97512e27059255810d25cfae058a7638016b59a2eb80492e3439`. Largest matched donors: John Masterson $1,000, Airbnb $200, CodeRabbit $200, Elastic $200, king Johnnie $200, Releaf – Medizinischer Cannabis Shop $200, Appfolio $100, WonderProxy $100, GitBook $50, RelativeCI $50, DontPayFull $25, Stiltsoft $25.
Unsure (not matched): Casivo.se $200, Сoinsmania $200, Ok win $200, Bonus Koodit $2, Pocket Option Promo Code: OGZ124 (2026) $2.

Sponsors the rules exclude (66; the 40 largest), with the validators' reason:

| Counted | Sponsor | Website | Reason |
|---|---|---|---|
| $200 | Ausländische Online Casinos Schweiz | https://www.palace-luzern.ch/ | Name explicitly promotes online casinos. |
| $200 | Blastup | https://blastup.com | Sells likes, views, and followers. |
| $200 | Buy Youtube Likes from Views4You | https://views4you.com/buy-youtube-likes/ | Sells YouTube likes. |
| $200 | c19.cl - Mejores Casinos Online | https://www.c19.cl/ | Name explicitly promotes online casinos. |
| $200 | AUCrazyVegas | https://www.crazyvegas.com/au/online-casinos/ | Promotes online casinos and casino offers. |
| $200 | Czech Casinos | https://czech-casinos.com/ | Name and website explicitly identify casinos. |
| $200 | Fun88 | https://global.fun88.com/ | Online sports betting and casino company. |
| $200 | Fun88 | https://www.fun88thx.com/th/ | Description identifies an online sports betting company. |
| $200 | Fun88 | https://www.fun88.com/vn/ | Description identifies an online sports betting company. |
| $200 | Instant Famous | https://www.instant-famous.com/ | Sells likes and followers. |
| $200 | JBO | https://www.jbo675.com/th/ | Offers sports betting and live casinos. |
| $200 | JBO | https://www.jbo88ve.com/vn/ | Offers sports betting and online casinos. |
| $200 | Parimatch India | https://parimatch.in/ | Parimatch is a sports betting brand. |
| $200 | SocialBoosting | https://www.socialboosting.com/ | Sells followers, likes, and views. |
| $200 | TopKasynoOnline PL | https://pl.topkasynoonline.com/ | Name and website explicitly promote online casinos. |
| $200 | utländska casino 10 euro | https://casinobonusutaninsattning.net/10-euro-casino-utan-licens/ | Name and website explicitly promote casinos. |
| $200 | Paras pikakasino | https://kasinokurko.com/pikakasinot/ | Name and website promote instant casinos. |
| $200 | Wolf Winner Casino | https://www.wolfwinner.fun/en | Name explicitly identifies a casino. |
| $50 | Fast payout casinos Canada | https://oercongress.org/ | Promotes fast payout casinos in Canada. |
| $25 | Casino Godz | https://casino-godz.com/ | Description explicitly identifies an online casino. |
| $25 | Crazy Tower casino | https://crazy-tower.casino/ | Name and website explicitly identify a casino. |
| $25 | French Casinos | https://french-casinos.com/ | Name and website explicitly identify casinos. |
| $25 | Mafia Casino | https://mafia-casino.com/ | Name and website explicitly identify a casino. |
| $25 | Casinos UK | https://casinos-uk.com/ | Promotes UK online casinos. |
| $25 | Social Followers | https://www.socialfollowers.uk/buy-tiktok-followers/ | Website sells TikTok followers. |
| $25 | WestAce | https://west-ace.com/ | Description explicitly identifies West Ace Casino. |
| $20 | Barbados Bingo | https://www.barbadosbingo.com | Name and website promote bingo gambling. |
| $15 | FUN88 Thailand | https://thai.fun88.com/ | FUN88 sports betting and casino brand. |
| $15 | Fun88 Vietnam | https://viet.fun88.com/ | FUN88 sports betting and casino brand. |
| $10 | Australian Casinos | https://1517.media/best/ | Reviews and promotes Australian online casinos. |
| $10 | BETON | https://beton.ua/ | Offers online casino and sports betting. |
| $10 | Betting Site | https://bettingsite.cc/ | Compares and promotes bookmakers and casinos. |
| $10 | Casino Australia Online | https://www.casinoaustraliaonline.net/ | Reviews and promotes gambling sites. |
| $10 | Casinos Portugal | https://casinosportugal.com | Promotes online casinos and betting sites. |
| $10 | Correct Casinos | https://www.correctcasinos.com/ | Helps players find online casinos. |
| $10 | DeContrabas | https://decontrabas.com/ | Reviews Dutch online casinos. |
| $10 | Fast.Bet Australia | https://www.fast.bet/au/ | Compares online casinos and payouts. |
| $10 | Fast.bet Finland | https://www.fast.bet/finland/ | Compares casinos and promotes fast payouts. |
| $10 | Gokken Online | https://gokken.cc/ | Promotes online gambling experiences. |
| $10 | Greece Casinos | https://greece-casinos.com/ | Casino portal promoting games and bonuses. |

Check the raw numbers yourself (Open Collective's public API, no key):

```bash
curl -s https://api.opencollective.com/graphql/v2 -H 'content-type: application/json' -d '{"query":"{ account(slug:\"webpack\") { stats { contributionsAmount(dateFrom:\"2026-10-01T00:00:00Z\", dateTo:\"2026-11-01T00:00:00Z\") { count amount { valueInCents } } } } }"}'
```

### match_1: webpack, 2026-10-01 to 2026-10-31

Terms: 0.001 GEN per dollar given, pot 5 GEN,
at most $1,000 per donor, donor accounts created before 2026-09-01.
Rules: *No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.*

> Open Collective lists 361 contributions ($9,443) to webpack from 2026-10-01 to 2026-10-31; without refunds that is 361 contributions, $9,443, exactly Open Collective's own total for the window. Matched: $2,601 from 62 established donors. Not matched: $607 from accounts created after 2026-09-01 (guest checkouts and new accounts) (204); $1,500 above the per-donor cap (1); $4,495 from sponsors the matcher's rules exclude (71); $200 from sponsors the validators were unsure about (1); $40 from sponsors beyond the 120 reviewed (21).

Evidence packet: read 2026-11-16T22:53:09 UTC, rows sha256 `e22636b2215777b7196552acf14d906efa1b77545b59574d25124074e47fe3df`, packet sha256 `44a943c573732db50cf19df624db952a3a71bf7cf9f92900276662cd4f032bbf`. Largest matched donors: John Masterson $1,000, Airbnb $200, CodeRabbit $200, Elastic $200, king Johnnie $200, Releaf – Medizinischer Cannabis Shop $200, Appfolio $100, WonderProxy $100, GitBook $50, RelativeCI $50, DontPayFull $25, Stiltsoft $25.
Unsure (not matched): Сoinsmania $200.

Sponsors the rules exclude (71; the 40 largest), with the validators' reason:

| Counted | Sponsor | Website | Reason |
|---|---|---|---|
| $200 | Ausländische Online Casinos Schweiz | https://www.palace-luzern.ch/ | Online casinos |
| $200 | Blastup | https://blastup.com | Sells followers, likes, views |
| $200 | Buy Youtube Likes from Views4You | https://views4you.com/buy-youtube-likes/ | Sells YouTube likes |
| $200 | c19.cl - Mejores Casinos Online | https://www.c19.cl/ | Online casinos |
| $200 | Casivo.se | https://www.casivo.se/ | Online casino |
| $200 | AUCrazyVegas | https://www.crazyvegas.com/au/online-casinos/ | Online casinos |
| $200 | Czech Casinos | https://czech-casinos.com/ | Online casinos |
| $200 | Fun88 | https://global.fun88.com/ | Sports betting and casino |
| $200 | Fun88 | https://www.fun88thx.com/th/ | Online sports betting |
| $200 | Fun88 | https://www.fun88.com/vn/ | Sports betting and casino |
| $200 | Instant Famous | https://www.instant-famous.com/ | Sells likes and followers |
| $200 | JBO | https://www.jbo675.com/th/ | Sports betting and casino |
| $200 | JBO | https://www.jbo88ve.com/vn/ | Sports betting and casino |
| $200 | Ok win | https://okwingame.io | Prediction game/gambling |
| $200 | Parimatch India | https://parimatch.in/ | Parimatch is a betting site |
| $200 | SocialBoosting | https://www.socialboosting.com/ | Sells followers, likes, views |
| $200 | TopKasynoOnline PL | https://pl.topkasynoonline.com/ | Online casino |
| $200 | utländska casino 10 euro | https://casinobonusutaninsattning.net/10-euro-casino-utan-licens/ | Online casino |
| $200 | Paras pikakasino | https://kasinokurko.com/pikakasinot/ | Online casino |
| $200 | Wolf Winner Casino | https://www.wolfwinner.fun/en | Online casino |
| $50 | Fast payout casinos Canada | https://oercongress.org/ | Online casinos |
| $25 | Casino Godz | https://casino-godz.com/ | Online casino |
| $25 | Crazy Tower casino | https://crazy-tower.casino/ | Online casino |
| $25 | French Casinos | https://french-casinos.com/ | Online casinos |
| $25 | Mafia Casino | https://mafia-casino.com/ | Online casino |
| $25 | Casinos UK | https://casinos-uk.com/ | Online casinos |
| $25 | Social Followers | https://www.socialfollowers.uk/buy-tiktok-followers/ | Sells followers |
| $25 | WestAce | https://west-ace.com/ | Online casino |
| $20 | Barbados Bingo | https://www.barbadosbingo.com | Bingo/gambling |
| $15 | FUN88 Thailand | https://thai.fun88.com/ | Online betting/casino |
| $15 | Fun88 Vietnam | https://viet.fun88.com/ | Online betting/casino |
| $10 | Australian Casinos | https://1517.media/best/ | Online casinos |
| $10 | BETON | https://beton.ua/ | Online casino and sports betting |
| $10 | Betting Site | https://bettingsite.cc/ | Bookmakers and casinos |
| $10 | Casino Australia Online | https://www.casinoaustraliaonline.net/ | Gambling sites |
| $10 | Casinos Portugal | https://casinosportugal.com | Online casinos and betting |
| $10 | Correct Casinos | https://www.correctcasinos.com/ | Online casinos |
| $10 | DeContrabas | https://decontrabas.com/ | Online casinos |
| $10 | Fast.Bet Australia | https://www.fast.bet/au/ | Online casinos |
| $10 | Fast.bet Finland | https://www.fast.bet/finland/ | Online casinos |

Check the raw numbers yourself (Open Collective's public API, no key):

```bash
curl -s https://api.opencollective.com/graphql/v2 -H 'content-type: application/json' -d '{"query":"{ account(slug:\"webpack\") { stats { contributionsAmount(dateFrom:\"2026-10-01T00:00:00Z\", dateTo:\"2026-11-01T00:00:00Z\") { count amount { valueInCents } } } } }"}'
```

### match_2: Babel, 2026-10-01 to 2026-10-31

Terms: 0.001 GEN per dollar given, pot 1 GEN,
no per-donor cap, donor accounts created before 2026-09-01.
Rules: *No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.*

> Open Collective lists 46 contributions ($6,831) to Babel from 2026-10-01 to 2026-10-31; without refunds that is 46 contributions, $6,831, exactly Open Collective's own total for the window. Matched: $6,331 from 45 established donors. Not matched: $500 from sponsors the matcher's rules exclude (1).

Evidence packet: read 2026-11-16T22:54:10 UTC, rows sha256 `a13f19d4596399fa3e9ac07cb92c27243f94e28a9829b4c0ce8566194e1a3c61`, packet sha256 `76c31c9ef62fe883d92c1c76fa20b4425f726b1e523234855218ae497f38cbec`. Largest matched donors: Vite Ecosystem Fund $5,000, BairesDev $500, Codecademy $500, Elastic $100, Principal Financial Group $30, Raider.IO $25, Jb Landry $20, MFB Technologies $10, Posit $10, TaopaiC Tao $10, Alex Riviere $5, Closelink $5.
Unsure (not matched): none.

Sponsors the rules exclude (1), with the validators' reason:

| Counted | Sponsor | Website | Reason |
|---|---|---|---|
| $500 | Fun88 | https://global.fun88.com/ | Online sports betting and casino company |

Check the raw numbers yourself (Open Collective's public API, no key):

```bash
curl -s https://api.opencollective.com/graphql/v2 -H 'content-type: application/json' -d '{"query":"{ account(slug:\"babel\") { stats { contributionsAmount(dateFrom:\"2026-10-01T00:00:00Z\", dateTo:\"2026-11-01T00:00:00Z\") { count amount { valueInCents } } } } }"}'
```

## Wallet test from the live app

MetaMask test from the production app (matchfund-bars26.vercel.app) on GenLayer Studio. The tester previews ESLint's October 2026 in the no-wallet panel, opens a match from it (1 GEN per $1,000 given, 5 GEN pot, $1,000 per-donor cap, donor accounts 30+ days old, the default rules), counts it, asks for a recount, finalizes after the 10-minute window and withdraws what came back. The app deposits the pot and the stake before the calls that need a reading; those calls send no GEN. Wallet `0x4f80b5c475fced34fc9a07ffccf39e1adc1406bf`.

| Step | GEN sent | Result | Tx |
|---|---|---|---|
| Deposit 5 GEN (sent by the app before opening the match) | 5 GEN | credited to the tester | [0x4c70ada5…](https://explorer-studio.genlayer.com/tx/0x4c70ada5745fbc663a3b5621e430c4c8f669112ab20957f56141d05f298b7caa) |
| Open a match: ESLint, 2026-10-01 to 2026-10-31, 1 GEN per $1,000, pot 5 GEN from the deposit |  | match_4 open; validators read ESLint (collective, USD, host opensource) from Open Collective | [0x1ddedbfc…](https://explorer-studio.genlayer.com/tx/0x1ddedbfc30a187fc59af28fd17431326be4fdffca7bea7d479ded3792f3a9e12) |
| Count the window |  | 47 contributions, $4,085.86, equal to Open Collective's own total; $3 from 3 accounts created after 2026-09-01 not matched; no sponsor excluded; $4,082.86 matched from 44 donors: 4.08286 GEN | [0xe568af49…](https://explorer-studio.genlayer.com/tx/0xe568af497421c9e1c9819e53b548fa08d263f2213c5894c0e0648f83565c7751) |
| Deposit the 0.5 GEN recount stake (sent by the app) | 0.5 GEN | credited to the tester | [0xd6042fb2…](https://explorer-studio.genlayer.com/tx/0xd6042fb21b02dfb46cce93464f9bf0680712dea6c2af80f50f200b7669faecc1) |
| Ask for a recount |  | UPHELD: the fresh count was the same, so the 0.5 GEN stake joined ESLint's match | [0x6f805ebd…](https://explorer-studio.genlayer.com/tx/0x6f805ebda08861de1a29e2d81fa5190e7eda471eebca4ffdc77e6e7f6bd28899) |
| Finalize after the 10-minute window |  | awaiting_wallet: 4.58286 GEN (match plus stake) held for ESLint until it publishes a GenLayer wallet; 0.91714 GEN of the pot credited back to the tester | [0xd3626cf5…](https://explorer-studio.genlayer.com/tx/0xd3626cf5d75dbc7d6374d7ee478bffbb73267ab6091c507dc0876874b0ab2fe5) |
| Withdraw |  | 0.91714 GEN sent to the tester; totals() expected balance 18.68386 GEN equals the contract balance | [0x1efb2d26…](https://explorer-studio.genlayer.com/tx/0x1efb2d2672589243beb3591da22501f61b886c6fbea83eb690f079be7ce14bce) |

## Every transaction

A refused call is still ACCEPTED by consensus; the contract outcome is the `exec` column (`ERROR` = the contract refused, on purpose here).
`open_match` and `recount` carry no GEN: pots and stakes come from a deposit and are taken only after the validators agree.

| Who | Call | GEN sent | Consensus | exec | Returned / refused | Tx |
|---|---|---|---|---|---|---|
| smoke | `deposit()` | 10 | ACCEPTED | SUCCESS | 10000000000000000000 | [0xa69c556c…](https://explorer-studio.genlayer.com/tx/0xa69c556c5e93a5bae32fefb64fdc7ea43a3a2b7dbc62b5a0f5be183626b66711) |
| smoke | `open_match("webpack", "2026-10-01", "2026-10-31", 0.01 GEN, 10 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | SUCCESS | match_0 | [0xb9818f09…](https://explorer-studio.genlayer.com/tx/0xb9818f091d4c06c941f68a69d8514e90d56dff04dcf1d6f95d078b7ad9b81988) |
| smoke | `tally("match_0")` |  | ACCEPTED | SUCCESS | 10000000000000000000 | [0xad59fed5…](https://explorer-studio.genlayer.com/tx/0xad59fed532b8b98e85b01921e922adf0958aa98a7a56dd5b0dd8988ec6fe98f3) |
| matcher | `deposit()` | 12 | ACCEPTED | SUCCESS | 12000000000000000000 | [0xbb5251cf…](https://explorer-studio.genlayer.com/tx/0xbb5251cf8ba310e7f8477ce16fb405f3b21288eebbfee3e6415e654417b2a020) |
| matcher | `open_match("webpack", "2026-09-31", "2026-10-31", 0.001 GEN, 5 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | ERROR | refused: starts must be a real calendar date written YYYY-MM-DD | [0x7f0004b2…](https://explorer-studio.genlayer.com/tx/0x7f0004b29e377fd58756bd7e2129484a29853f1c901342dfa640e2e01f4acca3) |
| matcher | `open_match("ag-grid-226", "2026-10-01", "2026-10-31", 0.001 GEN, 5 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | ERROR | refused: ag-grid-226 is a INDIVIDUAL account; matching is for a collective, fund, project or event | [0x13315f29…](https://explorer-studio.genlayer.com/tx/0x13315f297ae416b3cd579bfb8bdcd9557daca7fbc3ab870fc3130286d888131d) |
| matcher | `open_match("no-such-collective-matchfund", "2026-10-01", "2026-10-31", 0.001 GEN, 5 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | ERROR | refused: Open Collective has no account no-such-collective-matchfund | [0xb91bb9fb…](https://explorer-studio.genlayer.com/tx/0xb91bb9fb51fd9356419eff5c5a6815606c067ba300d1f2a5c7118283754c3f46) |
| matcher | `open_match("webpack", "2026-10-01", "2026-10-31", 0.001 GEN, 5 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | SUCCESS | match_1 | [0xeefb630d…](https://explorer-studio.genlayer.com/tx/0xeefb630df63f1e5ef084965dd32c8fa37c02a13ff3ce640c4cb56ae4a4b5386f) |
| matcher | `open_match("babel", "2026-10-01", "2026-10-31", 0.001 GEN, 1 GEN, 0, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | SUCCESS | match_2 | [0xb0889972…](https://explorer-studio.genlayer.com/tx/0xb0889972034d014479b9a284d45e9a053eccad63dba08981a64065b535670010) |
| matcher | `open_match("vuejs", "2026-12-01", "2026-12-31", 0.001 GEN, 1 GEN, 1000, 30, "No casino, betting or gambling sponsors, and no sellers of followers, likes, views or backlinks.", "2027-03-31")` |  | ACCEPTED | SUCCESS | match_3 | [0x5edc2dc9…](https://explorer-studio.genlayer.com/tx/0x5edc2dc9fdbe79838eb80065e196924a1baadca31117afe80d41afb7d7ae9fbf) |
| matcher | `cancel("match_3")` |  | ACCEPTED | SUCCESS | 1000000000000000000 | [0xba76b383…](https://explorer-studio.genlayer.com/tx/0xba76b38353c8f726fbad2883ce9e68bd866b7ef86afae6fddb02e06065c6d765) |
| counter | `tally("match_1")` |  | ACCEPTED | SUCCESS | 2601000000000000000 | [0x673e4f5c…](https://explorer-studio.genlayer.com/tx/0x673e4f5ca6b1d1766b4677c2038c924e969ca36861180099df45b21423772d65) |
| counter | `tally("match_2")` |  | ACCEPTED | SUCCESS | 1000000000000000000 | [0x94c10715…](https://explorer-studio.genlayer.com/tx/0x94c107153700938f51a80fecfeeffeddaa877917ad485d7e149ecd9259a4c5a6) |
| counter | `tally("match_3")` |  | ACCEPTED | ERROR | refused: This match has already been counted | [0x85f00b1b…](https://explorer-studio.genlayer.com/tx/0x85f00b1bc18e3987894083f35f4492b0685931f8a54f99833782550b9162e0c4) |
| doubter | `deposit()` | 0.5 | ACCEPTED | SUCCESS | 500000000000000000 | [0x6602b72b…](https://explorer-studio.genlayer.com/tx/0x6602b72bf3bfed20c668606e4a74fbab7269aabd3b487c1d8a6977a4c228abf9) |
| doubter | `recount("match_1")` |  | ACCEPTED | SUCCESS | UPHELD | [0x5efed77b…](https://explorer-studio.genlayer.com/tx/0x5efed77bb8dceda6e6f97a3b0790a70a2ed86409fbba0f0d2d05e9cce2bbe748) |
| counter | `finalize("match_2")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0x196d41c1…](https://explorer-studio.genlayer.com/tx/0x196d41c14257db5aa9dd540d5cec5ecc245e592db2dbe14ba5b51b6db48c70ff) |
| counter | `finalize("match_1")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xcda958ad…](https://explorer-studio.genlayer.com/tx/0xcda958adea893609cb1510808a503b6cf4b4aa45afdb2ff6b59e104de61b2fe3) |
| counter | `claim("match_1")` |  | ACCEPTED | ERROR | refused: webpack's Open Collective page does not publish one GenLayer wallet yet | [0x6430397d…](https://explorer-studio.genlayer.com/tx/0x6430397d36dd9c2eea86fffb7260ae12b8446a886f93e4afc48dc1f2b9eb47b8) |
| matcher | `withdraw()` |  | ACCEPTED | SUCCESS | 8399000000000000000 | [0x8d329aa7…](https://explorer-studio.genlayer.com/tx/0x8d329aa7fbc4056e30f0a8e10636a5d44a1c562441e06845c1c93846e3aa4dde) |
| doubter | `withdraw()` |  | ACCEPTED | ERROR | refused: Nothing to withdraw (the whole deposit was the recount stake, which went to webpack) | [0x07f3c80d…](https://explorer-studio.genlayer.com/tx/0x07f3c80d646741c7064b3afe6112fb7553b1452cdf4e740e060205856496bdd6) |
| counter | `finalize("match_0")` |  | ACCEPTED | SUCCESS | awaiting_wallet | [0xd7ae0bbf…](https://explorer-studio.genlayer.com/tx/0xd7ae0bbf00d1f0bb1bd29676b7e5429658b8c78720943c14befc0eb2c8ae67cc) |
| matcher | `withdraw()` |  | ACCEPTED | ERROR | refused: Nothing to withdraw | [0x8066bc42…](https://explorer-studio.genlayer.com/tx/0x8066bc42781e7073d717ff58a59bfdb0d147632b8885d5092cf51ba2fbd73585) |

Accounts: smoke `0x5eec1aba8c1dc97f58c04aacfd3364269b3b623f`, matcher `0x51b968416f2FF3e12Ed7C42c62D2988A6614a25b`, counter `0xF89ACd6fFaAfFbc27D0fB72efF073f46C93Aa964`, doubter `0x2561434E52f3D2cB4c83A891555AB12AD57b492B`.

## Balance reconciliation

`totals()` keeps running totals (pots of matches not yet final, matches held for a wallet, GEN credited but not withdrawn); their
sum must equal the contract's GEN balance on chain.

| When | Pots | Held | Credited | Expected | On-chain balance | |
|---|---|---|---|---|---|---|
| three pots taken from the deposit, 5 GEN still credited | 17 GEN | 0 GEN | 5 GEN | 22 GEN | 22 GEN | match |
| both windows counted, a recount stake added to webpack's match | 16.5 GEN | 0 GEN | 6 GEN | 22.5 GEN | 22.5 GEN | match |
| finalized: matches held for the collectives, the rest credited to the matcher | 10 GEN | 4.1 GEN | 8.4 GEN | 22.5 GEN | 22.5 GEN | match |
| end of run, after the withdrawals | 0 GEN | 14.101 GEN | 0 GEN | 14.101 GEN | 14.101 GEN | match |
| now (when this file was generated) | 0 GEN | 18.6839 GEN | 0 GEN | 18.6839 GEN | 18.6839 GEN | match |
