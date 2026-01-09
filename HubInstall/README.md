# Hub CRM Installation Package

This package contains all the files needed to install the Hub CRM component into a SvelteKit project.

## What's Included

- **CRM Library** (`src/lib/crm/`) - Core CRM functionality including:
  - Authentication and session management
  - File-based data storage (NDJSON)
  - Email sending via Resend
  - Form validation and sanitization
  - Recurrence pattern generation for events
  - Token management for public signups

- **Hub Routes** (`src/routes/hub/`) - Admin interface routes:
  - Dashboard
  - Contacts management
  - Lists management
  - Newsletter creation and sending
  - Event management with recurrence
  - Volunteer rotas
  - Meeting planners (planning tool for events with integrated rotas)
  - Dynamic forms
  - User management
  - Profile management

- **Signup Routes** (`src/routes/signup/`) - Public token-based signup pages:
  - Rota signup (`/signup/rota/[token]`)
  - Event signup (`/signup/event/[token]`)

- **Public Calendar Routes** (`src/routes/calendar/`, `src/routes/events/calendar/`, `src/routes/event/`) - Public-facing event calendar:
  - Calendar view (`/calendar`) - Monthly/weekly calendar of public events
  - Events calendar (`/events/calendar`) - Alternative calendar view with page data support
  - Event detail page (`/event/[token]`) - Public event signup page via token

- **Utility Scripts** (`scripts/`) - Helper scripts:
  - `create-admin.js` - Create admin users from command line

## Installation

### Quick Install

1. Copy this entire `HubInstall` folder to your SvelteKit project
2. Run the installation script:

```bash
cd HubInstall
node install.js /path/to/your/sveltekit/project
```

Or if you're already in your SvelteKit project root:

```bash
node /path/to/HubInstall/install.js
```

### Manual Install

If you prefer to install manually:

1. **Copy files:**
   ```bash
   cp -r HubInstall/src/lib/crm your-project/src/lib/
   cp -r HubInstall/src/routes/hub your-project/src/routes/
   cp -r HubInstall/src/routes/signup your-project/src/routes/
   cp -r HubInstall/scripts/* your-project/scripts/
   ```

2. **Install dependencies:**
   Add these to your `package.json` dependencies:
   ```json
   {
     "bcryptjs": "^3.0.3",
     "dompurify": "^3.3.1",
     "jsdom": "^27.4.0",
     "quill": "^2.0.3",
     "resend": "^6.4.2",
     "ulid": "^3.0.2",
     "xlsx": "^0.18.5"
   }
   ```
   Then run: `npm install`

3. **Set up hooks:**
   Copy `hooks.server.js.template` to `src/hooks.server.js` or integrate the CRM hook into your existing hooks file.

4. **Configure environment:**
   Copy `.env.example` to `.env` and fill in:
   - `CRM_SECRET_KEY` - Generate with: `openssl rand -base64 32`
   - `RESEND_API_KEY` - Get from https://resend.com
   - `APP_BASE_URL` - Your application base URL (optional)
   - `ROTA_REMINDER_CRON_SECRET` - Generate with: `openssl rand -base64 32` (required for rota reminder cron job)
   - `ROTA_REMINDER_DAYS_AHEAD` - Days ahead for reminders (optional, defaults to 3)

5. **Create data directory:**
   ```bash
   mkdir -p data/uploads
   ```

6. **Create first admin:**
   ```bash
   npm run create-admin admin@example.com "YourSecurePassword123!" "Admin Name"
   ```

7. **Create events pages in site database (optional):**
   If your site uses a page database (`database.json`), you can create the events pages:
   ```bash
   node scripts/create-events-page.js
   ```
   This creates:
   - `/events` page - Main events listing page
   - `/events/calendar` page - Calendar view page
   
   Note: If your site doesn't use a page database, the calendar will still work, but you may need to create these pages manually in your CMS.

## Features

### Contact Management
- Create, edit, and delete contacts
- Import contacts from CSV/Excel files
- Export contacts
- Contact lists for grouping

