import logger from '../utils/logger.js';
import hiringReadinessEngine from '../services/hiringReadinessEngine.js';
import careerTimelineEngine from '../services/careerTimelineEngine.js';
import validationProvider from '../services/validationProvider.js';
import UserProgress from '../models/UserProgress.js';
import CareerTimeline from '../models/CareerTimeline.js';
import Notification from '../models/Notification.js';
import LearnerProfile from '../models/LearnerProfile.js';
import publicProfileService from '../services/publicProfile.service.js';
import challengeGeneratorService from '../services/challengeGenerator.service.js';


/**
 * CAREER CONTROLLER (Zeeklect v3)
 * ==============================
 */

const parseTimelineMonths = (timeline = '6 months') => {
  const months = parseInt(String(timeline), 10);
  return Number.isFinite(months) && months > 0 ? months : 6;
};

const buildStarterTimeline = (targetRole, targetTimeline) => {
  const realisticMonths = parseTimelineMonths(targetTimeline);
  const optimisticMonths = Math.max(1, realisticMonths - 2);
  const pessimisticMonths = realisticMonths + 3;
  const now = new Date();

  return {
    targetRole,
    estimatedMonthsToReady: realisticMonths,
    hiringProbability: Math.max(35, Math.min(82, 68 - realisticMonths * 2)),
    scenarios: {
      optimistic: optimisticMonths,
      realistic: realisticMonths,
      pessimistic: pessimisticMonths,
    },
    milestones: [
      {
        title: 'Role Foundation Locked',
        targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Core Concepts', 'Problem Solving'],
        isCompleted: false,
      },
      {
        title: 'Portfolio Proof Shipped',
        targetDate: new Date(now.getTime() + Math.max(45, realisticMonths * 15) * 24 * 60 * 60 * 1000),
        requiredSkills: ['Projects', 'Deployment'],
        isCompleted: false,
      },
      {
        title: `${targetRole} Interview Ready`,
        targetDate: new Date(now.getTime() + realisticMonths * 30 * 24 * 60 * 60 * 1000),
        requiredSkills: ['Interview Practice', 'Proof of Work'],
        isCompleted: false,
      },
    ],
    weeklyPlan: [
      { week: 1, focus: `Map the ${targetRole} baseline`, tasks: ['Review the target role skill map', 'Choose one priority skill to improve', 'Block 3 focused study sessions'] },
      { week: 2, focus: 'Build practical proof', tasks: ['Complete one hands-on challenge', 'Document one portfolio-ready artifact', 'Capture what still feels weak'] },
      { week: 3, focus: 'Strengthen interview signal', tasks: ['Practice 10 role-aligned questions', 'Refine one technical explanation', 'Improve one weak area from feedback'] },
      { week: 4, focus: 'Ship momentum', tasks: ['Finish one visible proof-of-work item', 'Validate one core competency', 'Review timeline progress and adjust'] },
    ],
    message: 'Showing your starter projection while live career signals finish calibrating.',
  };
};

export const getHiringReadiness = async (req, res, next) => {
  const userId = req.user?.id || req.userId;
  
  if (!userId) {
    logger.warn('[Career Controller] getHiringReadiness failed: No userId in request');
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing userId"
    });
  }

  logger.info({ userId }, '[Career Controller] Fetching readiness');

  try {
    const readiness = await hiringReadinessEngine.calculateScore(userId);
    res.json({ success: true, data: readiness });
  } catch (error) {
    // Selective Fallback: Handle Initialization State
    if (error.message?.includes('Initializing') || error.message?.includes('not found')) {
      logger.warn(`[Career Controller] Serving fallback readiness for ${userId}: Initialization in progress`);
      return res.json({
        success: true,
        data: {
          score: 0,
          confidence: "Low",
          actions: [],
          explanation: {},
          message: "Initializing your SkillGraph..."
        }
      });
    }

    logger.error(`[Career Controller] Critical failure in getHiringReadiness for ${userId}:`, error.stack);
    next(error);
  }
};

export const getCareerTimeline = async (req, res, next) => {
  const userId = req.user.id;
  try {
    let timeline = await CareerTimeline.findOne({ userId });

    // If no timeline, try to generate one based on target role
    if (!timeline) {
      const userProgress = await UserProgress.findOne({ userId });
      const learnerProfile = await LearnerProfile.findOne({ userId });
      const targetRole = userProgress?.targetRole || learnerProfile?.goals?.targetRole || 'Software Engineer';
      const targetTimeline = learnerProfile?.goals?.targetTimeline || '6 months';
      
      try {
        timeline = await careerTimelineEngine.generateProjection(userId, targetRole);
      } catch (innerError) {
        logger.warn(`[Career Controller] Serving starter timeline for ${userId}: ${innerError.message}`);
        return res.json({
          success: true,
          data: buildStarterTimeline(targetRole, targetTimeline)
        });
      }
    }

    res.json({ success: true, data: timeline });
  } catch (error) {
    logger.error(`[Career Controller] Critical failure in getCareerTimeline for ${userId}:`, error.stack);
    next(error);
  }
};

export const validateSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skill, type, data } = req.body;

    const validation = await validationProvider.validate(userId, skill, type, data);
    
    // After validation, recalculate readiness score
    const newReadiness = await hiringReadinessEngine.calculateScore(userId);

    res.json({ 
      success: true, 
      data: {
        validation,
        newHiringScore: newReadiness.score
      }
    });
  } catch (error) {
    next(error);
  }
};

export const generateProbe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skill, type } = req.query;

    if (!skill || !type) {
      return res.status(400).json({ success: false, message: 'Skill and type are required' });
    }

    const probe = await challengeGeneratorService.generateValidationProbe(userId, skill, type);
    res.json({ success: true, data: probe });
  } catch (error) {
    next(error);
  }
};

export const generateStrategy = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skill } = req.query;

    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill is required' });
    }

    const strategy = await challengeGeneratorService.generateStrategy(userId, skill);
    res.json({ success: true, data: strategy });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const profile = await publicProfileService.getProfileByUsername(username);
    
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

import radarEngine from '../services/radarEngine.js';

export const getRadarBreakdown = async (req, res, next) => {
  const userId = req.user?.id || req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const radarData = await radarEngine.getRadarBreakdown(userId);
    res.json({ success: true, data: radarData });
  } catch (error) {
    logger.error(`[Career Controller] Radar error for ${userId}:`, error.stack);
    next(error);
  }
};

export default {
  getHiringReadiness,
  getCareerTimeline,
  validateSkill,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getPublicProfile,
  generateProbe,
  generateStrategy,
  getRadarBreakdown
};
