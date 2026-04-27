export const metadata = {
    title: 'Dashboard | Learning Command Center',
    description: 'Your personalized AI learning command center. Track progress, manage skills, view weekly plans, and monitor your learning momentum in real-time.',
    keywords: ['learning dashboard', 'skill tracker', 'progress monitor', 'AI learning', 'personalized education'],
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: 'Dashboard | Zeeklect',
        description: 'Your AI-powered learning command center.',
    },
};

export default function DashboardLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "Zeeklect Learning Dashboard",
                        "applicationCategory": "EducationalApplication",
                        "description": "AI-powered personalized learning dashboard with skill tracking, weekly plans, and progress analytics.",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
