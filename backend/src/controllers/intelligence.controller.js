import achievementProofService from '../services/achievementProof.service.js';

/**
 * INTELLIGENCE CONTROLLER
 * =======================
 * Achievement Proofs & Career Intelligence API.
 */

export const getProofs = async (req, res) => {
    try {
        const userId = req.userId;
        const proofs = await achievementProofService.getProofs(userId, {
            proofType: req.query.type,
            status: req.query.status,
            limit: parseInt(req.query.limit) || 50
        });
        res.json({ success: true, data: proofs });
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
        res.json({ success: true, data: feed });
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
