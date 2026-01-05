# Admin Guide

This guide covers administrative tasks for the CRM module.

## Initial Setup

### 1. Create Admin User

Use the provided script to create your first admin user:

```bash
node scripts/create-admin.js admin@example.com password123 "Admin Name"
```

### 2. Environment Variables

Ensure the following environment variables are set:

- `RESEND_API_KEY` - Your Resend API key for sending emails
- `RESEND_FROM_EMAIL` - Verified sender email address
- `APP_BASE_URL` - Base URL of your application (e.g., `https://yourdomain.com`)
- `CRM_SECRET_KEY` - Base64-encoded 32-byte key for encryption (generate with `openssl rand -base64 32`)

### 3. Data Directory

The CRM automatically creates a `/data` directory for storing NDJSON files. Ensure the application has write permissions to this directory.

## User Management

### Creating Additional Admins

You can create additional admin users in two ways:

**Method 1: Using the Hub Interface (Recommended)**
1. Log in to The Hub
2. Navigate to `/hub/users` (click "Users" in the main navigation)
3. Click "New Admin User" button
4. Fill in the form with name, email, and password
5. Click "Create Admin User"
6. The new admin will receive a welcome email with their credentials and verification link

**Method 2: Using the Command Line Script**
```bash
node scripts/create-admin.js email@example.com password "User Name"
```

**Welcome Email:**
When a new admin is created through the Hub interface, they automatically receive:
- A branded welcome email with their login credentials
- Email verification link
- Link to TheHUB login page
- Security reminders

### Managing Admin Users

The Hub provides a comprehensive admin user management interface:

**Features:**
- View all admin users in a searchable, paginated table
- See user status (Active, Locked, Unverified)
- Create new admin users
- Edit existing admin users (name, email)
- Reset user passwords
- Unlock locked accounts
- Manually verify email addresses
- Delete admin users

**Access:**
- Navigate to `/hub/users` from the main navigation
- Only existing admins can access this section

### Password Reset

Admins can reset their own passwords or have them reset by other admins:

**Self-Service Password Reset:**
1. On the login page, click "Forgot password?"
2. Enter email address
3. Check email for reset link (expires in 24 hours)
4. Click link and enter new password
5. All active sessions are logged out for security

**Admin-Initiated Password Reset:**
1. Go to `/hub/users`
2. Click on the admin user
3. Use the password reset feature
4. Enter new password (must meet complexity requirements)

**Password Requirements:**
- At least 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Email Verification

Admin users must verify their email addresses:
- New admins receive a verification email upon account creation
- Verification links expire after 7 days
- Admins can request new verification emails
- Other admins can manually verify emails if needed

### Admin Roles

Currently, all admins have full access. Future versions may include role-based access control.

## Data Management

### Backup

The CRM stores all data in NDJSON files under `/data`. To backup:

1. Copy the entire `/data` directory
2. Store backups securely (encrypted if containing sensitive data)

### Restore

To restore from backup:

1. Stop the application
2. Replace the `/data` directory with your backup
3. Restart the application

### Data Files

- `admins.ndjson` - Admin user accounts
- `contacts.ndjson` - Contact records (includes address and church membership fields)
- `lists.ndjson` - Contact lists
- `events.ndjson` - Event definitions (includes recurrence rules)
- `occurrences.ndjson` - Event occurrences (auto-generated from recurrence)
- `rotas.ndjson` - Volunteer rotas
- `newsletters.ndjson` - Newsletter drafts and sent newsletters
- `newsletter_templates.ndjson` - Saved newsletter templates
- `forms.ndjson` - Form definitions
- `registers.ndjson` - Form submissions (encrypted for safeguarding forms)
- `rota_tokens.ndjson` - Rota signup tokens

## Email Configuration

### Resend Setup

1. Sign up for a Resend account at https://resend.com
2. Verify your domain or use a test email
3. Create an API key
4. Add the API key to your environment variables

### Email Templates

Newsletters and rota invitations use HTML email templates. You can customize these in:
- `src/lib/crm/server/email.js`

