import logger from '../utils/logger.js';

/**
 * SHARE IMAGE SERVICE (Zeeklect v3)
 * =================================
 * Placeholder for dynamic OG/Share image generation.
 * This defines the contract for future Stage 2 implementation.
 */
class ShareImageService {
  /**
   * Generates a signed URL or dynamic buffer for a career share card.
   * @param {string} userId
   * @param {Object} data { score, role, badges }
   */
  async generateCareerCard(userId, data) {
    logger.info({ userId, role: data.role }, '[ShareImage] Share card requested (Stage 2 Placeholder)');
    
    // API CONTRACT:
    // This will eventually return a URL to a dynamically generated image
    // Using @vercel/og, Cloudinary, or an internal canvas worker.
    
    return {
      status: 'pending_implementation',
      placeholderUrl: `/api/share/placeholder?score=${data.score}&role=${data.role}`,
      contract: {
        dimensions: '1200x630 (OG Standard)',
        format: 'PNG/WebP',
        dynamicFields: ['hiringScore', 'role', 'verifiedBadgesCount', 'userName']
      }
    };
  }
}

export default new ShareImageService();
