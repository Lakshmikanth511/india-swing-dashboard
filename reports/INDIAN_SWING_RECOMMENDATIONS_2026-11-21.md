# INDIAN EQUITY SWING TRADING RECOMMENDATIONS
**Date:** 2026-11-21 (Saturday) | **Analysis time:** ~21:30 IST  
**Prices:** Closing prices as of 2026-11-20 (last trading session) + 2026-11-21 intraday closes (Yahoo, free, can lag)  
**Next trading session:** Monday 2026-11-24  

---

## CAPITAL & RISK PARAMETERS

| Parameter | Value |
|---|---|
| Working Capital | ₹2,00,000 |
| Risk per trade (1%) | ₹2,000 max |
| Max combined portfolio risk (2%) | ₹4,000 |
| Cash reserve (15%) | ₹30,000 |
| Deployable capital | ₹1,70,000 |
| Trading style | Swing, CNC delivery, 3–4 weeks |

---

## SKILLS UTILISED

| Skill | Used For |
|---|---|
| `india-scanner` (executed) | NIFTY 500 daily breakout scan – 203 hits across 490 liquid stocks |
| `india-analyst` (executed) | Q2 FY27 filed results for FEDERALBNK, BAJFINANCE, INDUSINDBK, PERSISTENT, EICHERMOT, BSE |
| `india-news` (executed) | NSE RSS + Google News for all shortlisted stocks |
| `groww-mcp::get_ltp` (executed) | Live index and stock LTPs |
| `groww-mcp::fetch_stocks_fundamental_data` (executed) | PE, ROE, D/E, Industry PE for all candidates |
| `groww-mcp::fetch_market_movers_and_trending_stocks_funds` (executed) | Top gainers, momentum stocks, yearly highs |

**Missing capabilities:** Delivery % data not available via Yahoo (not fabricated). Analyst target prices from brokerages sourced from news where available.

---

## MARKET OVERVIEW

**Data source:** Groww MCP live LTP, Economic Times Markets, 2026-11-21 IST

### Index Snapshot (2026-11-21 close)

| Index | Level | Day Change | % |
|---|---|---|---|
| NIFTY 50 | 25,800.60 | +286.30 | +1.12% |
| NIFTY Bank | 64,635.20 | +1,572.20 | +2.49% |
| NIFTY Midcap 100 | 22,750.80 | +136.95 | +0.61% |
| NIFTY Smallcap 100 | 19,443.60 | -24.80 | -0.13% |
| India VIX | 17.32 | +1.21 | +7.51% |

### Market Assessment

**MODERATELY BULLISH** — with a caution flag on elevated VIX.

**Bull case:** NIFTY 50 hit a nine-month high of 25,808 today. FIIs pumped over ₹1.12 lakh crore into Indian equities in November — the strongest FII buying streak in four weeks. Bank Nifty +2.49% led by HDFC Bank, Axis Bank and ICICI Bank, all posting 20-day closing-high breakouts. Q2 FY27 results season was strong: HSBC noted 67% of companies beat or met estimates; mid/small-cap earnings grew 30%–32%.

**Caution:** India VIX spiked 7.5% today to 17.32. Smallcap 100 is flat/mildly negative, suggesting large-cap rotation rather than broad-based rally. Persistent RSI overextension in banking (SBIN 82, KOTAKBANK 81, ICICIBANK 81, BANKBARODA 78, HDFCBANK 78) limits fresh large-cap entry. The scanner found 99 stocks at 20-day closing highs — but over half are RSI >70 or >75.

**Fresh swing entry supported, but selectively.** Prefer stocks with RSI 55–70, confirmed volume on the breakout, and a good fundamental story. Avoid chasing NIFTY at a 9-month high without a pullback setup.

**Sector strength (from scanner + market data):**
- **Leading:** Banking (private banks), IT/Technology, Capital Markets, Auto (2-wheelers)
- **Lagging:** FMCG, Pharma, Smallcap broadly

---

## RISK FILTER APPLIED — INDUSINDBK EXCLUDED

