# 🐦 Twitter OAuth Production Setup Guide

To enable Twitter (X) login on your production application, you must configure the Twitter Developer Portal to match your deployment URLs.

## 1. Create a Developer Account
1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).
2. Create a new **Project** and an **App** within that project.
3. Ensure your App is on the **Free** or **Basic** tier.

## 2. Configure User Authentication Settings
In your App settings, click **"Set up"** under the "User authentication settings" section:

### App Permissions
- Select **Read and Write** (essential if you plan to fetch profile data and emails).

### Type of App
- Select **Web App, Automated App or Bot**.

### App Info
- **Callback URI / Redirect URL**:
  - `https://your-backend.onrender.com/api/auth/twitter/callback`
  - *Replace `your-backend.onrender.com` with your actual Render URL.*
- **Website URL**:
  - `https://your-frontend.vercel.app`
  - *Replace `your-frontend.vercel.app` with your actual Vercel URL.*

## 3. Get Your Keys
Go to the **"Keys and Tokens"** tab. You need:
1. **API Key** (maps to `TWITTER_CONSUMER_KEY`)
2. **API Key Secret** (maps to `TWITTER_CONSUMER_SECRET`)

## 4. Update Render Environment Variables
Add these keys to your Render dashboard:
- `TWITTER_CONSUMER_KEY`: `[Your API Key]`
- `TWITTER_CONSUMER_SECRET`: `[Your API Key Secret]`
- `TWITTER_CALLBACK_URL`: `https://your-backend.onrender.com/api/auth/twitter/callback`

---

> [!IMPORTANT]
> **Twitter API v2 vs v1.1**
> The current application uses `passport-twitter` which relies on OAuth 1.0a. Ensure you enable **OAuth 1.0a** in the Twitter settings if it is not enabled by default.

> [!TIP]
> **Testing Logins**
> Once these keys are added, the "Twitter" button on the login page will automatically become functional.
