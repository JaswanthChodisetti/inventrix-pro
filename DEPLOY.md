# Deploy Inventrix Pro to Vercel

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- MongoDB Atlas account (free tier available)

---

## Step 1: Push to GitHub

Open PowerShell in your project folder and run:

```powershell
cd C:\Users\jaswa\Inventrix-Pro

# Initialize git
git init

# Create .gitignore if not exists (already done)

# Add all files
git add .

# Commit
git commit -m "Initial commit - Inventrix Pro"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/inventrix-pro.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. Create a free cluster (M0 Sandbox)
3. Click **Connect** → **Connect your application**
4. Copy the connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
5. In Vercel later, you'll add this as `MONGODB_URI`

---

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select your `inventrix-pro` repo
4. Click **Import**

### Configure Project:

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `pnpm build` (or `npm run build`) |
| Output Directory | `.next` |

### Add Environment Variables:

Click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://inventrix-pro.vercel.app`) |
| `SMTP_USER` | Your Gmail address (optional, for password reset) |
| `SMTP_PASS` | Gmail App Password (optional) |

5. Click **Deploy**

---

## Step 4: Gmail App Password (Optional)

If you want password reset emails:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Create app password for "Mail"
5. Use this password as `SMTP_PASS` in Vercel

---

## Step 5: Post-Deployment

1. **Create Admin User**: First user registered becomes admin (or update role in MongoDB)
2. **Test Password Reset**: Ensure SMTP is configured
3. **Check Logs**: Vercel → Deployments → Click latest → View logs

---

## Troubleshooting

### Build Fails
- Check Vercel deployment logs
- Ensure all dependencies in `package.json`
- Try `pnpm build` locally first

### Database Connection Fails
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0` (all IPs)
- Check connection string format
- Ensure database user has read/write permissions

### Password Reset Not Working
- Verify SMTP credentials in Vercel env vars
- Check `NEXT_PUBLIC_APP_URL` is correct
- Review Vercel function logs for errors

---

## Useful Commands

```powershell
# Test build locally
pnpm build

# Run Vercel CLI
vercel dev

# Link to Vercel project
vercel link
```
