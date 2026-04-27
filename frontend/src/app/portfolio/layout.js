export const metadata = {
    title: 'Portfolio | Professional Showcase Builder',
    description: 'Build a stunning professional portfolio powered by AI. Showcase your projects, skills, and achievements to potential employers and collaborators.',
    keywords: ['portfolio builder', 'professional portfolio', 'project showcase', 'developer portfolio', 'AI portfolio'],
    openGraph: {
        title: 'Portfolio | Zeeklect',
        description: 'AI-powered professional portfolio builder.',
    },
};

export default function PortfolioLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "CreativeWork",
                        "name": "Zeeklect Portfolio Builder",
                        "description": "AI-powered professional portfolio builder for showcasing projects, skills, and career achievements.",
                        "creator": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "genre": "Professional Development"
                    })
                }}
            />
            {children}
        </>
    );
}
