#!/bin/bash

# Simple script to copy database from production to development using Railway CLI
# This directly copies the file between Railway volumes

echo "🔄 Copying database from production to development using Railway CLI..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "   Please install: npm i -g @railway/cli"
    echo "   Then run: railway login"
    exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
TEMP_FILE="$TEMP_DIR/database.json"

echo "📖 Step 1: Reading database from production..."
echo "   (You will need to select the PRODUCTION project when prompted)"
echo "   Service name: EGCCNewWebsite"
echo ""

# Read from production
# Note: Service name is the same for both projects, but you need to link to production first
railway run --service EGCCNewWebsite cat /data/database.json > "$TEMP_FILE" 2>&1

if [ ! -s "$TEMP_FILE" ] || grep -q "error\|Error\|ERROR" "$TEMP_FILE"; then
    echo "❌ Failed to read from production"
    echo "   Make sure you're linked to the production project: railway link"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "✅ Successfully read production database"
echo ""

echo "📤 Step 2: Writing database to development..."
echo "   ⚠️  IMPORTANT: You need to switch to the DEVELOPMENT project now!"
echo "   Run: railway link"
echo "   Then select the DEVELOPMENT project"
echo "   Press Enter when ready to continue..."
read

# Write to development
railway run --service EGCCNewWebsite sh -c "cat > /data/database.json" < "$TEMP_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Successfully wrote database to development"
    echo ""
    echo "🎉 Database successfully copied!"
    echo "   The development site should now have the production data."
else
    echo "❌ Failed to write to development"
    echo "   Make sure you're linked to the development project"
fi

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "💡 Note: If you have separate Railway projects for prod/dev,"
echo "   you may need to switch projects: railway link"

