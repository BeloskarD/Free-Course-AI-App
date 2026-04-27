import queueService from '../services/queueService.js';
import { processResumeGeneration } from '../controllers/aiResume.controller.js';
import { processSkillGapAnalysis } from '../controllers/skillAnalysis.controller.js';
import { processAIIntelligenceSearch } from '../controllers/ai.controller.js';

export const initializeWorkers = () => {
    console.log('⚙️ [Workers] Initializing Background Job Processors...');
    
    // Feature 1: AI Resume Generation
    queueService.registerProcessor('generate_resume', processResumeGeneration);

    // Feature 2: Skill Gap Analysis
    queueService.registerProcessor('analyze_skill_gap', processSkillGapAnalysis);

    // Feature 3: AI Intelligence Search
    queueService.registerProcessor('ai_intelligence_search', processAIIntelligenceSearch);

    // Other heavy AI functions will be registered here...
};
