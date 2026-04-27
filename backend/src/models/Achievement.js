import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['milestone', 'streak', 'speed', 'completion', 'collection', 'excellence', 'mastery', 'innovation', 'dedication', 'growth', 'consistency', 'endurance'],
    default: 'milestone',
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  criteria: {
    type: { type: String },
    value: { type: Number },
    skillName: { type: String },
  },
  reward: String,
  icon: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Achievement', achievementSchema);
