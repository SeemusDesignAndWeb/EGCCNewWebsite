# CRM Module Setup Guide

## Data store: use the database

**All CRM data—including admin users, sessions, contacts, events, rotas, emails, etc.—should be stored in the database, not in JSON/NDJSON files.**

Set these in your `.env` (and on Railway):

- **`DATA_STORE=database`** – Use Postgres for all collections (admins, sessions, contacts, events, etc.).
- **`DATABASE_URL`** – Your Postgres connection string (e.g. from Railway’s Postgres service Variables; use the **private** URL when app and DB are on Railway – see `docs/RAILWAY_POSTGRES_SETUP.md`).

When `DATA_STORE=database` is set, the app uses the `crm_records` table in Postgres. No NDJSON files are used for Hub data. This is the recommended setup for production and for any environment where you have Postgres.

(If `DATA_STORE` is unset or not `database`, the app falls back to file store under `data/*.ndjson` for local development only.)

## Installation

1. **Install Dependencies**
   ```bash
   npm install bcryptjs ulid dompurify jsdom
   ```

2. **Set Environment Variables**
   
   Create a `.env` file (or add to your existing one) with:
   ```env
   DATA_STORE=database
   DATABASE_URL=postgresql://user:pass@host:5432/dbname

   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=your_verified_email@domain.com
   APP_BASE_URL=https://yourdomain.com
   CRM_SECRET_KEY=your_base64_32_byte_key
   ```
   
   Generate `CRM_SECRET_KEY`:
   ```bash
   openssl rand -base64 32
   ```

3. **Create Initial Admin User**
   
   Admin users are stored in the **database** when `DATA_STORE=database` (recommended). Run the script:
   ```bash
   node -r dotenv/config scripts/create-admin.js admin@example.com 'YourSecurePassword12!' "Admin Name"
   ```
   The script creates the admin in Postgres when `DATA_STORE=database` and `DATABASE_URL` are set; otherwise it writes to `data/admins.ndjson` (file store).

## Create-admin script

Use the existing script (writes to database when `DATA_STORE=database`, else to file):

```bash
node -r dotenv/config scripts/create-admin.js admin@example.com 'YourSecurePassword12!' "Admin Name"
```

## File Structure

The CRM module has been installed at:
- `src/lib/hub/` - Core CRM code
- `src/routes/hub/` - CRM routes
- `src/routes/signup/rota/` - Public signup routes
- `static/docs/` - Documentation
- `src/hooks.server.js` - Hook integration

## Data storage

- **With `DATA_STORE=database`** (recommended): All data is stored in Postgres in the `crm_records` table. No NDJSON files are used for Hub/CRM data.
- **Without database**: Data is stored in NDJSON files under `data/`. Use this only for local development if you are not using Postgres.

## Access

- CRM Dashboard: `/hub`
- Login: `/hub/auth/login`
- Help: `/hub/help`

## Features Implemented

✅ Contacts management
✅ Lists management  
✅ Newsletters with Resend integration
✅ Events and occurrences
✅ Volunteer rotas
✅ Bulk rota invitations
✅ Public token-based signup
✅ HTML WYSIWYG editor
✅ CSRF protection
✅ Session management
✅ Built-in documentation

## Next Steps

1. Install dependencies
2. Set environment variables
3. Create an admin user
4. Start your SvelteKit dev server
5. Log in at `/hub/auth/login`
6. Begin using the CRM!

## Notes

- The module uses your existing Tailwind CSS configuration
- All HTML content is sanitized with DOMPurify
- Email sending requires a verified Resend domain
- Sessions expire after 7 days
- CSRF tokens are required for all form submissions

