import networkIntelligenceService from '../services/networkIntelligence.service.js';
import opportunityRadarService from '../services/opportunityRadar.service.js';
import graphEngineService from '../services/graphEngine.service.js';
import reinforcementService from '../services/reinforcement.service.js';
import UserOpportunityMatch from '../models/UserOpportunityMatch.js';

/**
 * NETWORK INSIGHT CONTROLLER
 * ===========================
 * Handles network intelligence API requests.
 * Never exposes raw Happenstance data.
 */

/**
 * GET /api/network-insight
 * Get career insight with network intelligence for the authenticated user.
 */
export async function getNetworkInsight(req, res) {
    try {
        const userId = req.userId;

        // 1. Get comprehensive hiring readiness score
        const readinessEngine = (await import('../services/hiringReadinessEngine.js')).default;
        const readiness = await readinessEngine.calculateScore(userId);
        const readinessScore = readiness.score;
        
        // 2. Check activation conditions (v3 threshold: 40% readiness for early insights)
        const isActivated = readinessScore >= 40;


        if (!isActivated) {
            return res.json({
                success: true,
                activated: false,
                readiness: readinessScore,
                reason: readinessScore < 40
                    ? `Readiness at ${readinessScore}%. Reach 40% by completing skill validations and projects.`
                    : 'Momentum is not yet stable. Build consistency first.',
                careerInsight: null
            });
        }

        // 3. Get top opportunity match
        const opportunities = await opportunityRadarService.getRadar(userId, 1);
        const topOpp = opportunities?.[0] || null;

        if (!topOpp) {
            return res.json({
                success: true,
                activated: true,
                readiness: readinessScore,
                reason: 'No opportunity matches found. Run the opportunity scanner first.',
                careerInsight: null
            });
        }

        // 4. Extract context from opportunity
        const signal = topOpp.signal || {};
        const cluster = signal.skillCluster || 'General Technology';
        const requiredSkills = signal.skillTags || [];
        const companies = signal.title?.match(/at\s+([A-Z][a-zA-Z\s]+)/)?.[1]
            ? [signal.title.match(/at\s+([A-Z][a-zA-Z\s]+)/)[1]]
            : [];

        // 5. Call Network Intelligence (only if API key available)
        let networkData = networkIntelligenceService.buildEmptyResult();
        if (networkIntelligenceService.isAvailable()) {
            try {
                networkData = await networkIntelligenceService.analyzeNetworkPaths({
                    cluster,
                    requiredSkills,
                    companies,
                    roleTarget: cluster + ' Engineer'
                });
            } catch (err) {
                console.error('[NetworkInsight] Network analysis failed:', err.message);
            }
        }

        // 6. Count hiring companies from signals
        const radarAll = await opportunityRadarService.getRadar(userId, 10);
        const hiringSignals = radarAll.filter(o =>
            (o.signal?.source === 'hiring_signal') && (o.matchScore || 0) >= 0.5
        );

        // 7. Get graph data for micro-project suggestion
        const graph = await graphEngineService.getFullGraph(userId);
        const weakSkills = (graph?.nodes || [])
            .filter(n => n.entropyRate > 0.5 && n.masteryScore < 0.7)
            .sort((a, b) => b.entropyRate - a.entropyRate)
            .slice(0, 3)
            .map(n => n.id);

        // 8. Check if user has a completed micro-project
        const matchDoc = await UserOpportunityMatch.findOne({
            userId,
            signalId: signal.signalId,
            status: { $in: ['acting', 'completed'] }
        }).lean();

        const microProjectCompleted = matchDoc?.status === 'completed';

        // 9. Build CareerInsight
        const bestWarmPath = networkData.warmPaths[0] || null;
        const careerInsight = {
            readiness: readinessScore,
            cluster: cluster.replace(/_/g, ' '),
            startupsHiring: hiringSignals.length,
            warmPath: bestWarmPath ? {
                name: bestWarmPath.name || 'Anonymous Connection',
                role: bestWarmPath.role || 'Industry Professional',
                company: bestWarmPath.company || 'Confidential Company',
                connectionDegree: bestWarmPath.connectionDegree || 3,
                leverageScore: bestWarmPath.leverageScore || 0
            } : null,
            networkScore: networkData.networkScore,
            totalWarmPaths: networkData.warmPaths.length,
            hiringManagers: networkData.hiringManagers.length,
            domainExperts: networkData.domainExperts.length,
            requiredNextAction: microProjectCompleted
                ? 'You\'re ready to generate outreach messages!'
                : 'Complete a micro-project to unlock outreach.',
            microProject: {
                title: `Build a ${cluster.replace(/_/g, ' ')} demo project`,
                skills: weakSkills.length > 0 ? weakSkills : requiredSkills.slice(0, 3),
                completed: microProjectCompleted
            },
            outreachReady: microProjectCompleted,
            opportunity: {
                title: signal.title,
                signalId: signal.signalId,
                matchScore: Math.round((topOpp.matchScore || 0) * 100)
            }
        };

        // 10. Persist network layer to UserOpportunityMatch (non-blocking)
        if (networkData.warmPaths.length > 0 && signal.signalId) {
            UserOpportunityMatch.findOneAndUpdate(
                { userId, signalId: signal.signalId },
                {
                    $set: {
                        'networkLayer.warmPaths': networkData.warmPaths.slice(0, 5).map(p => ({
                            name: p.name,
                            role: p.role,
                            company: p.company,
                            connectionDegree: p.connectionDegree,
                            leverageScore: p.leverageScore
                        })),
                        'networkLayer.networkScore': networkData.networkScore
                    }
                },
                { upsert: false }
            ).catch(err => console.error('[NetworkInsight] DB update failed:', err.message));
        }

        const responseData = {
            activated: true,
            readiness: readinessScore,
            careerInsight
        };

        // Response Shaping for Network Intelligence
        if (req.entitlements && req.entitlements.tier !== 'career+') {
            const { shapeGatedResponse, getCuriosityHint } = await import('../utils/response.js');
            const shaped = shapeGatedResponse(responseData, req.entitlements, {
                featureArea: 'networkInsight',
                keysToLock: ['warmPath', 'hiringManagers', 'domainExperts', 'totalWarmPaths'],
                upgradeHint: 'Unlock full network intelligence and warm connection paths with Career+.',
                lockedMessage: getCuriosityHint('networkInsight')
            });
            return res.json({ success: true, ...shaped });
        }

        res.json({
            success: true,
            ...responseData
        });

    } catch (error) {
        console.error('[NetworkInsight] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/network-insight/analyze
 * Analyze network paths for a specific opportunity signal.
 */
export async function analyzeNetworkPaths(req, res) {
    try {
        const { signalId, cluster, skills, companies, roleTarget } = req.body;

        if (!networkIntelligenceService.isAvailable()) {
            return res.status(503).json({
                success: false,
                error: 'Network intelligence is not configured.'
            });
        }

        const result = await networkIntelligenceService.analyzeNetworkPaths({
            cluster: cluster || 'Technology',
            requiredSkills: skills || [],
            companies: companies || [],
            roleTarget: roleTarget || ''
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[NetworkInsight] Analyze error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
