'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Trophy,
    Zap,
    BookOpen,
    X,
    CheckCheck,
    Settings,
    Target,
    ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * NOTIFICATION DROPDOWN
 * Bell icon with dropdown panel showing recent notifications
 * Matches Extreme Elite design system with theme support
 * Now with localStorage persistence
 */

import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Type-based styling and icons
const TYPE_CONFIG = {
    achievement: { bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', icon: Trophy },
    reminder: { bg: 'bg-rose-500/10', iconColor: 'text-rose-500', icon: Zap },
    learning: { bg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', icon: BookOpen },
    system: { bg: 'bg-neutral-500/10', iconColor: 'text-neutral-500', icon: Bell },
    skill_decay: { bg: 'bg-amber-500/10', iconColor: 'text-amber-500', icon: AlertCircle },
    inactivity: { bg: 'bg-rose-500/10', iconColor: 'text-rose-500', icon: Zap },
    hiring_score_drop: { bg: 'bg-rose-500/10', iconColor: 'text-rose-500', icon: Target },
    validation_success: { bg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', icon: CheckCircle2 },
    score_milestone: { bg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', icon: Trophy },
};

// Format relative time
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const date = new Date(timestamp);
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { token } = useAuth();
    const dropdownRef = useRef(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch real notifications
    const { data: notificationsRes, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.getCareerNotifications(token),
        enabled: !!token,
        refetchInterval: 30000, // Poll every 30s for fresh alerts
    });

    const notifications = notificationsRes?.data || [];
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Mutation for marking as read
    const markReadMutation = useMutation({
        mutationFn: (id) => api.markNotificationRead(id, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    // Mutation for deleting/dismissing
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteNotification(id, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Mark all as read
    const handleMarkAllRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
        for (const id of unreadIds) {
            await markReadMutation.mutateAsync(id);
        }
    };

    // Mark single as read and navigate
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markReadMutation.mutateAsync(notification._id);
        }

        const actionLink = notification.type === 'skill_decay' 
            ? '/momentum#skill-evolution-hub' 
            : notification.actionLink;

        if (actionLink) {
            setIsOpen(false);
            router.push(actionLink);
        }
    };

    // Dismiss notification - NOW DELETES FROM DB
    const handleDismiss = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteMutation.mutateAsync(id);
        } catch (error) {
            console.error("Dismiss failed:", error);
        }
    };



    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    relative w-8 h-8 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl 
                    bg-[var(--site-text)]/5 text-[var(--site-text)] 
                    hover:bg-[var(--site-text)]/10 btn-tactile 
                    border border-[var(--card-border)]
                    transition-all duration-300 cursor-pointer
                    flex items-center justify-center flex-shrink-0
                    ${isOpen ? 'ring-2 ring-[var(--accent-primary)]/30' : ''}
                `}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Bell className="w-4 h-4" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-rose-500 text-white text-[9px] lg:text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Mobile Overlay (< 500px) - starts below navbar */}
                    <div
                        className="fixed inset-x-0 top-20 bottom-0 bg-black/20 backdrop-blur-sm z-[10000] min-[500px]:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        className={`
                            fixed min-[500px]:absolute 
                            inset-x-3 top-[72px] bottom-auto min-[500px]:inset-auto
                            min-[500px]:top-full min-[500px]:right-0 min-[500px]:mt-3
                            min-[500px]:w-[340px] md:w-96
                            max-h-[calc(100vh-100px)] min-[500px]:max-h-[450px]
                            bg-[var(--card-bg)] backdrop-blur-3xl
                            border border-[var(--card-border)]
                            rounded-2xl min-[500px]:rounded-3xl 
                            shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]
                            overflow-hidden z-[10001]
                            animate-in fade-in slide-in-from-top-2 duration-300
                        `}
                        role="dialog"
                        aria-label="Notifications"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--card-border)] bg-[var(--site-text)]/[0.02]">
                            <h3 className="text-sm font-black text-[var(--site-text)] uppercase tracking-[0.2em]">Career Alerts</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full animate-pulse">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[380px] overflow-y-auto scroll-smooth">
                            {notifications.length === 0 ? (
                                <div className="p-16 text-center opacity-40">
                                    <Bell size={40} className="mx-auto mb-4 text-[var(--site-text-muted)]" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)]">No active alerts</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                                    const IconComponent = config.icon || Bell;

                                    return (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`
                                                relative p-6 border-b border-[var(--card-border)] last:border-b-0
                                                transition-all duration-300 cursor-pointer
                                                hover:bg-[var(--site-text)]/[0.04]
                                                ${!notification.isRead ? 'bg-[var(--accent-primary)]/[0.03]' : ''}
                                                group
                                            `}
                                        >
                                            {/* Dismiss button - Absolute positioned for perfect alignment */}
                                            <button
                                                onClick={(e) => handleDismiss(notification._id, e)}
                                                className="absolute top-4 right-4 p-1.5 rounded-lg bg-[var(--site-text)]/0 hover:bg-rose-500/10 text-[var(--site-text-muted)] hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                                                aria-label="Dismiss"
                                            >
                                                <X size={14} />
                                            </button>

                                            {/* Unread indicator */}
                                            {!notification.isRead && (
                                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-sm shadow-[var(--accent-primary)]/50" />
                                            )}

                                            <div className="flex gap-4">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                                    <IconComponent size={18} className={config.iconColor} />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1.5 pr-6">
                                                        <p className="text-[13px] font-black text-[var(--site-text)] uppercase tracking-tight truncate">
                                                            {notification.title}
                                                        </p>
                                                    </div>
                                                    
                                                    <p className="text-[11px] text-[var(--site-text-muted)] leading-relaxed mb-4 opacity-80 line-clamp-2">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center justify-between gap-4 mt-auto">
                                                        <div className="flex items-center gap-3">
                                                            {!notification.isRead && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notification._id); }}
                                                                    className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 transition-all group/btn cursor-pointer bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10"
                                                                >
                                                                    <CheckCheck size={11} className="group-hover/btn:scale-125 transition-transform" /> Done
                                                                </button>
                                                            )}
                                                            {notification.actionLink && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const actionLink = notification.type === 'skill_decay' 
                                                                            ? '/momentum#skill-evolution-hub' 
                                                                            : notification.actionLink;
                                                                        if (actionLink) {
                                                                            setIsOpen(false);
                                                                            router.push(actionLink);
                                                                        }
                                                                    }}
                                                                    className="text-[9px] font-black text-[var(--accent-primary)] hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer bg-[var(--accent-primary)]/5 px-2 py-1 rounded-lg border border-[var(--accent-primary)]/10"
                                                                >
                                                                    Take Action <ArrowUpRight size={10} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] font-bold text-[var(--site-text-muted)] opacity-50 whitespace-nowrap">
                                                            {formatTimeAgo(notification.createdAt || notification.sentAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--site-text)]/[0.02]">
                            <button 
                                onClick={handleMarkAllRead}
                                className="w-full py-3 rounded-2xl text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] hover:bg-[var(--site-text)]/5 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={14} /> Mark all as read
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

