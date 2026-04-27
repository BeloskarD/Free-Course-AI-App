export default function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_BASE_URL is missing in production!'); })() : 'http://localhost:3000');

    // Core public pages - highest priority
    const coreRoutes = [
        { route: '', priority: 1.0, changeFrequency: 'daily' },
        { route: '/courses', priority: 0.9, changeFrequency: 'daily' },
        { route: '/ai-intelligence', priority: 0.9, changeFrequency: 'daily' },
        { route: '/ai-tools', priority: 0.9, changeFrequency: 'daily' },
        { route: '/youtube', priority: 0.85, changeFrequency: 'daily' },
    ];

    // Feature pages - high priority
    const featureRoutes = [
        { route: '/skill-analysis', priority: 0.8, changeFrequency: 'weekly' },
        { route: '/skill-graph', priority: 0.8, changeFrequency: 'weekly' },
        { route: '/career-acceleration', priority: 0.8, changeFrequency: 'weekly' },
        { route: '/momentum', priority: 0.75, changeFrequency: 'weekly' },
        { route: '/growth', priority: 0.75, changeFrequency: 'weekly' },
        { route: '/wellbeing', priority: 0.7, changeFrequency: 'weekly' },
    ];

    // Tool pages - medium priority
    const toolRoutes = [
        { route: '/ai-resume', priority: 0.7, changeFrequency: 'weekly' },
        { route: '/opportunity-radar', priority: 0.7, changeFrequency: 'weekly' },
    ];

    const allRoutes = [...coreRoutes, ...featureRoutes, ...toolRoutes];

    return allRoutes.map(({ route, priority, changeFrequency }) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
    }));
}
