# Hub custom domains

The Hub can be served on a custom domain (e.g. `https://hub.egcc.co.uk`). Users visit that URL to log in and use the Hub; the app resolves the organisation from the request host and scopes all data to that org.

## Where to set the Hub domain

1. Ensure your organisation record exists in the CRM (e.g. in `data/organisations.ndjson` or the `organisations` collection in the database).
2. Set the organisation’s **Hub domain** field to the hostname only, e.g. `hub.egcc.local` or `hub.egcc.co.uk` (no `https://` or port). This can be done via Hub Settings or by editing the organisation record in the data store.
3. The hostname must be valid (letters, digits, hyphens, dots) and is used to match the request `Host` header.

---

## Local development (Mac)

To test a custom hub domain on your Mac without DNS or Railway:

1. **Pick a local hostname**  
   Use something that won’t conflict with real domains, e.g. `hub.egcc.local` or `hub.egcc.test`.

2. **Edit `/etc/hosts`**  
   Add a line so that hostname points to your machine:
   ```text
   127.0.0.1   hub.egcc.local
   ```
   To edit (needs admin):
   ```bash
   sudo nano /etc/hosts
   ```
   Save and exit (Ctrl+O, Enter, Ctrl+X in nano).

3. **Set the org’s Hub domain**  
   In your organisation record (Hub Settings or data store), set **Hub domain** to the same hostname (e.g. `hub.egcc.local`). No port — the app strips the port when matching.

4. **Run the app and open the custom host**  
   Start the dev server (`npm run dev`), then in the browser go to:
   ```text
   http://hub.egcc.local:5173/hub
   ```
   (Use the port your dev server uses, e.g. 5173 for Vite.) The app will see `Host: hub.egcc.local:5173`, match `hub.egcc.local` to the org, and serve that org’s Hub.

**Without a custom host** (e.g. `http://localhost:5173/hub`), the app uses the default org from Hub settings (`hub_settings.currentOrganisationId` or the default organisation ID).

---

## Setup (production)

1. **Organisation hub domain**  
   Set **Hub domain** on your organisation (e.g. `hub.egcc.co.uk`) in Hub Settings or the data store. It must be a valid hostname.

2. **DNS**  
   Point the host (e.g. `hub.egcc.co.uk`) to your app. For Railway, add a custom domain in the project settings and set a CNAME (or A/AAAA) as Railway instructs.

3. **Railway**  
   In the Railway project, add the domain (e.g. `hub.egcc.co.uk`) as a custom domain so the service receives requests with `Host: hub.egcc.co.uk`. The app then matches that host to the organisation and serves that org’s Hub.

## How it works

- **Resolution**  
  On each request to `/hub` or `/signup/*`, the app reads the `Host` header, normalises it (lowercase, no port), and looks up an organisation whose `hubDomain` (stored in the `organisations` collection) matches. If there is a match, that organisation is used for the whole request and cannot be overridden.

- **Security**
  - Organisation is determined **only** from the request host, matched against the server-side list of `hubDomain` values. Query parameters and cookies are **not** used to choose the organisation when the host matches a hub domain.
  - When the host matches a hub domain, the current org is fixed for that request; there is no way for the client to switch to another org on that host.
  - Session cookies are origin-bound. A session created at `hub.egcc.co.uk` does not apply to another host or the main app URL.
  - To avoid domain spoofing, ensure your deployment (e.g. Railway) sets the `Host` header from the actual request (which it does when you add a custom domain). Do not forward a client-supplied Host from an untrusted proxy without validation.

- **Default URL**  
  When the request host does **not** match any organisation’s `hubDomain`, the app uses the default org from Hub settings (`hub_settings.currentOrganisationId` or the default organisation ID). That allows the main app URL (e.g. `yourapp.railway.app`) to work for the single org.

## Security summary

- **No mimicking**: Org is derived only from the request host against a server-side allowlist (`hubDomain` per org). Clients cannot pass an org id or cookie to access a different org’s Hub.
- **No override**: On a custom hub domain, the org is fixed for the request; `hub_settings.currentOrganisationId` and URL params are ignored for org resolution.
- **Origin-bound sessions**: Hub login at one host does not grant access on another host.

## Files

- `src/lib/crm/server/hubDomain.js` – host normalisation, `hubDomain` validation, resolve org from host.
- `src/lib/crm/server/requestOrg.js` – request-scoped org (AsyncLocalStorage) so `getCurrentOrganisationId()` uses the domain’s org.
- `src/lib/crm/server/hook-plugin.js` – for `/hub` and `/signup`, resolves org from host and runs request with that org.
- Organisation `hubDomain` is stored in the `organisations` collection and can be edited in Hub Settings or the data store.
