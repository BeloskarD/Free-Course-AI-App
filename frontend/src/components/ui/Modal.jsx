'use client';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
  icon: CustomIcon
}) {
  const { isMounted } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !isMounted) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: {
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      border: 'border-emerald-500/20'
    },
    error: {
      gradient: 'from-red-500 to-rose-600',
      glow: 'shadow-red-500/30',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      border: 'border-red-500/20'
    },
    warning: {
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/30',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      border: 'border-amber-500/20'
    },
    info: {
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/30',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      border: 'border-blue-500/20'
    }
  };

  const Icon = CustomIcon || icons[type];
  const colorTheme = colors[type];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 sm:pt-24 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Professional Backdrop - matching ConfirmModal */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />

      {/* Centered Modal Container - Compact like ConfirmModal */}
      <div
        className="relative z-10 w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-4 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Modal Box - Compact Elite Frame like ConfirmModal */}
        <div className="relative bg-[var(--card-bg)] rounded-[2rem] shadow-2xl overflow-hidden border border-[var(--card-border)]">
          {/* Ambient Glow */}
          <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${colorTheme.gradient} opacity-15 blur-3xl pointer-events-none`} />
          <div className={`absolute -left-16 -bottom-16 w-32 h-32 bg-gradient-to-br ${colorTheme.gradient} opacity-10 blur-3xl pointer-events-none`} />

          {/* Close Button - Compact like ConfirmModal */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all hover:rotate-90 group btn-tactile border border-[var(--card-border)]"
            aria-label="Close"
          >
            <X size={16} className="text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
          </button>

          {/* Compact Content - matching ConfirmModal */}
          <div className="pt-10 pb-6 px-8 text-center">
            {/* Icon - Compact size like ConfirmModal */}
            <div className={`inline-flex w-16 h-16 rounded-2xl ${colorTheme.iconBg} ${colorTheme.iconColor} items-center justify-center mb-5 border ${colorTheme.border}`}>
              <Icon size={32} strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-[var(--site-text)] mb-2 tracking-tight">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-[var(--site-text-muted)] leading-relaxed font-medium">
              {message}
            </p>
          </div>

          {/* Action Button - Compact like ConfirmModal */}
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className={`w-full py-3.5 bg-gradient-to-r ${colorTheme.gradient} text-white font-black rounded-xl text-xs uppercase tracking-[0.15em] shadow-lg ${colorTheme.glow} hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 btn-tactile cursor-pointer`}
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
