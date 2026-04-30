// REPOSITORY EXPORTS
// ==================
// This index file serves as the single entry point for all repositories.
// Currently exporting Mongoose implementations.

import userRepository from './mongoose/UserRepository.js';
import pkgRepository from './mongoose/PkgRepository.js';
import missionRepository from './mongoose/MissionRepository.js';
import userProgressRepository from './mongoose/UserProgressRepository.js';
import achievementRepository from './mongoose/AchievementRepository.js';
import learnerProfileRepository from './mongoose/LearnerProfileRepository.js';
import roleTaxonomyRepository from './mongoose/RoleTaxonomyRepository.js';

export {
    userRepository,
    pkgRepository,
    missionRepository,
    userProgressRepository,
    achievementRepository,
    learnerProfileRepository,
    roleTaxonomyRepository
};

export default {
    userRepository,
    pkgRepository,
    missionRepository,
    userProgressRepository,
    achievementRepository,
    learnerProfileRepository,
    roleTaxonomyRepository
};
