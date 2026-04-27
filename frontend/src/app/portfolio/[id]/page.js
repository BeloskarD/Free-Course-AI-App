import React from 'react';
import PortfolioClient from './PortfolioClient';
import { getServerApiBaseUrl, getPublicAppUrl } from '../../../lib/runtimeConfig';

// ========================================
// SERVER-SIDE SEO HANDLER
// ========================================

async function getPortfolioData(id) {
    if (!id || id === 'undefined') return null;
    const API_BASE = getServerApiBaseUrl();

    try {
        console.log(`[SSR Fetch] Portfolio Request: ${id} from ${API_BASE}`);
        
        // Implementation of AbortController for timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const response = await fetch(`${API_BASE}/portfolio/${id}`, {
            next: { revalidate: 3600 },
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[SSR Fetch Error] Status: ${response.status} URL: ${API_BASE}/portfolio/${id}`);
            return null;
        }

        const result = await response.json();
        return result.success ? result.data : null;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error("[SSR Timeout] Request timed out for ID:", id);
        } else {
            console.error("[SSR Fetch Exception] Message:", err.message);
        }
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const data = await getPortfolioData(id);

    if (!data) return { title: 'Elite Portfolio | Zeeklect' };

    const { user, profile } = data;
    const bio = profile.professionalSummary || `${user.name} is a verified innovator on the Zeeklect protocol.`;

    return {
        title: `${user.name} | ${profile.targetRole || 'Verified Innovator'} | Zeeklect Portfolio`,
        description: bio,
        openGraph: {
            title: `${user.name}'s Professional Portfolio`,
            description: bio,
            images: [user.avatar || '/zeeklect-icon.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${user.name} | Elite Resume`,
            description: bio,
        }
    };
}

export default async function PortfolioPage({ params }) {
    const { id } = await params;
    const initialData = await getPortfolioData(id);
    const publicUrl = getPublicAppUrl();

    if (!initialData) {
        // Return structured UI for 404/Error state
        return <PortfolioClient initialData={null} id={id} error="The requested portfolio could not be retrieved. It may be private or temporarily unavailable." />;
    }

    const { user, profile } = initialData;

    // Structured Data (JSON-LD) - Dynamic URL resolution
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": user.name,
        "jobTitle": profile.targetRole,
        "description": profile.professionalSummary,
        "url": `${publicUrl}/portfolio/${id}`,
        "image": user.avatar,
        "sameAs": [
            profile.socialLinks?.linkedin,
            profile.socialLinks?.github,
            profile.socialLinks?.twitter
        ].filter(Boolean)
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PortfolioClient initialData={initialData} id={id} />
        </>
    );
}
