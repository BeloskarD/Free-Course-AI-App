import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Zeeklect - AI Learning Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a2e 30%, #16213e 60%, #0f0f14 100%)',
                    fontFamily: 'system-ui, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Ambient glow effects */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-100px',
                        right: '-100px',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-100px',
                        left: '-100px',
                        width: '400px',
                        height: '400px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                    }}
                />

                {/* Badge */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 28px',
                        borderRadius: '999px',
                        border: '1px solid rgba(99,102,241,0.3)',
                        background: 'rgba(99,102,241,0.1)',
                        marginBottom: '32px',
                    }}
                >
                    <div
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#6366f1',
                        }}
                    />
                    <span
                        style={{
                            color: '#a5b4fc',
                            fontSize: '16px',
                            fontWeight: 800,
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                        }}
                    >
                        AI-Powered Learning Platform
                    </span>
                </div>

                {/* Main Title */}
                <h1
                    style={{
                        fontSize: '80px',
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        margin: 0,
                        textAlign: 'center',
                    }}
                >
                    ZEEKLECT
                </h1>

                {/* Tagline */}
                <p
                    style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        marginTop: '16px',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Seek Intelligence
                </p>

                {/* Features row */}
                <div
                    style={{
                        display: 'flex',
                        gap: '24px',
                        marginTop: '48px',
                    }}
                >
                    {['Curated Courses', 'AI Roadmaps', 'Skill Analysis', 'Career Tools'].map((feature) => (
                        <div
                            key={feature}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '14px',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {feature}
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7, #6366f1)',
                    }}
                />
            </div>
        ),
        { ...size }
    );
}
