# WarForge — Ranked War Analytics

Post-war report viewer for Torn City ranked wars.

## Project Structure

```
warforge/
├── pages/
│   ├── index.js          ← Main WarForge UI
│   ├── _app.js           ← App wrapper (loads CSS)
│   └── api/
│       └── torn.js       ← API proxy (solves CORS)
├── styles/
│   └── globals.css       ← Base styles
├── package.json          ← Dependencies
├── next.config.js        ← Next.js config
└── .gitignore            ← Keeps junk out of Git
```

## How It Works

1. User enters API key + War ID in the browser
2. Browser calls `/api/torn` (our Vercel serverless function)
3. Our function calls `api.torn.com` server-side (no CORS issue)
4. Data comes back to the browser and renders

This is the same pattern as Google Apps Script — the API call
happens on a server, not in the browser.

## Deployment (Vercel)

Already connected via GitHub. Push to `main` branch → auto-deploys.

## Changelog

See top of `pages/index.js` for full version history.
