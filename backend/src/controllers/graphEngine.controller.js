import graphEngineService from '../services/graphEngine.service.js';
import { shapeGatedResponse, getCuriosityHint } from '../utils/response.js';

/**
 * GRAPH ENGINE CONTROLLER
 * =======================
 * Free: basic graph structure, top skills visible, mastery/entropy locked
 * Pro: full graph with all metrics
 * Career+: full graph + evolution timeline
 */

export const getFullGraph = async (req, res) => {
    try {
        const userId = req.userId;
        const graph = await graphEngineService.getFullGraph(userId);

        if (!req.entitlements || req.entitlements.tier === 'pro' || req.entitlements.tier === 'career_plus') {
            return res.json({ success: true, data: graph, tier: req.entitlements?.tier || 'free' });
        }

        const shaped = shapeGatedResponse(graph, req.entitlements, {
            partialCount: 5,
            keysToLock: ['entropyRate', 'masteryScore', 'decayPrediction', 'reinforcementHistory', 'strategicPriority'],
            featureArea: 'graphEngine',
            upgradeHint: 'Unlock full mastery scores and skill decay predictions with Pro.',
            lockedMessage: getCuriosityHint('graphEngine')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[GraphEngine] getFullGraph error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getClusters = async (req, res) => {
    try {
        const userId = req.userId;
        const clusters = await graphEngineService.getClusters(userId);

        if (!req.entitlements || req.entitlements.tier === 'pro' || req.entitlements.tier === 'career_plus') {
            return res.json({ success: true, data: clusters, tier: req.entitlements?.tier || 'free' });
        }

        const shaped = shapeGatedResponse(clusters, req.entitlements, {
            partialCount: 3,
            keysToLock: ['strategicPriority', 'marketDemand', 'competitiveEdge'],
            featureArea: 'graphEngine',
            upgradeHint: 'See which skill clusters give you a competitive edge.',
            lockedMessage: getCuriosityHint('graphEngine')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[GraphEngine] getClusters error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSkillNode = async (req, res) => {
    try {
        const userId = req.userId;
        const { skillName } = req.params;
        const node = await graphEngineService.getSkillNode(userId, skillName);
        if (!node) return res.status(404).json({ success: false, error: 'Skill not found' });
        res.json({ success: true, data: node });
    } catch (error) {
        console.error('[GraphEngine] getSkillNode error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getEvolution = async (req, res) => {
    try {
        const userId = req.userId;
        const timeline = await graphEngineService.getEvolution(userId);

        if (!req.entitlements || req.entitlements.tier === 'pro' || req.entitlements.tier === 'career_plus') {
            return res.json({ success: true, data: timeline, tier: req.entitlements?.tier || 'free' });
        }

        const shaped = shapeGatedResponse(timeline, req.entitlements, {
            partialCount: 2,
            keysToLock: ['prediction', 'trajectory', 'futureState', 'recommendations'],
            featureArea: 'graphEngine',
            upgradeHint: 'Unlock your full skill evolution timeline and predictions.',
            lockedMessage: getCuriosityHint('graphEngine')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[GraphEngine] getEvolution error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const recalculateGraph = async (req, res) => {
    try {
        const userId = req.userId;
        const graph = await graphEngineService.recalculateGraph(userId);
        res.json({ success: true, data: graph, message: 'Graph recalculated successfully' });
    } catch (error) {
        console.error('[GraphEngine] recalculate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { getFullGraph, getClusters, getSkillNode, getEvolution, recalculateGraph };
