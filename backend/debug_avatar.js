import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function debugUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const user = await User.findOne({ email: /beloskar/i });
    if (user) {
      console.log('User found:');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Avatar:', JSON.stringify(user.avatar));
      console.log('Auth Provider:', user.authProvider);
      console.log('Provider ID:', user.providerId);
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

debugUser();
