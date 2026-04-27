'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }) {
    useEffect(() => {
      const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      if (apiKey) {
        posthog.init(apiKey, {
          api_host: host,
          person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
          capture_pageview: false // Disable automatic pageview capture, as we capture manually
        })
      }
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}
