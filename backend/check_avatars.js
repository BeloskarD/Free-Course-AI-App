import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './src/models/User.js';

async function checkAvatars() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const usersWithAvatarText = await User.find({ avatar: 'Avatar' });
    console.log(`Found ${usersWithAvatarText.length} users with avatar literally set to "Avatar"`);
    
    usersWithAvatarText.forEach(u => {
      console.log(`- ID: ${u._id}, Email: ${u.email}`);
    });

    const totalUsers = await User.countDocuments();
    console.log(`Total users in DB: ${totalUsers}`);

    const usersWithLinks = await User.find({ avatar: { $regex: /^http/ } });
    console.log(`Users with valid-looking URLs: ${usersWithLinks.length}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAvatars();
