# INDIAN EQUITY MARKET – PROFESSIONAL SWING TRADING RESEARCH SYSTEM
**Version:** 1.0  
**File:** INDIAN_SWING_TRADING_MASTER.md  
**Created:** 2026-11-21 IST  

---

This file contains the complete research specification for the Indian equity swing-trading system.
The full specification is in the system prompt. Key parameters are summarised below for quick reference.

## Working Capital
- **Current:** ₹2,00,000 (dynamic – update when changed)
- **Risk per trade:** 0.5%–1% of capital (₹1,000–₹2,000)
- **Max combined portfolio risk:** 2% (₹4,000)
- **Cash reserve:** Minimum 15% (₹30,000)

## Installed Kiro Skills (Indian Market)

| Skill | Responsibility |
|---|---|
| `india-scanner` | Stock screening, breakout detection, RSI, universe builder |
| `india-analyst` | Quarterly results, revenue/profit/EPS, margins, next results date |
| `india-news` | NSE announcements, Google News, price moves, governance alerts |
| `india-budget` | Position sizing, Zerodha charges, order proposal |
| `india-risk` | Risk gate – checks every order before it reaches the broker |
| `india-entry` | Entry timing – bar-by-bar breakout confirmation |
| `india-exit` | Stop loss and target setting, R calculation |
| `india-alerts` | Price alerts – stop, target, flat-by reminders |
| `india-timemachine` | Monte Carlo simulation, historical odds |
| `india-insiders` | SEBI PIT disclosures, bulk/block deals |
| `india-broker` | Order execution (paper by default) |

## MCP Integration
- **Groww MCP** (`groww-mcp`): Live LTP, fundamentals, market movers, screener

## Skill Mapping to Responsibilities

| Responsibility | Skill / Tool |
|---|---|
| Market data (indices, LTP) | `groww-mcp::get_ltp` |
| Stock screening / breakout | `india-scanner` |
| Technical analysis / RSI | `india-scanner` (RSI 14 built-in) |
| Fundamental data | `groww-mcp::fetch_stocks_fundamental_data` |
| Financial results / EPS | `india-analyst` |
| News / announcements | `india-news` |
| Position sizing | `india-budget` |
| Risk management | `india-risk` |
| Portfolio allocation | `india-budget` (weights mode) |

## Trading Philosophy
- 3–4 week swing trades, bullish / long only, cash equity delivery
- Minimum 5% upside target, 1:2 risk/reward minimum to Target 2
- Capital protection over trade generation
- Confirm breakouts on daily close, not intraday
- Recommend WAIT / HOLD CASH when no qualifying setups exist

## File Structure
```
Trading/
├── INDIAN_SWING_TRADING_MASTER.md      ← this file
└── reports/
    ├── INDIAN_SWING_RECOMMENDATIONS_YYYY-MM-DD.md
    ├── INDIAN_SWING_WATCHLIST.md
    ├── INDIAN_SWING_TRADE_JOURNAL.md
    └── INDIAN_SWING_PERFORMANCE.md
```