**Email Types:**
- Newsletter emails (personalised with contact information)
- Rota invitation emails (with signup links)
- Admin welcome emails (with credentials and verification links)
- Password reset emails (with secure reset links)
- Email verification emails (for admin accounts)

## Security

### Safeguarding Forms

Forms marked as "Safeguarding" are automatically encrypted using AES-256-GCM. The encryption key is stored in `CRM_SECRET_KEY`.

**Important**: 
- Never share or commit `CRM_SECRET_KEY` to version control
- Keep backups of the encryption key securely
- If the key is lost, encrypted data cannot be recovered

### CSRF Protection

All forms are protected with CSRF tokens. Tokens are automatically generated and validated.

### Session Management

Admin sessions use HttpOnly cookies for security. Sessions expire after 7 days of inactivity.

**Password Security:**
- All passwords are hashed using bcrypt (10 rounds)
- Plain text passwords are never stored
- Password hashes are stored in `admins.ndjson`

**Account Lockout:**
- Accounts are locked after 5 failed login attempts
- Lockout duration: 30 minutes
- Admins can unlock accounts manually from the user management page

**Password Reset:**
- Admins can reset passwords via "Forgot password?" link
- Reset links expire after 24 hours
- All active sessions are invalidated when password is changed

## Additional Features

### PDF Export for Newsletters

The Hub includes PDF export functionality for newsletters:

**Requirements:**
- Puppeteer must be installed: `npm install puppeteer`
- Puppeteer downloads Chromium automatically (may take time on first install)

**Usage:**
- Admins can export newsletters to PDF from the preview page
- PDFs include branded header, full content, and footer
- A4 format with proper margins
- Print-ready layout

**Configuration:**
- No additional configuration needed once Puppeteer is installed
- PDF generation happens server-side
- Files are streamed directly to the browser

**Troubleshooting:**
- If PDF export fails, check that Puppeteer is installed
- Ensure server has sufficient memory for Chromium
- Check server logs for detailed error messages

## Maintenance

### Generating Dummy Data

For testing purposes, you can generate dummy data:

```bash
node scripts/create-dummy-data.js
```

This creates sample contacts, lists, events, rotas, newsletters, and forms.

### Contact Import

To import contacts from CSV or Excel:

1. Prepare your file with column headers
2. Go to `/hub/contacts/import`
3. Upload the file (CSV or Excel format)
4. Map columns to contact fields
5. Preview and complete the import

**Supported Formats:**
- CSV (.csv)
- Excel (.xlsx, .xls)

**Field Mapping:**
The system auto-detects common column names. Ensure your file has:
- Email (required)
- First Name, Last Name
- Other fields as needed

**Troubleshooting Import:**
- Check that email column is mapped
- Verify date formats (Excel dates are automatically converted)
- Review validation errors for specific rows
- Check server logs for detailed error information

### Logs

Check application logs for errors. Common issues:
- Missing environment variables
- File permission errors
- Email sending failures

## Troubleshooting

### Cannot Create Admin

- Ensure `bcryptjs` is installed: `npm install bcryptjs`
- Check file permissions on `/data` directory
- Verify the script has access to write files

### Emails Not Sending

- Verify `RESEND_API_KEY` is set correctly
- Check that `RESEND_FROM_EMAIL` is verified in Resend
- Review Resend dashboard for delivery status

### Forms Not Submitting

- Check CSRF token is being generated
- Verify form fields match the form definition
- Check browser console for JavaScript errors

### Encryption Errors

- Ensure `CRM_SECRET_KEY` is set and valid (32 bytes, base64 encoded)
- Verify the key hasn't changed since data was encrypted
- Check that the key format is correct

## Best Practices

1. **Regular Backups**: Schedule regular backups of the `/data` directory
2. **Monitor Logs**: Check application logs regularly for errors
3. **Update Dependencies**: Keep npm packages updated for security
4. **Test Email**: Test email functionality after configuration changes
5. **Secure Keys**: Store encryption keys securely, never in code
6. **Access Control**: Limit admin account creation to trusted personnel

## Support

For technical issues, refer to:
- [Technical Documentation](TECHNICAL.md)
- [User Guide](USER_GUIDE.md)
- [Security Guide](SECURITY.md)

