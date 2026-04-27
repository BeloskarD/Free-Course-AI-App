"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle,
  ExternalLink,
  Check
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const NotificationBell = () => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notificationsRes, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.getCareerNotifications(token),
    enabled: !!token,
    refetchInterval: 30000, // Check every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.markNotificationRead(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const notifications = notificationsRes?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case 'skill_decay': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'validation_success': return <ShieldCheck className="text-emerald-500" size={18} />;
      case 'score_milestone': return <TrendingUp className="text-indigo-500" size={18} />;
      default: return <Bell className="text-indigo-500" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] flex items-center justify-center hover:bg-[var(--site-text)]/10 transition-all"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-indigo-500 animate-pulse' : 'text-[var(--site-text-muted)]'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[var(--site-bg)]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-[var(--card-border)] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between">
                <h3 className="text-sm font-black text-[var(--site-text)] uppercase tracking-widest">Career Alerts</h3>
                <span className="text-[10px] font-bold text-[var(--site-text-muted)] uppercase tracking-widest">{unreadCount} New</span>
              </div>

              <div className="max-h-[70vh] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      className={`p-5 border-b border-[var(--card-border)] hover:bg-[var(--site-text)]/5 transition-all relative ${!notif.isRead ? 'bg-indigo-500/5' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-[var(--site-text)] mb-1">{notif.title}</p>
                          <p className="text-[11px] text-[var(--site-text-muted)] leading-relaxed mb-3">{notif.message}</p>
                          
                          <div className="flex items-center gap-3">
                            {notif.actionLink && (
                              <Link 
                                href={notif.actionLink}
                                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:underline"
                              >
                                Take Action <ExternalLink size={10} />
                              </Link>
                            )}
                            {!notif.isRead && (
                              <button 
                                onClick={() => markReadMutation.mutate(notif._id)}
                                className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"
                              >
                                Mark as Read <Check size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center opacity-40">
                    <Bell className="mx-auto mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No notifications yet</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-[var(--site-text)]/5 text-center">
                  <button className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] hover:text-indigo-500 transition-all">
                    View All Activity
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
