export const metadata = {
    title: 'Momentum | Skill Health & Progress Tracker',
    description: 'Monitor your learning momentum with skill health diagnostics, achievement badges, activity heatmaps, and AI-powered progress analytics.',
    keywords: ['learning momentum', 'skill health', 'progress tracker', 'learning analytics', 'achievement badges'],
    openGraph: {
        title: 'Momentum | Zeeklect',
        description: 'Track your learning momentum and skill health.',
    },
};

export default function MomentumLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "Zeeklect Momentum Tracker",
                        "applicationCategory": "EducationalApplication",
                        "description": "Skill health diagnostics and learning momentum analytics with AI-powered insights.",
                        "operatingSystem": "Web",
                        "featureList": ["Skill Health Diagnostics", "Activity Heatmaps", "Achievement Badges", "Progress Charts"]
                    })
                }}
            />
            {children}
        </>
    );
}
