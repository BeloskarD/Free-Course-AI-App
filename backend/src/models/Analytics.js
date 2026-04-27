import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "view_timeline", "validate_skill"
  feature: { type: String }, // e.g. "career_timeline", "skill_validation"
  metadata: { type: mongoose.Schema.Types.Mixed },
  userTier: { type: String, enum: ['free', 'pro'] },
  currentScore: { type: Number },
}, { timestamps: true });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  featureId: { type: String, required: true },
  helpful: { type: Boolean, required: true },
  comment: { type: String },
  userState: {
    score: Number,
    tier: { type: String, enum: ['free', 'pro'] }
  }
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
