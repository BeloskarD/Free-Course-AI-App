import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const buildPayload = (user) => ({
  userId: user.id || user._id?.toString(),
  sub: user.email || user.id || user._id?.toString(),
  email: user.email || undefined,
  tokenVersion: 2,
});

export const issueAccessToken = (user) => jwt.sign(buildPayload(user), config.jwtSecret, {
  expiresIn: config.jwtExpiresIn,
  issuer: config.jwtIssuer,
  audience: config.jwtAudience,
});

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret, {
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
};

export default {
  issueAccessToken,
  verifyAccessToken,
};
