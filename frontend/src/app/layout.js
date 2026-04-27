import './globals.css';
import ClientShell from '../components/layout/ClientShell';
import AICompanion from '../components/AICompanion';
import GlobalBreakReminder from '../components/wellbeing/GlobalBreakReminder';
import MoodCheckIn from '../components/wellbeing/MoodCheckIn';
import ToastContainer from '../components/notifications/ToastContainer';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider as GlobalAuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { GuardianProvider } from '../context/GuardianContext';
import { QueryProviders } from '../app/lib/queryClient';
import { Inter, Outfit } from 'next/font/google';
import { PostHogProvider } from './lib/posthog';
import PostHogPageView from './PostHogPageView';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800', '900'], display: 'swap', variable: '--font-outfit' });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_BASE_URL is missing in production!'); })() : 'http://localhost:3000');

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Zeeklect | Seek Intelligence - AI Career Engine',
    template: '%s | Zeeklect'
  },
  description: 'AI-powered career automation engine with adaptive skill analysis, smart roadmaps, and opportunity radar.',
  keywords: ['AI learning', 'online courses', 'skill development', 'career growth', 'learning platform', 'AI tools', 'skill gap analysis', 'AI resume builder', 'skill gap analyzer', 'career pathway planner'],
  authors: [{ name: 'Zeeklect' }],
  creator: 'Zeeklect',
  publisher: 'Zeeklect',
  icons: {
    icon: '/zeeklect-icon.png',
    shortcut: '/zeeklect-icon.png',
    apple: '/zeeklect-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Zeeklect',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Zeeklect - AI Learning Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeeklect | Seek Intelligence - AI Learning Platform',
    description: 'AI-powered learning with curated courses, personalized roadmaps, and career development tools.',
    images: ['/opengraph-image'],
  },
  alternates: {
    canonical: baseUrl,
  },
  // Additional SEO settings
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <meta name="format-detection" content="telephone=no" />
        {/* Organization JSON-LD for rich search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Zeeklect",
              "description": "AI-powered learning platform with curated courses, personalized roadmaps, and career development tools.",
              "url": baseUrl,
              "logo": `${baseUrl}/zeeklect-logo.png`,
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "availableLanguage": "English"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free AI-powered learning platform"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-outfit text-[var(--site-text)]`} suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-[var(--accent-primary)] focus:text-white focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>

        <PostHogProvider>
          <PostHogPageView />
          <ThemeProvider>
            <GlobalAuthProvider>
              <QueryProviders>
                <NotificationProvider>
                  <GuardianProvider>
                    <ClientShell>
                      {children}
                    </ClientShell>
                    <AICompanion />
                    <GlobalBreakReminder />
                    <MoodCheckIn />
                    <ToastContainer />
                  </GuardianProvider>
                </NotificationProvider>
              </QueryProviders>
            </GlobalAuthProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
