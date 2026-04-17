# Specialty Kit Finder - Complete Render Deployment Setup

This guide walks you through deploying the Specialty Kit Finder to Render from start to finish.

## Prerequisites

- GitHub account with access to `LightsOn-Safety-Solutions/hazmat-toolkit` repository
- Render account (create at [render.com](https://render.com))
- Supabase project with the specialty_kits table created
- Admin email address for access control

## Step 1: Verify GitHub Repository

Your code is already pushed to: https://github.com/LightsOn-Safety-Solutions/hazmat-toolkit

The `specialty-kit-finder` service is configured in `render.yaml` at the repository root.

## Step 2: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **Sign Up**
3. Choose **Sign up with GitHub** (easier for connecting repositories)
4. Authorize Render to access your GitHub account
5. Complete your profile

## Step 3: Create a Render Service

### Option A: Using render.yaml (Recommended)

If your Render account is connected to your GitHub org, Render will auto-detect the render.yaml file:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint** 
3. Select `LightsOn-Safety-Solutions/hazmat-toolkit` repository
4. Render will create all services from `render.yaml` automatically
5. Skip to Step 4 below

### Option B: Manual Setup (If Blueprint doesn't auto-detect)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Static Site**
3. Click **Connect Repository**
4. Search for `hazmat-toolkit` and select it
5. Fill in:
   - **Name:** `specialty-kit-finder`
   - **Branch:** `main`
   - **Build Command:** `cd native-ios/App/public/toolbox/training/specialty-kits && npm ci && npm run build`
   - **Publish Directory:** `native-ios/App/public/toolbox/training/specialty-kits`
6. Click **Create Static Site**

## Step 4: Configure Environment Variables

After the service is created:

1. Go to your `specialty-kit-finder` service in Render Dashboard
2. Click **Environment**
3. Add the following variables:

### Public Variables (Add as Environment Variables)

| Key | Value | Description |
|-----|-------|-------------|
| `SPECIALTY_KITS_SUPABASE_URL` | `https://domebvsyhexhgvsducbm.supabase.co` | Your Supabase project URL |
| `SPECIALTY_KITS_ADMIN_EMAILS` | `john.holtan@lightsonss.com` | Comma-separated admin emails |

### Secret Variables (Add as Secrets)

1. Click **Add Secret** (not "Add Environment Variable")
2. Add these securely:

| Key | Value | Notes |
|-----|-------|-------|
| `SPECIALTY_KITS_SUPABASE_ANON_KEY` | [See below] | Don't log this |
| `SPECIALTY_KITS_OPENCAGE_API_KEY` | [Optional] | Leave blank if not using geocoding |

### Getting Your Supabase Keys

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (domebvsyhexhgvsducbm)
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `SPECIALTY_KITS_SUPABASE_URL`
   - **Anon public key** → Use for `SPECIALTY_KITS_SUPABASE_ANON_KEY`

### Updating Admin Emails

If you want to add more admins, update `SPECIALTY_KITS_ADMIN_EMAILS`:

```
john.holtan@lightsonss.com,other-admin@example.com,another-admin@example.com
```

5. Click **Save Changes**

## Step 5: Deploy

### Automatic Deployment

Render will auto-deploy whenever you push to the `main` branch:

```bash
git add .
git commit -m "Update specialty kit finder"
git push origin main
```

You'll see the deployment status in the Render Dashboard.

### Manual Deployment

Click **Deploy** in the Render Dashboard if you want to redeploy without code changes.

## Step 6: Find Your URL

Once deployed:

1. Go to your service in Render Dashboard
2. At the top, you'll see the URL like: `https://specialty-kit-finder-XXXXX.onrender.com`
3. Click it to open your live app

## Step 7: Verify Deployment

### Check the App Loads

```bash
curl https://specialty-kit-finder-XXXXX.onrender.com/index.html
```

You should see HTML content (not an error).

### Test Admin Page

1. Go to `https://specialty-kit-finder-XXXXX.onrender.com/admin.html`
2. You should be redirected to login
3. Sign in with one of the admin emails
4. If login works, Supabase is connected correctly

### Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab:

- You should NOT see errors about missing config
- You should see logs like: "Supabase initialized"
- No red error messages

## Step 8: Update URLs (if needed)

If your Render URL is different from the example above, update any hardcoded URLs:

### In your application code

Search for hardcoded URLs and update to your Render domain:

- Change: `https://localhost:9000` → `https://specialty-kit-finder-XXXXX.onrender.com`
- Search your code for old URLs and update

### In client apps

If other apps reference this URL, update:
- config.js files
- API endpoints
- Any hardcoded links

## Troubleshooting

### Build Fails

Check the build logs in Render:
1. Go to your service
2. Click **Logs** → **Build logs**
3. Look for errors like `SPECIALTY_KITS_SUPABASE_ANON_KEY is not set`

**Solution:** Add the missing environment variable.

### App Loads but Shows Blank Page

Check the browser console (F12):

- **"Cannot read property 'supabaseUrl' of undefined"** → Config wasn't generated
  - Verify environment variables are set
  - Check build logs for errors
  - Trigger a manual redeploy

- **"Failed to connect to Supabase"** → Connection issue
  - Verify `SPECIALTY_KITS_SUPABASE_URL` is correct
  - Check Supabase project is active
  - Verify anon key is valid

### Admin Page Won't Load

- Sign out and sign back in
- Check your email is in `SPECIALTY_KITS_ADMIN_EMAILS`
- Check Supabase Auth is enabled
- Look for auth errors in browser console

### Static Files (CSS, JS) Not Loading

This usually means the `staticPublishPath` is wrong. Check:
1. Your render.yaml has correct path
2. The files exist at that path
3. Trigger a redeploy

## Custom Domain Setup

To use a custom domain like `specialty-kits.example.com`:

1. In Render Dashboard, go to your service
2. Click **Settings**
3. Scroll to **Custom Domain**
4. Click **Add Custom Domain**
5. Enter your domain: `specialty-kits.example.com`
6. Follow DNS configuration steps
7. Update your DNS provider (GoDaddy, Route53, etc.)

## SSL/TLS Certificate

Render automatically provides free SSL certificates (HTTPS). Your site will be:
- `https://specialty-kit-finder-XXXXX.onrender.com` (auto)
- `https://specialty-kits.example.com` (if you add custom domain)

## Monitoring & Logs

### View Logs

1. Go to your service in Render Dashboard
2. Click **Logs**
3. See real-time logs as requests come in
4. Look for errors or warnings

### Check Health

Static sites don't have health checks like API services, but you can:
1. Manually visit the URL
2. Check HTTP status code (should be 200)
3. Use monitoring tools to ping the URL

## Updates & Redeployments

### Standard Deploy

```bash
git add .
git commit -m "Your message"
git push origin main
```

Render auto-deploys.

### Force Redeploy

In Render Dashboard:
1. Go to your service
2. Click **Deploy**
3. Select "Clear build cache and deploy"

### Rollback to Previous Deployment

1. Go to **Deployments** tab
2. Find the previous successful deployment
3. Click **Re-deploy**

## Environment Variables Quick Reference

```bash
# Public
SPECIALTY_KITS_SUPABASE_URL=https://domebvsyhexhgvsducbm.supabase.co
SPECIALTY_KITS_ADMIN_EMAILS=john.holtan@lightsonss.com

# Secrets
SPECIALTY_KITS_SUPABASE_ANON_KEY=your-key-here
SPECIALTY_KITS_OPENCAGE_API_KEY=optional-geocoding-key
```

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Issues:** https://github.com/LightsOn-Safety-Solutions/hazmat-toolkit/issues

## Next Steps

Once deployed:

1. ✅ Visit your live URL
2. ✅ Test the finder interface
3. ✅ Test the submission form
4. ✅ Test the admin dashboard
5. ✅ Share the URL with users
6. ✅ Monitor logs for errors

---

**Your Specialty Kit Finder is now in production!** 🎉
