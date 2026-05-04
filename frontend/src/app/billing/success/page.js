'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import posthog from 'posthog-js';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { api } from '../../../services/api';

export default function BillingSuccessPage() {
  const { token, refreshUser } = useAuth();
  const { notify } = useNotification();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const res = await api.getSubscriptionStatus(token);
        if (res.success && res.data?.tier === 'pro') {
          await refreshUser?.();
          posthog.capture('checkout_completed', { source: 'stripe_success' });
          notify.success('Zeeklect Pro is now active.');
          clearInterval(interval);
        } else if (attempts >= 6) {
          clearInterval(interval);
        }
      } catch {
        if (attempts >= 6) clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [notify, refreshUser, token]);

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">Processing your Pro access</h1>
        <p className="text-sm font-bold text-[var(--site-text-muted)] leading-relaxed mb-6">
          Your payment was completed. We are syncing your subscription with Zeeklect now.
        </p>
        <div className="flex items-center justify-center gap-3 text-[var(--accent-primary)] font-black uppercase tracking-[0.24em] text-xs mb-8">
          <Loader2 size={16} className="animate-spin" /> Checking billing status
        </div>
        <Link href="/settings/billing" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-[0.24em] text-xs">
          Open Billing Settings
        </Link>
      </div>
    </div>
  );
}
