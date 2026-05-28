'use client';
import React, { useState } from 'react';
import { Shield, Check, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const tiers = [
  { id: 'free', label: 'Free', color: 'bg-slate-500' },
  { id: 'pro', label: 'Pro', color: 'bg-indigo-600' },
  { id: 'career_plus', label: 'Career+', color: 'bg-purple-600' }
];

export default function DevTierSwitcher({ compact = false }) {
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(null);
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleSwitch = async (tierId) => {
    if (user.subscriptionTier === tierId) return;
    
    setLoading(tierId);
    try {
      const result = await api.updateUserTier(tierId, token);
      if (result.success) {
        updateUser({ subscriptionTier: tierId });
        queryClient.invalidateQueries();
      }
    } catch (error) {
      console.error('Failed to update tier:', error);
    } finally {
      setLoading(null);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-1 p-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
        {tiers.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSwitch(t.id)}
            disabled={loading !== null}
            className={`
              px-2 py-1 text-[9px] font-bold rounded uppercase transition-all
              ${user.subscriptionTier === t.id 
                ? `${t.color} text-white shadow-lg` 
                : 'text-white/40 hover:text-white hover:bg-white/10'}
              ${loading === t.id ? 'animate-pulse opacity-50' : ''}
            `}
          >
            {loading === t.id ? <Loader2 size={8} className="animate-spin" /> : t.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Shield size={12} className="text-indigo-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Test Mode</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {tiers.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSwitch(t.id)}
            disabled={loading !== null}
            className={`
              flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all
              ${user.subscriptionTier === t.id 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}
              ${loading === t.id ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span>{t.label}</span>
            {user.subscriptionTier === t.id && <Check size={12} />}
            {loading === t.id && <Loader2 size={12} className="animate-spin" />}
          </button>
        ))}
      </div>
    </div>
  );
}
