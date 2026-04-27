import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL'];

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const ensureUrl = (name, value) => {
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    console.error(`[FATAL ERROR] Invalid URL for environment variable: ${name}`);
    process.exit(1);
  }
};

// Fail fast on missing critical environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[FATAL ERROR] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (String(process.env.JWT_SECRET).length < 16) {
  console.error('[FATAL ERROR] JWT_SECRET must be at least 16 characters long');
  process.exit(1);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'zeeklect-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'zeeklect-web',
  frontendUrl: ensureUrl('FRONTEND_URL', process.env.FRONTEND_URL || 'http://localhost:3000'),
  authIncludeLegacyOauthToken: parseBoolean(process.env.AUTH_INCLUDE_LEGACY_OAUTH_TOKEN, true),
  requireDbOnBoot: parseBoolean(process.env.REQUIRE_DB_ON_BOOT, false),
  sentryDsn: process.env.SENTRY_DSN,
  posthogApiKey: process.env.POSTHOG_API_KEY,
  keepAliveInterval: parseInt(process.env.KEEP_ALIVE_INTERVAL || '600000'),
};

export default config;
