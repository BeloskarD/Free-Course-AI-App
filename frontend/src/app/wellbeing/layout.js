export const metadata = {
    title: 'Wellbeing | Learning-Life Balance',
    description: 'Maintain a healthy learning-life balance with AI-powered wellbeing tools. Track mood, manage breaks, and build sustainable study habits.',
    keywords: ['learning wellbeing', 'study-life balance', 'mood tracking', 'break reminders', 'healthy learning habits'],
    openGraph: {
        title: 'Wellbeing | Zeeklect',
        description: 'AI-powered learning wellbeing and balance tools.',
    },
};

export default function WellbeingLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "Zeeklect Wellbeing Hub",
                        "applicationCategory": "HealthApplication",
                        "description": "Learning-life balance tools with mood tracking, break management, and sustainable habit building.",
                        "operatingSystem": "Web",
                        "featureList": ["Mood Tracking", "Break Reminders", "Focus Sessions", "Wellbeing Analytics"]
                    })
                }}
            />
            {children}
        </>
    );
}
