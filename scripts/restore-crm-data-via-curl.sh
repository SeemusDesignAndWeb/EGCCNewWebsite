#!/bin/bash
# Script to restore CRM data via API using curl
# This doesn't require Railway CLI or volume upload

set -e

PROD_URL="${PROD_URL:-https://new.egcc.co.uk}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ ADMIN_PASSWORD not set!"
    echo "   Export it: export ADMIN_PASSWORD=your-password"
    echo "   Or set PROD_URL if different: export PROD_URL=https://your-domain.com"
    exit 1
fi

DATA_DIR="./data"

echo "🔄 Restoring CRM data to $PROD_URL via API..."
echo ""

# Build JSON payload
PAYLOAD="{"
PAYLOAD="$PAYLOAD\"force\":true,"

FIRST=true
for file in admins contacts events occurrences rotas lists forms newsletters newsletter_templates event_signups event_tokens occurrence_tokens rota_tokens sessions audit_logs; do
    FILE_PATH="$DATA_DIR/${file}.ndjson"
    
    if [ -f "$FILE_PATH" ]; then
        if [ "$FIRST" = false ]; then
            PAYLOAD="$PAYLOAD,"
        fi
        # Read file and escape JSON
        CONTENT=$(cat "$FILE_PATH" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr -d '\n' | sed 's/$/\\n/' | tr -d '\n')
        PAYLOAD="$PAYLOAD\"$file\":\"$CONTENT\""
        FIRST=false
        echo "✅ Found $file.ndjson"
    else
        echo "⏭️  Skipping $file.ndjson (not found)"
    fi
done

PAYLOAD="$PAYLOAD}"

echo ""
echo "📤 Uploading to $PROD_URL/api/init-crm-data..."
echo ""

# Upload via curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/init-crm-data" \
    -H "Authorization: Bearer $ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Restore successful!"
    echo "$BODY" | grep -o '"written":\[[^]]*' | sed 's/"written":\[//' | sed 's/\]//' | tr ',' '\n' | sed 's/"//g' | while read file; do
        [ -n "$file" ] && echo "   ✅ Restored: $file"
    done
    echo ""
    echo "✅ CRM data successfully restored!"
else
    echo "❌ Upload failed (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi

