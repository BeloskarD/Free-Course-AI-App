export const metadata = {
    title: 'Courses | Curated Learning Library',
    description: 'Browse thousands of curated courses from top platforms. AI-powered recommendations tailored to your career goals and skill gaps.',
    keywords: ['online courses', 'free courses', 'curated learning', 'AI course recommendations', 'skill development courses'],
    openGraph: {
        title: 'Courses | Zeeklect',
        description: 'Curated course library with AI-powered recommendations.',
        images: ['/og-image.png'],
    },
};

export default function CoursesLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "Curated Learning Courses",
                        "description": "A curated collection of the best online courses across technology, design, and business domains.",
                        "itemListOrder": "https://schema.org/ItemListOrderDescending",
                        "numberOfItems": "1000+",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        }
                    })
                }}
            />
            {children}
        </>
    );
}
