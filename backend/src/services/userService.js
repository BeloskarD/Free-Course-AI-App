import { userRepository } from '../repositories/index.js';

/**
 * USER SERVICE
 * ============
 * Centralized service for User-related business logic.
 */
class UserService {
    /**
     * Create a new user
     * @param {Object} userData 
     * @returns {Promise<Object>}
     */
    async create(userData) {
        return await userRepository.create(userData);
    }

    /**
     * Get user by ID
     * @param {string} userId 
     * @returns {Promise<Object>}
     */
    async getUserById(userId) {
        return await userRepository.findById(userId);
    }

    /**
     * Get user by email
     * @param {string} email 
     * @returns {Promise<Object>}
     */
    async getUserByEmail(email) {
        return await userRepository.findByEmail(email);
    }

    /**
     * Update user profile
     * @param {string} userId 
     * @param {Object} profileData 
     * @returns {Promise<Object>}
     */
    async updateProfile(userId, profileData) {
        // Business logic for profile updates (e.g., validation)
        return await userRepository.updateProfile(userId, profileData);
    }

    /**
     * Increment user XP/Level (Gamification)
     * @param {string} userId 
     * @param {number} xpToAdd 
     * @returns {Promise<Object>}
     */
    /**
     * Change user password
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.default.compare(currentPassword, user.password);
        if (!isValidPassword) throw new Error('Current password is incorrect');

        const salt = await bcrypt.default.genSalt(10);
        const hashed = await bcrypt.default.hash(newPassword, salt);

        return await userRepository.update(userId, { password: hashed });
    }

    /**
     * Favorites (Saved Courses)
     */
    async getFavorites(userId) {
        const user = await userRepository.findById(userId);
        return user?.savedCourses || [];
    }

    async addFavorite(userId, courseData) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const courseId = courseData.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .substring(0, 100);

        const savedCourses = [...(user.savedCourses || [])];
        if (savedCourses.some(c => c.courseId === courseId)) return savedCourses;

        const newCourse = {
            ...courseData,
            courseId,
            savedAt: new Date(),
            progress: 0
        };

        savedCourses.push(newCourse);
        
        // Add XP
        const xp = (user.gamification?.xp || 0) + 10;
        
        return await userRepository.update(userId, { 
            savedCourses,
            'gamification.xp': xp,
            'gamification.lastActivityDate': new Date()
        });
    }

    async removeFavorite(userId, courseId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const savedCourses = (user.savedCourses || []).filter(c => c.courseId !== courseId);
        return await userRepository.update(userId, { savedCourses });
    }

    /**
     * Saved Analyses
     */
    async saveAnalysis(userId, analysisData) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const savedAnalyses = [...(user.savedAnalyses || [])];
        const existingIndex = savedAnalyses.findIndex(
            a => a.role.toLowerCase() === analysisData.role.toLowerCase()
        );

        const newAnalysis = {
            ...analysisData,
            savedAt: new Date()
        };

        if (existingIndex !== -1) {
            savedAnalyses[existingIndex] = newAnalysis;
        } else {
            savedAnalyses.push(newAnalysis);
        }

        // Limit to 10
        const finalAnalyses = savedAnalyses.slice(-10);

        return await userRepository.update(userId, { savedAnalyses: finalAnalyses });
    }

    async getSavedAnalyses(userId) {
        const user = await userRepository.findById(userId);
        return user?.savedAnalyses || [];
    }

    async deleteAnalysis(userId, role) {
        const user = await userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const savedAnalyses = (user.savedAnalyses || []).filter(
            a => a.role.toLowerCase() !== role.toLowerCase()
        );

        return await userRepository.update(userId, { savedAnalyses });
    }
}

export default new UserService();
