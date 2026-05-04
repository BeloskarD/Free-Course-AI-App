'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Surface from '../../components/ui/Surface';

function PricingContent() {
  const { token, user } = useAuth();
  const { notify } = useNotification();
  const searchParams = useSearchParams();
  const [startingCheckout, setStartingCheckout] = useState(false);
  const source = searchParams.get('source') || 'pricing_page';

  const { data, isLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => api.getBillingPlans(),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    posthog.capture('pricing_view', { source, authenticated: Boolean(user) });
  }, [source, user]);

  const plans = data?.data || [];
  const freePlan = useMemo(() => plans.find((plan) => plan.id === 'free'), [plans]);
  const proPlan = useMemo(() => plans.find((plan) => plan.id === 'pro'), [plans]);

  const handleCheckout = async () => {
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    setStartingCheckout(true);
    posthog.capture('checkout_started', { source });

    try {
      const res = await api.createCheckoutSession(token, source);
      if (!res.success || !res.data?.url) {
        throw new Error(res.message || 'Unable to start checkout right now.');
      }
      window.location.href = res.data.url;
    } catch (error) {
      notify.error(error.message || 'Unable to start checkout right now.');
      setStartingCheckout(false);
    }
  };

  const planFeatureRows = [
    { label: 'Weekly skill validations', freeValue: freePlan?.limits?.validation_limit || 3, proValue: 'Unlimited' },
    { label: 'Advanced career insights', freeValue: 'Preview', proValue: 'Included' },
    { label: 'Managed billing portal', freeValue: 'No', proValue: 'Included' },
  ];

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14 px-1">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <ShieldCheck size={16} className="text-[var(--accent-primary)]" /> Zeeklect Pro
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight leading-[1.05] mb-5">
            Unlock your full hiring signal.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[var(--site-text-muted)] font-bold max-w-3xl mx-auto leading-relaxed">
            Keep the current experience you already know, then remove usage friction with a single monthly plan built around deeper career execution.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] gap-6 xl:gap-8 items-start">
          <Surface className="p-5 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem]">
            <div className="flex flex-col gap-6 sm:gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--site-text-muted)] mb-3">Included with Pro</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Unlimited weekly skill validations',
                    'More room for repeated proof-of-work practice',
                    'Advanced insights support',
                    'Managed billing through Stripe portal',
                  ].map((feature) => (
                    <div key={feature} className="rounded-3xl border border-[var(--card-border)] bg-[var(--site-text)]/5 p-4 sm:p-5 flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={18} />
                      </div>
                      <p className="text-sm font-black leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--card-border)] overflow-hidden">
                <div className="grid grid-cols-[minmax(140px,1.2fr)_minmax(90px,1fr)_minmax(110px,1fr)] text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-[var(--site-text-muted)] bg-[var(--site-text)]/5">
                  <div className="px-4 py-4">Feature</div>
                  <div className="px-4 py-4 border-l border-[var(--card-border)]">Free</div>
                  <div className="px-4 py-4 border-l border-[var(--card-border)]">Pro</div>
                </div>
                {planFeatureRows.map((row) => (
                  <div key={row.label} className="grid grid-cols-[minmax(140px,1.2fr)_minmax(90px,1fr)_minmax(110px,1fr)] border-t border-[var(--card-border)] text-xs sm:text-sm font-bold">
                    <div className="px-4 py-4 leading-relaxed">{row.label}</div>
                    <div className="px-4 py-4 border-l border-[var(--card-border)] text-[var(--site-text-muted)]">{row.freeValue}</div>
                    <div className="px-4 py-4 border-l border-[var(--card-border)] text-[var(--accent-primary)]">{row.proValue}</div>
                  </div>
                ))}
              </div>
            </div>
          </Surface>

          <Surface className="p-5 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600" />
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--site-text-muted)] mb-2">Monthly Plan</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Zeeklect Pro</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Sparkles size={22} />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-end gap-2">
                <span className="text-5xl sm:text-6xl font-black tracking-tight">${proPlan?.price || 12}</span>
                <span className="text-sm font-black uppercase tracking-[0.25em] text-[var(--site-text-muted)] pb-2">/ month</span>
              </div>
              <p className="text-sm text-[var(--site-text-muted)] font-bold mt-3 leading-relaxed">
                Designed to keep the current flow intact while unlocking unlimited signal-building validation work.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                'Fast hosted Stripe checkout',
                'No UI disruption to the current product flow',
                'Cancel or manage billing in your account settings',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-bold">
                  <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                disabled={startingCheckout || isLoading}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs sm:text-sm font-black uppercase tracking-[0.28em] shadow-xl shadow-indigo-500/20 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              >
                {startingCheckout ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Start Pro Monthly
              </button>

              {!token ? (
                <Link href="/auth/login" className="block text-center text-[11px] font-black uppercase tracking-[0.24em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                  Sign in required to subscribe
                </Link>
              ) : null}

              <Link href="/settings/billing" className="block text-center text-[11px] font-black uppercase tracking-[0.24em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                Already subscribed? Manage billing
              </Link>
            </div>
          </Surface>
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12"><div className="max-w-[1600px] mx-auto flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" /></div></main>}>
      <PricingContent />
    </Suspense>
  );
}
