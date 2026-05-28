import express from 'express';
import { authenticate } from '../middleware/auth.js';
import graphEngineService from '../services/graphEngine.service.js';
import reinforcementService from '../services/reinforcement.service.js';
import opportunityRadarService from '../services/opportunityRadar.service.js';
import achievementProofService from '../services/achievementProof.service.js';
import { getCareerTimeline } from '../controllers/pathway.controller.js';
import { subscriptionGuard } from '../middleware/subscriptionGuard.js';

/**
 * PATHWAY ORCHESTRATOR ROUTES
 * ============================
 * Aggregated view from all engines for Career Acceleration Overview.
 */

const router = express.Router();
router.use(authenticate);

// GET /api/pathway-orchestrator/career-overview
// The BigPicture endpoint: aggregates data from all engines
router.get('/career-overview', subscriptionGuard('pathway'), async (req, res) => {
    try {
        const userId = req.userId;

        const [graph, reinforcement, radar, proofs] = await Promise.all([
            graphEngineService.getFullGraph(userId),
            reinforcementService.getStatus(userId),
            opportunityRadarService.getRadar(userId, 5),
            achievementProofService.getProofs(userId, { limit: 10 })
        ]);

        const tier = req.entitlements?.tier || 'free';
        const isFree = tier === 'free';

        const overviewData = {
            graph: {
                totalSkills: graph.meta.totalNodes,
                totalEdges: graph.meta.totalEdges,
                dominantCluster: graph.meta.dominantCluster,
                clusters: graph.clusters,
                topSkills: graph.nodes
                    .sort((a, b) => b.masteryScore - a.masteryScore)
                    .slice(0, 5)
                    .map(n => ({ name: n.label, mastery: n.masteryScore, entropy: n.entropyRate }))
            },
            reinforcement,
            opportunities: isFree ? radar.slice(0, 3) : radar.slice(0, 5),
            recentProofs: proofs.slice(0, 5),
            lastUpdated: new Date(),
            locked: isFree,
            tier
        };

        res.json({
            success: true,
            ...overviewData
        });
    } catch (error) {
        console.error('[Pathway] career-overview error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/pathway-orchestrator/recalibrate
router.post('/recalibrate', async (req, res) => {
    try {
        const userId = req.userId;
        const graph = await graphEngineService.recalculateGraph(userId);
        const reinforcement = await reinforcementService.getStatus(userId);
        res.json({
            success: true,
            data: { graph: graph.meta, reinforcement },
            message: 'All engines recalibrated'
        });
    } catch (error) {
        console.error('[Pathway] recalibrate error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/career-timeline', subscriptionGuard('careerTimeline'), getCareerTimeline);

export default router;
