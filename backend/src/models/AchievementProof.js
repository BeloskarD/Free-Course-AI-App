import mongoose from 'mongoose';

/**
 * ACHIEVEMENT PROOF MODEL
 * =======================
 * Automatic proof records triggered by learning milestones.
 * Drives portfolio updates, resume triggers, and recruiter signals.
 */

const achievementProofSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Proof Identity
    proofType: {
        type: String,
        enum: ['skill_badge', 'mission_completion', 'project_showcase', 'streak_milestone',
            'mastery_achieved', 'portfolio_update', 'resume_trigger'],
        required: true
    },
    title: { type: String, required: true },
    description: { type: String },

    // Source
    triggerSource: {
        type: { type: String, enum: ['mission', 'challenge', 'skill_health', 'momentum', 'manual'] },
        referenceId: { type: mongoose.Schema.Types.ObjectId },
        event: { type: String }
    },

    // Artifact
    artifact: {
        type: { type: String, enum: ['portfolio_project', 'resume_entry', 'badge', 'certificate', 'publication'] },
        data: { type: mongoose.Schema.Types.Mixed },
        isPublic: { type: Boolean, default: false },
        publicUrl: { type: String }
    },

    // Auto-Actions
    autoActions: {
        portfolioUpdated: { type: Boolean, default: false },
        resumeUpdated: { type: Boolean, default: false },
        recruiterSignalSent: { type: Boolean, default: false },
        socialShareReady: { type: Boolean, default: false }
    },

    // Recruiter Visibility
    recruiterVisibility: {
        isVisible: { type: Boolean, default: false },
        tags: [{ type: String }],
        verifiedAt: { type: Date },
        impressions: { type: Number, default: 0 }
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'generated', 'published', 'archived'],
        default: 'pending'
    }
}, { timestamps: true });

achievementProofSchema.index({ userId: 1, proofType: 1 });
achievementProofSchema.index({ 'recruiterVisibility.isVisible': 1, 'recruiterVisibility.tags': 1 });

export default mongoose.model('AchievementProof', achievementProofSchema);
