import mongoose from 'mongoose';

const OAuthCodeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    token: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 300 // TTL Index: Auto-delete after 5 minutes (300 seconds)
    }
});

const OAuthCode = mongoose.model('OAuthCode', OAuthCodeSchema);

export default OAuthCode;