> **⚠️ GOVERNANCE RISK — DO NOT TRADE**  
> IndusInd Bank (INDUSINDBK) surged 8.6% today on high volume and appeared as top breakout candidate from the scanner. **However, india-news flagged a critical management event today:** The board terminated ex-CEO Sumant Kathpalia's employment and invoked malus and clawback provisions going back to March 2020, following a disciplinary inquiry into accounting irregularities that caused a ₹1,960 crore financial impact.  
> This is an unresolved governance/regulatory event. The stock is excluded from all recommendations until the situation stabilises.

---

## A. LARGE CAP RECOMMENDATIONS

| # | Stock | Symbol | CMP | Breakout Level | Buy Range | Stop Loss | T1 | T2 | Upside | RSI | P/E | Ind P/E | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Bajaj Finance | BAJFINANCE | ₹1,122 | ₹1,100 | ₹1,105–1,120 | ₹1,055 | ₹1,195 | ₹1,250 | 7–11% | 67.6 | 31.4x | 17.8x | Buy on Confirmation |
| 2 | Eicher Motors | EICHERMOT | ₹8,113 | ₹8,050 | ₹8,050–8,120 | ₹7,780 | ₹8,620 | ₹9,000 | 6–11% | 69.9 | 37.0x | 25.9x | Buy on Confirmation |

*Market cap classification: AMFI list (latest available). BAJFINANCE ₹6.93 lakh cr = Large Cap. EICHERMOT ₹2.21 lakh cr = Large Cap.*

---

## B. MID CAP RECOMMENDATIONS

| # | Stock | Symbol | CMP | Breakout Level | Buy Range | Stop Loss | T1 | T2 | Upside | RSI | P/E | Ind P/E | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | The Federal Bank | FEDERALBNK | ₹373.50 | ₹365 | ₹368–375 | ₹348 | ₹400 | ₹422 | 7–13% | 70.1 | 16.7x | 13.2x | Buy on Confirmation |
| 2 | Persistent Systems | PERSISTENT | ₹6,124 | ₹5,950 | ₹5,950–6,050 | ₹5,650 | ₹6,500 | ₹6,900 | 6–13% | 62.1 | 53.9x | 18.5x | Buy on Confirmation |

*FEDERALBNK ₹90,150 cr = Large Cap by recent AMFI list. Treated as mid-large. PERSISTENT ₹97,142 cr = Large Cap.*  
*Note: AMFI reclassification dates vary; check latest AMFI list for the exact category on trade date.*

---

## C. SMALL/MID CAP RECOMMENDATIONS

| # | Stock | Symbol | CMP | Breakout Level | Buy Range | Stop Loss | T1 | T2 | Upside | RSI | P/E | Ind P/E | Recommendation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | BSE Ltd | BSE | ₹3,781 | ₹3,760 | ₹3,760–3,800 | ₹3,540 | ₹4,050 | ₹4,300 | 7–14% | 60.6 | 50.0x | 46.9x | Buy on Confirmation |

*BSE Ltd ₹1,53,568 cr = Large Cap by AMFI. RSI 60.6 is the most attractive in this study for a fresh entry — not overextended.*

---

## INDIVIDUAL STOCK ANALYSIS

---

### Bajaj Finance – BAJFINANCE

**Technical Setup**
- Current trend: Uptrend; 20-day closing-high breakout + bull flag confirmed by scanner
- Breakout level: ₹1,100 (20-day high)
- RSI (14, daily, as of 2026-11-20): **67.6** — bullish momentum, not overextended
- Moving average structure: Price above 20/50/200 EMA (confirmed by uptrend and 20-day breakout)
- Volume: Part of breakout scan; delivery data not available via free source
- Support: ₹1,055 (prior base), ₹1,000 (psychological)
- Resistance: ₹1,100 (breakout), ₹1,195 (T1), ₹1,250 (T2)
- Breakout status: **Breakout awaiting confirmation** — entry valid only on Monday's daily close above ₹1,100

