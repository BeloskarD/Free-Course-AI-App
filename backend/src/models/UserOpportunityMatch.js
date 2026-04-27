import mongoose from 'mongoose';

/**
 * USER OPPORTUNITY MATCH MODEL
 * ============================
 * Per-user match scores and interaction state for opportunity signals.
 */

const userOpportunityMatchSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    signalId: { type: String, required: true },

    // Match Scoring
    matchScore: { type: Number, min: 0, max: 1 },
    gapAnalysis: [{
        skill: { type: String },
        currentMastery: { type: Number },
        requiredLevel: { type: Number },
        gap: { type: Number }
    }],

    // User Interaction
    status: {
        type: String,
        enum: ['new', 'viewed', 'saved', 'dismissed', 'acting', 'completed'],
        default: 'new'
    },
    savedAt: { type: Date },
    actedAt: { type: Date },

    // Generated Action Plan
    actionPlan: {
        missions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],
        estimatedTimeToReady: { type: String },
        skills: [{ type: String }]
    },

    // Network Intelligence Layer (backward-compatible extension)
    networkLayer: {
        warmPaths: [{
            name: { type: String },
            role: { type: String },
            company: { type: String },
            connectionDegree: { type: Number, min: 1, max: 3 },
            leverageScore: { type: Number, min: 0, max: 1 }
        }],
        networkScore: { type: Number, default: 0, min: 0, max: 1 }
    }
}, { timestamps: true });

userOpportunityMatchSchema.index({ userId: 1, matchScore: -1 });
userOpportunityMatchSchema.index({ userId: 1, signalId: 1 }, { unique: true });

export default mongoose.model('UserOpportunityMatch', userOpportunityMatchSchema);
