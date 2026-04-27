import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';
dotenv.config();

const cleanupNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users
        const userIds = await Notification.distinct('userId');
        
        for (const userId of userIds) {
            // Find all notifications for this user, grouped by type
            const notifications = await Notification.find({ userId }).sort({ sentAt: -1 });
            
            const seenTypes = new Set();
            const toDelete = [];
            
            for (const note of notifications) {
                if (seenTypes.has(note.type)) {
                    toDelete.push(note._id);
                } else {
                    seenTypes.add(note.type);
                }
            }
            
            if (toDelete.length > 0) {
                await Notification.deleteMany({ _id: { $in: toDelete } });
                console.log(`Deleted ${toDelete.length} duplicate unread notifications for user ${userId}`);
            }
        }
        
        console.log('Cleanup complete');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanupNotifications();
