# Mailgun Email Setup

This project uses [Mailgun](https://www.mailgun.com) for sending emails (contact form, newsletters, rota invites, password reset, etc.).

## Environment variables

Add to your `.env`:

```env
# Mailgun (required for email)
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@yourdomain.com
```

- **MAILGUN_API_KEY**: Private API key from [Mailgun Dashboard → Sending → Domain settings → API Keys](https://app.mailgun.com/app/sending/domains).
- **MAILGUN_DOMAIN**: Your sending domain (e.g. `mg.yourdomain.com` or the sandbox domain for testing).
- **MAILGUN_FROM_EMAIL**: Default “From” address; must be from your verified sending domain.

Optional:

- **MAILGUN_EU**: Set to `true` or `1` if your Mailgun account uses the EU region (`https://api.eu.mailgun.net`).

For a short migration from Resend, you can keep **RESEND_FROM_EMAIL** and it will be used as a fallback for the default “From” address if **MAILGUN_FROM_EMAIL** is not set.

## Domain verification

1. In [Mailgun](https://app.mailgun.com), add and verify your sending domain (DNS records).
2. Use a “From” address on that domain (e.g. `noreply@yourdomain.com`).
3. For testing, you can use the Mailgun sandbox domain and add authorized recipients in the dashboard.

## What uses Mailgun

- Contact form (site → church, plus confirmation to sender)
- Hub newsletters (single and bulk)
- Rota invitations (single and bulk)
- Event signup confirmations
- Admin welcome / verification emails
- Multi-org password reset emails

All sending goes through `$lib/server/mailgun.js` and uses the same rate limiting as before.