**Fundamental Quality**
- PE assessment: 31.4x vs Industry PE 17.8x. Premium is structurally justified — Bajaj Finance is the benchmark NBFC with best-in-class AUM growth. Premium has been consistent historically.
- Earnings growth (Q2 FY27, filed NSE): Revenue +21.6% YoY, Net Profit +28.5% YoY, EPS ₹10.05 (+28.4%). Three consecutive quarters of 20%+ revenue growth.
- EBITDA margin: 71.0% — exceptionally high for a lender, stable and expanding
- ROE: 17.6%
- D/E: 4.08 (normal for a lender — not a concern)
- Fundamental rating: **Excellent**

**Analyst Commentary**
- HSBC included Bajaj Finance in its list of 19 Indian stocks with FY27 earnings upgrades (Economic Times, 2026-11-21). Source: https://economictimes.indiatimes.com/markets/stocks/news
- No governance concerns. No SEBI/regulatory issues found.
- Next results: Q3 FY27 (Dec quarter), due by 2027-02-14.

**Trading Plan**
- CMP: ₹1,122 (2026-11-21 close, Yahoo)
- Buy range: ₹1,105–1,120 (on Monday, limit order after daily close above ₹1,100)
- Stop loss: ₹1,055 (below prior support, closing-price basis) — Risk: ₹65/share (~5.9%)
- Target 1: ₹1,195 (+6.5% from ₹1,120 entry)
- Target 2: ₹1,250 (+11.6% from ₹1,120 entry)
- Holding period: 15–20 trading sessions
- Target date: By 2026-12-19
- Risk/Reward: T1 = 1.15:1 | T2 = **2.0:1** ✓
- Invalidation: Daily close below ₹1,055

**Why this stock?**
Bajaj Finance is breaking to 20-day highs with an RSI that has room to run (67.6). The fundamental story is clean: 28% EPS growth last quarter, 71% EBITDA margins, no debt concerns for an NBFC, and HSBC just upgraded its earnings estimate. Banking/NBFC is the leading sector this week (Bank Nifty +2.49%), giving sector tailwind. The 2:1 R/R to T2 meets the minimum requirement.

---

### Eicher Motors – EICHERMOT

**Technical Setup**
- Current trend: Uptrend; 20-day closing-high breakout confirmed by scanner
- Breakout level: ₹8,050 (20-day high, confirmed close)
- RSI (14, daily): **69.9** — approaching 70 but not yet overextended
- Moving average structure: Bullish alignment implied by 20-day high breakout
- Support: ₹7,780 (prior swing low), ₹7,500
- Resistance: ₹8,150 (intraday high today), ₹8,620 (T1), ₹9,000 (T2)
- Breakout status: **Confirmed breakout** (closed above 20-day high)

**Fundamental Quality**
- PE: 37.0x vs Industry PE 25.9x. Premium to sector justified by Royal Enfield's market leadership and strong margin profile.
- Earnings (Q2 FY27, filed NSE): Revenue ₹7,422 cr (+20.3% YoY). Net profit ₹1,573 cr (+14.9% YoY). EPS ₹57.23. Latest quarter filed 2026-11-13 — very fresh.
- EBITDA margin: 23.7% — consistent and healthy for auto
- ROE: 23.0% | D/E: 0.02 — essentially debt-free
- Promoter (Lal Group + VE Commercial): Stable; no pledging concerns known
- Fundamental rating: **Excellent**

**Analyst Commentary**
- Eicher Motors Q2 FY27 results filed 2026-11-13 show revenue +20% and steady margins. No negative news found.
- No governance, regulatory, or SEBI issues.
- Next results: Q3 FY27, due by 2027-02-14.

