import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  targetRole: { type: String, default: 'Software Engineer' },
  hiringScore: { type: Number, default: 0 },
  
  hiringScoreHistory: [{
    score: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],


  coursesCompleted: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedAt: { type: Date, default: Date.now },
    score: Number,
  }],

  activityLog: [{
    date: { type: Date, required: true },
    type: { type: String },
    count: { type: Number, default: 1 },
  }],

  skills: [{
    name: { type: String, required: true },
    category: String,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    coursesCompleted: { type: Number, default: 0 },
    hoursSpent: { type: Number, default: 0 },
    lastPracticed: Date,
  }],

  unlockedAchievements: [{
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
    unlockedAt: { type: Date, default: Date.now },
  }],

  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastActivityDate: Date,
  streakHistory: [{
    date: { type: Date, required: true },
    active: { type: Boolean, default: true }
  }],

  weeklyGoals: {
    skills: [String],
    targetXP: { type: Number, default: 50 },
    currentXP: { type: Number, default: 0 },
    deadline: Date,
    isCompleted: { type: Boolean, default: false }
  },

  preferences: {
    recruiterModePersistent: { type: Boolean, default: false },
    theme: { type: String, default: 'dark' }
  },
  
  // Monetization & Analytics Tracking
  lastCalculatedScore: { type: Number, default: 0 },
  validationUsage: [{
    week: { type: String }, // e.g. "2026-W16"
    count: { type: Number, default: 0 }
  }],

}, { timestamps: true });

userProgressSchema.index({ 'activityLog.date': 1 });

export default mongoose.model('UserProgress', userProgressSchema);
