import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET all saved tools for user
router.get('/favorites', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('savedTools');
        res.json({ success: true, tools: user?.savedTools || [] });
    } catch (error) {
        console.error('❌ Get tools error:', error);
        res.status(500).json({ error: 'Failed to fetch saved tools' });
    }
});

// POST add a tool to favorites
router.post('/favorites', authenticate, async (req, res) => {
    try {
        const { name, description, url, domain } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Tool name is required' });
        }

        const user = await User.findById(req.userId);

        // Check if already saved
        const exists = user.savedTools.some(t => t.name === name);
        if (exists) {
            return res.status(400).json({ error: 'Tool already saved' });
        }

        user.savedTools.push({ name, description, url, domain, savedAt: new Date() });
        await user.save();

        res.json({ success: true, message: 'Tool saved!', tools: user.savedTools });
    } catch (error) {
        console.error('❌ Save tool error:', error);
        res.status(500).json({ error: 'Failed to save tool' });
    }
});

// DELETE remove a tool from favorites
router.delete('/favorites/:toolName', authenticate, async (req, res) => {
    try {
        const { toolName } = req.params;
        const user = await User.findById(req.userId);

        user.savedTools = user.savedTools.filter(t => t.name !== toolName);
        await user.save();

        res.json({ success: true, message: 'Tool removed', tools: user.savedTools });
    } catch (error) {
        console.error('❌ Remove tool error:', error);
        res.status(500).json({ error: 'Failed to remove tool' });
    }
});

export default router;
