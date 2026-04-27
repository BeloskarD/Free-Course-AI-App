/**
 * STRING UTILS
 * Centralized normalization for queries and keys
 */

/**
 * Normalizes a query string for use in cache keys and comparisons.
 * Lowercases, trims, and replaces multiple whitespace/special separators with a single underscore.
 * @param {string} query - The raw input query
 * @returns {string} - The normalized query
 */
export const normalizeQuery = (query) => {
    if (!query || typeof query !== 'string') return '';
    return query
        .toLowerCase()
        .trim()
        .replace(/[\s\-_]+/g, '_');
};

export default {
    normalizeQuery
};
