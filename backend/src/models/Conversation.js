import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['chat', 'tutor', 'quiz', 'eli5'],
        default: 'chat'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for guest users
    },
    sessionId: {
        type: String,
        required: true // For tracking guest sessions
    },
    messages: {
        type: [messageSchema],
        default: [],
        validate: [arrayLimit, 'Messages exceed the limit of 20']
    },
    currentMode: {
        type: String,
        enum: ['chat', 'tutor', 'quiz', 'eli5'],
        default: 'chat'
    },
    context: {
        currentPage: String,
        favorites: [String],
        recentSearches: [String]
    },
    guestMessageCount: {
        type: Number,
        default: 0
    },
    lastMessageDate: {
        type: Date,
        default: Date.now
    },
    // Gamification & Stats
    badges: [{
        id: String,
        name: String,
        icon: String,
        description: String,
        earnedAt: { type: Date, default: Date.now }
    }],
    stats: {
        totalMessages: { type: Number, default: 0 },
        quizCorrectAnswers: { type: Number, default: 0 },
        actionsTaken: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Limit messages to 20
function arrayLimit(val) {
    return val.length <= 20;
}

// Auto-prune oldest messages when adding new ones
conversationSchema.methods.addMessage = function (message) {
    if (this.messages.length >= 20) {
        this.messages.shift(); // Remove oldest message
    }
    this.messages.push(message);
    this.lastMessageDate = new Date();
    return this.save();
};

// Reset guest message count daily
conversationSchema.methods.checkGuestLimit = function () {
    const today = new Date().toDateString();
    const lastMsgDate = new Date(this.lastMessageDate).toDateString();

    if (today !== lastMsgDate) {
        this.guestMessageCount = 0;
    }

    return this.guestMessageCount < 5;
};

// TTL Index: Auto-delete conversations after 7 days of inactivity
conversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

// Index for faster queries
conversationSchema.index({ userId: 1, sessionId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
