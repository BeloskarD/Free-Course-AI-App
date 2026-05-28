"use client";

import { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { analytics } from '../lib/analytics';

export function useCheckout() {
  const { token } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleUpgrade = async (tier, source = 'unknown') => {
    if (!token) {
      window.location.href = '/auth/login?redirect=/pricing';
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      analytics.checkoutStarted(tier, { source });
      
      const response = await api.createCheckoutSession(token, tier);
      
      if (response.success && response.data?.url) {
        // Direct redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error(response.error || 'Failed to initialize checkout');
      }
    } catch (err) {
      console.error('[Checkout] Upgrade failed:', err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return { handleUpgrade, isProcessing, error };
}
