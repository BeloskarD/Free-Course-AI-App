export const metadata = {
    title: 'AI Tools Command Center | Professional AI Directory',
    description: 'Discover and compare the best AI tools for developers, designers, and marketers. Professional directory with side-by-side comparison features.',
    keywords: ['AI tools', 'AI directory', 'best AI tools 2026', 'AI comparison', 'productivity tools'],
    openGraph: {
        title: 'AI Tools Command Center | Zeeklect',
        description: 'The definitive directory for professional AI tools.',
        images: ['/og-tools.png'],
    },
};

export default function AIToolsLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zeeklect AI Tools Navigator",
                        "applicationCategory": "EducationalApplication",
                        "description": "A comprehensive navigator and comparison engine for professional AI tools.",
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
