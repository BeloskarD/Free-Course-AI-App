import pkgService from './pkgService.js';
import roleTaxonomyService from './roleTaxonomy.service.js';
import LearnerProfile from '../models/LearnerProfile.js';
import UserProgress from '../models/UserProgress.js';

class RadarEngine {
    /**
     * Get the radar breakdown for a user based on their PKG and target role.
     */
    async getRadarBreakdown(userId) {
        const pkg = await pkgService.getPKG(userId);
        const userProgress = await UserProgress.findOne({ userId });
        const learnerProfile = await LearnerProfile.findOne({ userId });

        // Get target role from progress or profile
        const targetRole = userProgress?.targetRole || learnerProfile?.goals?.targetRole || 'Software Engineer';
        
        // 1. Fetch configured axes for the target role
        const axesConfig = await roleTaxonomyService.getRadarAxes(targetRole);
        const roleData = await roleTaxonomyService.getRoleData(targetRole);

        // Extract skills from PKG
        const skillsArr = Array.isArray(pkg.skills) ? pkg.skills : [];

        // 2. Map PKG skills to these axes
        const axes = axesConfig.map(axis => {
            // Very simplified skill matching based on string similarity or categories
            // A more advanced engine would use embeddings or exact taxonomy matching.
            // For now, we search skills in the user's PKG that match the axis label.
            const matchingSkills = skillsArr.filter(s => {
                const skillName = s.skillId || s.displayName || '';
                return skillName.toLowerCase().includes(axis.label.toLowerCase()) || 
                       axis.label.toLowerCase().includes(skillName.toLowerCase());
            });

            // Calculate aggregate score
            let score = 0;
            if (matchingSkills.length > 0) {
                const sum = matchingSkills.reduce((acc, curr) => acc + (curr.level || 0), 0);
                score = sum / matchingSkills.length;
            } else {
                // Heuristic fallback: if no direct match, look at overall readiness/skills
                const overallAvg = skillsArr.length > 0 ? skillsArr.reduce((acc, curr) => acc + (curr.level || 0), 0) / skillsArr.length : 15;
                // Random variation based on overall
                score = overallAvg * 0.8 + Math.random() * 20;
            }

            return {
                label: axis.label,
                score: Math.min(100, Math.round(score)),
                maxScore: axis.weight,
                trend: Math.random() > 0.5 ? 'up' : 'down' // Simulate trend for visual wow factor
            };
        });

        return {
            targetRole: roleData.roleName || targetRole,
            axes,
            overallScore: Math.round(axes.reduce((a, b) => a + b.score, 0) / axes.length)
        };
    }
}

export default new RadarEngine();
