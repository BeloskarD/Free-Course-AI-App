import mongoose from 'mongoose';

/**
 * SEARCH CACHE MODEL (Double Shield Protection)
 * Persistently stores expensive AI/Search results for 2 days.
 */
const searchCacheSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    category: {
        type: String,
        enum: ['skill_gap', 'ai_intelligence', 'youtube', 'other'],
        default: 'other',
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // Uses TTL index on the date field
    }
}, {
    timestamps: true
});

const SearchCache = mongoose.model('SearchCache', searchCacheSchema);

export default SearchCache;
