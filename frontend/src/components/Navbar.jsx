'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Rocket,
  Heart,
  Zap,
  Briefcase,
  Brain,
  BarChart3,
  BookOpen,
  Wrench,
  Youtube,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationDropdown from './notifications/NotificationDropdown';
import SmartSearch from './layout/SmartSearch';

// ─── NAV STRUCTURE ────────────────────────────────────
const directLinks = [
  { name: 'Evolution', href: '/mission-home', icon: Sparkles },
  { name: 'Missions', href: '/missions', icon: Rocket },
];

const dropdownGroups = [
  {
    label: 'Growth',
    items: [
      { name: 'Growth', href: '/growth', icon: Zap, desc: 'Track your progress' },
      { name: 'Wellbeing', href: '/wellbeing', icon: Heart, desc: 'Mind & body balance' },
      { name: 'Momentum', href: '/momentum', icon: BarChart3, desc: 'Stay consistent' },
    ],
  },
  {
    label: 'Career',
    items: [
      { name: 'Career', href: '/career-acceleration', icon: Briefcase, desc: 'Accelerate your path' },
      { name: 'Intelligence', href: '/ai-intelligence', icon: Brain, desc: 'AI-powered insights' },
      { name: 'Skills', href: '/skill-analysis', icon: BarChart3, desc: 'Skill gap analysis' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { name: 'Library', href: '/courses', icon: BookOpen, desc: 'Browse all courses' },
      { name: 'Tools', href: '/ai-tools', icon: Wrench, desc: 'AI productivity tools' },
      { name: 'Mentors', href: '/youtube', icon: Youtube, desc: 'Expert video guides' },
    ],
  },
];

// All links flat (for mobile menu)
const allPrimaryLinks = [
  { name: 'Evolution', href: '/mission-home' },
  { name: 'Missions', href: '/missions' },
  { name: 'Growth', href: '/growth' },
  { name: 'Wellbeing', href: '/wellbeing' },
];

const allSecondaryLinks = [
  { name: 'Career', href: '/career-acceleration' },
  { name: 'Intelligence', href: '/ai-intelligence' },
  { name: 'Skills', href: '/skill-analysis' },
  { name: 'Library', href: '/courses' },
  { name: 'Tools', href: '/ai-tools' },
  { name: 'Mentors', href: '/youtube' },
  { name: 'Momentum', href: '/momentum' },
];

// ─── DROPDOWN COMPONENT ──────────────────────────────
function NavDropdown({ group, pathname, openDropdown, setOpenDropdown }) {
  const isOpen = openDropdown === group.label;
  const hasActiveChild = group.items.some((item) => pathname === item.href);
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(group.label);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown((prev) => (prev === group.label ? null : prev));
    }, 200);
  };

  // Prevent page scroll when mouse wheel is used over the dropdown
  useEffect(() => {
    const el = dropdownRef.current;
    if (!el) return;
    const preventScroll = (e) => e.preventDefault();
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <button
        onClick={() => setOpenDropdown(isOpen ? null : group.label)}
        className={`
          nav-trigger-btn group relative flex items-center gap-1 h-9 min-[1250px]:h-10
          px-3 min-[1300px]:px-4 xl:px-5
          text-[11.5px] min-[1100px]:text-[12px] min-[1300px]:text-[13px] xl:text-[13.5px]
          rounded-full transition-all duration-300 border-[1.5px] font-semibold tracking-tight cursor-pointer
          ${hasActiveChild
            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.08] border-[var(--accent-primary)]/30 shadow-sm'
            : 'text-[var(--site-text-muted)] bg-transparent border-transparent hover:text-[var(--site-text)] hover:bg-[var(--site-text)]/[0.06] hover:border-[var(--site-text)]/[0.12]'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{group.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${hasActiveChild ? 'text-[var(--accent-primary)]' : 'opacity-50 group-hover:opacity-80'}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 min-w-[230px] pt-1 z-[10001]"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="nav-dropdown-panel p-1.5 rounded-2xl border border-[var(--card-border)] origin-top"
            style={{
              animation: 'navDropdownFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              backgroundColor: 'var(--card-bg)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group/item
                  ${isActive
                      ? 'bg-[var(--accent-primary)]/[0.1] text-[var(--accent-primary)]'
                      : 'text-[var(--site-text-muted)] hover:bg-[var(--site-text)]/[0.05] hover:text-[var(--site-text)]'
                    }
                `}
                >
                  <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200
                  ${isActive
                      ? 'bg-[var(--accent-primary)]/[0.15] text-[var(--accent-primary)]'
                      : 'bg-[var(--site-text)]/[0.05] text-[var(--site-text-muted)] group-hover/item:bg-[var(--accent-primary)]/[0.1] group-hover/item:text-[var(--accent-primary)]'
                    }
                `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[13px] font-semibold leading-tight ${isActive ? 'text-[var(--accent-primary)]' : ''}`}>
                      {item.name}
                    </span>
                    <span className="text-[11px] text-[var(--site-text-muted)] opacity-70 leading-tight mt-0.5 truncate">
                      {item.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN NAVBAR ─────────────────────────────────────
export default function Navbar({ onMenuClick, isSidebarActive }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isMounted } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef(null);

  const isDashboardPage = pathname === '/dashboard';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  if (!isMounted) {
    return (
      <nav className="sticky top-0 z-50 w-full h-16 lg:h-[60px] bg-[var(--site-bg)] border-b border-[var(--card-border)] animate-pulse" />
    );
  }

  return (
    <>
      <nav
      ref={navRef}
      className={`
        sticky top-0 z-[10000] w-full glass-elite h-16 lg:h-[60px]
        ${isSidebarActive ? 'border-b border-[var(--card-border)]' : ''}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
        <div className="max-w-[1800px] mx-auto h-full flex items-center justify-between px-3 sm:px-5 lg:px-6">

          {/* ── LOGO / MENU TRIGGER ───────────────────────────── */}
          <div className="flex items-center gap-4 h-full">
            {isSidebarActive && (
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-all cursor-pointer"
                onClick={onMenuClick}
              >
                <Menu size={24} />
              </button>
            )}

            {!isSidebarActive && (
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center h-full relative">
                <img
                  src="/zeeklect-logo.png"
                  alt="Zeeklect - AI Learning Platform"
                  className="h-full w-auto object-contain object-left scale-[1.3] transition-transform hover:scale-[1.35] origin-left"
                  loading="eager"
                />
              </Link>
            )}
            
            {isSidebarActive && (
              <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] hidden sm:block">
                {pathname.split('/').pop().replace(/-/g, ' ')}
              </h2>
            )}
          </div>

          {/* ── DESKTOP NAV (lg+) - ONLY SHOW IF NO SIDEBAR ──────────────── */}
          {!isSidebarActive && (
            <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 px-2 gap-1 xl:gap-2">
              {directLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`
                      relative flex items-center justify-center h-9 min-[1250px]:h-10
                      px-4 xl:px-5 text-[12px] xl:text-[13.5px]
                      rounded-full transition-all duration-300 border-[1.5px] font-semibold tracking-tight
                      ${isActive
                        ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/[0.08] border-[var(--accent-primary)]/30 shadow-sm font-bold'
                        : 'text-[var(--site-text-muted)] bg-transparent border-transparent hover:text-[var(--site-text)] hover:bg-[var(--site-text)]/[0.06] hover:border-[var(--site-text)]/[0.12]'
                      }
                    `}
                  >
                    <span className="leading-none">{link.name}</span>
                  </Link>
                );
              })}
              <div className="w-px h-5 bg-[var(--site-text)]/[0.08] mx-0.5 min-[1300px]:mx-1 flex-shrink-0" />
              {dropdownGroups.map((group) => (
                <NavDropdown
                  key={group.label}
                  group={group}
                  pathname={pathname}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ))}
            </div>
          )}

          {/* ── ACTIONS ────────────────────────── */}
          <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4 h-full">
            {/* Search (Desktop) */}
            <SmartSearch />

            {/* Search Trigger (Mobile/Tablet) */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-[var(--accent-primary)]/5 text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 btn-tactile border border-[var(--card-border)] hover:border-[var(--accent-primary)]/30 rounded-xl transition-all cursor-pointer shadow-sm group"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--site-text)]/5 text-[var(--site-text-muted)] hover:text-[var(--site-text)] hover:bg-[var(--site-text)]/10 btn-tactile border border-[var(--card-border)] flex items-center justify-center transition-all duration-300 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-indigo-600" />}
            </button>

            {/* Notifications */}
            {user && <NotificationDropdown />}

            {/* Auth / Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                 {/* Dashboard Link (Optional if sidebar is present) */}
                 {!isSidebarActive && (
                    <Link
                      href="/dashboard"
                      className="hidden sm:flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                    >
                      <LayoutDashboard size={14} />
                      Dashboard
                    </Link>
                 )}

                 {/* Logout - Keep simple when in dashboard */}
                 <button
                    onClick={logout}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-rose-500/5 text-rose-500/80 hover:bg-rose-500 hover:text-white rounded-full transition-all duration-300 border border-rose-500/10 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-6 h-10 flex items-center justify-center bg-[var(--accent-primary)] text-white text-[11px] font-bold rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all uppercase tracking-widest"
              >
                Sign In
              </Link>
            )}

            {/* Hamburger (Mobile Guest Only) */}
            {!isSidebarActive && (
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center text-[var(--site-text-muted)] btn-tactile bg-[var(--site-text)]/5 rounded-full border border-[var(--card-border)] hover:text-[var(--site-text)] transition-all cursor-pointer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>

      {/* ── MOBILE MENU (GUESTS ONLY) ──────────────────────── */}
      {!isSidebarActive && isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={() => setIsMenuOpen(false)} />
          <div
            id="mobile-menu"
            className="lg:hidden fixed top-16 left-0 right-0 bg-[var(--card-bg)] p-5 space-y-4 shadow-2xl border-b border-[var(--card-border)] z-[9999]"
            style={{ animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >
             <div className="grid grid-cols-2 gap-3">
               {[...allPrimaryLinks, ...allSecondaryLinks].map((link) => (
                 <Link
                   key={link.name}
                   href={link.href}
                   className="flex items-center justify-center h-12 rounded-2xl bg-[var(--card-bg-hover)] text-sm font-bold text-[var(--text-primary)] border border-[var(--card-border)]"
                 >
                   {link.name}
                 </Link>
               ))}
             </div>
          </div>
        </>
      )}
      {/* ── MOBILE SEARCH OVERLAY ────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[11000] flex flex-col p-4 sm:p-6 lg:hidden">
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsSearchOpen(false)} />
            <div className="relative w-full max-w-2xl mx-auto mt-12 sm:mt-16 animate-in fade-in slide-in-from-top-4 duration-500">
                <SmartSearch isOverlay={true} onClose={() => setIsSearchOpen(false)} />
            </div>
        </div>
      )}
      </nav>
    </>
  );
}
