# Security Guide

## Environment Variables

### Required

- `CRM_SECRET_KEY`: Base64-encoded 32-byte key for encryption
  - Generate: `openssl rand -base64 32`
  - Keep secret and never commit to version control

- `RESEND_API_KEY`: Your Resend API key
  - Get from Resend dashboard
  - Required for sending emails

### Optional

- `APP_BASE_URL`: Base URL for absolute links in emails
  - Defaults to `event.url.origin` if not set
  - Should be set in production

- `RESEND_FROM_EMAIL`: Sender email address
  - Must be verified in Resend
  - Defaults to `onboarding@resend.dev`

## Best Practices

1. **Never commit secrets** to version control
2. **Use HTTPS** in production (required for Secure cookies)
3. **Rotate keys** periodically
4. **Limit admin access** - only create admin accounts for trusted users
5. **Monitor sessions** - review active sessions regularly
6. **Sanitize all input** - HTML content is sanitized via DOMPurify
7. **CSRF protection** - all forms include CSRF tokens

## Encryption

Safeguarding data (e.g., form submissions) is encrypted using AES-256-GCM:
- IV and auth tag included in ciphertext
- Key stored in `CRM_SECRET_KEY` environment variable
- Never store the key in code or logs

## Session Security

- Sessions expire after 7 days
- HttpOnly cookies prevent XSS
- Secure flag in production prevents transmission over HTTP
- SameSite=strict prevents CSRF

## Password Security

- Passwords hashed with bcrypt (10 rounds)
- Never store plain text passwords
- Use strong passwords for admin accounts

