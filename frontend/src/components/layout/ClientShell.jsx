'use client';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../ui/PageTransition';

export default function ClientShell({ children }) {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const publicRoutes = ['/ai-intelligence', '/courses', '/ai-tools', '/youtube', '/skill-analysis', '/mission-home'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
  
  const showSidebar = (!loading && !!user);


  return (
    <div className="flex min-h-screen bg-[var(--site-bg)] transition-colors duration-500">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      )}

      {/* Main Content Area */}
      <div 
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-500 
          ${showSidebar ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : 'ml-0'}
        `}
        style={{
           '--sidebar-offset': showSidebar ? (isCollapsed ? '5rem' : '18rem') : '0px'
        }}
      >
        <Navbar onMenuClick={() => setIsMobileOpen(true)} isSidebarActive={showSidebar} />
        
        <main id="main-content" className="flex-1 w-full bg-[var(--site-bg)] relative z-0" role="main">
           <div className="max-w-[1800px] mx-auto min-h-full">
            <AnimatePresence mode="wait">
              <PageTransition key={pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
           </div>
        </main>

        {!showSidebar && <Footer />}
      </div>
    </div>
  );
}
