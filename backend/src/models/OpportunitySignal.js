import mongoose from 'mongoose';

/**
 * OPPORTUNITY SIGNAL MODEL
 * ========================
 * External intelligence signals (GitHub trends, hiring signals, research trends).
 * Part of the Opportunity Radar Engine.
 */

const opportunitySignalSchema = new mongoose.Schema({
    // Signal Identity
    signalId: { type: String, required: true, unique: true, index: true },
    source: {
        type: String,
        default: 'industry_report',
        required: true
    },

    // Content
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed },

    // Skill Mapping
    skillTags: [{ type: String }],
    skillCluster: { type: String },

    // Scoring
    opportunityScore: { type: Number, min: 0, max: 1, default: 0.5 },
    trendMomentum: { type: Number, min: -1, max: 1, default: 0 },
    relevanceDecayRate: { type: Number, default: 0.05 },

    // Temporal
    detectedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    lastRefreshed: { type: Date },

    // Engagement
    timesShown: { type: Number, default: 0 },
    timesClicked: { type: Number, default: 0 },
    userDismissals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Meta
    isActive: { type: Boolean, default: true },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
}, { timestamps: true });

opportunitySignalSchema.index({ skillTags: 1 });
opportunitySignalSchema.index({ opportunityScore: -1 });
opportunitySignalSchema.index({ isActive: 1, opportunityScore: -1 });
opportunitySignalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OpportunitySignal', opportunitySignalSchema);
