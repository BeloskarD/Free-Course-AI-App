'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Rocket,
  Zap,
  Heart,
  BarChart3,
  Briefcase,
  Brain,
  BookOpen,
  Wrench,
  Youtube,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Bell,
  Search,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const sidebarGroups = [
  {
    label: 'Evolution Hub',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Sparkles },
      { name: 'Missions', href: '/missions', icon: Rocket },
      { name: 'Courses', href: '/courses', icon: BookOpen },
    ],
  },
  {
    label: 'Growth Hub',
    items: [
      { name: 'Performance', href: '/growth', icon: Zap },
      { name: 'Momentum', href: '/momentum', icon: BarChart3 },
      { name: 'Wellbeing', href: '/wellbeing', icon: Heart },
    ],
  },
  {
    label: 'Intelligence Hub',
    items: [
      { name: 'Career Radar', href: '/career-acceleration', icon: Briefcase },
      { name: 'AI Resume', href: '/ai-resume', icon: FileText },
      { name: 'Skill Graph', href: '/skill-graph', icon: Brain },
      { name: 'Gap Analysis', href: '/skill-analysis', icon: BarChart3 },
      { name: 'AI Intel', href: '/ai-intelligence', icon: Sparkles },
    ],
  },
  {
    label: 'Resources Hub',
    items: [
      { name: 'AI Tools', href: '/ai-tools', icon: Wrench },
      { name: 'Youtube Mentors', href: '/youtube', icon: Youtube },
      { name: 'Portfolio', href: '/dashboard?tab=portfolio', icon: LayoutDashboard },
    ],
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = React.useRef(null);

  // Removed: if (!user) return null; (Handled by ClientShell and conditional rendering below)

  // Reset scroll position on mount or when navigation drawer opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isMobileOpen]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const isActive = (href) => {
    // Exact match or contains tab parameter
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      return pathname === path && searchParams.toString().includes(query);
    }
    
    // If it's a base dashboard link, only active if NO tab parameter is present in URL
    if (href === '/dashboard' && pathname === '/dashboard') {
      return !searchParams.toString().includes('tab=');
    }

    // Special case for AI Resume which redirects to /dashboard?tab=portfolio
    if (href === '/ai-resume' && pathname === '/dashboard' && searchParams.get('tab') === 'portfolio') {
      return true;
    }

    // Special case for Career Intelligence related routes
    if (href === '/career-acceleration' && pathname === '/opportunity-radar') {
      return true;
    }

    return pathname === href;
  };

  const getInitials = (name, email) => {
    if (name && name !== 'User' && name !== 'N/A' && name !== 'No Name' && name !== 'Anonymous') {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length > 0) {
        return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
      }
    }
    return (email?.[0] || 'U').toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen bg-[var(--card-bg)] border-r border-[var(--card-border)] z-[9999]
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${(isCollapsed && !isMobileOpen) ? 'w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--card-border)] overflow-hidden">
          <Link href="/mission-home" className="flex items-center gap-3 shrink-0">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white shrink-0">
                <Sparkles size={18} />
             </div>
             {!isCollapsed && (
               <span className="text-xl font-black tracking-tighter text-[var(--site-text)] animate-in fade-in slide-in-from-left-4 duration-500">
                 ZEEKLECT <span className="text-[var(--accent-primary)]">OS</span>
               </span>
             )}
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar"
        >
          {sidebarGroups.map((group, groupIdx) => (
            <div key={group.label} className={`mb-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
              {!isCollapsed && (
                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] mb-3 px-2 opacity-60">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="h-[1px] bg-[var(--card-border)] mb-4 mx-2" />}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  // Disable non-public items for guests (or let them click and redirect)
                  const isPublic = ['/ai-intelligence', '/courses', '/ai-tools', '/youtube', '/skill-analysis', '/mission-home'].some(route => item.href.startsWith(route)) || item.href === '/';
                  
                  if (!user && !isPublic) return null;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        group relative flex items-center rounded-xl transition-all duration-200 h-10 cursor-pointer
                        ${(isCollapsed && !isMobileOpen) ? 'justify-center' : 'px-3 gap-3'}
                        ${active 
                          ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm' 
                          : 'text-[var(--site-text-muted)] hover:bg-[var(--site-text)]/5 hover:text-[var(--site-text)]'
                        }
                      `}
                      title={(isCollapsed && !isMobileOpen) ? item.name : ''}
                    >
                      <div className={`
                        shrink-0 transition-transform duration-200 group-hover:scale-110
                        ${active ? 'text-[var(--accent-primary)]' : 'text-[var(--site-text-muted)] group-hover:text-[var(--site-text)]'}
                      `}>
                        <Icon size={18} />
                      </div>
                      
                      {(!isCollapsed || isMobileOpen) && (
                        <span className="font-bold text-sm tracking-tight truncate">
                          {item.name}
                        </span>
                      )}

                      {/* Active Indicator */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--accent-primary)] rounded-r-full shadow-glow-sm" />
                       )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User / Bottom Actions */}
        <div className="p-4 border-t border-[var(--card-border)] bg-[var(--site-text)]/5">
          {user ? (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl border border-transparent hover:border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-all cursor-pointer group`}>
               <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-[var(--card-bg)] shadow-md flex items-center justify-center text-white font-bold text-sm shrink-0 uppercase overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(user?.name, user?.email)
                  )}
               </div>
               {(!isCollapsed || isMobileOpen) && (
                 <div className="min-w-0 flex-1 overflow-hidden animate-in fade-in slide-in-from-left-4">
                    <p className="text-sm font-black text-[var(--site-text)] truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] font-medium text-[var(--site-text-muted)] truncate opacity-60">{user?.email}</p>
                 </div>
               )}
            </div>
          ) : (
            <Link 
              href="/auth/login"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-[var(--accent-primary)] text-white shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer group overflow-hidden`}
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <span className="font-black text-xs uppercase tracking-widest truncate">Sign In</span>
              )}
            </Link>
          )}
          
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] items-center justify-center text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all shadow-md z-[10000] cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </aside>
    </>
  );
}
