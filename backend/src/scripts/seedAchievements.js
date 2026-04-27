import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: join(__dirname, '../../.env') });

// Define Achievement schema inline (since we're using ES modules)
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

const Achievement = mongoose.model('Achievement', achievementSchema);

const achievements = [
  {
    title: 'First Steps',
    description: 'Complete your first course',
    type: 'milestone',
    rarity: 'common',
    criteria: { type: 'courses_completed', value: 1 },
    reward: '+10 XP',
  },
  {
    title: '7-Day Streak',
    description: 'Learn for 7 consecutive days',
    type: 'streak',
    rarity: 'rare',
    criteria: { type: 'streak_days', value: 7 },
    reward: '+50 XP',
  },
  {
    title: 'Speed Learner',
    description: 'Complete 5 courses in one week',
    type: 'speed',
    rarity: 'epic',
    criteria: { type: 'courses_completed', value: 5 },
    reward: '+100 XP',
  },
  {
    title: 'JavaScript Master',
    description: 'Reach 90% mastery in JavaScript',
    type: 'mastery',
    rarity: 'legendary',
    criteria: { type: 'skill_mastery', value: 90, skillName: 'JavaScript' },
    reward: '+200 XP + Badge',
  },
  {
    title: 'Bookworm',
    description: 'Complete 10 courses',
    type: 'collection',
    rarity: 'rare',
    criteria: { type: 'courses_completed', value: 10 },
    reward: '+75 XP',
  },
  {
    title: 'Dedication',
    description: 'Complete 30 courses',
    type: 'dedication',
    rarity: 'epic',
    criteria: { type: 'courses_completed', value: 30 },
    reward: '+150 XP',
  },
  {
    title: '30-Day Streak',
    description: 'Learn for 30 consecutive days',
    type: 'consistency',
    rarity: 'epic',
    criteria: { type: 'streak_days', value: 30 },
    reward: '+150 XP',
  },
  {
    title: 'Century Club',
    description: 'Complete 100 courses',
    type: 'endurance',
    rarity: 'legendary',
    criteria: { type: 'courses_completed', value: 100 },
    reward: '+500 XP + Special Badge',
  },
];

async function seedAchievements() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', process.env.MONGO_URI ? '✅ Found' : '❌ Not found');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing achievements...');
    const deleted = await Achievement.deleteMany({});
    console.log(`✅ Cleared ${deleted.deletedCount} existing achievements`);

    console.log('✨ Inserting new achievements...');
    const result = await Achievement.insertMany(achievements);
    console.log(`✅ Seeded ${result.length} achievements successfully!`);

    console.log('\n📋 Achievements created:');
    achievements.forEach((a, i) => {
      const emoji = {
        common: '⚪',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟡'
      }[a.rarity];
      console.log(`  ${emoji} ${i + 1}. ${a.title} (${a.rarity})`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding achievements:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedAchievements();
