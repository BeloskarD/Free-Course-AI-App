import { roleTaxonomyRepository } from '../repositories/index.js';
import logger from '../utils/logger.js';

/**
 * ROLE TAXONOMY SERVICE
 * =====================
 * Handles mapping of roles to skill categories and radar axes.
 */

const SEED_ROLES = [
    {
        roleId: 'softwareengineer',
        roleName: 'Software Engineer',
        category: 'engineering',
        skillMap: [
            { skill: 'Data Structures & Algorithms', weight: 100, category: 'Core' },
            { skill: 'System Design', weight: 80, category: 'Architecture' },
            { skill: 'Clean Code', weight: 90, category: 'Engineering' }
        ],
        radarAxes: [
            { label: 'Frontend', weight: 100 },
            { label: 'Backend', weight: 100 },
            { label: 'System Design', weight: 100 },
            { label: 'Problem Solving', weight: 100 },
            { label: 'DevOps', weight: 80 },
            { label: 'Soft Skills', weight: 100 }
        ],
        description: 'Generalist software engineering role focusing on end-to-end development.'
    },
    {
        roleId: 'frontendengineer',
        roleName: 'Frontend Engineer',
        category: 'engineering',
        skillMap: [
            { skill: 'React', weight: 100, category: 'Frameworks' },
            { skill: 'JavaScript', weight: 100, category: 'Languages' },
            { skill: 'CSS/UI', weight: 90, category: 'Design' }
        ],
        radarAxes: [
            { label: 'UI/UX Implementation', weight: 100 },
            { label: 'JavaScript/TypeScript', weight: 100 },
            { label: 'State Management', weight: 100 },
            { label: 'Performance', weight: 100 },
            { label: 'Testing', weight: 80 },
            { label: 'Web Accessibility', weight: 80 }
        ]
    },
    {
        roleId: 'backendengineer',
        roleName: 'Backend Engineer',
        category: 'engineering',
        skillMap: [
            { skill: 'Node.js', weight: 100, category: 'Languages' },
            { skill: 'Databases', weight: 100, category: 'Core' },
            { skill: 'API Design', weight: 90, category: 'Architecture' }
        ],
        radarAxes: [
            { label: 'API Architecture', weight: 100 },
            { label: 'Database Design', weight: 100 },
            { label: 'System Design', weight: 100 },
            { label: 'Security', weight: 90 },
            { label: 'Cloud/Infrastructure', weight: 80 },
            { label: 'Performance Tuning', weight: 90 }
        ]
    },
    {
        roleId: 'devopsengineer',
        roleName: 'DevOps Engineer',
        category: 'engineering',
        radarAxes: [
            { label: 'Infrastructure as Code', weight: 100 },
            { label: 'CI/CD Pipelines', weight: 100 },
            { label: 'Containerization', weight: 100 },
            { label: 'Monitoring & Logging', weight: 100 },
            { label: 'Cloud Platforms', weight: 100 },
            { label: 'Security & Compliance', weight: 90 }
        ]
    },
    {
        roleId: 'datascience',
        roleName: 'Data Scientist',
        category: 'data',
        radarAxes: [
            { label: 'Machine Learning', weight: 100 },
            { label: 'Statistical Analysis', weight: 100 },
            { label: 'Data Visualization', weight: 100 },
            { label: 'Data Wrangling', weight: 100 },
            { label: 'Programming (Python/R)', weight: 100 },
            { label: 'Domain Knowledge', weight: 80 }
        ]
    },
    {
        roleId: 'aimlengineer',
        roleName: 'AI/ML Engineer',
        category: 'engineering',
        radarAxes: [
            { label: 'Deep Learning', weight: 100 },
            { label: 'MLOps', weight: 100 },
            { label: 'Data Engineering', weight: 90 },
            { label: 'Model Deployment', weight: 100 },
            { label: 'Programming', weight: 100 },
            { label: 'Cloud Platforms', weight: 90 }
        ]
    }
];

const FALLBACK_AXES = [
    { label: 'Technical Depth', weight: 100 },
    { label: 'System Architecture', weight: 100 },
    { label: 'Problem Solving', weight: 100 },
    { label: 'Execution/Shipping', weight: 100 },
    { label: 'Communication', weight: 100 },
    { label: 'Tooling/Infra', weight: 100 }
];

class RoleTaxonomyService {
    async seedRoles() {
        try {
            const count = await roleTaxonomyRepository.findAll();
            if (count && count.length > 0) return; // Already seeded

            for (const roleData of SEED_ROLES) {
                // Check if exists
                const existing = await roleTaxonomyRepository.findByRoleId(roleData.roleId);
                if (!existing) {
                    await roleTaxonomyRepository.create(roleData);
                }
            }
            logger.info('[RoleTaxonomy] Seeded initial roles');
        } catch (error) {
            logger.error({ error: error.message }, '[RoleTaxonomy] Failed to seed roles');
        }
    }

    async getRoleData(targetRole) {
        if (!targetRole) return { radarAxes: FALLBACK_AXES };
        
        let roleData = await roleTaxonomyRepository.findByRoleId(targetRole);
        if (!roleData) {
            // Dynamic fallback: If user enters a custom role, we provide the fallback axes
            // but we could also dynamically generate axes using AI here in the future
            return { radarAxes: FALLBACK_AXES, roleName: targetRole };
        }
        return roleData;
    }

    async getRadarAxes(targetRole) {
        const roleData = await this.getRoleData(targetRole);
        return roleData.radarAxes || FALLBACK_AXES;
    }

    async getAllRoles() {
        return await roleTaxonomyRepository.findAll();
    }
}

export default new RoleTaxonomyService();
