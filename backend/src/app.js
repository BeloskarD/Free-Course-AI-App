import config from './config/env.js';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import passport from './config/passport.js';
import * as Sentry from "@sentry/node";
import logger from './utils/logger.js';


// Route Imports
import healthRoutes from './routes/health.routes.js';
import aiRoutes from './routes/ai.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js'
import youtubeRoutes from './routes/youtube.routes.js';
import skillAnalysisRoutes from './routes/skillAnalysis.routes.js';
import momentumRoutes from './routes/momentum.js';
import companionRoutes from './routes/companion.routes.js';
import toolRoutes from './routes/tool.routes.js';
import personalizationRoutes from './routes/personalization.routes.js';
import skillHealthRoutes from './routes/skillHealth.routes.js';
import pkgRoutes from './routes/pkg.routes.js';
import guardianRoutes from './routes/guardian.routes.js';
import missionRoutes from './routes/mission.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import aiResumeRoutes from './routes/aiResume.routes.js';
import jobRoutes from './routes/job.routes.js';
import graphEngineRoutes from './routes/graphEngine.routes.js';
import opportunityRadarRoutes from './routes/opportunityRadar.routes.js';
import challengeGeneratorRoutes from './routes/challengeGenerator.routes.js';
import reinforcementRoutes from './routes/reinforcement.routes.js';
import intelligenceRoutes from './routes/intelligence.routes.js';
import pathwayRoutes from './routes/pathway.routes.js';
import networkInsightRoutes from './routes/networkInsight.routes.js';
import outreachGeneratorRoutes from './routes/outreachGenerator.routes.js';
import interviewPrepRoutes from './routes/interviewPrep.routes.js';
import careerRoutes from './routes/career.routes.js';
import billingRoutes from './routes/billing.routes.js';


const app = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

/**
 * ── OBSERVIEBILITY: Sentry Initialization ──
 * Must be initialized BEFORE any other middleware
 */
const SENTRY_DSN = config.sentryDsn || 'https://890598de911a707d7860b06ff5dc8779@o4511292664840192.ingest.us.sentry.io/4511292688826368';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: config.nodeEnv,
  tracesSampleRate: config.nodeEnv === 'production' ? 0.2 : 1.0,
  release: process.env.SENTRY_RELEASE || 'zeeklect-os@1.0.0',
});

// ── CORE MIDDLEWARE ──
app.use(requestIdMiddleware);
app.use(compression());
app.use('/api/billing/webhook', express.raw({ limit: '2mb', type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── SECURITY MIDDLEWARE (Helmet) ──
const isProd = config.nodeEnv === 'production';
const allowedConnectSrc = ["'self'"];
if (!isProd) {
  allowedConnectSrc.push("http://localhost:5000", "http://127.0.0.1:5000", "http://192.168.0.219.nip.io:5000", "http://192.168.0.219:5000");
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: allowedConnectSrc,
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.hidePoweredBy());

// ── CORS CONFIGURATION ──
const allowedOrigins = [
  config.frontendUrl,
  'https://zeeklect-ai.vercel.app',
  'https://zeeklect.com'
].filter(Boolean);

// Add local origins for development
if (config.nodeEnv !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || (config.nodeEnv !== 'production' && origin.includes('nip.io'))) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-job-access-key', 'cache-control'],
  exposedHeaders: ['Set-Cookie']
}));

// ── RATE LIMITING ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ── AI SPECIFIC RATE LIMITING (Cost Protection) ──
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100, // Increased for production testing
  message: { error: 'TooManyRequests', message: 'AI processing limit reached. Please try again in 15 minutes.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/ai', aiLimiter);
app.use('/api/ai-resume', aiLimiter);
app.use('/api/opportunity-match', aiLimiter);
app.use('/api/skill-analysis', aiLimiter);
app.use('/api/intelligence', aiLimiter);

// ── AUTHENTICATION ──
app.use(passport.initialize());

// ── API ROUTES ──
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/skill-analysis', skillAnalysisRoutes);
app.use('/api/momentum', momentumRoutes);
app.use('/api/companion', companionRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/personalization', personalizationRoutes);
app.use('/api/skill-health', skillHealthRoutes);
app.use('/api/pkg', pkgRoutes);
app.use('/api/guardian', guardianRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai-resume', aiResumeRoutes);
app.use('/api/jobs', jobRoutes);

// ── CAREER ENGINE ROUTES ──
app.use('/api/graph-engine', graphEngineRoutes);
app.use('/api/opportunity-match', opportunityRadarRoutes);
app.use('/api/challenge-generator', challengeGeneratorRoutes);
app.use('/api/reinforcement', reinforcementRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/pathway-orchestrator', pathwayRoutes);
app.use('/api/network-insight', networkInsightRoutes);
app.use('/api/outreach-generator', outreachGeneratorRoutes);
app.use('/api/interview-prep', interviewPrepRoutes);


// ── ERROR HANDLING ──
Sentry.setupExpressErrorHandler(app);

// ── 404 HANDLER (MUST be after all routes) ──
app.use((req, res, next) => {
  res.type('application/json');
  res.status(404).json({
    error: 'NotFoundError',
    message: `The requested path ${req.path} was not found on this server.`
  });
});

app.use(errorHandler);

export default app;
