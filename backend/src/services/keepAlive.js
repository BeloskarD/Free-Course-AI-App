import axios from 'axios';
import config from '../config/env.js';

/**
 * KeepAliveService
 * Prevent Render Free Tier from sleeping by self-pinging.
 * Also ensures background jobs in Agenda stay active.
 */
class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.pingCount = 0;
    this.isEnabled = config.nodeEnv === 'production';
    this.selfUrl = `http://localhost:${config.port}/api/health/live`;
    
    // In production, we should try to use the public URL if provided
    if (config.nodeEnv === 'production') {
       // We can detect public URL if we want, or just stick to localhost:PORT 
       // inside the container, or use a health-check endpoint.
       // Actually, localhost is safest for internal keep-awake.
    }
  }

  start() {
    if (!this.isEnabled) {
      console.log('ℹ️ [KeepAlive] Disabled (non-production environment)');
      return;
    }

    if (this.intervalId) return;

    console.log(`🚀 [KeepAlive] Starting self-ping service (Interval: ${config.keepAliveInterval}ms)`);
    
    this.intervalId = setInterval(async () => {
      try {
        this.pingCount++;
        await axios.get(this.selfUrl);
        if (this.pingCount % 6 === 0) { // Log every hour if interval is 10 mins
            console.log(`💓 [KeepAlive] Heartbeat active. Pings sent: ${this.pingCount}`);
        }
      } catch (err) {
        console.error(`⚠️ [KeepAlive] Self-ping failed: ${err.message}`);
      }
    }, config.keepAliveInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 [KeepAlive] Stopped.');
    }
  }
}

export default new KeepAliveService();
