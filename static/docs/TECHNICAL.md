# Technical Documentation

## Architecture

The CRM module is built as a SvelteKit 5 plugin that can be dropped into any existing SvelteKit application.

### File Structure

```
src/lib/crm/
  server/
    fileStore.js      # NDJSON persistence
    crypto.js         # Encryption utilities
    ids.js            # ULID generation
    auth.js           # Authentication & sessions
    validators.js     # Data validation
    email.js          # Resend integration
    tokens.js         # Rota token management
    hook-plugin.js    # SvelteKit hook handler
  components/
    CrmShell.svelte   # Layout wrapper
    Table.svelte      # Data table
    Pager.svelte      # Pagination
    FormField.svelte  # Form input
    HtmlEditor.svelte # WYSIWYG editor
```

### Data Storage

Data is stored in NDJSON files under `/data`:
- `contacts.ndjson` - Contact records with address and church membership fields
- `lists.ndjson` - Contact lists
- `newsletters.ndjson` - Newsletter templates and drafts
- `newsletter_templates.ndjson` - Saved newsletter templates
- `events.ndjson` - Event definitions with recurrence rules
- `occurrences.ndjson` - Event occurrences (generated from recurrence)
- `rotas.ndjson` - Volunteer rotas
- `rota_tokens.ndjson` - Rota signup tokens
- `forms.ndjson` - Form definitions
- `registers.ndjson` - Form submissions (encrypted for safeguarding forms)
- `admins.ndjson` - Admin user accounts
- `sessions.ndjson` - Admin sessions

### Authentication

- Uses bcryptjs for password hashing
- Sessions stored in NDJSON with expiration
- HttpOnly, Secure cookies in production
- CSRF protection via tokens

### Security

- AES-256-GCM encryption for safeguarding data
- CSRF tokens on all forms
- Input sanitization via DOMPurify
- Session expiration (7 days)

### Email

- Resend SDK for sending emails
- Newsletter sending with metrics
- Bulk rota invitations
- HTML and plain text support

## Hooks Integration

The module uses SvelteKit's `sequence` to compose hooks:

```javascript
import { sequence } from '@sveltejs/kit/hooks';
import { crmHandle } from '$lib/crm/server/hook-plugin.js';

export const handle = sequence(baseHandle, crmHandle);
```

The hook plugin:
- Protects `/hub/**` routes (except auth)
- Sets CSRF tokens on GET requests
- Verifies CSRF on non-GET requests
- Attaches `event.locals.admin` for authenticated requests

## Dependencies

- `bcryptjs` - Password hashing
- `ulid` - ID generation
- `dompurify` - HTML sanitization
- `jsdom` - Server-side DOM for DOMPurify
- `quill` - WYSIWYG editor
- `resend` - Email sending
- `xlsx` - Excel file parsing for contact imports

## Features

### Contact Import
- Supports CSV and Excel (.xlsx, .xls) file formats
- Automatic field mapping based on column names
- Manual field mapping interface
- Duplicate detection and validation
- Excel date serial number conversion

### Event Recurrence
- Daily, weekly, monthly, and yearly recurrence patterns
- Flexible end conditions (never, date, count)
- Automatic occurrence generation
- ICS export for calendar integration

### Email Personalization
- Placeholder support in newsletters and rota invitations
- Automatic upcoming rota links (next 7 days)
- Contact-specific data insertion

### Forms
- Dynamic form builder with multiple field types
- Safeguarding encryption for sensitive forms
- Public form submission
- Submission tracking and viewing

