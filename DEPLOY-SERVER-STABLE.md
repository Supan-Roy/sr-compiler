# SR Compiler - Server Deployment Guide (Stable)

## 🔥 IMPORTANT: New Server Stability Features

The execution server has been completely updated with production-ready features:

### Automatic Stability Features
- ✅ **Auto-cleanup**: Sessions expire after 5 minutes of inactivity
- ✅ **Session limits**: Maximum 20 concurrent sessions (prevents memory leaks)
- ✅ **Process timeouts**: Each process has 30-second timeout
- ✅ **Health monitoring**: `/api/health` endpoint shows active sessions
- ✅ **Graceful error handling**: Better error messages on failures
- ✅ **Activity tracking**: Updates last activity timestamp

**These prevent server crashes after extended usage on Vercel!**

---

## Option 1: Deploy to Railway (Recommended) ⭐

Railway is perfect for this - free tier includes generous limits.

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your sr-compiler repository
5. Railway auto-detects Node.js and deploys
6. Go to your project → Settings → Domains
7. Generate a domain (e.g., `sr-compiler.up.railway.app`)
8. Test the server health:
   ```
   https://sr-compiler.up.railway.app/api/health
   ```
9. Create `.env` file in project root:
   ```
   VITE_EXECUTION_SERVER_URL=https://sr-compiler.up.railway.app
   ```
10. Push to GitHub and redeploy frontend to Vercel

---

## Option 2: Deploy to Render

Render has good free tier with 750 hours/month.

1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Configure settings:
   - **Name**: sr-compiler-server
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Port**: 3001
5. Deployment will start automatically
6. Copy your URL from dashboard
7. Test health: `https://your-service.onrender.com/api/health`
8. Add to `.env`: 
   ```
   VITE_EXECUTION_SERVER_URL=https://your-service.onrender.com
   ```

---

## Option 3: Deploy to Fly.io (Alternative)

Fly.io offers good free credits.

1. Go to [Fly.io](https://fly.io)
2. Install flyctl CLI
3. Login and run:
   ```bash
   fly launch
   fly deploy
   ```
4. Get your URL: `https://your-app.fly.dev`
5. Test: `https://your-app.fly.dev/api/health`

---

## Final Step: Deploy Frontend to Vercel

1. **Vercel Dashboard** → Your Project → Settings
2. Go to **Environment Variables**
3. Add new variable:
   - **Name**: `VITE_EXECUTION_SERVER_URL`
   - **Value**: `https://your-deployed-server.com` (Railway/Render/Fly URL)
4. Redeploy or push to trigger new deployment

---

## How to Test Everything Works

### Local Testing
```bash
# Terminal 1: Start backend
npm run server
# Should show: "Code execution server running on http://localhost:3001"

# Terminal 2: Start frontend
npm run dev
# Should show: "Local: http://localhost:3000/"

# Visit http://localhost:3000 and test interactive mode
```

### After Deployment
1. Visit your Vercel frontend URL
2. Write a C++ program that asks for input:
   ```cpp
   #include <iostream>
   using namespace std;
   
   int main() {
       int n;
       cout << "Enter a number: ";
       cin >> n;
       cout << "You entered: " << n << endl;
       return 0;
   }
   ```
3. Click **Run** in Interactive mode
4. Should show prompt waiting for your input
5. Type a number and press Enter
6. Should display the result

---

## Troubleshooting

### "Server unavailable" on Vercel?
- Check if server is deployed and running
- Visit the health endpoint: `https://your-server.com/api/health`
- If no response, restart or redeploy the server
- Check environment variable is set correctly in Vercel

### "Session not found" after some time?
- Sessions expire after 5 minutes of inactivity (by design)
- This prevents memory leaks and orphaned processes
- Just run your code again to get a new session

### "Maximum concurrent sessions reached"?
- Server limits to 20 sessions to prevent resource exhaustion
- Wait a moment for other sessions to timeout
- Or use **Manual Mode** instead of Interactive

### Process timeout (30 seconds)?
- This limit exists to prevent resource exhaustion
- For longer programs, use "Manual Input Mode"
- Enter all input at once instead of interactive prompts

### Still crashing after extended use?
- Switch to **Railway** (most stable for Node.js apps)
- Or upgrade to paid plan for more resources
- Check server logs for specific errors

---

## Performance Tips

1. **Use Interactive Mode for short programs** (< 5 seconds)
2. **Use Manual Mode for longer programs** (> 5 seconds)
3. **Close unused tabs** to free up sessions
4. **Refresh page** if session expires

---

## Architecture Overview

```
┌─────────────────────┐
│  Vercel Frontend    │ (React app)
│  (VITE builds)      │
└──────────┬──────────┘
           │ (API calls)
           ↓
┌─────────────────────┐
│ Railway/Render Srv  │ (Node.js server)
│ - Session Manager   │
│ - Process Executor  │
│ - Auto Cleanup      │
└─────────────────────┘
```

---

**Your compiler is now production-ready! 🚀**
