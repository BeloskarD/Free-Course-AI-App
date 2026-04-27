import { Agenda } from 'agenda';
import { MongoBackend } from '@agendajs/mongo-backend';
import crypto from 'crypto';
import mongoose from 'mongoose';
import config from '../config/env.js';
import notificationService from './notificationService.js';
import User from '../models/User.js';
import UserProgress from '../models/UserProgress.js';
import PKG from '../models/PKG.js';


/**
 * QueueService
 * Uses MongoDB-backed Agenda to enforce isolated background job processing,
 * preventing heavy AI tasks from blocking the Node event loop and causing API timeouts.
 */
class QueueService {
    constructor() {
        this.agenda = new Agenda({
            backend: new MongoBackend({ 
                address: config.mongoUri, 
                collection: 'agendaJobs' 
            }),
            processEvery: '5 seconds', // Poll interval for new jobs
            maxConcurrency: 5,         // Prevent AI rate limit explosions
        });

        this.isInitialized = false;

        this.agenda.on('ready', async () => {
            const redactedUri = config.mongoUri ? `${config.mongoUri.substring(0, 15)}...${config.mongoUri.substring(config.mongoUri.length - 10)}` : 'NULL';
            console.log(`✅ [QueueService] Agenda connected to: ${redactedUri}`);
            await this.agenda.start();
            this.isInitialized = true;

            // Start scheduled background jobs after Agenda is ready
            await this._startScheduledJobs();
        });

        this.agenda.on('error', (error) => {
            console.error('❌ [QueueService] Agenda Connection Error:', error);
        });
    }

    _createAccessKey() {
        return crypto.randomBytes(24).toString('hex');
    }

    _hashAccessKey(accessKey) {
        return crypto.createHash('sha256').update(String(accessKey)).digest('hex');
    }

    // ========================================
    // SCHEDULED BACKGROUND JOBS
    // ========================================

    /**
     * Registers and starts all recurring background jobs.
     * Called automatically when Agenda is ready.
     */
    async _startScheduledJobs() {
        try {
            // ── Entropy Decay Job (Forgetting Curve) ──
            this.agenda.define('entropy-decay-daily', async (job) => {
                console.log('[ScheduledJob] 🧠 Starting daily entropy decay...');
                const startTime = Date.now();

                // Lazy import to avoid circular dependency issues
                const graphEngineService = (await import('./graphEngine.service.js')).default;
                const PKG = (await import('../models/PKG.js')).default;

                const pkgs = await PKG.find({}).lean();
                let updatedCount = 0;
                let skillsDecayed = 0;

                for (const pkg of pkgs) {
                    if (!pkg.skills || typeof pkg.skills !== 'object') continue;

                    const updates = {};
                    const skillEntries = pkg.skills instanceof Map
                        ? (Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : Array.from(pkg.skills.entries()))
                        : Object.entries(pkg.skills);

                    for (const [skillName, skill] of skillEntries) {
                        if (!skill) continue;

                        const oldEntropy = skill.entropyRate ?? 0.5;
                        const newEntropy = graphEngineService.calculateEntropy(skill);

                        // Only update if entropy changed meaningfully (> 0.01 difference)
                        if (Math.abs(newEntropy - oldEntropy) > 0.01) {
                            const confidence = skill.confidenceWeight || 0;
                            const newHealth = Math.min(100, Math.round(
                                (confidence * 50) + ((1 - newEntropy) * 50)
                            ));

                            updates[`skills.${skillName}.entropyRate`] = Math.min(0.95, newEntropy);
                            updates[`skills.${skillName}.health`] = newHealth;
                            skillsDecayed++;
                        }
                    }

                    if (Object.keys(updates).length > 0) {
                        updates.updatedAt = new Date();
                        await PKG.updateOne({ _id: pkg._id }, { $set: updates });
                        updatedCount++;
                    }
                }

                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                const summary = `Processed ${pkgs.length} PKGs, updated ${updatedCount}, decayed ${skillsDecayed} skills in ${duration}s`;
                console.log(`[ScheduledJob] ✅ Entropy decay complete: ${summary}`);

                return { status: 'success', summary };
            });

            // Schedule: Run every 24 hours
            await this.agenda.every('24 hours', 'entropy-decay-daily');
            console.log('📅 [QueueService] Scheduled: entropy-decay-daily (every 24 hours)');

            // ── Retention Check Job (Inactivity & Significant Decay) ──
            this.agenda.define('retention-check-daily', async (job) => {
                console.log('[ScheduledJob] 🔄 Starting daily retention check...');
                
                const seventiesTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
                
                // 1. Check Inactivity
                const inactiveUsers = await UserProgress.find({
                    lastActivityDate: { $lt: seventiesTwoHoursAgo }
                }).select('userId lastActivityDate');

                for (const up of inactiveUsers) {
                    await notificationService.notify(up.userId, 'inactivity', {
                        title: 'We miss you at Zeeklect!',
                        message: 'Your career momentum is slowing down. Jump back in to keep your scores high.',
                        priority: 'medium',
                        actionLink: '/dashboard'
                    });
                }

                // 2. Check for Significant Decay (Health < 70)
                const pkgs = await PKG.find({}).lean();
                for (const pkg of pkgs) {
                    const criticalSkills = [];
                    const skillEntries = pkg.skills instanceof Map ? (Array.isArray(pkg.skills) ? pkg.skills.map(s => [s.skillId || s.displayName || 'unknown', s]) : Array.from(pkg.skills.entries())) : Object.entries(pkg.skills);
                    
                    for (const [name, skill] of skillEntries) {
                        if (skill && skill.health < 70) {
                            criticalSkills.push(skill.displayName || name);
                        }
                    }

                    if (criticalSkills.length > 0) {
                        await notificationService.notify(pkg.userId, 'skill_decay', {
                            title: 'Knowledge Decay Alert',
                            message: `Your mastery in ${criticalSkills[0]}${criticalSkills.length > 1 ? ' and others' : ''} is slipping. Time for a quick practice session!`,
                            priority: 'high',
                            actionLink: '/momentum#skill-evolution-hub'
                        });
                    }
                }
                
                console.log(`[ScheduledJob] ✅ Retention check complete. Notified ${inactiveUsers.length} inactive users.`);
            });

            await this.agenda.every('24 hours', 'retention-check-daily');
            console.log('📅 [QueueService] Scheduled: retention-check-daily (every 24 hours)');


        } catch (error) {
            console.error('❌ [QueueService] Failed to start scheduled jobs:', error);
        }
    }

