'use client';
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * NOTIFICATION CONTEXT
 * Global state management for toast notifications and alerts
 * Provides: addNotification, removeNotification, notifications list
 */

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // Add a new notification
    const addNotification = useCallback((type, message, options = {}) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const notification = {
            id,
            type, // 'success' | 'error' | 'warning' | 'info'
            message,
            title: options.title || null,
            icon: options.icon || null,
            duration: options.duration || 4000, // Default 4 seconds
            actionUrl: options.actionUrl || null,
            actionLabel: options.actionLabel || null,
            createdAt: new Date(),
        };

        setNotifications(prev => {
            // Max 3 visible toasts at once - remove oldest if needed
            const updated = [...prev, notification];
            if (updated.length > 3) {
                return updated.slice(-3);
            }
            return updated;
        });

        // Auto-dismiss after duration
        if (notification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration);
        }

        return id;
    }, []);

    // Remove a notification by ID
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Shorthand methods for common notification types
    const notify = useMemo(() => ({
        success: (message, options) => addNotification('success', message, options),
        error: (message, options) => addNotification('error', message, options),
        warning: (message, options) => addNotification('warning', message, options),
        info: (message, options) => addNotification('info', message, options),
    }), [addNotification]);

    const value = useMemo(() => ({
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        notify,
    }), [notifications, addNotification, removeNotification, clearAll, notify]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

// Custom hook to use notification context
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
