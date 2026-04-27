import mongoose from 'mongoose';

const skillValidationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skill: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['mcq', 'code', 'project', 'external'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  proofLink: {
    type: String, // GitHub, Live URL, or internal submission ID
    default: null
  },
  validatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Stores MCQ answers or code feedback
    default: {}
  },
  isLatest: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Anti-gaming: Compound index to easily fetch previous attempts
skillValidationSchema.index({ userId: 1, skill: 1, validatedAt: -1 });

export default mongoose.model('SkillValidation', skillValidationSchema);