    /**
     * Registers a background processor with unified error and state capturing.
     * @param {string} jobName - Unique identifier for the job type
     * @param {Function} handler - The async function that performs the heavy lifting
     */
    registerProcessor(jobName, handler) {
        this.agenda.define(jobName, async (job, done) => {
            try {
                console.log(`[QueueService] 🔄 Processing job: ${jobName} (${job.attrs._id})`);
                
                // Execute heavy AI/DB logic
                const result = await handler(job.attrs.data);
                
                // Store result directly into the job document so frontend can poll it
                job.attrs.result = result;
                await job.save();
                
                console.log(`[QueueService] ✅ Completed job: ${jobName} (${job.attrs._id})`);
                done(); 
            } catch (error) {
                console.error(`[QueueService] ❌ Failed job: ${jobName} (${job.attrs._id})`, error);
                
                // Save error reason for visibility
                job.attrs.failReason = error.message;
                await job.save();
                
                done(error);
            }
        });
    }

    /**
     * Enqueues a job for immediate background processing.
     * Returns the 24-char hex Job ID to return to the frontend.
     */
    async enqueueJob(jobName, data, options = {}) {
        if (!this.isInitialized) {
            console.warn('[QueueService] Warning: Enqueuing before Agenda is fully ready.');
        }

        const ownerUserId = options.ownerUserId || data?.userId || null;
        const accessKey = !ownerUserId ? this._createAccessKey() : null;
        const payload = {
            ...data,
            __jobMeta: {
                ownerUserId,
                accessKeyHash: accessKey ? this._hashAccessKey(accessKey) : null,
                createdAt: new Date().toISOString(),
            }
        };

        const job = this.agenda.create(jobName, payload);
        await job.save();
        
        const jobId = job.attrs._id.toString();
        console.log(`[QueueService] 📥 Enqueued job: ${jobName} | ID: ${jobId}`);
        
        // Diagnostic: Check if we can find it immediately
        if (mongoose.connection.db) {
            const count = await mongoose.connection.db.collection('agendaJobs').countDocuments({ _id: job.attrs._id });
            console.log(`[QueueService] 🔍 Verification find direct in DB for ${jobId}: ${count > 0 ? 'FOUND' : 'NOT FOUND'}`);
        }
        
        return { jobId, accessKey };
    }

