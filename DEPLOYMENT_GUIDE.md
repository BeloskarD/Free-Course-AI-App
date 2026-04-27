# 🚀 AI Learning Platform Deployment Guide

This guide provides step-by-step instructions for deploying the AI Learning Platform to production environments.

## 📋 Overview

The platform consists of two main components:
1. **Frontend**: Next.js 16.1.1 React application
2. **Backend**: Node.js/Express.js API server with MongoDB

## 🏗️ Recommended Deployment Architecture

For optimal performance, scalability, and cost-effectiveness:

- **Frontend**: Vercel (optimized for Next.js)
- **Backend**: Render.com (Node.js/Express/MongoDB friendly)
- **Database**: MongoDB Atlas (managed MongoDB service)
- **Environment Variables**: Configured in each platform's dashboard

## 🔧 Prerequisites

1. GitHub repository with the code
2. Accounts on:
   - Vercel (vercel.com)
   - Render.com (render.com)
   - MongoDB Atlas (mongodb.com/cloud/atlas)
3. API keys for all external services:
   - OpenAI
   - Groq
   - Azure AI Inference
   - Tavily
   - Serper
   - Bytez

## 📦 Step 1: Database Setup (MongoDB Atlas)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free tier M0 is sufficient for development)
3. Create a database user with read/write access
4. Whitelist your IP address (or allow access from anywhere for initial setup)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

## 🎨 Step 2: Frontend Deployment (Vercel)

