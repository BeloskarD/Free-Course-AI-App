'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full rounded-[2rem] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 sm:p-10 text-center shadow-xl">
        <h1 className="text-3xl font-black tracking-tight mb-3">Checkout canceled</h1>
        <p className="text-sm font-bold text-[var(--site-text-muted)] leading-relaxed mb-8">
          No changes were made to your subscription. You can return anytime when you want unlimited validation access.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing" className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black uppercase tracking-[0.24em] text-xs">
            Back to pricing
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-[var(--card-border)] bg-[var(--site-text)]/5 font-black uppercase tracking-[0.24em] text-xs">
            <ArrowLeft size={14} /> Return to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
