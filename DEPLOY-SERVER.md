# SR Compiler - Server Deployment Guide

## Option 1: Deploy to Railway (Recommended - Free tier available)

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your sr-compiler repository
5. Railway will detect Node.js and deploy automatically
6. Go to Settings → Generate Domain
7. Copy the domain (e.g., `your-app.up.railway.app`)
8. Create a `.env` file in your project:
   ```
   VITE_EXECUTION_SERVER_URL=https://your-app.up.railway.app
   ```
9. Redeploy Vercel

## Option 2: Deploy to Render

1. Go to [Render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repo
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Port: 3001
5. Create service and get the URL
6. Add to `.env`: `VITE_EXECUTION_SERVER_URL=https://your-service.onrender.com`

## Option 3: Deploy to Glitch

1. Go to [Glitch.com](https://glitch.com)
2. Import from GitHub
3. Your server will auto-start
4. Get the URL and add to `.env`

## For Vercel Deployment

After deploying your server, add the environment variable in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_EXECUTION_SERVER_URL` = `https://your-deployed-server.com`
3. Redeploy

Now your compiler will have TRUE interactive input on mobile! 🎉
