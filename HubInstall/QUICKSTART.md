# Quick Start Guide

## Installation (3 steps)

### Step 1: Run the installer
```bash
cd HubInstall
node install.js /path/to/your/sveltekit/project
```

### Step 2: Install dependencies
```bash
cd /path/to/your/sveltekit/project
npm install
```

### Step 3: Configure and create admin
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add:
# - CRM_SECRET_KEY (generate: openssl rand -base64 32)
# - RESEND_API_KEY (get from https://resend.com)

# Create first admin user
npm run create-admin admin@example.com "YourPassword123!" "Admin Name"

# (Optional) Create events pages in site database
node scripts/create-events-page.js
```

### Step 4: Start the server
```bash
npm run dev
```

Visit `http://localhost:5173/hub` to access the CRM!

## What Gets Installed

- ✅ CRM library (`src/lib/crm/`)
- ✅ Hub admin routes (`src/routes/hub/`)
- ✅ Public signup routes (`src/routes/signup/`)
- ✅ Public calendar routes (`src/routes/calendar/`, `src/routes/events/calendar/`, `src/routes/event/`)
- ✅ Utility scripts (`scripts/`)
- ✅ Hook integration (`src/hooks.server.js`)
- ✅ Environment template (`.env.example`)
- ✅ Data directory structure (`data/`)

## Optional: Image Picker

The Hub includes an image picker feature that references `$lib/server/database.js`. If you don't have this:
- The image picker will show an error (non-critical)
- You can remove it by editing `src/lib/crm/components/HtmlEditor.svelte`
- Or create your own database integration

## Public Events Calendar

The Hub includes public calendar routes that display events marked as `public`:
- `/calendar` - Main calendar view
- `/events/calendar` - Alternative calendar view
- `/event/[token]` - Public event detail page

**Note:** These routes reference `$lib/components/Footer.svelte`. You may need to:
- Create a Footer component, or
- Remove the Footer import from the calendar pages

## Customization

After installation, customize branding in:
- `src/lib/crm/components/CrmShell.svelte` - Logo, title, footer

## Need Help?

See `README.md` for detailed documentation.