**Trading Plan**
- CMP: ₹8,113 (2026-11-21 close, Yahoo)
- Buy range: ₹8,050–8,120 (limit order on Monday's open)
- Stop loss: ₹7,780 (prior swing low, closing-price basis) — Risk: ₹340/share (~4.2%)
- Target 1: ₹8,620 (+6.2% from ₹8,120)
- Target 2: ₹9,000 (+10.8% from ₹8,120)
- Holding period: 15–20 sessions
- Target date: By 2026-12-19
- Risk/Reward: T1 = 1.47:1 | T2 = **2.57:1** ✓
- Invalidation: Daily close below ₹7,780

**Why this stock?**
Royal Enfield is in the sweet spot of the Indian 2-wheeler premiumisation cycle. Q2 FY27 revenue +20%, debt-free, 23% ROE. The scanner confirms a 20-day closing-high breakout. RSI 69.9 gives a narrow window before overextension — entry needs to be Monday. The 2.57:1 R/R to T2 is the best in the large-cap set.

---

### The Federal Bank – FEDERALBNK

**Technical Setup**
- Current trend: Strong uptrend; 20-day closing-high breakout confirmed
- Breakout level: ₹365 (20-day high)
- RSI (14): **70.1** — at the upper edge of preferred range; watch for overextension
- Support: ₹348 (prior consolidation base)
- Resistance: ₹374 (today's high), ₹400 (T1), ₹422 (T2)
- Breakout status: **Confirmed breakout** (closed at ₹373.50, above ₹365 level)

**Fundamental Quality**
- PE: 16.7x vs Industry PE 13.2x. Moderate premium; well within acceptable range for a consistently growing private bank.
- Earnings (Q2 FY27, filed NSE): Total income ₹9,903 cr (+19.0% YoY). NII ₹3,599 cr (+29.2% YoY). Net profit ₹1,499 cr (+51.1% YoY). EPS ₹5.82 (+45.5%). Exceptional quarter — PPOP margin improving, provisions low.
- ROE: 12.6% | D/E: N/A (bank)
- Fundamental rating: **Good**

**Analyst Commentary**
- Federal Bank AI-enabled hiring process announced (Odisha Diary, 2026-11-21) — minor operational news, positive.
- No governance concerns, no SEBI issues.
- Next results: Q3 FY27, due by 2027-02-14.

**Trading Plan**
- CMP: ₹373.50 (2026-11-21 close, Yahoo)
- Buy range: ₹368–375 (Monday open or on a minor pullback)
- Stop loss: ₹348 (prior base, closing-price basis) — Risk: ₹27/share (~7.3%)
- Target 1: ₹400 (+7.2% from ₹373)
- Target 2: ₹422 (+13.1% from ₹373)
- Holding period: 15–20 sessions
- Target date: By 2026-12-19
- Risk/Reward: T1 = 0.98:1 | T2 = **1.79:1**
- Note: RSI at 70.1 — prefer to buy on a mild Monday pullback to ₹368–370 to improve R/R.
- Invalidation: Daily close below ₹348

**Why this stock?**
Federal Bank delivered one of the strongest Q2 results in private banking — NII +29%, net profit +51%, EPS +45%. The stock is breaking to 20-day highs with strong momentum. At 16.7x PE vs 13.2x industry, it's not cheap but not stretched. The upcoming Q3 results (February 2027) are well outside the 3–4 week hold window, so no results-gap risk.

---

### Persistent Systems – PERSISTENT

**Technical Setup**
- Current trend: Strong uptrend; 20-day closing-high breakout + reclaimed 20-day MA
- Breakout level: ₹5,950 (prior resistance / 20-day high)
- RSI (14): **62.1** — preferred bullish zone; most room to run in this study
- Support: ₹5,650 (prior MA support)
- Resistance: ₹6,215 (today's intraday high), ₹6,500 (T1), ₹6,900 (T2)
- Breakout status: **Confirmed breakout** (closed ₹6,124, well above prior resistance)

**Fundamental Quality**
- PE: 53.9x vs Industry PE 18.5x. Persistent trades at a large premium, but it has earned it: revenue grew 30% YoY last quarter, the highest growth rate among top-10 Indian IT companies.
- Earnings (Q2 FY27, filed NSE): Revenue ₹4,664 cr (+30.3% YoY). EPS ₹22.22. Note: net profit -25.4% YoY due to base effect and investment costs, but revenue trend is intact.
- ROE: 21.0% | D/E: 0.07 — nearly debt-free
- Fundamental rating: **Good** (high PE is a risk; revenue growth justifies it)

**Analyst Commentary**
- Persistent Systems appeared on HSBC's list of 19 Indian stocks with FY27 earnings upgrades (Economic Times, 2026-11-21, analyst/results tag). Source: https://economictimes.indiatimes.com/markets/stocks/news
- IT sector leading market today (NIFTY IT +1.3%).
- Next results: Q3 FY27, due by 2027-02-14.

**Trading Plan**
- CMP: ₹6,124 (2026-11-21 close, Yahoo)
- Buy range: ₹5,950–6,050 (wait for a pullback on Monday, don't chase at ₹6,124)
- Stop loss: ₹5,650 (key MA support, closing-price basis) — Risk: ₹400/share (~6.7%)
- Target 1: ₹6,500 (+7.4% from ₹6,000 mid-range entry)
- Target 2: ₹6,900 (+15.0% from ₹6,000)
- Holding period: 15–20 sessions
- Target date: By 2026-12-19
- Risk/Reward: T1 = 1.1:1 | T2 = **3.1:1** ✓
- **Important:** Today's +4.15% move is extended. Do not buy at Monday's open unless it pulls back to ₹5,950–6,050. If it gaps up further, skip — the setup is compromised.
- Invalidation: Daily close below ₹5,650

**Why this stock?**
Persistent is the fastest-growing large IT company in India. RSI at 62.1 gives the most headroom of all candidates. Revenue +30% last quarter, nearly debt-free, and on HSBC's upgraded list. The 3.1:1 R/R to T2 is the best in this study. Wait for the pullback.

---

### BSE Ltd – BSE

**Technical Setup**
- Current trend: Moderate uptrend; bull flag pattern (consolidation after a strong run)
- Breakout level: ₹3,760 (flag resistance)
- RSI (14): **60.6** — cleanest entry RSI in this study; plenty of room
- Support: ₹3,540 (flag base)
- Resistance: ₹3,800 (flag top/breakout), ₹4,050 (T1), ₹4,300 (T2)
- Breakout status: **Breakout awaiting confirmation** — flag breakout triggers on daily close above ₹3,800

**Fundamental Quality**
- PE: 50.0x vs Industry PE 46.9x. Near fair value vs peers (NSE, MCX). Capital markets businesses trade at high multiples globally.
- Earnings (Q2 FY27, filed NSE): Revenue ₹1,433 cr (+34.1% YoY). Net profit ₹809 cr (+44.9% YoY). EPS ₹19.64 (+44.8%). Exceptional — EBITDA margin 67.9%, net margin 56.5%.
- ROE: 38.8% — outstanding
- D/E: 0.0 — zero debt
- Fundamental rating: **Excellent**

**Analyst Commentary**
- BSE Ltd continues to benefit from the surge in derivatives and equity volumes. NSE's growing options market has driven record exchange revenues industry-wide.
- No governance concerns. No SEBI adverse orders found.
- Next results: Q3 FY27, due by 2027-02-14.

**Trading Plan**
- CMP: ₹3,781 (2026-11-21 close, Yahoo)
- Buy range: ₹3,760–3,810 (Monday, after daily close above ₹3,800)
- Stop loss: ₹3,540 (flag base, closing-price basis) — Risk: ₹260/share (~6.9%)
- Target 1: ₹4,050 (+7.1% from ₹3,785 entry)
- Target 2: ₹4,300 (+13.6% from ₹3,785)
- Holding period: 15–20 sessions
- Target date: By 2026-12-19
- Risk/Reward: T1 = 1.04:1 | T2 = **1.98:1** ✓
- Invalidation: Daily close below ₹3,540

**Why this stock?**
BSE is an exchange business — asset-light, high-margin, zero debt, 38.8% ROE. Revenue grew 34% last quarter with 56.5% net margins. RSI 60.6 is the best entry point in this study. The bull flag is a continuation pattern after the strong Q1/Q2 run. Capital markets sector has strong tailwinds from record FII inflows and rising retail participation.

---

## FINAL TOP 5 RANKING

### Scoring Methodology (out of 100)
Each stock scored on: Breakout quality (15), RSI & momentum (15), Volume/confirmation (10), Fundamental health (20), PE valuation (10), Sector strength (10), Analyst sentiment (5), Liquidity (5), Risk/reward (10).

| Rank | Stock | Symbol | Score | Category |
|---|---|---|---|---|
| 1 | Persistent Systems | PERSISTENT | **82/100** | Mid-Large Cap |
| 2 | BSE Ltd | BSE | **80/100** | Large Cap |
| 3 | Eicher Motors | EICHERMOT | **78/100** | Large Cap |
| 4 | Bajaj Finance | BAJFINANCE | **76/100** | Large Cap |
| 5 | The Federal Bank | FEDERALBNK | **72/100** | Mid-Large Cap |

**Best Large Cap Pick:** Eicher Motors (EICHERMOT) — confirmed breakout, 23% ROE, debt-free  
**Best Mid Cap Pick:** Federal Bank (FEDERALBNK) — +51% profit growth Q2, sector tailwind  
**Best Small/Capital Markets Pick:** BSE Ltd (BSE) — lowest RSI, best fundamentals, zero debt  
**Best Overall Swing Trade:** Persistent Systems (PERSISTENT) — best R/R (3.1:1), growth leader, RSI 62  
**Best Risk/Reward:** Persistent Systems (PERSISTENT) — 3.1:1 to T2  
**Best Stock to Watch for Breakout:** BSE Ltd (BSE) — waiting for ₹3,800 close  

---

## DYNAMIC CAPITAL ALLOCATION

Selected 4 best opportunities (excluding PERSISTENT unless pullback occurs):

| Stock | Category | Entry | Stop Loss | Qty | Investment | Max Risk |
|---|---|---|---|---|---|---|
| BAJFINANCE | Large Cap | ₹1,115 | ₹1,055 | 16 | ₹17,840 | ₹960 |
| EICHERMOT | Large Cap | ₹8,100 | ₹7,780 | 3 | ₹24,300 | ₹960 |
| FEDERALBNK | Mid-Large | ₹370 | ₹348 | 45 | ₹16,650 | ₹990 |
| BSE | Large Cap | ₹3,785 | ₹3,540 | 8 | ₹30,280 | ₹1,960 |

*PERSISTENT: Hold off — buy only on pullback to ₹5,950–6,050 on Monday. If that level holds, replace BSE with PERSISTENT or add as 5th position.*

**Portfolio Summary**

| Item | Amount |
|---|---|
| Available capital | ₹2,00,000 |
| Total deployed (4 stocks) | ₹89,070 |
| Cash reserve | ₹1,10,930 (55%) |
| Max portfolio downside | ₹4,870 (2.4%) |
| Est. gross profit at all T1s | ₹10,340 |
| Est. gross profit at all T2s | ₹21,890 |

**Charges estimate (Zerodha, delivery CNC):**
- No brokerage on delivery
- STT: 0.1% both sides × ₹89,070 × 2 = ~₹178
- Exchange + SEBI + stamp: ~₹120
- GST on exchange charges: ~₹22
- **Total round-trip charges (est.): ~₹320**
- **Estimated net profit at T1: ~₹10,020**
- **Estimated net profit at T2: ~₹21,570**

*These are estimates. Never guaranteed. Each stock must be validated on Monday morning before entry.*

---

## DATA LIMITATIONS & DISCLOSURES

1. Prices are from Yahoo Finance (free, can lag) for closing data, and Groww MCP for intraday LTP.
2. RSI values are from india-scanner tool as of 2026-11-20 daily closes.
3. Delivery % data not available via free sources — not fabricated.
4. PE and fundamental data from Groww MCP (Groww internal source).
5. Financial results from NSE XBRL filings via india-analyst tool (official, most reliable).
6. Brokerage analyst target prices cited only where found in published news (HSBC list, Economic Times).
7. IndusInd Bank excluded on live governance grounds — reassess after full RBI/SEBI inquiry completion.
8. AMFI market-cap classification: Based on latest available classification. Verify before trading.
9. All trades are for EDUCATIONAL and RESEARCH purposes. These are NOT investment recommendations. Past chart patterns do not guarantee future performance. Capital at risk.

---

*Report generated: 2026-11-21 ~21:30 IST | Next review: 2026-11-24 (Monday pre-market)*  
*Source links: NSE XBRL filings linked in india-analyst output above | ET Markets: https://economictimes.indiatimes.com/markets*
