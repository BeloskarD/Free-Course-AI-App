import userService from '../services/userService.js';

/**
 * USER CONTROLLER
 * ===============
 */

export const getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            success: true,
            profile: {
                id: user.id,
                email: user.email,
                name: user.name || '',
                avatar: user.avatar || '',
                createdAt: user.createdAt,
                onboardingStatus: user.onboardingStatus || { roleDefined: false, skillsDefined: false },
                subscriptionTier: user.subscriptionTier || 'free',
                billing: {
                    provider: user.billing?.provider || null,
                    subscriptionStatus: user.billing?.subscriptionStatus || 'inactive',
                    subscriptionPlan: user.billing?.subscriptionPlan || user.subscriptionTier || 'free',
                    currentPeriodEnd: user.billing?.currentPeriodEnd || null,
                    cancelAtPeriodEnd: Boolean(user.billing?.cancelAtPeriodEnd),
                },
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const profileData = {};
        if (name !== undefined) profileData.name = name;
        if (avatar !== undefined) profileData.avatar = avatar;

        const user = await userService.updateProfile(req.userId, profileData);
        res.json({
            success: true,
            message: "Profile updated successfully",
            profile: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        await userService.changePassword(req.userId, currentPassword, newPassword);
        res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        res.status(error.message === 'Current password is incorrect' ? 401 : 500).json({ error: error.message });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const favorites = await userService.getFavorites(req.userId);
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const result = await userService.addFavorite(req.userId, req.body);
        res.json({ success: true, message: "Course saved!", savedCourses: result.savedCourses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const result = await userService.removeFavorite(req.userId, req.params.courseId);
        res.json({ success: true, message: "Course removed", savedCourses: result.savedCourses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveAnalysis = async (req, res) => {
    try {
        const result = await userService.saveAnalysis(req.userId, req.body);
        res.json({ success: true, message: "Skill analysis saved successfully", totalAnalyses: result.savedAnalyses.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSavedAnalyses = async (req, res) => {
    try {
        const analyses = await userService.getSavedAnalyses(req.userId);
        res.json({ success: true, analyses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAnalysis = async (req, res) => {
    try {
        const result = await userService.deleteAnalysis(req.userId, req.params.role);
        res.json({ success: true, message: "Analysis removed successfully", totalAnalyses: result.savedAnalyses.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const updatePreferences = async (req, res) => {
    try {
        const { UserProgress } = await import('../models/UserProgress.js');
        const update = { ...req.body };
        
        // Ensure we only update valid preference fields
        const progress = await UserProgress.findOneAndUpdate(
            { userId: req.userId },
            { $set: { "preferences": update } },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            preferences: progress.preferences
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
