import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import User from '../models/User.js';
import PKG from '../models/PKG.js';
import config from './env.js';

const FRONTEND_URL = config.frontendUrl;

// ─── Helper: Find or Create User from OAuth Profile ───
async function findOrCreateUser(profile, provider) {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;
    const name = profile.displayName || profile.username || '';
    const avatar = profile.photos?.[0]?.value || '';

    if (!email) {
        // Some providers (Twitter) may not return email
        // Try to find by providerId + provider
        let user = await User.findOne({ providerId, authProvider: provider });
        if (user) {
            // Update name/avatar from provider data
            if (name) user.name = name;
            if (avatar) user.avatar = avatar;
            await user.save();
            return user;
        }

        // Create new user without email (use providerId as pseudo-email)
        user = new User({
            email: `${provider}_${providerId}@social.auth`,
            authProvider: provider,
            providerId,
            name,
            avatar,
        });
        await user.save();
        await PKG.initializeForUser(user._id);
        console.log(`[OAuth] New ${provider} user created (no email): ${user._id}`);
        return user;
    }

    // Check if user already exists with this email
    let user = await User.findOne({ email });

    if (user) {
        // User exists - update social fields if they logged in with local before
        if (!user.providerId && user.authProvider === 'local') {
            user.authProvider = provider;
            user.providerId = providerId;
        }
        // Update name/avatar from provider data
        if (name) user.name = name;
        if (avatar) user.avatar = avatar;
        await user.save();
        console.log(`[OAuth] Existing user linked to ${provider}: ${user._id}`);
        return user;
    }

    // Create new user
    user = new User({
        email,
        authProvider: provider,
        providerId,
        name,
        avatar,
    });
    await user.save();

    // Initialize PKG for new user
    await PKG.initializeForUser(user._id);
    console.log(`[OAuth] New ${provider} user created: ${user._id}`);
    return user;
}

// ─── Google Strategy ───
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateUser(profile, 'google');
            done(null, user);
        } catch (err) {
            console.error('[OAuth] Google strategy error:', err);
            done(err, null);
        }
    }));
    console.log('✅ Google OAuth strategy configured');
} else {
    console.log('⚠️  Google OAuth: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// ─── GitHub Strategy ───
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
        scope: ['user:email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateUser(profile, 'github');
            done(null, user);
        } catch (err) {
            console.error('[OAuth] GitHub strategy error:', err);
            done(err, null);
        }
    }));
    console.log('✅ GitHub OAuth strategy configured');
} else {
    console.log('⚠️  GitHub OAuth: Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
}

// ─── Twitter Strategy ───
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL || '/api/auth/twitter/callback',
        includeEmail: true,
    }, async (token, tokenSecret, profile, done) => {
        try {
            const user = await findOrCreateUser(profile, 'twitter');
            done(null, user);
        } catch (err) {
            console.error('[OAuth] Twitter strategy error:', err);
            done(err, null);
        }
    }));
    console.log('✅ Twitter OAuth strategy configured');
} else {
    console.log('⚠️  Twitter OAuth: Missing TWITTER_CONSUMER_KEY or TWITTER_CONSUMER_SECRET');
}

// Passport serialization (we use JWT, so these are minimal)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
