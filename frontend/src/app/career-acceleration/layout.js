export const metadata = {
    title: 'Career Acceleration | AI-Powered Career Strategy',
    description: 'Accelerate your tech career with AI-powered strategy tools. Get personalized career paths, salary insights, and professional development plans.',
    keywords: ['career acceleration', 'career strategy', 'tech career', 'salary insights', 'professional development'],
    openGraph: {
        title: 'Career Acceleration | Zeeklect',
        description: 'AI-powered career strategy and acceleration tools.',
    },
};

export default function CareerAccelerationLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "AI Career Acceleration Engine",
                        "description": "AI-powered career acceleration with personalized roadmaps, salary benchmarks, and professional growth strategies.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "serviceType": "Career Development",
                        "areaServed": "Global"
                    })
                }}
            />
            {children}
        </>
    );
}
