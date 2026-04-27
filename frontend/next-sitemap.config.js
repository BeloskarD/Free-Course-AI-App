/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://zeeklect.com',
  generateRobotsTxt: true, // Generates /robots.txt (Default: false)
  exclude: [
    '/admin/*',
    '/auth/*',
    '/dashboard/*',
    '/api/*',
  ],
  additionalPaths: async (config) => {
    // You can add additional paths here if needed
    return [];
  }
};