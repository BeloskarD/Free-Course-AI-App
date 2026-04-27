export const metadata = {
    title: 'YouTube Mentors | Curated Video Learning',
    description: 'Discover the best YouTube tutorials and tech mentors. AI-curated video content for developers, designers, and tech professionals.',
    keywords: ['YouTube tutorials', 'tech mentors', 'coding videos', 'programming tutorials', 'video learning'],
    openGraph: {
        title: 'YouTube Mentors | Zeeklect',
        description: 'AI-curated YouTube tutorials from top tech mentors.',
        images: ['/og-image.png'],
    },
};

export default function YouTubeLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "CollectionPage",
                        "name": "Curated YouTube Mentors & Tutorials",
                        "description": "A curated collection of the best YouTube channels and tutorials for technology learning.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "about": {
                            "@type": "Thing",
                            "name": "Technology Education Videos"
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
