export const metadata = {
    title: 'Growth Hub | Performance Analytics',
    description: 'Deep performance analytics and growth metrics for your learning journey. Visualize progress trends, skill development velocity, and mastery milestones.',
    keywords: ['learning analytics', 'performance metrics', 'growth tracking', 'skill development', 'progress visualization'],
    openGraph: {
        title: 'Growth Hub | Zeeklect',
        description: 'Performance analytics and growth metrics for your learning journey.',
    },
};

export default function GrowthLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "Zeeklect Growth Hub",
                        "applicationCategory": "EducationalApplication",
                        "description": "Performance analytics dashboard with learning velocity metrics, mastery milestones, and growth trend visualization.",
                        "operatingSystem": "Web"
                    })
                }}
            />
            {children}
        </>
    );
}
