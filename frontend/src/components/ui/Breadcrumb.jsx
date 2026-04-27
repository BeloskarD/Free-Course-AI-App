"use client";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

/**
 * Reusable Breadcrumb Navigation Component
 * @param {Object} props
 * @param {string} props.currentPage - Name of the current page
 * @param {React.ComponentType} props.currentIcon - Lucide icon component for current page
 * @param {string} [props.homeHref="/"] - Link target for the home button
 * @param {string} [props.homeLabel="Home"] - Label for the home button
 * @param {React.ComponentType} [props.homeIcon] - Optional icon override for the home button
 */
export default function Breadcrumb({ currentPage, currentIcon: CurrentIcon, homeHref = "/", homeLabel = "Home", homeIcon: HomeIcon, onHomeClick }) {
    const ResolvedHomeIcon = HomeIcon || Home;
    const homeTriggerClass = "flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all duration-300 group shadow-sm cursor-pointer";
    return (
        <nav className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2 text-sm flex-wrap">
                {onHomeClick ? (
                    <button onClick={onHomeClick} type="button" className={homeTriggerClass}>
                        <ResolvedHomeIcon size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold">{homeLabel}</span>
                    </button>
                ) : (
                    <Link href={homeHref} className={homeTriggerClass}>
                        <ResolvedHomeIcon size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="font-bold">{homeLabel}</span>
                    </Link>
                )}
                <ChevronRight size={16} className="text-[var(--site-text-muted)] opacity-40" />
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-500/20 text-[var(--accent-primary)] font-black shadow-sm">
                    {CurrentIcon && <CurrentIcon size={16} />}
                    <span>{currentPage}</span>
                </div>
            </div>
        </nav>
    );
}
