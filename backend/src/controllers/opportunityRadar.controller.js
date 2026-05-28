import opportunityRadarService from '../services/opportunityRadar.service.js';
import aiOpportunityScannerService from '../services/aiOpportunityScanner.service.js';
import { shapeGatedResponse } from '../utils/response.js';

/**
 * OPPORTUNITY RADAR CONTROLLER
 * (Now AI-powered with automatic signal generation)
 */

export const ingestSignals = async (req, res) => {
    try {
        const signals = req.body.signals || [];
        if (!Array.isArray(signals) || signals.length === 0) {
            return res.status(400).json({ success: false, error: 'signals array is required' });
        }
        const result = await opportunityRadarService.ingestSignals(signals);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[OpportunityRadar] ingest error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getRadar = async (req, res) => {
    try {
        const userId = req.userId;
        const limit = parseInt(req.query.limit) || 10;
        const entitlements = req.entitlements;

        // AUTO-SCAN: If no recent signals, trigger AI scanner automatically
        try {
            const autoResult = await aiOpportunityScannerService.autoScanIfNeeded(userId);
            if (autoResult.status === 'success') {
                console.log(`[OpportunityRadar] 🤖 Auto-scan generated ${autoResult.signalsGenerated} signals`);
            }
        } catch (scanErr) {
            console.warn('[OpportunityRadar] Auto-scan failed (non-blocking):', scanErr.message);
        }

        const matches = await opportunityRadarService.getRadar(userId, limit);
        
        // Standardized Gating:
        // - Free users see limited matches (3)
        // - Nested insights (gapAnalysis, aiReasoning) are recursively masked
        const gatedResult = shapeGatedResponse(matches, entitlements, {
            lockedMessage: "Upgrade to Pro to unlock precise skill gap analysis and the full opportunity list.",
            upgradeHint: "Pro users see 3x more opportunities and get custom advice for each role.",
            keysToLock: ['gapAnalysis', 'aiReasoning'],
            maskValue: "Upgrade to Pro to unlock AI-driven match reasoning."
        });

        res.json(gatedResult);
    } catch (error) {
        console.error('[OpportunityRadar] getRadar error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateMatchStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const { signalId } = req.params;
        const { status } = req.body;
        if (!status) return res.status(400).json({ success: false, error: 'status is required' });
        const match = await opportunityRadarService.updateMatchStatus(userId, signalId, status);
        res.json({ success: true, data: match });
    } catch (error) {
        console.error('[OpportunityRadar] updateStatus error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTrends = async (req, res) => {
    try {
        const userId = req.userId;
        const trends = await opportunityRadarService.getTrends(userId);
        res.json({ success: true, data: trends });
    } catch (error) {
        console.error('[OpportunityRadar] getTrends error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSavedMatches = async (req, res) => {
    try {
        const userId = req.userId;
        const saved = await opportunityRadarService.getSavedOpportunities(userId);
        res.json({ success: true, data: saved });
    } catch (error) {
        console.error('[OpportunityRadar] getSavedMatches error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// NEW: Manual AI Scan trigger
export const aiScan = async (req, res) => {
    try {
        const userId = req.userId;
        const result = await aiOpportunityScannerService.scanForUser(userId);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[OpportunityRadar] AI scan error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { ingestSignals, getRadar, updateMatchStatus, getTrends, aiScan, getSavedMatches };

