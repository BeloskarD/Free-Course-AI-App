'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Command, ArrowRight, CornerDownLeft, X } from 'lucide-react';
import { getSmartResults } from '../../utils/commandMap';

export default function SmartSearch({ isOverlay, onClose }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // --- 1. KEYBOARD SHORTCUTS (Cmd+K) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus input automatically if in overlay mode
  useEffect(() => {
    if (isOverlay) {
        inputRef.current?.focus();
        const filtered = getSmartResults('');
        setResults(filtered);
        setIsOpen(true);
    }
  }, [isOverlay]);

  // --- 2. SEARCH LOGIC ---
  useEffect(() => {
    const filtered = getSmartResults(query);
    setResults(filtered);
    if (query.trim() || inputRef.current === document.activeElement) {
      setIsOpen(filtered.length > 0);
    }
    setSelectedIndex(0);
  }, [query]);

  // --- 3. INPUT HANDLERS ---
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleNavigate(results[selectedIndex].href);
      }
    }
  };

  const handleNavigate = (href) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
    onClose?.();
  };

  // Close on outside click (if not overlay)
  useEffect(() => {
    const handleClickOutside = (e) => {
        if (!isOverlay && searchRef.current && !searchRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOverlay]);

  return (
    <div 
        ref={searchRef} 
        className={`relative items-center group transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isOverlay ? 'flex w-full animate-in fade-in zoom-in-95 slide-in-from-top-6 duration-700 max-w-2xl mx-auto' : 'hidden min-[1100px]:flex'}
        `}
    >
      <div className={`
        flex items-center bg-[var(--site-text)]/[0.03] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isOverlay 
            ? 'w-full h-12 sm:h-14 rounded-2xl px-5 border-2 bg-[var(--card-bg)] border-[var(--accent-primary)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5),0_0_60px_-15px_rgba(99,102,241,0.6)] ring-8 ring-[var(--accent-primary)]/10' 
            : 'w-64 md:w-80 h-9 min-[1250px]:h-10 rounded-full px-4 border-[1.5px] border-[var(--card-border)] hover:border-[var(--site-text)]/[0.15]'}
        ${isOpen && !isOverlay
            ? 'border-[var(--accent-primary)]/50 bg-[var(--site-text)]/[0.06] ring-4 ring-[var(--accent-primary)]/10 shadow-[0_0_40px_-10px_rgba(79,70,229,0.2)] w-72 md:w-96' 
            : ''}
        focus-within:ring-0 focus:ring-0 outline-none focus:outline-none ring-offset-0
      `}>
        <Search size={isOverlay ? 22 : 16} className={`shrink-0 mr-2 sm:mr-3 transition-colors duration-500 ${isOverlay || isOpen ? 'text-[var(--accent-primary)]' : 'text-[var(--site-text-muted)]'}`} />
        
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            const filtered = getSmartResults(query);
            setResults(filtered);
            setIsOpen(filtered.length > 0);
          }}
          placeholder="Search OS (Cmd+K)..." 
          className={`bg-transparent border-none outline-none focus:outline-none focus:ring-0 ring-0 ring-offset-0 px-1 w-full font-medium placeholder:text-[var(--site-text-muted)]/50 text-[var(--site-text)] cursor-text ${isOverlay ? 'text-base' : 'text-xs min-[1300px]:text-[13px]'}`}
        />

        {!isOverlay && (
            <div className={`flex items-center gap-1 opacity-40 group-focus-within:opacity-0 transition-opacity`}>
                <Command size={12} />
                <span className="text-[10px] font-bold uppercase tracking-tight">K</span>
            </div>
        )}

        {isOverlay && (
            <button onClick={onClose} className="p-2 sm:p-2.5 rounded-full hover:bg-[var(--site-text)]/5 text-[var(--site-text-muted)] transition-colors cursor-pointer flex items-center justify-center">
                <X size={22} className="shrink-0" />
            </button>
        )}
      </div>

      {/* --- SMART DROPDOWN (Glassmorphism) --- */}
      {isOpen && results.length > 0 && (
        <div className={`
            absolute top-[calc(100%+8px)] left-0 w-full glass-elite border border-[var(--card-border)] rounded-2xl shadow-2xl z-[10002] p-2 animate-in fade-in slide-in-from-top-2 duration-300
            ${isOverlay ? 'min-w-full max-h-[60vh] overflow-y-auto' : 'min-w-[320px] max-h-[400px] overflow-y-auto'}
        `}>
          
          <div className="px-3 py-1.5 opacity-40">
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{query.length < 2 ? 'Quick Access' : 'Search Results'}</span>
          </div>

          <div className="space-y-1">
            {results.map((result, index) => (
                <div 
                    key={index}
                    onClick={() => handleNavigate(result.href)}
                    className={`
                        flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                        ${selectedIndex === index 
                            ? 'bg-[var(--accent-primary)]/[0.1] border-[var(--accent-primary)]/20 shadow-sm translate-x-1 outline-none' 
                            : 'bg-transparent border-transparent hover:bg-[var(--site-text)]/5'}
                    `}
                >
                <div className="flex items-center gap-3">
                    <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300
                        ${selectedIndex === index ? 'bg-[var(--accent-primary)] text-white scale-110 shadow-lg' : 'bg-[var(--site-text)]/5 text-[var(--site-text-muted)]'}
                    `}>
                    {result.icon ? <result.icon size={18} /> : <Search size={18} />}
                    </div>
                    <div className="flex flex-col">
                    <span className={`text-[13px] font-black tracking-tight ${selectedIndex === index ? 'text-[var(--site-text)] font-extrabold' : 'text-[var(--site-text-muted)]'}`}>
                        {result.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                        {result.category}
                    </span>
                    </div>
                </div>

                {selectedIndex === index && (
                    <div className="flex items-center gap-2 text-[var(--accent-primary)] animate-in fade-in slide-in-from-right-2">
                        <span className="text-[10px] font-black uppercase italic tracking-tighter">Execute</span>
                        <CornerDownLeft size={12} />
                    </div>
                )}
                </div>
            ))}
          </div>

          {/* AI Hint Footer */}
          <div className="mt-2 pt-2 border-t border-[var(--card-border)] px-3 py-1 flex items-center justify-between opacity-50 italic">
             <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--accent-primary)]" />
                <span className="text-[10px] font-bold">Auto-Gen Intel active</span>
             </div>
             <ArrowRight size={10} />
          </div>
        </div>
      )}
    </div>
  );
}
