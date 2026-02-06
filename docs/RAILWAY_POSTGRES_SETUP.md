# Railway Postgres: Use the Private (Internal) URL

**Hub/CRM data (including admin users) should be stored in the database.** Set `DATA_STORE=database` and `DATABASE_URL` (see below) in your app service so all collections—admins, sessions, contacts, events, rotas, emails, etc.—use Postgres instead of JSON files.

When your app runs on Railway and uses a Postgres service in the **same project**, you should connect using the **private/internal** URL, not the public one.

## Why use the private URL?

- **No egress fees** – Traffic stays on Railway’s internal network.
- **Faster and more reliable** – No proxy; direct connection.
- **Avoids the warning** – Railway warns about egress when you use the public URL from inside Railway.

## What to set

In your **web app** service (not the Postgres service):

- Set **`DATA_STORE`** to **`database`**.
- Set **`DATABASE_URL`** to the **private** Postgres connection string.
- Do **not** use `DATABASE_PUBLIC_URL` or any URL that goes through `RAILWAY_TCP_PROXY_DOMAIN` for app ↔ Postgres connections when both run on Railway.

## Where to get the private URL

1. Open your **Postgres** service in the Railway dashboard.
2. Go to **Variables** (or **Connect**).
3. Use the variable that contains the **private** connection URL. It will typically have a host like:
   - `postgres.railway.internal`, or
   - A host derived from **`RAILWAY_PRIVATE_DOMAIN`** (e.g. `monorail.proxy.rlwy.net` for private networking, depending on your plan).

Railway often exposes:

- **`DATABASE_URL`** (or similar) – private URL for services in the same project. **Use this for your app.**
- **`DATABASE_PUBLIC_URL`** – public URL (via `RAILWAY_TCP_PROXY_DOMAIN`). Avoid this for app ↔ Postgres when both are on Railway.

If you **reference** the Postgres service from your app (e.g. “Add reference” / “Connect” in the app service), Railway may inject `DATABASE_URL` automatically with the private URL. In that case you don’t need to copy it manually.

## Summary

| Where your app runs | Which URL to use for `DATABASE_URL` |
|---------------------|-------------------------------------|
| **On Railway** (same project as Postgres) | **Private/internal** URL (e.g. from Postgres Variables, host like `*.railway.internal` or private domain) |
| **Locally** (your laptop) | Public URL or a tunnel URL if you need to reach Railway Postgres from your machine |

So: when the development (or production) host is on Railway, use the internal/private Postgres URL for `DATABASE_URL` to avoid egress and the public-endpoint warning.

## Deploy script

On each deploy, before the app starts, the start command runs `scripts/deploy.js`. It only ensures the `crm_records` table exists. To create an admin user, run manually: `node -r dotenv/config scripts/create-admin.js <email> <password> [name]`, or on Railway: `railway run -- ./scripts/create-admin-railway.sh` (set `SUPER_ADMIN_EMAIL` in Railway variables; password is optional and will be generated if missing).
