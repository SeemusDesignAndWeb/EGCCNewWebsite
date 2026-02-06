#!/usr/bin/env sh
# Create or reset admin on Railway (uses Railway's env: SUPER_ADMIN_EMAIL, DATABASE_URL).
# If ADMIN_PASSWORD is not set, a strong password is generated and printed.
# Prereq: railway login && railway link (in this repo).
# Usage: ./scripts/create-admin-railway.sh   OR   railway run -- ./scripts/create-admin-railway.sh

set -e
cd "$(dirname "$0")/.."

EMAIL="${SUPER_ADMIN_EMAIL:?Set SUPER_ADMIN_EMAIL in Railway (or env)}"
NAME="${ADMIN_NAME:-Admin}"

# Generate strong password if unset or shorter than 12 chars (create-admin requirement)
if [ -z "${ADMIN_PASSWORD}" ] || [ ${#ADMIN_PASSWORD} -lt 12 ]; then
  ADMIN_PASSWORD=$(node scripts/generate-password.js | tr -d '\n')
  GENERATED=1
fi

export RESET_ADMIN_PASSWORD=1
export ADMIN_PASSWORD

# Pass password via env only so special characters (# etc.) are not mangled by the shell
node -r dotenv/config scripts/create-admin.js "$EMAIL" "" "$NAME"

if [ -n "$GENERATED" ]; then
  echo ""
  echo "=============================================="
  echo "Use this password to log in (save it now):"
  echo "  $ADMIN_PASSWORD"
  echo "=============================================="
fi
