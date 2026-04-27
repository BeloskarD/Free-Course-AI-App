import { verifyAccessToken } from '../utils/jwt.js';

// EXISTING: Required authentication
export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    // FIXED: Support both 'id' and 'userId' field names
    const userId = decoded.userId || decoded.id;

    // Set both req.userId (legacy) and req.user (controller standard)
    req.userId = userId;
    req.user = { id: userId, userId, ...decoded };

    if (!userId) {
      return res.status(403).json({ error: 'Invalid token structure' });
    }

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// NEW: Optional authentication (works with or without token)
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no token, continue without userId
  if (!token) {
    console.log('🔓 Request without authentication (guest user)');
    req.userId = null;
    return next();
  }

  // If token exists, verify it
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId || decoded.id;
    req.user = req.userId ? { id: req.userId, userId: req.userId, ...decoded } : null;
  } catch {
    req.userId = null;
    req.user = null;
  }

    next();
};

export default { authenticate, optionalAuth };
