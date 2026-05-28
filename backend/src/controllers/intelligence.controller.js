import achievementProofService from '../services/achievementProof.service.js';
import { shapeGatedResponse, getCuriosityHint } from '../utils/response.js';

/**
 * INTELLIGENCE CONTROLLER
 * =======================
 * CORRECTION 2: Progressive reveal for intelligence feed.
 * Free: hiring signal counts, partial matches, basic awareness
 * Pro: full insights
 * Career+: strategic recommendations + predictive insights
 */

export const getProofs = async (req, res) => {
    try {
        const userId = req.userId;
        const proofs = await achievementProofService.getProofs(userId, {
            proofType: req.query.type,
            status: req.query.status,
            limit: parseInt(req.query.limit) || 50
        });

        // If no entitlements or paid tier, return full data
        if (!req.entitlements || req.entitlements.tier === 'pro' || req.entitlements.tier === 'career_plus') {
            return res.json({ success: true, data: proofs, tier: req.entitlements?.tier || 'free' });
        }

        // Free: show partial proofs with locked strategic details
        const shaped = shapeGatedResponse(proofs, req.entitlements, {
            partialCount: 3,
            keysToLock: [
                'recruiterReasoning', 'strategicRecommendations',
                'companyPrioritization', 'predictiveInsights',
                'competitiveAnalysis', 'industryBenchmark'
            ],
            featureArea: 'intelligence',
            upgradeHint: 'See what recruiters notice first with Pro.',
            lockedMessage: getCuriosityHint('intelligence')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[Intelligence] getProofs error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const publishProof = async (req, res) => {
    try {
        const { id } = req.params;
        const proof = await achievementProofService.publishProof(id);
        if (!proof) return res.status(404).json({ success: false, error: 'Proof not found' });
        res.json({ success: true, data: proof });
    } catch (error) {
        console.error('[Intelligence] publishProof error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getRecruiterFeed = async (req, res) => {
    try {
        const feed = await achievementProofService.getRecruiterFeed({
            limit: parseInt(req.query.limit) || 25
        });

        // If no entitlements or paid tier, return full data
        if (!req.entitlements || req.entitlements.tier === 'pro' || req.entitlements.tier === 'career_plus') {
            return res.json({ success: true, data: feed, tier: req.entitlements?.tier || 'free' });
        }

        // Free: show signal counts and partial matches, lock recruiter reasoning
        const shaped = shapeGatedResponse(feed, req.entitlements, {
            partialCount: 3,
            keysToLock: [
                'recruiterReasoning', 'strategicRecommendations',
                'companyPrioritization', 'predictiveInsights',
                'detailedAnalysis', 'hiringProbability'
            ],
            featureArea: 'intelligence',
            upgradeHint: 'Unlock the full recruiter intelligence feed.',
            lockedMessage: getCuriosityHint('intelligence')
        });

        res.json(shaped);
    } catch (error) {
        console.error('[Intelligence] recruiterFeed error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const shareProof = async (req, res) => {
    try {
        const { id } = req.params;
        const shareUrl = await achievementProofService.generateShareLink(id);
        if (!shareUrl) return res.status(404).json({ success: false, error: 'Proof not found' });
        res.json({ success: true, data: { shareUrl } });
    } catch (error) {
        console.error('[Intelligence] shareProof error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVisible } = req.body;
        const proof = await achievementProofService.toggleVisibility(id, isVisible);
        if (!proof) return res.status(404).json({ success: false, error: 'Proof not found' });
        res.json({ success: true, data: proof });
    } catch (error) {
        console.error('[Intelligence] toggleVisibility error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { getProofs, publishProof, getRecruiterFeed, shareProof, toggleVisibility };
