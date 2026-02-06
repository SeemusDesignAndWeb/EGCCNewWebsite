# Railway 502 troubleshooting

Railway builds the app with **Nixpacks** (no custom Dockerfile). Start command is just the Node server.

## What can cause 502

1. **App not listening on Railway’s PORT**  
   SvelteKit adapter-node reads `process.env.PORT`. Railway sets `PORT` automatically; don’t override it unless you know what you’re doing.

2. **App listening on localhost only**  
   The server must listen on `0.0.0.0` (all interfaces). adapter-node defaults to `HOST=0.0.0.0`; if you set `HOST=127.0.0.1` in variables, remove it.

3. **App crash on startup**  
   Check **Deploy → View logs** in Railway. If the process exits, you’ll see the error (e.g. missing env, bad `DATABASE_URL`, uncaught exception).

4. **Start command never reaches the server**  
   The start command is now only `node -r dotenv/config build/index.js`. If you add init scripts again, use `(node script.js || true) &&` so a failing script doesn’t prevent the server from starting.

5. **Build didn’t produce `build/index.js`**  
   If the Nixpacks build fails or uses a different output path, the start command will fail. Check build logs.

## Route-specific 502: `/hub/emails/[id]` and `__data.json`

If you see **502** with **~15s** on the email detail page or its data request:

1. **Request timeout** – The gateway often times out at 15s. The email page load now has a 12s timeout; you'll get **503** with a message instead of 502, and logs will show `[hub/emails/[id]] Load timed out`.
2. **Slow or large data** – Loading one email can be slow if:
   - **File store**: `findById('emails', id)` reads the whole `emails.ndjson` file. With many/large emails, that file is big and slow to read.
   - **Large email body**: A very large `htmlContent` makes the `__data.json` response huge and can hit timeouts or memory limits.
3. **Fix**: Prefer **DATA_STORE=database** on Railway so emails are fetched by id (single row). If you must use file store, keep the emails collection small or consider moving to the database.

## Quick checks

- In Railway: **Variables** → ensure `PORT` is not set (Railway sets it).
- **Logs**: look for “Listening on http://0.0.0.0:…” and any stack traces.
- **Data/DB**: if the app needs DB or volume on startup, ensure `DATABASE_URL` or `CRM_DATA_DIR` is set and correct; the app may still start and then return 500 for those features.