1. Push your code to GitHub (if not already done)
2. Go to [Vercel](https://vercel.com) and sign up/login
3. Click "New Project" → Import your GitHub repository
4. Vercel should automatically detect it's a Next.js project
5. Configure environment variables:
   - `NEXT_PUBLIC_BASE_URL`: Will be auto-filled by Vercel (your vercel.app domain)
   - `NEXT_PUBLIC_API_BASE_URL`: Set to your backend URL (e.g., `https://your-backend.onrender.com/api`)
6. Click "Deploy"
7. Vercel will handle the build and deployment automatically
8. After deployment, note your frontend URL (e.g., `https://your-project.vercel.app`)

## ⚙️ Step 3: Backend Deployment (Render)

1. Go to [Render](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - Name: `ai-learning-platform-backend` (or similar)
   - Region: Choose closest to your users
   - Branch: `main` (or your default branch)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`
   - Plan: Start with Free tier
5. Click "Create Web Service"
6. After the service is created, go to the "Environment" tab
7. Add the following environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=[Your Vercel frontend URL]
   MONGO_URI=[Your MongoDB Atlas connection string]
   JWT_SECRET=[Generate a strong random string, e.g., 32+ characters]
   OPENAI_API_KEY=[Your OpenAI API key]
   GROQ_API_KEY=[Your Groq API key]
   AZURE_AI_INFERENCE_ENDPOINT=[Your Azure AI endpoint]
   AZURE_AI_INFERENCE_KEY=[Your Azure AI key]
   TAVILY_API_KEY=[Your Tavily API key]
   SERPER_API_KEY=[Your Serper API key]
   BYTEZ_API_KEY=[Your Bytez API key]
   REQUIRE_DB_ON_BOOT=true
   AUTH_INCLUDE_LEGACY_OAUTH_TOKEN=false
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   CACHE_TTL=3600
   WORKER_CONCURRENCY=2
   LOG_LEVEL=info
   ```
8. Save changes and wait for the service to redeploy automatically
9. After deployment, note your backend URL (e.g., `https://your-backend.onrender.com`)

## 🔄 Step 4: Update Frontend with Backend URL

1. Go back to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_BASE_URL` to point to your Render backend:
   ```
   https://your-backend.onrender.com/api
   ```
4. Redeploy the frontend

## 🔐 Step 5: Security Verification

1. **CORS Configuration**: Verify that your backend only accepts requests from your frontend domain
2. **Environment Variables**: Confirm no sensitive keys are exposed in client-side code
3. **HTTPS**: Both Vercel and Render provide automatic SSL certificates
4. **Security Headers**: Check that security headers are being applied (use browser dev tools)

## 📈 Step 6: Performance Optimization

1. **Frontend**:
   - Vercel automatically optimizes Next.js applications
   - Image optimization is configured via `next.config.mjs`
   - Consider enabling Vercel's Image Optimization for external images

2. **Backend**:
   - Monitor response times in Render dashboard
   - Consider upgrading instance type if needed
   - MongoDB Atlas provides performance monitoring

## 🔍 Step 7: Monitoring & Logging

1. **Frontend**:
   - Vercel provides built-in analytics
   - Consider integrating Sentry for error tracking

2. **Backend**:
   - Render provides basic logging and metrics
   - Consider adding structured logging with Winston or Pino
   - Set up health check monitoring (endpoint: `/api/health`)

## 🧪 Step 8: Testing Your Deployment

1. Visit your frontend URL
2. Test user registration and login flows
3. Test AI features (skill gap analysis, course recommendations, etc.)
4. Check browser console for any errors
5. Verify that data persists correctly in MongoDB

## 🔄 Continuous Deployment

Both Vercel and Render are configured for automatic deployments:
- **Vercel**: Automatically deploys on every push to connected GitHub branch
- **Render**: Automatically redeploys when connected GitHub branch is updated

## 📝 Environment Variables Reference

### Frontend (.env.example)
```
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
```

### Backend (Render Environment Variables)
```
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=[strong-random-string]
OPENAI_API_KEY=[your-openai-key]
GROQ_API_KEY=[your-groq-key]
AZURE_AI_INFERENCE_ENDPOINT=[your-azure-endpoint]
AZURE_AI_INFERENCE_KEY=[your-azure-key]
TAVILY_API_KEY=[your-tavily-key]
SERPER_API_KEY=[your-serper-key]
BYTEZ_API_KEY=[your-bytez-key]
REQUIRE_DB_ON_BOOT=true
AUTH_INCLUDE_LEGACY_OAUTH_TOKEN=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=3600
WORKER_CONCURRENCY=2
LOG_LEVEL=info
```

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Connection Errors**:
   - Verify MongoDB connection string
   - Check network access in MongoDB Atlas (Network Access tab)
   - Ensure `REQUIRE_DB_ON_BOOT=true` is set

2. **CORS Errors**:
   - Verify `FRONTEND_URL` matches exactly (including protocol and no trailing slash)
   - Check backend CORS configuration in `src/app.js`

3. **Authentication Issues**:
   - Verify `JWT_SECRET` is set and matches between services
   - Check token expiration handling

4. **Missing Features**:
   - Verify all required API keys are set
   - Check backend logs for initialization errors

### Logs Access

- **Frontend**: Vercel dashboard → Deployments → Logs
- **Backend**: Render dashboard → Service → Logs

## 🎯 Next Steps for Production

1. **Custom Domain**:
   - Add your domain in Vercel settings (Domains tab)
   - Add your domain in Render settings (Custom Domains tab)
   - Update DNS records accordingly

2. **Scaling**:
   - Upgrade Render service as traffic grows
   - Consider MongoDB Atlas dedicated clusters for production
   - Add Redis caching layer for improved performance

3. **Advanced Monitoring**:
   - Integrate Sentry for frontend error tracking
   - Add detailed backend logging with request tracing
   - Set up uptime monitoring with services like UptimeRobot

4. **Backup Strategy**:
   - Enable MongoDB Atlas backups
   - Consider regular database dumps
   - Document disaster recovery procedures

## 📞 Support

If you encounter issues during deployment:
1. Check the platform-specific logs first
2. Verify all environment variables are correctly set
3. Ensure your MongoDB cluster is accessible
4. Check that all required API keys are valid and have sufficient quota
5. Review the error messages carefully - they often point to the root cause

---

*Last Updated: April 12, 2026*
*Platform: AI Learning Platform v1.0.0*