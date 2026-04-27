export const metadata = {
    title: 'Mission Hub | Project-Based Learning',
    description: 'Explore curated learning missions and project-based challenges. Build real-world skills through hands-on projects with AI mentorship.',
    keywords: ['project based learning', 'coding missions', 'hands-on projects', 'learning challenges', 'skill building'],
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: 'Mission Hub | Zeeklect',
        description: 'Project-based learning missions with AI mentorship.',
    },
};

export default function MissionHomeLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "CreativeWork",
                        "name": "Zeeklect Mission Hub",
                        "description": "A curated collection of project-based learning missions for hands-on skill development.",
                        "creator": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "educationalLevel": "Beginner to Advanced",
                        "learningResourceType": "Project"
                    })
                }}
            />
            {children}
        </>
    );
}
