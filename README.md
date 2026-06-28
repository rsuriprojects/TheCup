# TheCup

An interactive companion for the 2026 FIFA World Cup — group standings, the
knockout bracket, scores, and a predictions game that grades itself as results
come in.

## Run locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click **New Project** and import the repo.
3. Vercel auto-detects Vite — just click **Deploy**. No settings needed.

## Updating the data

All tournament data lives in `src/TheCup.jsx`:

- **`GROUPS`** — group standings. Each row is `[code, W, D, L, Pts]`.
- **`RESULTS`** / **`UPCOMING`** — the Scores tab.
- **`R32`** — the Round of 32. To resolve a slot to a real team, give the match
  `home` and `away` team codes. To grade predictions for a played match, add a
  `result`, e.g.:

  ```js
  { id:"M73", side:"L", a:"1E", b:"2D", home:"GER", away:"PAR",
    kickoff:"Mon Jun 29", result:{ hs:2, as:0 } }
  ```

  The winner score earns +3, an exact scoreline earns +5 (3 + 2 bonus).

## Predictions storage

Predictions are saved in each visitor's browser via `localStorage`
(`USE_LOCAL_STORAGE = true` at the top of `TheCup.jsx`). They persist per device,
with no login. To move to a shared, cross-device leaderboard later, replace the
two functions in the `store` object with calls to your own API.

## Owner mode — entering scores

You don't have to edit code to record knockout results. Open your site with a
secret link:

```
https://your-site.vercel.app/?owner=letmein
```

That reveals an **⚙ Owner** tab where you type each final score and hit **Save** —
the bracket fills in the winner and predictions grade instantly. Without the
`?owner=` link, visitors never see this tab.

**Change the password:** edit `OWNER_KEY` near the top of `TheCup.jsx` (it ships
as `"letmein"`). Note this is light gatekeeping, not real security — it just keeps
the panel hidden from normal visitors. Scores you enter save to the browser
you entered them in.
