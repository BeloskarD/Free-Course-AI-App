"use client";
import React from 'react';

/**
 * High-Fidelity Shimmer Skeleton
 * A premium, glassmorphic loading state for the AI platform.
 */
const Skeleton = ({ className = "", style = {} }) => {
  return (
    <div 
      className={`relative overflow-hidden bg-[var(--site-text)]/5 rounded-2xl ${className}`}
      style={style}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[var(--site-text)]/[0.08] to-transparent" />
      
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;

// --- NAMED EXPORTS FOR SPECIFIC LAYOUTS ---

/**
 * Course Card Skeleton
 */
export const CourseSkeleton = () => (
  <div className="p-8 rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] h-full flex flex-col">
    <div className="flex justify-between items-start mb-8">
      <Skeleton className="w-14 h-14 rounded-2xl" />
      <Skeleton className="w-24 h-8 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-3/4 mb-4 rounded-lg" />
    <Skeleton className="h-4 w-full mb-2 rounded-md" />
    <Skeleton className="h-4 w-5/6 mb-8 rounded-md" />
    <div className="mt-auto pt-6 border-t border-[var(--card-border)]/50 flex justify-between gap-4">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  </div>
);

/**
 * YouTube Video Skeleton
 */
export const YouTubeSkeleton = () => (
  <div className="rounded-[2.5rem] overflow-hidden bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] h-full flex flex-col">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="p-8 space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <div className="pt-4 flex justify-between items-center">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

/**
 * AI Tool Skeleton
 */
export const ToolSkeleton = () => (
  <div className="p-10 rounded-[3rem] bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--shadow-elite)] h-full flex flex-col">
    <div className="flex justify-between items-start mb-8">
      <Skeleton className="w-16 h-16 rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
    </div>
    <Skeleton className="h-10 w-2/3 mb-6 rounded-xl" />
    <Skeleton className="h-4 w-full mb-2 rounded-md" />
    <Skeleton className="h-4 w-full mb-2 rounded-md" />
    <Skeleton className="h-4 w-4/5 mb-10 rounded-md" />
    <div className="mt-auto pt-8 border-t border-[var(--card-border)]/50 flex justify-between">
      <Skeleton className="h-6 w-24 rounded-lg" />
      <Skeleton className="h-10 w-24 rounded-xl" />
    </div>
  </div>
);

/**
 * Stats Card Skeleton for Dashboard / Momentum
 */
export const StatsSkeleton = () => (
  <div className="relative rounded-2xl sm:rounded-[2.5rem] bg-[var(--card-bg)] border border-[var(--card-border)] p-5 sm:p-8 flex flex-col justify-between h-44 sm:h-52 overflow-hidden">
    {/* Inner glow base simulation */}
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--site-text)]/10 to-transparent"></div>
    <div className="relative z-10">
      <Skeleton className="w-14 h-14 rounded-2xl mb-6 shadow-sm" />
      <div className="flex items-baseline gap-3 mb-1">
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-1/2 mb-4 rounded-md" />
    </div>
    <div className="relative z-10 flex items-center justify-between mt-auto">
      <Skeleton className="h-3 w-1/3 rounded-md" />
    </div>
  </div>
);
