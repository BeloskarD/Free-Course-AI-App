import axios from 'axios';
import { getCache, setCache, getPersistentCache, setPersistentCache } from '../utils/cacheUtils.js';
import { normalizeQuery } from '../utils/stringUtils.js';

export const searchYouTube = async (req, res) => {
  try {
    const { query } = req.body;

    // --- DOUBLE-SHIELD: BACKEND CACHE CHECK ---
    const normalizedQuery = normalizeQuery(query);
    const cacheKey = `youtube_search_${normalizedQuery}`;
    
    // Check Memory First
    let cachedResult = getCache(cacheKey);
    // Check Persistent Second
    if (!cachedResult) {
        cachedResult = await getPersistentCache(cacheKey);
    }

    if (cachedResult) {
      console.log(`🚀 [Double-Shield] CACHE HIT: serving youtube results for="${query}" instantly.`);
      return res.json(cachedResult);
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        q: `${query} course playlist`,
        type: 'playlist',
        maxResults: 50,
        part: 'snippet'
      }
    });

    const data = response.data.items;

    // --- DOUBLE-SHIELD: SAVE TO BACKEND CACHE (Memory+DB) ---
    await setPersistentCache(cacheKey, data, { ttlDays: 2, category: 'youtube' });
    console.log(`💾 [Double-Shield] CACHED youtube results for="${query}" (TTL: 2 days)`);

    res.json(data);
  } catch (err) {
    console.error(`❌ YouTube Search API Error for "${req.body.query}":`, err.message);
    res.status(500).json({ error: err.message });
  }
};
