export const metadata = {
    title: 'Opportunity Radar | Job & Opportunity Tracker',
    description: 'Discover relevant job opportunities and career openings with AI-powered matching. Real-time opportunity scanning tailored to your skills and goals.',
    keywords: ['job opportunities', 'career radar', 'job tracker', 'AI job matching', 'opportunity finder'],
    openGraph: {
        title: 'Opportunity Radar | Zeeklect',
        description: 'AI-powered job opportunity radar and career matching.',
    },
};

export default function OpportunityRadarLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "Zeeklect Opportunity Radar",
                        "description": "AI-powered job opportunity discovery and career matching engine.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "serviceType": "Job Matching",
                        "areaServed": "Global"
                    })
                }}
            />
            {children}
        </>
    );
}
