# Copy Production Database to Development using Railway CLI

Since the service name is the same for both projects, you need to switch between Railway projects.

## Step-by-Step Instructions

### Prerequisites
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`

### Steps

1. **Link to Production Project:**
   ```bash
   railway link
   # Select your PRODUCTION project (www.egcc.co.uk)
   ```

2. **Read Database from Production:**
   ```bash
   railway run --service EGCCNewWebsite cat /data/database.json > temp-db.json
   ```

3. **Link to Development Project:**
   ```bash
   railway link
   # Select your DEVELOPMENT project (dev.egcc.co.uk)
   ```

4. **Write Database to Development:**
   ```bash
   railway run --service EGCCNewWebsite sh -c "cat > /data/database.json" < temp-db.json
   ```

5. **Clean up:**
   ```bash
   rm temp-db.json
   ```

## Alternative: Use API Method (No Railway CLI needed)

Since the service names are the same, the easiest method is using the API:

```bash
PROD_URL="https://www.egcc.co.uk" \
DEV_URL="https://dev.egcc.co.uk" \
ADMIN_PASSWORD="Haran153!" \
node scripts/copy-prod-to-dev-api.js
```

This works once the `/api/export-database` endpoint is deployed to production.

