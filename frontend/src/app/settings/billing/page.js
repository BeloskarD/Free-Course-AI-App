'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { api } from '../../../services/api';

export default function BillingSettingsPage() {
  const { token, user } = useAuth();
  const { notify } = useNotification();
  const [busyAction, setBusyAction] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['billing-subscription', user?.id],
    queryFn: () => api.getSubscriptionStatus(token),
    enabled: !!token,
    staleTime: 1000 * 30,
  });

  const subscription = data?.data;
  const proPlan = useMemo(() => subscription?.plans?.find((plan) => plan.id === 'pro'), [subscription]);

  const startCheckout = async () => {
    setBusyAction('checkout');
    posthog.capture('upgrade_cta_clicked', { source: 'settings_billing' });
    try {
      const res = await api.createCheckoutSession(token, 'settings_billing');
      if (!res.success || !res.data?.url) {
        throw new Error(res.message || 'Unable to open checkout right now.');
      }
      window.location.href = res.data.url;
    } catch (error) {
      notify.error(error.message || 'Unable to open checkout right now.');
      setBusyAction(null);
    }
  };

  const openPortal = async () => {
    setBusyAction('portal');
    posthog.capture('billing_portal_opened', { source: 'settings_billing' });
    try {
      const res = await api.createBillingPortalSession(token);
      if (!res.success || !res.data?.url) {
        throw new Error(res.message || 'Unable to open billing portal right now.');
      }
      window.location.href = res.data.url;
    } catch (error) {
      notify.error(error.message || 'Unable to open billing portal right now.');
      setBusyAction(null);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-xl font-black text-[var(--site-text)] mb-3">Login required</p>
          <p className="text-sm font-bold text-[var(--site-text-muted)] mb-6">Please sign in to manage your Zeeklect subscription.</p>
          <Link href="/auth/login" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[var(--accent-primary)] text-white font-black uppercase tracking-[0.24em] text-xs">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <Link href="/settings/profile" className="inline-flex items-center gap-2 text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] mb-6 sm:mb-8 transition-colors font-bold">
          <ArrowLeft size={18} /> Back to settings
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-6 xl:gap-8">
          <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Billing Settings</h1>
                <p className="text-sm font-bold text-[var(--site-text-muted)] mt-1">Manage your current Zeeklect plan without changing the rest of your workflow.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--site-text)]/5 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] mb-2">Current tier</p>
                    <p className="text-2xl font-black capitalize">{subscription?.tier || 'free'}</p>
                  </div>
                  <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--site-text)]/5 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] mb-2">Status</p>
                    <p className="text-2xl font-black capitalize">
                      {subscription?.tier === 'free' ? 'Active' : (subscription?.status || 'inactive')}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--site-text)]/5 p-5 sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] mb-2">Current plan</p>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <p className="text-2xl sm:text-3xl font-black">{subscription?.planLabel || 'Free'}</p>
                      <p className="text-sm font-bold text-[var(--site-text-muted)] mt-2">
                        {subscription?.currentPeriodEnd ? `Current period ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.` : 'No active billing period yet.'}
                      </p>
                      {subscription?.cancelAtPeriodEnd ? (
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 mt-3">Cancellation scheduled at period end</p>
                      ) : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-4xl font-black">${proPlan?.price || 12}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--site-text-muted)]">monthly</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black">Plan Actions</h2>
                <p className="text-xs font-bold text-[var(--site-text-muted)]">Optimized for your current flow</p>
              </div>
            </div>

            <div className="space-y-3">
              {subscription?.tier === 'pro' ? (
                <button
                  onClick={openPortal}
                  disabled={busyAction === 'portal'}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-[0.28em] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                >
                  {busyAction === 'portal' ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  Manage Billing
                </button>
              ) : (
                <button
                  onClick={startCheckout}
                  disabled={busyAction === 'checkout'}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-[0.28em] cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                >
                  {busyAction === 'checkout' ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  Upgrade to Pro
                </button>
              )}

              <button
                onClick={() => refetch()}
                className="w-full px-6 py-3 rounded-3xl border border-[var(--card-border)] bg-[var(--site-text)]/5 text-[var(--site-text)] text-xs font-black uppercase tracking-[0.24em] cursor-pointer"
              >
                Refresh Billing Status
              </button>

              <Link href="/pricing" className="block text-center text-[11px] font-black uppercase tracking-[0.24em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                View pricing page
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
