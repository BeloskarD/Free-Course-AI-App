'use client';
import { X, AlertTriangle, Info, Trash2, BookmarkCheck, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger', 'warning', 'info', 'success'
  isLoading = false
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
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen || !isMounted) return null;

  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    info: Info,
    success: BookmarkCheck
  };

  const colors = {
    danger: {
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
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-blue-500/30',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      border: 'border-blue-500/20'
    },
    success: {
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      border: 'border-emerald-500/20'
    }
  };

  const Icon = icons[type] || Info;
  const colorTheme = colors[type] || colors.info;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-20 sm:pt-24 animate-in fade-in duration-300"
      onClick={isLoading ? undefined : onClose}
    >
      {/* Professional Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />

      {/* Centered Modal Container */}
      <div
        className="relative z-10 w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-4 duration-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Modal Box - Compact Elite Frame */}
        <div className="relative bg-[var(--card-bg)] rounded-[2rem] shadow-2xl overflow-hidden border border-[var(--card-border)]">
          {/* Ambient Glow */}
          <div className={`absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br ${colorTheme.gradient} opacity-15 blur-3xl pointer-events-none`} />
          <div className={`absolute -left-16 -bottom-16 w-32 h-32 bg-gradient-to-br ${colorTheme.gradient} opacity-10 blur-3xl pointer-events-none`} />

          {/* Close Button */}
          {!isLoading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 flex items-center justify-center transition-all hover:rotate-90 group btn-tactile border border-[var(--card-border)]"
              aria-label="Close"
            >
              <X size={16} className="text-[var(--site-text-muted)] group-hover:text-rose-500 transition-colors" />
            </button>
          )}

          {/* Compact Content */}
          <div className="pt-10 pb-6 px-8 text-center">
            {/* Icon */}
            <div className={`inline-flex w-16 h-16 rounded-2xl ${colorTheme.iconBg} ${colorTheme.iconColor} items-center justify-center mb-5 border ${colorTheme.border}`}>
              <Icon size={32} strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-[var(--site-text)] mb-2 tracking-tight">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-[var(--site-text-muted)] leading-relaxed font-medium line-clamp-3">
              {message}
            </p>
          </div>

          {/* Action Buttons - Horizontal */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 py-3.5 bg-[var(--site-text)]/5 hover:bg-[var(--site-text)]/10 text-[var(--site-text)] font-black rounded-xl text-xs uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95 btn-tactile border border-[var(--card-border)] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 py-3.5 bg-gradient-to-r ${colorTheme.gradient} text-white font-black rounded-xl text-xs uppercase tracking-[0.15em] shadow-lg ${colorTheme.glow} hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 btn-tactile flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
