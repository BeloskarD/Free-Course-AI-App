import reinforcementService from '../services/reinforcement.service.js';

/**
 * REINFORCEMENT ENGINE CONTROLLER
 */

export const getStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const status = await reinforcementService.getStatus(userId);
        res.json({ success: true, data: status });
    } catch (error) {
        console.error('[Reinforcement] getStatus error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInterventions = async (req, res) => {
    try {
        const userId = req.userId;
        const interventions = await reinforcementService.getActiveInterventions(userId);
        res.json({ success: true, data: interventions });
    } catch (error) {
        console.error('[Reinforcement] interventions error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const acknowledgeIntervention = async (req, res) => {
    try {
        // For now just acknowledge - future: track acknowledgements
        res.json({ success: true, message: 'Intervention acknowledged' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAnalytics = async (req, res) => {
    try {
        const userId = req.userId;
        const analytics = await reinforcementService.getAnalytics(userId);
        res.json({ success: true, data: analytics });
    } catch (error) {
        console.error('[Reinforcement] analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { getStatus, getInterventions, acknowledgeIntervention, getAnalytics };
