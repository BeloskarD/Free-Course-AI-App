import mongoose from 'mongoose';

const careerTimelineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetRole: {
    type: String,
    required: true
  },
  estimatedMonthsToReady: {
    type: Number,
    required: true
  },
  hiringProbability: { type: Number, default: 0 },
  scenarios: {
    optimistic: Number,
    realistic: Number,
    pessimistic: Number
  },

  milestones: [{
    title: { type: String, required: true },
    targetDate: { type: Date, required: true },
    requiredSkills: [{ type: String }],
    isCompleted: { type: Boolean, default: false }
  }],
  weeklyPlan: [{
    week: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{ type: String }]
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('CareerTimeline', careerTimelineSchema);
