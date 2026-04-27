export const metadata = {
    title: 'Real-Time Skill Analysis | Deep Market Insights',
    description: 'Analyze your technical skills against real-world job market data in India. Discover your career readiness and high-demand skills for 2026.',
    keywords: ['skill assessment', 'career readiness', 'job market data India', 'technical skills focus', 'salary insights'],
};

export default function SkillAnalysisLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "Market-Driven Skill Analysis",
                        "description": "AI-powered comparison of individual skills against real-time industry demand data.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
