import userService from '../services/userService.js';
import pkgService from '../services/pkgService.js';
import personalizationService from '../services/personalizationService.js';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';
import { issueAccessToken } from '../utils/jwt.js';
import { createOAuthCode, consumeOAuthCode } from '../utils/oauthCodeStore.js';

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const hashed = await bcrypt.hash(password, 10);
    // Use userService to create user
    const user = await userService.create({ email: normalizedEmail, password: hashed, authProvider: 'local' });

    // Initialize PKG for new user using service
    await pkgService.getPKG(user.id);
    await personalizationService.getProfile(user.id);
    console.log(`[Auth] PKG and Profile initialized for new user: ${user.id}`);

    const token = issueAccessToken(user);
    res.json({ token, user: { id: user.id, email: normalizedEmail } });
  } catch (err) { res.status(400).json({ error: err.message }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userService.getUserByEmail(normalizedEmail);
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Ensure PKG exists for existing users (migration) via service
    await pkgService.getPKG(user.id);
    await personalizationService.getProfile(user.id);

    const token = issueAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const exchangeOAuthCode = async (req, res) => {
  const { code } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'OAuth code is required' });
  }

  try {
    const token = await consumeOAuthCode(code);
    if (!token) {
      return res.status(400).json({ error: 'OAuth code is invalid or expired' });
    }

    return res.json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to exchange OAuth code' });
  }
};

// ─── OAuth Callback Handler ───
// After Passport authenticates, this generates a JWT and redirects to frontend
export const socialCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${config.frontendUrl}/auth/callback?error=authentication_failed`);
    }

    // Standardize to use user.id (string) vs user._id (object)
    const userId = user.id || user._id.toString();

    // Ensure PKG exists for social login users
    await pkgService.getPKG(userId);
    await personalizationService.getProfile(userId);
    console.log(`[Auth] PKG and Profile verified/initialized for social login: ${userId}`);

    const token = issueAccessToken({ ...user, id: userId });
    const code = await createOAuthCode(token);
    const callbackUrl = new URL(`${config.frontendUrl}/auth/callback`);
    callbackUrl.searchParams.set('code', code);

    if (config.authIncludeLegacyOauthToken) {
      callbackUrl.searchParams.set('token', token);
    }

    res.redirect(callbackUrl.toString());
  } catch (err) {
    console.error('[Auth] Social callback error:', err);
    res.redirect(`${config.frontendUrl}/auth/callback?error=server_error`);
  }
};

// ─── OAuth Error Handler ───
export const socialError = (req, res) => {
  res.redirect(`${config.frontendUrl}/auth/callback?error=oauth_denied`);
};
