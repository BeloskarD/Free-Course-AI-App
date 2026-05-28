"use client";

import { useState, useEffect } from 'react';

// Singleton event bus for the modal to avoid requiring context providers
const listeners = new Set();
let modalState = {
  isOpen: false,
  featureName: '',
  upgradeHint: '',
  limitReached: false,
  targetTier: 'pro'
};

const notify = () => {
  listeners.forEach(listener => listener(modalState));
};

export const upgradeModalActions = {
  open: (options = {}) => {
    modalState = {
      isOpen: true,
      featureName: options.featureName || 'this feature',
      upgradeHint: options.upgradeHint || 'Upgrade to unlock full access.',
      limitReached: !!options.limitReached,
      targetTier: options.targetTier || 'pro'
    };
    notify();
  },
  close: () => {
    modalState = { ...modalState, isOpen: false };
    notify();
  }
};

export function useUpgradeModal() {
  const [state, setState] = useState(modalState);

  useEffect(() => {
    setState(modalState);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    openModal: upgradeModalActions.open,
    closeModal: upgradeModalActions.close
  };
}
