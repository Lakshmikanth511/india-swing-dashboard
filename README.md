# 🇮🇳 India Swing Trading Dashboard

Professional Indian equity swing-trading research terminal built on Kiro skills.

## Quick Start

```bash
cd dashboard
npm install
node backend/server.js
# Open http://localhost:3000
```

That's it. The server boots, loads existing scanner + analyst data, fetches index prices and news, then serves the dashboard.

## What's Running

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | REST API + SSE push |
| Database | sql.js (SQLite, pure JS) | Persistent storage |
| Frontend | Vanilla JS + Chart.js | Single-page dashboard |
| Data | Yahoo Finance (free, delayed) | Index + stock prices |
| Scanner | india-scanner Kiro skill | RSI, breakouts, universe |
| Analyst | india-analyst Kiro skill | NSE XBRL quarterly results |
| News | india-news + RSS feeds | Market news |

## API Endpoints

```
GET  /api/status                    Server health + data counts
GET  /api/indices                   Index prices (NIFTY, BankNifty, VIX…)
POST /api/indices/refresh           Fetch fresh index prices
GET  /api/screener?cap=&rsi_min=&rsi_max=&setup=&limit=&sort=
POST /api/screener/sync             Re-sync scanner data from trader-in/
GET  /api/recommendations?action=&cap=&minScore=
POST /api/recommendations/generate  Regenerate scoring
GET  /api/news?symbol=&sentiment=
POST /api/news/refresh
GET  /api/stock/:symbol
GET  /api/portfolio
PUT  /api/portfolio/capital         {"amount": 200000}
POST /api/portfolio/size            {"entry": 1122, "stopLoss": 1055}
GET  /api/watchlist
POST /api/watchlist                 {"symbol": "BSE"}
GET  /api/alerts
POST /api/alerts
GET  /sse                           Server-Sent Events (30s refresh)
```

## Configuration

Copy `.env.example` → `.env` and set:
- `TRADING_ROOT` — path to this Trading folder
- `SKILLS_ROOT` — path to `~/.kiro/skills`
- `PORT` — default 3000
- `REFRESH_INTERVAL_MS` — default 30000 (30s)

## Data Limitations

- **Prices**: Yahoo Finance, free, unofficial, delayed. Never labelled "live".
- **RSI/setups**: From last india-scanner daily run (`trader-in/watchlist.json`).
- **Fundamentals**: 6 companies from last india-analyst run (`trader-in/metrics.json`). Run the skill for more.
- **News**: NSE RSS (today only), ET Markets, BS, Mint RSS feeds.
- **Recommendations**: Algorithmic only — not brokerage advice.

## Disclaimer

Research tool only. Not SEBI-registered investment advice. Capital at risk.
