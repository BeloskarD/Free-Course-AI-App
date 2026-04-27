import { LRUCache } from 'lru-cache';

/**
 * Global Memory Cache for the Express Server.
 * Using LRU (Least Recently Used) to prevent memory leaks when scaling.
 * 
 * Default config:
 * - max: 500 items in cache
 * - ttl: 5 minutes
 */
const options = {
  max: 500,
  ttl: 1000 * 60 * 5, 
};

export const cache = new LRUCache(options);

/**
 * Express Middleware to instantly return cached JSON responses for heavy GET routes
 * (e.g., Matrix dashboards, skill graphs, stable AI reads)
 *
 * @param {number} durationMs - How long the response should live in cache
 */
export const requireCache = (durationMs = 1000 * 60 * 5) => {
  return (req, res, next) => {
    // We only cache deterministic GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Key by UserID + Route explicitly so users don't see each other's data
    const userIdPrefix = req.userId ? `user_${req.userId}` : 'guest';
    const key = `__express__${userIdPrefix}_${req.originalUrl || req.url}`;
    
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      console.log(`⚡ [Cache HIT] Serving ${req.originalUrl} from Memory LRU`);
      return res.json(JSON.parse(cachedBody));
    } else {
      console.log(`💽 [Cache MISS] Calculating ${req.originalUrl}`);
      // Override res.json to capture the outbound payload
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, JSON.stringify(body), { ttl: durationMs });
        }
        originalJson.call(this, body);
      };
      next();
    }
  };
};

/**
 * Utility to manually bust/clear the cache when a mutation occurs.
 * e.g., clearCacheForUser(userId) when they save a new course.
 */
export const clearCacheForUser = (userId) => {
  if (!userId) return;
  const prefix = `__express__user_${userId}`;
  
  // LRUCache v10+ requires iterating keys manually to delete by prefix
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(k => cache.delete(k));
  console.log(`🧹 [Cache] Busted ${keysToDelete.length} stale entries for User ${userId}`);
};
