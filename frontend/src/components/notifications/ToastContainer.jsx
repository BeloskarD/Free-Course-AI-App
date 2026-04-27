'use client';
import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    X,
    Zap
} from 'lucide-react';

/**
 * TOAST CONTAINER
 * Renders toast notifications in bottom-right corner
 * Fully responsive and theme-aware with Extreme Elite styling
 */

// Icon mapping for notification types
const TOAST_ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

// Style mapping for notification types
const TOAST_STYLES = {
    success: {
        border: 'border-l-emerald-500',
        iconColor: 'text-emerald-500',
        bg: 'bg-emerald-500/5',
    },
    error: {
        border: 'border-l-rose-500',
        iconColor: 'text-rose-500',
        bg: 'bg-rose-500/5',
    },
    warning: {
        border: 'border-l-amber-500',
        iconColor: 'text-amber-500',
        bg: 'bg-amber-500/5',
    },
    info: {
        border: 'border-l-indigo-500',
        iconColor: 'text-indigo-500',
        bg: 'bg-indigo-500/5',
    },
};

// Single toast component
function Toast({ notification, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const style = TOAST_STYLES[notification.type] || TOAST_STYLES.info;
    const IconComponent = TOAST_ICONS[notification.type] || Info;

    // Animate in on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // Handle dismiss with exit animation
    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
    };

    return (
        <div
            className={`
                relative w-full sm:w-[380px] p-4 rounded-2xl
                bg-[var(--card-bg)] backdrop-blur-xl
                border border-[var(--card-border)] border-l-4 ${style.border}
                shadow-[var(--shadow-elite)]
                transition-all duration-300 ease-out
                ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
                group cursor-pointer
            `}
            onClick={handleDismiss}
            role="alert"
            aria-live="polite"
        >
            {/* Subtle glow background */}
            <div className={`absolute inset-0 ${style.bg} rounded-2xl opacity-50`} />

            <div className="relative flex items-start gap-3 z-10">
                {/* Icon */}
                <div className={`mt-0.5 ${style.iconColor}`}>
                    <IconComponent size={20} strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {notification.title && (
                        <p className="font-black text-sm text-[var(--site-text)] mb-0.5 truncate">
                            {notification.title}
                        </p>
                    )}
                    <p className="text-sm font-bold text-[var(--site-text-muted)] leading-relaxed">
                        {notification.message}
                    </p>

                    {/* Action button if provided */}
                    {notification.actionUrl && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = notification.actionUrl;
                            }}
                            className="mt-2 text-xs font-black uppercase tracking-wider text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                        >
                            {notification.actionLabel || 'View'}
                            <Zap size={12} />
                        </button>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss();
                    }}
                    className="p-1 rounded-lg hover:bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Dismiss notification"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

// Main container component
export default function ToastContainer() {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 sm:bottom-6 sm:right-6"
            role="region"
            aria-label="Notifications"
        >
            {notifications.map((notification) => (
                <Toast
                    key={notification.id}
                    notification={notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
}
