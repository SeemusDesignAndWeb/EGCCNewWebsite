# CRM Module Documentation

Welcome to the CRM module documentation. This module provides a complete customer relationship management system for SvelteKit 5.

## Quick Start

1. Install dependencies: `npm install bcryptjs ulid dompurify jsdom`
2. Set up environment variables (see `.env.example`)
3. Generate a CRM_SECRET_KEY: `openssl rand -base64 32`
4. Access the CRM at `/hub` (login required)

## Features

- **Contacts Management**: Store and manage contact information
- **Lists**: Organize contacts into lists for targeted communications
- **Newsletters**: Create and send newsletters via Resend
- **Events & Occurrences**: Manage events with multiple occurrences
- **Volunteer Rotas**: Create rotas and send bulk invitations
- **Public Signup**: Token-based public signup for rotas
- **Built-in Documentation**: Access help at `/hub/help`

## Documentation

- [User Guide](USER_GUIDE.md) - How to use the CRM
- [Admin Guide](ADMIN_GUIDE.md) - Administrative tasks
- [Technical Documentation](TECHNICAL.md) - Technical details
- [Data Models](DATA_MODELS.md) - Data structure reference
- [Security](SECURITY.md) - Security best practices

