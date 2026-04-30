import config from "./config/env.js";
import app from "./app.js";
import mongoose from "mongoose";
import { initializeWorkers } from './workers/index.js';
import keepAlive from './services/keepAlive.js';

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = config.port;
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'both'; // 'web', 'worker', or 'both'
const isWorker = SERVICE_TYPE === 'worker' || SERVICE_TYPE === 'both';
const isWeb = SERVICE_TYPE === 'web' || SERVICE_TYPE === 'both';

let server;

// Connect to MongoDB with robust settings for intermittent DNS/network
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      connectTimeoutMS: 30000, 
      serverSelectionTimeoutMS: 30000, 
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Mongo connected successfully to: ${mongoose.connection.db?.databaseName}`);
    
    // Seed initial database data
    try {
      const roleTaxonomyService = (await import('./services/roleTaxonomy.service.js')).default;
      await roleTaxonomyService.seedRoles();
    } catch (e) {
      console.error("❌ Failed to seed data:", e);
    }

    // Initialize AI Background Workers ONLY if role is worker/both
    if (isWorker) {
      initializeWorkers();
    }
  } catch (err) {
    console.error("❌ MongoDB Initial Connection Error:", err.message);
    if (config.requireDbOnBoot) {
      process.exit(1);
    }
    console.log("⚠️  Backend will continue running, but DB-dependent features may fail until connection is established.");
  }
};

connectDB();

if (isWeb) {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend [${SERVICE_TYPE}] server running on port ${PORT}`);
    
    // Start KeepAlive service to prevent Render sleep in production (only for web)
    keepAlive.start();
  });

  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
} else {
  console.log(`✅ Backend [${SERVICE_TYPE}] initialized (No HTTP listener)`);
  
  process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION (Worker)!');
    console.error(err.name, err.message, err.stack);
    // Workers don't have a server to close, but we should exit if critical
  });
}

process.on('SIGTERM', () => {
  console.log(`👋 [${SERVICE_TYPE}] SIGTERM received. Shutting down...`);
  if (isWeb && typeof server !== 'undefined') {
    server.close(() => {
      console.log('🛑 [Web] HTTP server closed.');
      mongoose.connection.close(false).finally(() => {
        console.log('💾 [Web] Mongo connection closed. Exit 0.');
        process.exit(0);
      });
    });
  } else {
    mongoose.connection.close(false).finally(() => {
      console.log('🛑 [Worker] Background processing stopped. Mongo connection closed. Exit 0.');
      process.exit(0);
    });
  }
});
