import mongoose from "mongoose";

// Define the saved course subdocument schema
const savedCourseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true },
    title: { type: String, required: true },
    platform: { type: String, default: "Unknown" },
    type: { type: String, default: "Free" },
    price: { type: Number, default: 0 },
    level: { type: String, default: "All Levels" },
    language: { type: String, default: "English" },
    link: { type: String, default: "#" },
    savedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    lastAccessed: { type: Date },
  },
  { _id: false }
); // Don't create _id for subdocuments

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },

    // Social Auth fields
    authProvider: { type: String, enum: ['local', 'google', 'github', 'twitter'], default: 'local' },
    providerId: { type: String, default: null },

    // Profile fields
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },  // URL to avatar image

    // ✅ FIXED: savedCourses as array of objects (not strings)
    savedCourses: [savedCourseSchema],

    // Gamification
    gamification: {
      xp: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      streak: { type: Number, default: 0 },
      lastActivityDate: { type: Date },
      achievements: [
        {
          name: String,
          unlockedAt: Date,
        },
      ],
    },

    // Add this to your User schema
    savedAnalyses: [
      {
        role: String,
        careerReadiness: Number,
        timeToJobReady: String,
        salaryPotential: String,
        currentSkills: [String],
        skillGaps: [
          {
            skill: String,
            priority: String,
            marketDemand: String,
            reasoning: String,
            estimatedLearningTime: String,
          },
        ],
        nextSteps: [String],
        marketOutlook: String,
        analyzedAt: Date,
        savedAt: { type: Date, default: Date.now },
      },
    ],

    // Saved AI Tools (from AI Tools page)
    savedTools: [
      {
        name: { type: String, required: true },
        description: String,
        url: String,
        domain: String,
        savedAt: { type: Date, default: Date.now },
      },
    ],

    // Monetization & Growth
    subscriptionTier: { type: String, enum: ['free', 'pro'], default: 'free' },
    billing: {
      provider: { type: String, default: null },
      stripeCustomerId: { type: String, default: null },
      stripeSubscriptionId: { type: String, default: null },
      subscriptionStatus: { type: String, default: 'inactive' },
      subscriptionPlan: { type: String, default: 'free' },
      currentPeriodEnd: { type: Date, default: null },
      cancelAtPeriodEnd: { type: Boolean, default: false },
      lastPaymentAt: { type: Date, default: null },
    },
    onboardingStatus: {
      roleDefined: { type: Boolean, default: false },
      skillsDefined: { type: Boolean, default: false }
    },
    sessionCount: { type: Number, default: 0 },

    // AI Profile (Phase 2 - Placeholder)
    aiProfile: {
      detectedSkills: [String],
      skillGaps: [
        {
          skill: String,
          priority: String,
        },
      ],
      learningVelocity: { type: Number, default: 0 },
      lastAnalysis: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