    /**
     * Fetches the sanitized status of a job for frontend UI polling.
     */
    /**
     * Fetches the sanitized status of a job for frontend UI polling.
     */
    async getJobStatus(jobId, options = {}) {
        try {
            const sanitizedId = jobId?.toString().trim();
            console.log(`[QueueService] 🔍 Status search for: "${sanitizedId}"`);
            
            if (!sanitizedId || sanitizedId.length < 20) {
                console.warn(`[QueueService] ⚠️ Invalid Job ID length: ${sanitizedId?.length}`);
                return null;
            }

            let objectId;
            try {
                objectId = new mongoose.Types.ObjectId(sanitizedId);
            } catch (oidError) {
                console.warn(`[QueueService] ⚠️ Could not convert ${sanitizedId} to ObjectId: ${oidError.message}`);
            }

            // Search directly via MongoDB (Agenda v6+ removed .jobs() API)
            let jobs = [];
            
            // 2. Fallback: Search the collection directly via Mongoose (More robust for completed jobs)
            if (!jobs || jobs.length === 0) {
                const currentDB = mongoose.connection.db?.databaseName;
                console.log(`[QueueService] ⚠️ Standard search found nothing for ${sanitizedId}. Trying direct DB query in "${currentDB}"...`);
                
                if (mongoose.connection.db) {
                    const collection = mongoose.connection.db.collection('agendaJobs');
                    
                    // Count total jobs for context
                    const totalJobs = await collection.countDocuments({});
                    console.log(`[QueueService] 📊 Collection 'agendaJobs' in "${currentDB}" has ${totalJobs} total jobs.`);
                    
                    // Try searching by ObjectId
                    let dbJob = null;
                    if (objectId) {
                        dbJob = await collection.findOne({ _id: objectId });
                    }
                    
                    // If still nothing, try searching by string ID
                    if (!dbJob) {
                        console.log(`[QueueService] 🔍 ObjectId search failed, trying raw string ID...`);
                        dbJob = await collection.findOne({ _id: sanitizedId });
                    }

                    if (dbJob) {
                        console.log(`[QueueService] ✅ Direct DB query SAVED THE DAY for ${sanitizedId}!`);
                        jobs = [{ attrs: dbJob }];
                    } else {
                        console.warn(`[QueueService] ❌ Exhaustive DB query also found NOTHING for ${sanitizedId} in "${currentDB}.agendaJobs"`);
                        // List the last 3 IDs for context
                        const sample = await collection.find({}).sort({$natural:-1}).limit(3).toArray();
                        console.log(`[QueueService] 💡 Last 3 jobs in this DB: ${sample.map(s => s._id).join(', ')}`);
                    }
                } else {
                    console.error("[QueueService] ❌ mongoose.connection.db is UNDEFINED!");
                }
            }

            if (!jobs || jobs.length === 0) {
                return null;
            }

            const job = jobs[0];
            const jobMeta = job.attrs.data?.__jobMeta;
            const requesterUserId = options.requesterUserId || null;
            const providedAccessKey = options.accessKey || null;

            if (jobMeta?.ownerUserId) {
                if (!requesterUserId || String(requesterUserId) !== String(jobMeta.ownerUserId)) {
                    return { forbidden: true };
                }
            } else if (jobMeta?.accessKeyHash) {
                if (!providedAccessKey || this._hashAccessKey(providedAccessKey) !== jobMeta.accessKeyHash) {
                    return { forbidden: true };
                }
            }
            
            // Normalize status strings for the frontend
            let status = 'queued';
            if (job.attrs.lockedAt) status = 'processing';
            if (job.attrs.failedAt) status = 'failed';
            if (job.attrs.lastFinishedAt && !job.attrs.failedAt) status = 'completed';

            return {
                id: job.attrs._id,
                status: status,
                result: job.attrs.result || null,
                data: job.attrs.data || null,
                error: job.attrs.failReason || null,
                failedAt: job.attrs.failedAt || null,
                createdAt: job.attrs.nextRunAt || new Date()
            };
        } catch (error) {
            console.error(`[QueueService] 🚨 CRITICAL ERROR in getJobStatus for ${jobId}:`);
            console.error(error.message);
            console.error(error.stack);
            return null;
        }
    }


    /**
     * Finds an already active job (queued or processing) with matching data.
     * Prevents redundant heavy AI calls if multiple users search for the same thing.
     */
    async findActiveJob(jobName, searchCriteria) {
        try {
            if (!mongoose.connection.db) return null;
            
            const collection = mongoose.connection.db.collection('agendaJobs');
            
            // Search for jobs that are not failed and not finished
            // We search for matching fields in the 'data' object
            const query = {
                name: jobName,
                lastFinishedAt: { $exists: false },
                failedAt: { $exists: false }
            };

            // Add search criteria to the query
            for (const [key, value] of Object.entries(searchCriteria)) {
                query[`data.${key}`] = value;
            }

            const activeJob = await collection.findOne(query);
            
            if (activeJob) {
                console.log(`[QueueService] 🎯 Found duplicate active job for ${jobName}: ${activeJob._id}`);
                return {
                    jobId: activeJob._id.toString(),
                    accessKey: null // Returning existing job usually means the requester needs to be the owner or have the hash
                };
            }
            
            return null;
        } catch (error) {
            console.error('[QueueService] findActiveJob error:', error.message);
            return null;
        }
    }
}


// Export singleton to ensure only ONE instance connects to Mongo
export default new QueueService();
