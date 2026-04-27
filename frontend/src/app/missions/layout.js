export const metadata = {
    title: 'Learning Missions | Human-Like Project Experience',
    description: 'Master tech skills by completing real-world missions. Project-based learning with AI guidance, milestones, and verifiable proof of competence.',
    keywords: ['project based learning', 'coding missions', 'hands-on tech training', 'skill verification', 'learning by doing'],
    robots: {
        index: false,
        follow: false,
    },
};

export default function MissionsLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "CreativeWork",
                        "name": "Learning Missions Framework",
                        "description": "A project-based learning framework that transforms information into practical missions.",
                        "creator": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "educationalLevel": "Intermediate to Advanced"
                    })
                }}
            />
            {children}
        </>
    );
}
