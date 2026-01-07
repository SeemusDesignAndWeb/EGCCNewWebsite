# Manual Upload of CRM Data Files to Railway

Since Railway CLI can be unreliable, here are alternative methods to upload your CRM data files.

## Method 1: Railway Dashboard File Upload (Easiest)

1. **Go to Railway Dashboard:**
   - Navigate to your service
   - Click on the **Volume** tab
   - You should see the volume mounted at `/data`

2. **Upload Files:**
   - Click "Upload Files" or use the file browser
   - Upload each `.ndjson` file from your local `./data` directory:
     - `admins.ndjson` (IMPORTANT - contains your login credentials)
     - `contacts.ndjson`
     - `events.ndjson`
     - `occurrences.ndjson`
     - `rotas.ndjson`
     - `lists.ndjson`
     - `forms.ndjson`
     - `newsletters.ndjson`
     - `newsletter_templates.ndjson`
     - `event_signups.ndjson`
     - `event_tokens.ndjson`
     - `occurrence_tokens.ndjson`
     - `rota_tokens.ndjson`
     - `sessions.ndjson`
     - `audit_logs.ndjson`

3. **Verify:**
   - After uploading, check that files appear in the volume
   - Restart your service if needed

## Method 2: Railway Shell + Copy/Paste

1. **Open Railway Shell:**
   - Go to Railway Dashboard → Your Service → Deployments → Latest
   - Click "Shell" to open a terminal

2. **Create the files:**
   ```bash
   # Navigate to data directory
   cd /data
   
   # Create each file (you'll paste the content)
   nano admins.ndjson
   # Paste the content from your local data/admins.ndjson
   # Save and exit (Ctrl+X, Y, Enter)
   ```

3. **Or use echo with base64:**
   ```bash
   # On your local machine, encode the file:
   base64 data/admins.ndjson
   
   # Copy the output, then in Railway shell:
   echo "PASTE_BASE64_HERE" | base64 -d > /data/admins.ndjson
   ```

## Method 3: One-Time Deployment Script

Create a file that runs on deployment to copy data from a backup location:

1. **Create a backup of your data files:**
   - Copy all `.ndjson` files to a temporary location in your repo
   - Or store them as base64 in environment variables

2. **Create an initialization script** that runs on first deployment

## Method 4: Use Railway's File System Access

If Railway provides file system access through their dashboard:

1. Navigate to the volume in Railway dashboard
2. Use the file editor to create/edit files directly
3. Paste the content from your local files

## Quick Fix for Login Issue

**Minimum required file:** `admins.ndjson`

If you only need to fix login, you can:

1. **Copy your local `data/admins.ndjson` file**
2. **Upload it to Railway volume at `/data/admins.ndjson`**
3. **Restart your service**

This will restore your admin accounts and allow you to log in.

## Verify Files Are Uploaded

After uploading, you can verify in Railway shell:
```bash
ls -la /data/*.ndjson
```

You should see all your CRM data files listed.

