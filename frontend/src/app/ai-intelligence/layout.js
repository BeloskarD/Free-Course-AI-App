export const metadata = {
    title: 'AI Intelligence Hub | Advanced Learning Roadmaps',
    description: 'Generate deep, AI-powered learning roadmaps and identify skill gaps with our advanced intelligence engine. Professional career paths tailored for 2026.',
    keywords: ['AI roadmap', 'learning path', 'skill gap analysis', 'career strategy', 'tech roadmap 2026'],
    openGraph: {
        title: 'AI Intelligence Hub | Zeeklect',
        description: 'Deep AI-powered learning roadmaps and skill analysis.',
        images: ['/og-intelligence.png'],
    },
};

export default function AIIntelligenceLayout({ children }) {
    return (
        <>
            {/* Structured Data for SEO Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "AI Learning Intelligence Hub",
                        "description": "AI-powered skill gap analysis and personalized learning roadmap generation.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "areaServed": "Global",
                        "hasOfferCatalog": {
                            "@type": "OfferCatalog",
                            "name": "Learning Intelligence",
                            "itemListElement": [
                                {
                                    "@type": "Offer",
                                    "itemOffered": {
                                        "@type": "Service",
                                        "name": "Skill Gap Analysis"
                                    }
                                },
                                {
                                    "@type": "Offer",
                                    "itemOffered": {
                                        "@type": "Service",
                                        "name": "Personalized Roadmaps"
                                    }
                                }
                            ]
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
