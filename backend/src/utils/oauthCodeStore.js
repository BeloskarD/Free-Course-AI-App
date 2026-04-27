import crypto from 'crypto';
import OAuthCode from '../models/OAuthCode.js';

/**
 * Persists an OAuth exchange code to MongoDB.
 * Replaces the old in-memory Map to survive server restarts on Render.
 */
export const createOAuthCode = async (token) => {
  const code = crypto.randomBytes(24).toString('hex');
  await OAuthCode.create({
    code,
    token
  });
  return code;
};

/**
 * Consumes an OAuth code from MongoDB.
 * Atomic operation: find and delete ensures single-use security.
 */
export const consumeOAuthCode = async (code) => {
  if (!code) return null;

  try {
    const entry = await OAuthCode.findOneAndDelete({ code });
    if (!entry) {
      return null;
    }

    // TTL index handles expiry, but we can verify createdAt just in case
    const isExpired = (Date.now() - entry.createdAt.getTime()) > (5 * 60 * 1000);
    if (isExpired) {
      return null;
    }

    return entry.token;
  } catch (error) {
    console.error('[OAuthStore] Error consuming code:', error);
    return null;
  }
};

export default {
  createOAuthCode,
  consumeOAuthCode,
};
