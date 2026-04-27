import graphEngineService from '../services/graphEngine.service.js';

/**
 * GRAPH ENGINE CONTROLLER
 * =======================
 * API endpoints for the Dynamic Cognitive Graph.
 */

export const getFullGraph = async (req, res) => {
    try {
        const userId = req.userId;
        const graph = await graphEngineService.getFullGraph(userId);
        res.json({ success: true, data: graph });
    } catch (error) {
        console.error('[GraphEngine] getFullGraph error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getClusters = async (req, res) => {
    try {
        const userId = req.userId;
        const clusters = await graphEngineService.getClusters(userId);
        res.json({ success: true, data: clusters });
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
        res.json({ success: true, data: timeline });
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
