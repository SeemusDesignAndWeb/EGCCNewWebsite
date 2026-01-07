# Restore CRM Data via Railway Shell

If you can't upload files to the Railway volume, you can create them directly in Railway shell.

## Step 1: Open Railway Shell

1. Go to Railway Dashboard
2. Navigate to your service
3. Click on the latest deployment
4. Click "Shell" to open a terminal

## Step 2: Create Files Manually

For each file you need to restore, run these commands in Railway shell:

### For admins.ndjson (most important):

```bash
cd /data
cat > admins.ndjson << 'EOF'
PASTE_YOUR_ADMINS_FILE_CONTENT_HERE
EOF
```

### For other files:

Repeat the same process for each file:
- `contacts.ndjson`
- `events.ndjson`
- `occurrences.ndjson`
- etc.

## Step 3: Using Base64 (Easier)

On your local machine, encode each file:

```bash
base64 data/admins.ndjson
```

Copy the output, then in Railway shell:

```bash
cd /data
echo "PASTE_BASE64_OUTPUT_HERE" | base64 -d > admins.ndjson
```

## Step 4: Verify Files

After creating files, verify they exist:

```bash
ls -la /data/*.ndjson
cat /data/admins.ndjson
```

## Quick Fix - Just Admins File

If you only need to restore login access, just create the `admins.ndjson` file:

1. Copy the content of your local `data/admins.ndjson`
2. In Railway shell, run:
   ```bash
   cd /data
   nano admins.ndjson
   ```
3. Paste the content
4. Save (Ctrl+X, then Y, then Enter)

This will restore your admin accounts so you can log in again.

