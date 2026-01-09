# Installation Package Summary

This `HubInstall` folder contains everything needed to install the Hub CRM component into any SvelteKit project.

## Package Contents

### Core Files (119 files total)

#### Installation Scripts
- `install.js` - Automated installation script
- `README.md` - Full documentation
- `QUICKSTART.md` - Quick start guide
- `hooks.server.js.template` - Template for hooks integration
- `env.example` - Environment variables template

#### CRM Library (`src/lib/crm/`)
- **Components** (7 files):
  - `CrmShell.svelte` - Main layout wrapper
  - `Table.svelte` - Data table component
  - `Pager.svelte` - Pagination component
  - `FormField.svelte` - Form input component
  - `HtmlEditor.svelte` - WYSIWYG editor (Quill-based)
  - `NotificationPopup.svelte` - Toast notifications
  - `ConfirmDialog.svelte` - Confirmation dialogs

- **Server Utilities** (12 files):
  - `auth.js` - Authentication & session management
  - `fileStore.js` - NDJSON file-based storage
  - `crypto.js` - Encryption utilities
  - `email.js` - Email sending via Resend
  - `validators.js` - Data validation
  - `sanitize.js` - HTML sanitization
  - `tokens.js` - Token management
  - `recurrence.js` - Event recurrence patterns
  - `ids.js` - ULID generation
  - `audit.js` - Audit logging
  - `logger.js` - Logging utilities
  - `hook-plugin.js` - SvelteKit hook integration

- **Stores** (1 file):
  - `notifications.js` - Notification and dialog stores

- **Utils** (1 file):
  - `dateFormat.js` - Date formatting utilities

#### Hub Routes (`src/routes/hub/`)
Complete admin interface with:
- Dashboard (`+page.svelte`, `+page.server.js`)
- Authentication (login, logout, password reset, email verification)
- Contacts management (CRUD, import)
- Lists management
- Newsletters (creation, templates, sending, PDF export)
- Events (creation, calendar view, occurrences, ICS export)
- Rotas (volunteer management, bulk invitations)
- Forms (dynamic form builder, submissions)
- Users (admin user management)
- Profile (user profile management)
- Help (documentation viewer)

#### Signup Routes (`src/routes/signup/`)
Public token-based signup pages:
- Rota signup (`/signup/rota/[token]`)
- Event signup (`/signup/event/[token]`)

#### Public Calendar Routes (`src/routes/calendar/`, `src/routes/events/calendar/`, `src/routes/event/`)
Public-facing event calendar:
- Calendar view (`/calendar`) - Monthly/weekly calendar
- Events calendar (`/events/calendar`) - Alternative view with page data support
- Event detail (`/event/[token]`) - Public event signup page

#### Utility Scripts (`scripts/`)
- `create-admin.js` - Create admin users from command line
- `create-events-page.js` - Create events pages in site database (if using page database)

## Installation Process

The `install.js` script will:

1. ✅ Copy all CRM files to target project
2. ✅ Update `package.json` with required dependencies
3. ✅ Create/update `src/hooks.server.js` with CRM integration
4. ✅ Create `.env.example` template
5. ✅ Create `data/` directory structure
6. ✅ Copy utility scripts

## Dependencies Added

The installer adds these npm packages:
- `bcryptjs@^3.0.3` - Password hashing
- `dompurify@^3.3.1` - HTML sanitization
- `jsdom@^27.4.0` - Server-side DOM
- `quill@^2.0.3` - WYSIWYG editor
- `resend@^6.4.2` - Email sending
- `ulid@^3.0.2` - ID generation
- `xlsx@^0.18.5` - Excel file parsing

## Requirements

- SvelteKit 2.0+
- Node.js 18+
- Tailwind CSS (for styling)
- Resend account (for email sending)

## Data Storage

Uses file-based storage (NDJSON) in `data/` directory:
- No database setup required
- Automatic directory creation
- Persistent storage ready for production

## Next Steps After Installation

1. Run `npm install` to install dependencies
2. Configure `.env` file with:
   - `CRM_SECRET_KEY` (generate: `openssl rand -base64 32`)
   - `RESEND_API_KEY` (from https://resend.com)
3. Create first admin: `npm run create-admin <email> <password> [name]`
4. (Optional) Create events pages: `node scripts/create-events-page.js`
5. Start dev server: `npm run dev`
6. Access at: `http://localhost:5173/hub`

## Public Events Calendar

The Hub includes public calendar routes that display events with `visibility: 'public'`:
- Events marked as public automatically appear on `/calendar` and `/events/calendar`
- Public events get token-based URLs for sharing (`/event/[token]`)
- Calendar pages use Tailwind CSS for styling

**Customization Note:** The calendar pages reference `$lib/components/Footer.svelte`. You may need to:
- Create a Footer component in your project, or
- Remove/comment out the Footer import in the calendar pages

## Notes

- The installation is **non-destructive** - it only adds files, doesn't modify existing ones (except `package.json` and `hooks.server.js`)
- All files are copied, not moved, so your original installation remains intact
- The Hub is fully self-contained and doesn't require any external database
