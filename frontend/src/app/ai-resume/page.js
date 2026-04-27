'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIResumeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard with the portfolio tab active
    router.replace('/dashboard?tab=portfolio');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-[var(--site-text-muted)] font-black uppercase tracking-[0.3em] text-xs">
          Redirecting to AI Resume Intelligence...
        </p>
      </div>
    </div>
  );
}
