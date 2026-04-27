export const metadata = {
    title: 'Skill Graph | Visual Competency Map',
    description: 'Visualize your skill ecosystem with an interactive network graph. See how your competencies interconnect and identify strategic growth paths.',
    keywords: ['skill graph', 'competency map', 'skill visualization', 'knowledge graph', 'skill network'],
    openGraph: {
        title: 'Skill Graph | Zeeklect',
        description: 'Interactive skill ecosystem visualization and competency mapping.',
    },
};

export default function SkillGraphLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "Zeeklect Skill Graph",
                        "applicationCategory": "EducationalApplication",
                        "description": "Interactive skill network visualization showing competency interconnections and growth pathways.",
                        "operatingSystem": "Web"
                    })
                }}
            />
            {children}
        </>
    );
}
