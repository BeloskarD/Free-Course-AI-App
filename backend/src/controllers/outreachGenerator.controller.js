import outreachGeneratorService from '../services/outreachGenerator.service.js';

/**
 * OUTREACH GENERATOR CONTROLLER
 * ===============================
 * Handles outreach message generation API requests.
 * Gates behind mastery threshold + micro-project completion.
 */

/**
 * POST /api/outreach-generator/generate
 * Generate outreach messages for a target connection.
 */
export async function generateOutreach(req, res) {
    try {
        const userId = req.userId;
        const {
            connectionName,
            connectionRole,
            connectionCompany,
            cluster,
            roleTarget,
            microProject
        } = req.body;

        if (!connectionName) {
            return res.status(400).json({
                success: false,
                error: 'connectionName is required.'
            });
        }

        const result = await outreachGeneratorService.generateOutreach(userId, {
            connectionName,
            connectionRole: connectionRole || '',
            connectionCompany: connectionCompany || '',
            cluster: cluster || '',
            roleTarget: roleTarget || '',
            microProject: microProject || ''
        });

        if (!result.success && result.gated) {
            return res.status(403).json({
                success: false,
                gated: true,
                reason: result.reason,
                context: result.context
            });
        }

        res.json({
            success: true,
            data: {
                messages: result.messages,
                strategy: result.strategy,
                provider: result.provider,
                context: result.context
            }
        });
    } catch (error) {
        console.error('[OutreachGenerator] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/outreach-generator/status
 * Check if outreach generation is available for the user.
 */
export async function getOutreachStatus(req, res) {
    try {
        const userId = req.userId;
        const gateStatus = await outreachGeneratorService.getGateStatus(userId);

        res.json({
            success: true,
            data: {
                allowed: gateStatus.allowed,
                reason: gateStatus.reason || null,
                context: gateStatus.context || null,
                masteryThreshold: outreachGeneratorService.MASTERY_THRESHOLD * 100
            }
        });
    } catch (error) {
        console.error('[OutreachGenerator] Status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
