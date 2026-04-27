import queueService from '../services/queueService.js';
import { normalizeAIResponse } from '../utils/aiUtils.js';

export const getJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const jobStatus = await queueService.getJobStatus(id, {
            requesterUserId: req.userId,
            accessKey: req.headers['x-job-access-key'],
        });
        
        if (!jobStatus) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }

        if (jobStatus.forbidden) {
            return res.status(403).json({ success: false, error: 'You do not have access to this job' });
        }

        // --- DEEP NORMALIZATION LAYER ---
        // Ensure result data is normalized before sending to frontend
        if (jobStatus.status === 'completed' && jobStatus.result) {
            const mode = jobStatus.data?.mode || req.query.mode || 'courses';
            
            // The result shape is: { success, query, data: { courses: [...], ... } }
            // We need to normalize result.data (the inner payload)
            if (jobStatus.result.data && typeof jobStatus.result.data === 'object') {
                jobStatus.result.data = normalizeAIResponse(jobStatus.result.data, mode);
            } else {
                // Fallback: normalize result itself if it's a flat structure
                jobStatus.result = normalizeAIResponse(jobStatus.result, mode);
            }
        }

        res.json({ success: true, data: jobStatus });
    } catch (error) {
        console.error('[JobController] Error fetching job status:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve job status' });
    }
};

export default { getJobStatus };