### Newsletter System
- Rich text editor (Quill-based)
- Template system
- Email personalization with placeholders
- PDF export
- Bulk email sending via Resend

### Event Management
- Create events with recurrence patterns
- Daily, weekly, monthly, yearly recurrence
- Automatic occurrence generation
- ICS calendar export
- Public event signup via tokens
- **Public Events Calendar** - Display public events on your website
  - Monthly/weekly calendar views
  - Event filtering by visibility (`public` vs `private`)
  - Token-based public event detail pages
  - Automatic token generation for public events

### Volunteer Rotas
- Create rotas for events
- Assign volunteers to occurrences
- Token-based public signup links
- Bulk invitation emails
- **Automated reminder emails** - See `ROTA_REMINDER_SETUP.md` for setup instructions

### Meeting Planners
- Create meeting planners for events or specific occurrences
- Automatically creates standard rotas (Meeting Leader, Worship Leader, Speaker, Call to Worship)
- Integrated rota management within meeting planner interface
- Quick view for upcoming meetings
- Notes and planning fields for each meeting

### Dynamic Forms
- Form builder with multiple field types
- Public form submission
- Submission tracking
- Safeguarding encryption for sensitive forms

### Security Features
- Password complexity requirements
- CSRF protection
- Session management
- Account lockout after failed attempts
- Audit logging
- HTML sanitization

## Data Storage

The Hub uses file-based storage (NDJSON format) in the `data/` directory. No database setup required!

Data files:
- `contacts.ndjson` - Contact records
- `lists.ndjson` - Contact lists
- `newsletters.ndjson` - Newsletters
- `newsletter_templates.ndjson` - Newsletter templates
- `events.ndjson` - Event definitions
- `occurrences.ndjson` - Event occurrences
- `rotas.ndjson` - Volunteer rotas
- `rota_tokens.ndjson` - Rota signup tokens
- `event_tokens.ndjson` - Event signup tokens
- `meeting_planners.ndjson` - Meeting planner records
- `forms.ndjson` - Form definitions
- `admins.ndjson` - Admin users
- `sessions.ndjson` - Active sessions
- `audit_logs.ndjson` - Audit trail

## Customization

### Branding
Edit `src/lib/crm/components/CrmShell.svelte` to customize:
- Logo image path
- Hub title
- Footer branding
- Color scheme (uses Tailwind CSS)

### Styling
The Hub uses Tailwind CSS. Ensure Tailwind is configured in your project.

### Image Picker (Optional)
If you have a database with images, you can optionally add:
- `src/routes/hub/api/images/+server.js` that references your image database
- Or remove the image picker feature from `HtmlEditor.svelte`

### Public Events Calendar Integration

The Hub includes public-facing calendar routes that display events marked as `public`:

**Routes included:**
- `/calendar` - Main public calendar view
- `/events/calendar` - Alternative calendar view (supports page data integration)
- `/event/[token]` - Public event detail and signup page

**How it works:**
1. Events created in the Hub can be marked as `public` or `private`
2. Only events with `visibility: 'public'` appear on public calendar pages
3. Public events automatically get token-based URLs for sharing
4. Visitors can view events and sign up via the public pages

**Customization:**
- The calendar pages use your site's `Footer` component (if available)
- Update `src/routes/events/calendar/+page.server.js` to integrate with your page database if needed
- Customize styling in the calendar Svelte components to match your site design
- The calendar uses Tailwind CSS for styling

**Note:** The calendar pages reference `$lib/components/Footer.svelte` which is site-specific. You may need to:
- Create a Footer component, or
- Remove/comment out the Footer import in the calendar pages, or
- Replace it with your own footer component

## Requirements

- SvelteKit 2.0+
- Node.js 18+
- Tailwind CSS (for styling)
- Resend account (for email sending)

## Additional Setup Guides

- **Rota Reminder Notifications**: See `ROTA_REMINDER_SETUP.md` in the project root for instructions on setting up automated email reminders for upcoming rota assignments.

## Support

For issues or questions, refer to the documentation in the Hub's help section at `/hub/help` after installation.

## License

[Add your license information here]
