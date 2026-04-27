import NodeCache from 'node-cache';
import SearchCache from '../models/SearchCache.js';

// Initialize cache with standard TTL of 5 minutes (300 seconds)
const stdCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * DOUBLE-SHIELD CACHE SERVICE
 * Layer 1: In-memory (NodeCache) - Fast, volatile.
 * Layer 2: Persistent (MongoDB) - Reliable, survives restarts.
 */

export const getCache = (key) => stdCache.get(key);
export const setCache = (key, value, ttl = 300) => stdCache.set(key, value, ttl);
export const delCache = (key) => stdCache.del(key);
export const flushCache = () => stdCache.flushAll();

/**
 * PERSISTENT CACHE HELPERS (Layer 2)
 */

export const getPersistentCache = async (key) => {
    try {
        const cached = await SearchCache.findOne({ key });
        if (cached) {
            // Populate memory cache for next time
            setCache(key, cached.data);
            return cached.data;
        }
        return null;
    } catch (error) {
        console.error(`[Cache] Persistent Get Error for ${key}:`, error.message);
        return null;
    }
};

export const setPersistentCache = async (key, value, options = {}) => {
    try {
        const { ttlDays = 2, category = 'other' } = options;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + ttlDays);

        await SearchCache.findOneAndUpdate(
            { key },
            { 
                data: value, 
                category, 
                expiresAt 
            },
            { upsert: true, new: true }
        );
        
        // Also update memory cache
        setCache(key, value, 3600); // 1hr memory durability for hot items
    } catch (error) {
        console.error(`[Cache] Persistent Set Error for ${key}:`, error.message);
    }
};

export default {
    getCache,
    setCache,
    getPersistentCache,
    setPersistentCache,
    delCache,
    flushCache,
    _cache: stdCache,
};

