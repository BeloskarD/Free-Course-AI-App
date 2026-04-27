import interviewPrepService from '../services/interviewPrep.service.js';

export const getPrepKit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { signalId } = req.body;

        if (!signalId) return res.status(400).json({ error: 'signalId is required' });

        console.log(`🔍 [InterviewPrep] Generating kit for user ${userId} / signal ${signalId}...`);
        const kit = await interviewPrepService.generatePrepKit(userId, signalId);
        
        res.json({ success: true, data: kit });
    } catch (error) {
        console.error('[InterviewPrep] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
