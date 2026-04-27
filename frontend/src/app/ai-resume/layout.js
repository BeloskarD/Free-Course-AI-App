export const metadata = {
    title: 'AI Resume Builder | Professional Profile Generator',
    description: 'Create ATS-optimized resumes with AI. Generate professional profiles, cover letters, and career summaries tailored to your target roles.',
    keywords: ['AI resume builder', 'ATS resume', 'professional profile', 'cover letter generator', 'career summary'],
    openGraph: {
        title: 'AI Resume Builder | Zeeklect',
        description: 'AI-powered ATS-optimized resume and profile generator.',
    },
};

export default function AIResumeLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "Zeeklect AI Resume Builder",
                        "description": "AI-powered resume and professional profile generation with ATS optimization.",
                        "provider": {
                            "@type": "Organization",
                            "name": "Zeeklect"
                        },
                        "serviceType": "Resume Building",
                        "areaServed": "Global"
                    })
                }}
            />
            {children}
        </>
    );
}
