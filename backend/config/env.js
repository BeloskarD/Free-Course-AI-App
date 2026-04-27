// Environment configuration with validation
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'AZURE_AI_INFERENCE_ENDPOINT',
  'AZURE_AI_INFERENCE_KEY',
  'TAVILY_API_KEY',
  'SERPER_API_KEY',
  'BYTEZ_API_KEY'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these variables in your .env file or deployment environment');
  // In production, we should exit, but in development we'll continue with warnings
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Configuration object
const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongoUri: process.env.MONGO_URI || '',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtIssuer: process.env.JWT_ISSUER || 'zeeklect',
  jwtAudience: process.env.JWT_AUDIENCE || 'zeeklect_users',
  
  // Frontend URL for CORS and redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // API Keys for external services
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  azureAiInferenceEndpoint: process.env.AZURE_AI_INFERENCE_ENDPOINT || '',
  azureAiInferenceKey: process.env.AZURE_AI_INFERENCE_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  serperApiKey: process.env.SERPER_API_KEY || '',
  bytezApiKey: process.env.BYTEZ_API_KEY || '',
  
  // Application settings
  requireDbOnBoot: process.env.REQUIRE_DB_ON_BOOT === 'true',
  authIncludeLegacyOauthToken: process.env.AUTH_INCLUDE_LEGACY_OAUTH_TOKEN === 'true',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  
  // File upload limits
  maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
  
  // Worker settings
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2,
  
  // Cache settings
  cacheTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Validate critical configuration
if (!config.mongoUri) {
  console.warn('⚠️  MongoDB URI is not set. Database-dependent features will not work.');
}

if (!config.jwtSecret) {
  console.warn('⚠️  JWT secret is not set. Authentication will not work securely.');
}

if (!config.openaiApiKey && !config.groqApiKey && !config.azureAiInferenceKey) {
  console.warn('⚠️  No AI API keys are set. AI-dependent features will not work.');
}

// Log configuration in development
if (config.nodeEnv !== 'production') {
  console.log('🔧 Configuration loaded:');
  console.log(`   • Port: ${config.port}`);
  console.log(`   • Environment: ${config.nodeEnv}`);
  console.log(`   • Frontend URL: ${config.frontendUrl}`);
  console.log(`   • MongoDB URI: ${config.mongoUri ? 'Set' : 'Not Set'}`);
  console.log(`   • JWT Secret: ${config.jwtSecret ? 'Set' : 'Not Set'}`);
  console.log(`   • OpenAI API Key: ${config.openaiApiKey ? 'Set' : 'Not Set'}`);
  console.log(`   • Groq API Key: ${config.groqApiKey ? 'Set' : 'Not Set'}`);
  console.log(`   • Azure AI Key: ${config.azureAiInferenceKey ? 'Set' : 'Not Set'}`);
}

module.exports = config;