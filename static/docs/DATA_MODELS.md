# Data Models

This document describes the data structures used in the CRM module.

## Admin

```javascript
{
  id: string,              // ULID
  email: string,           // Unique email address
  passwordHash: string,    // bcrypt hashed password
  name: string,            // Display name
  role: 'admin',           // User role
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}
```

## Contact

```javascript
{
  id: string,              // ULID
  email: string,           // Primary email (required, unique)
  firstName: string,       // First name
  lastName: string,        // Last name
  phone: string,           // Phone number
  // Address fields
  addressLine1: string,
  addressLine2: string,
  city: string,
  county: string,
  postcode: string,
  country: string,
  // Church membership fields
  membershipStatus: string, // 'member' | 'regular-attender' | 'visitor' | 'former-member'
  dateJoined: string,      // ISO date (YYYY-MM-DD)
  baptismDate: string,      // ISO date (YYYY-MM-DD)
  smallGroup: string,       // Small group name
  servingAreas: string[],   // Array of serving area names
  giftings: string[],       // Array of gifting names
  notes: string,            // Free-form notes
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## List

```javascript
{
  id: string,              // ULID
  name: string,            // List name (required)
  description: string,     // List description
  contactIds: string[],    // Array of contact IDs
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Event

```javascript
{
  id: string,              // ULID
  title: string,           // Event title (required)
  description: string,     // HTML description
  location: string,        // Default location
  visibility: string,       // 'public' | 'private'
  meta: object,            // Additional metadata
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Occurrence

```javascript
{
  id: string,              // ULID
  eventId: string,         // Parent event ID (required)
  startsAt: string,        // ISO 8601 timestamp (required)
  endsAt: string,         // ISO 8601 timestamp (required)
  location: string,       // Override location (optional)
  createdAt: string,      // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Rota

```javascript
{
  id: string,              // ULID
  eventId: string,         // Parent event ID (required)
  occurrenceId: string,    // Specific occurrence ID (optional, null for all)
  role: string,            // Role name (required)
  capacity: number,       // Maximum capacity (default: 1)
  assignees: string[],     // Array of contact IDs
  notes: string,           // HTML notes
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Newsletter

```javascript
{
  id: string,              // ULID
  subject: string,         // Email subject (required)
  htmlContent: string,     // HTML email body
  textContent: string,      // Plain text email body
  status: string,          // 'draft' | 'sent'
  logs: object[],          // Array of send logs
  metrics: object,         // Delivery metrics
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Form

```javascript
{
  id: string,              // ULID
  name: string,            // Form name (required)
  description: string,     // Form description
  fields: Field[],         // Array of form fields (required)
  isSafeguarding: boolean, // Whether form requires encryption
  requiresEncryption: boolean, // Auto-set from isSafeguarding
  meta: object,            // Additional metadata
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

### Field

```javascript
{
  id: string,              // Unique field ID
  type: string,            // 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio'
  label: string,           // Field label (required)
  name: string,            // Field name/ID (required)
  required: boolean,        // Whether field is required
  placeholder: string,     // Placeholder text
  options: string[]        // Options for select/radio/checkbox fields
}
```

## Register (Form Submission)

```javascript
{
  id: string,              // ULID
  formId: string,          // Parent form ID (required)
  data: object,            // Plain form data (if not encrypted)
  encryptedData: string,   // Encrypted form data (if safeguarding)
  submittedAt: string,     // ISO 8601 timestamp
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

**Note**: For safeguarding forms, `data` will be null and `encryptedData` will contain the encrypted JSON string. For regular forms, `encryptedData` will be null.

## Token (Rota Signup)

```javascript
{
  id: string,              // ULID
  eventId: string,         // Event ID (required)
  rotaId: string,          // Rota ID (required)
  occurrenceId: string,    // Occurrence ID (optional)
  token: string,           // Unique token string (required)
  expiresAt: string,       // ISO 8601 timestamp
  used: boolean,           // Whether token has been used
  usedAt: string,          // ISO 8601 timestamp (when used)
  createdAt: string,      // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}
```

## Common Fields

All records include:
- `id`: ULID (Universally Unique Lexicographically Sortable Identifier)
- `createdAt`: ISO 8601 timestamp when record was created
- `updatedAt`: ISO 8601 timestamp when record was last updated

## Data Storage

All data is stored in NDJSON (Newline Delimited JSON) format:
- One JSON object per line
- Files are located in `/data` directory
- Atomic writes ensure data integrity
- Per-file write queues prevent race conditions

## Relationships

- **List → Contact**: Many-to-many (via `contactIds` array)
- **Event → Occurrence**: One-to-many (via `eventId`)
- **Event → Rota**: One-to-many (via `eventId`)
- **Occurrence → Rota**: Optional one-to-many (via `occurrenceId`, null for all occurrences)
- **Rota → Contact**: Many-to-many (via `assignees` array)
- **Form → Register**: One-to-many (via `formId`)
- **Event → Token**: One-to-many (via `eventId`)
- **Rota → Token**: One-to-many (via `rotaId`)

## Validation

See `src/lib/crm/server/validators.js` for validation rules:
- Email format validation
- Required field checks
- Date format validation
- String length limits
- Array type checks

