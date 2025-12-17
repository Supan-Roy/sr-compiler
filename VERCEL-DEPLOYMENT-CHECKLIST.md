# Vercel Deployment Checklist

## Pre-Deployment (Local Testing)

- [ ] Run `npm run dev` - Frontend works at http://localhost:3000
- [ ] Run `npm run server` - Backend works at http://localhost:3001
- [ ] Test interactive mode with a simple C++ program
- [ ] Wait 30+ seconds - confirm processes terminate
- [ ] Run multiple programs simultaneously - confirm session limit works
- [ ] Refresh page - confirm code persists via localStorage

## Deployment Steps

### Step 1: Deploy Backend Server (Choose ONE)

**Option A: Railway (Recommended)**
- [ ] Create Railway account
- [ ] Import GitHub repo
- [ ] Wait for auto-deployment
- [ ] Copy deployment URL
- [ ] Test `/api/health` endpoint
- [ ] Note the URL for next step

**Option B: Render**
- [ ] Create Render account
- [ ] New Web Service
- [ ] Set Start Command: `npm run server`
- [ ] Wait for deployment
- [ ] Copy URL from dashboard
- [ ] Test `/api/health` endpoint

**Option C: Fly.io**
- [ ] Install flyctl
- [ ] Run `fly launch`
- [ ] Run `fly deploy`
- [ ] Get URL from output
- [ ] Test `/api/health` endpoint

### Step 2: Deploy Frontend to Vercel

- [ ] Push latest code to GitHub (all fixes included)
- [ ] Go to Vercel Dashboard
- [ ] Connect GitHub repo (if not already)
- [ ] Go to Settings → Environment Variables
- [ ] Add new variable:
  - Name: `VITE_EXECUTION_SERVER_URL`
  - Value: `https://your-backend-url.com` (from Step 1)
- [ ] Redeploy or push to trigger new build
- [ ] Wait for build to complete

## Post-Deployment Verification

- [ ] Visit Vercel app URL
- [ ] Write a test C++ program that takes input
- [ ] Run in Interactive mode
- [ ] Enter input when prompted
- [ ] Verify program executes correctly
- [ ] Refresh page - code still there? ✅
- [ ] Check `/api/health` - shows active sessions? ✅
- [ ] Run 10 programs rapidly - handles it well? ✅

## Environment Variables

### For Vercel (Frontend)
```
VITE_EXECUTION_SERVER_URL=https://your-backend-url.com
```

### For Backend Server (if using Railway/Render dashboard)
None required - port defaults to 3001

---

## Quick Reference URLs

After deployment, your URLs will be:

**Frontend**: `https://your-vercel-app.vercel.app`

**Backend Health Check**: `https://your-backend-url.com/api/health`

**Test Interactive**: 
1. Visit frontend URL
2. Write C++ program
3. Click Run (Interactive mode)
4. Enter input when prompted

---

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| "Server unavailable" | Check VITE_EXECUTION_SERVER_URL env var |
| Session expires in output | Normal - sessions timeout after 5 min inactivity |
| Max sessions error | Wait for other sessions to timeout |
| Code disappears after refresh | Check if localStorage is enabled |
| Process timeout error | Your program took > 30 seconds (expected) |

---

**Done! Your SR Compiler is now production-ready on Vercel! 🎉**
