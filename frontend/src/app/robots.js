export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_BASE_URL is missing in production!'); })() : 'http://localhost:3000');

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/auth/', '/dashboard/', '/settings/', '/search/', '/mission-home/', '/missions/'],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/auth/', '/dashboard/', '/settings/', '/search/', '/mission-home/', '/missions/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
