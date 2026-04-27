'use client';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

/**
 * Zeeklect Logo Component - Responsive & Animated
 * Supports sizes: xs, sm, md, lg, xl, 2xl
 * Supports variants: navbar, footer, hero
 */
export default function Logo({
    size = 'md',
    showText = true,
    variant = 'navbar',
    href = '/',
    className = ''
}) {
    const { theme } = useTheme();

    // Responsive size configurations (width/height in px)
    const sizeMap = {
        xs: {
            logo: 'w-7 h-7',        // 28px - mobile small (300px-400px)
            text: 'text-sm',
            gap: 'gap-1.5'
        },
        sm: {
            logo: 'w-8 h-8 sm:w-9 sm:h-9',  // 32-36px - mobile large (400px-640px)
            text: 'text-base',
            gap: 'gap-2'
        },
        md: {
            logo: 'w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11',  // 36-44px - tablet (640px-1024px)
            text: 'text-lg',
            gap: 'gap-2.5'
        },
        lg: {
            logo: 'w-11 h-11 lg:w-12 lg:h-12 xl:w-14 xl:h-14',  // 44-56px - desktop (1024px-1536px)
            text: 'text-xl lg:text-2xl',
            gap: 'gap-3'
        },
        xl: {
            logo: 'w-14 h-14 xl:w-16 xl:h-16 2xl:w-18 2xl:h-18',  // 56-72px - large desktop
            text: 'text-2xl xl:text-3xl',
            gap: 'gap-4'
        },
        '2xl': {
            logo: 'w-16 h-16 xl:w-20 xl:h-20',  // 64-80px - hero/footer
            text: 'text-3xl xl:text-4xl',
            gap: 'gap-4'
        }
    };

    // Variant-specific styling
    const variantStyles = {
        navbar: {
            container: 'group btn-tactile',
            logoWrapper: `
        relative flex-shrink-0 flex items-center justify-center
        transition-all duration-500 ease-out
      `,
            logo: `
        w-full h-full object-contain rounded-xl
        transition-all duration-500 ease-out transform
        group-hover:scale-110 group-hover:rotate-[2deg]
        active:scale-95
        drop-shadow-sm
        group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.35)]
        dark:group-hover:drop-shadow-[0_0_20px_rgba(129,140,248,0.5)]
      `,
            text: `
        font-bold tracking-tighter
        text-[var(--site-text-muted)]
        group-hover:text-[var(--accent-primary)]
        transition-all duration-300 transform
        group-hover:-translate-y-0.5
      `,
            glow: `
        absolute inset-0 rounded-xl opacity-0
        group-hover:opacity-100
        bg-gradient-to-br from-indigo-500/10 to-purple-500/10
        dark:from-indigo-400/15 dark:to-purple-400/15
        transition-opacity duration-500 pointer-events-none
      `
        },
        footer: {
            container: 'group cursor-pointer',
            logoWrapper: `
        relative flex-shrink-0 flex items-center justify-center
        transition-all duration-500 ease-out
      `,
            logo: `
        w-full h-full object-contain rounded-2xl
        transition-all duration-500 ease-out
        group-hover:scale-110 group-hover:rotate-[5deg]
        drop-shadow-lg
        group-hover:drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]
        dark:group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]
      `,
            text: `
        font-black tracking-tighter
        text-[var(--site-text)]
        transition-all duration-300
        dark:group-hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]
      `,
            glow: `
        absolute inset-0 rounded-2xl
        bg-gradient-to-br from-purple-500/0 to-indigo-500/0
        group-hover:from-purple-500/20 group-hover:to-indigo-500/20
        dark:group-hover:from-purple-400/30 dark:group-hover:to-pink-500/30
        transition-all duration-500 pointer-events-none
      `,
            outerRing: `
        absolute -inset-1.5 rounded-3xl opacity-0
        group-hover:opacity-0 dark:group-hover:opacity-100
        bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-indigo-500/50
        blur-lg transition-all duration-500 pointer-events-none -z-10
      `
        },
        hero: {
            container: 'group',
            logoWrapper: `
        relative flex-shrink-0 flex items-center justify-center
        animate-float-elite
      `,
            logo: `
        w-full h-full object-contain rounded-3xl
        transition-all duration-700 ease-out
        hover:scale-105
        drop-shadow-2xl
        hover:drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]
        dark:hover:drop-shadow-[0_0_50px_rgba(129,140,248,0.6)]
      `,
            text: `
        font-black tracking-tight
        text-gradient-elite
      `,
            glow: `
        absolute inset-0 rounded-3xl
        bg-gradient-to-br from-indigo-500/10 to-purple-500/10
        animate-pulse-elite pointer-events-none
      `
        }
    };

    const currentSize = sizeMap[size] || sizeMap.md;
    const currentVariant = variantStyles[variant] || variantStyles.navbar;

    const LogoContent = (
        <div className={`flex items-center ${currentSize.gap} ${currentVariant.container} ${className}`}>
            {/* Logo Image Container */}
            <div className={`${currentSize.logo} ${currentVariant.logoWrapper}`}>
                <img
                    src="/zeeklect-logo.png"
                    alt="Zeeklect - Seek Intelligence"
                    className={currentVariant.logo}
                    style={{ imageRendering: 'crisp-edges' }}
                    loading="eager"
                />
                {/* Glow overlay */}
                <div className={currentVariant.glow} />
                {/* Outer ring for footer dark mode */}
                {variant === 'footer' && <div className={currentVariant.outerRing} />}
            </div>

            {/* Text Label */}
            {showText && (
                <div className="flex flex-col">
                    <span className={`${currentSize.text} ${currentVariant.text}`}>
                        {variant === 'footer' ? (
                            <>Zeek<span className="text-[var(--accent-primary)]">lect</span></>
                        ) : (
                            'Zeeklect'
                        )}
                    </span>
                    {variant === 'footer' && (
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--site-text-muted)] opacity-60">
                            Seek Intelligence
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    // Wrap in Link if href provided (for navbar)
    if (href && variant === 'navbar') {
        return (
            <Link href={href} className="flex items-center w-fit">
                {LogoContent}
            </Link>
        );
    }

    return LogoContent;
}

/**
 * Responsive Logo - Auto-adjusts based on screen width
 * Use this when you want the logo to automatically adapt
 */
export function ResponsiveLogo({
    variant = 'navbar',
    showTextBreakpoint = 'lg',
    className = ''
}) {
    const textVisibilityClasses = {
        'sm': 'hidden sm:flex',
        'md': 'hidden md:flex',
        'lg': 'hidden lg:flex',
        'xl': 'hidden xl:flex',
        'always': 'flex',
        'never': 'hidden'
    };

    return (
        <div className={`flex items-center ${className}`}>
            {/* Mobile: xs logo, no text */}
            <div className="sm:hidden">
                <Logo size="xs" showText={false} variant={variant} />
            </div>

            {/* Small tablets: sm logo */}
            <div className="hidden sm:block md:hidden">
                <Logo size="sm" showText={false} variant={variant} />
            </div>

            {/* Tablets: md logo */}
            <div className="hidden md:block lg:hidden">
                <Logo size="md" showText={false} variant={variant} />
            </div>

            {/* Desktop: lg logo with text */}
            <div className="hidden lg:block xl:hidden">
                <Logo size="lg" showText={true} variant={variant} />
            </div>

            {/* Large desktop: xl logo with text */}
            <div className="hidden xl:block">
                <Logo size="xl" showText={true} variant={variant} />
            </div>
        </div>
    );
}
