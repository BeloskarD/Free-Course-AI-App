'use client';
import { useState, useEffect } from 'react';
import {
    User, Briefcase, GraduationCap, Code, Award, Sparkles, Save,
    Download, ExternalLink, ChevronRight, Check, AlertCircle,
    FileText, Search, Zap, Layout, Palette, Share2, Target, Cpu,
    Plus, Trash2, Heart, Rocket, Info, X
} from 'lucide-react';
import { api } from '../../services/api';

export default function ResumeBuilder({ token, initialData }) {
    const [targetRole, setTargetRole] = useState(initialData?.targetRole || initialData?.portfolio?.headline || '');
    const [jobDescription, setJobDescription] = useState('');
    const [sections, setSections] = useState({
        experience: [],
        projects: [],
        skills: [],
        interests: []
    });

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [rxUrl, setRxUrl] = useState(null);

    // Initial load from profile
    useEffect(() => {
        if (initialData?.targetRole && !targetRole) {
            setTargetRole(initialData.targetRole);
        }
        
        if (initialData?.portfolio) {
            setSections({
                experience: initialData.portfolio.experience || [],
                projects: initialData.portfolio.customProjects || [],
                skills: initialData.masteredSkills?.map(s => s.name) || [],
                interests: []
            });
        }
    }, [initialData]);

    const handleGenerate = async (pushToRx = false) => {
        // Phase 4 Sync Update: Enforce validation
        if (!targetRole && !initialData?.targetRole) {
            setStatus({ type: 'error', message: '⚠️ Target Position is required for AI Optimization.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: pushToRx ? '🚀 Pushing directly to Reactive Resume...' : '🥇 AI Orchestrator running...' });

        try {
            const data = await api.resumeOrchestrator({
                target_role: targetRole,
                initial_target_role: initialData?.targetRole,
                job_description: jobDescription,
                custom_sections: sections,
                push_to_rx: pushToRx
            }, token);

            if (data.success) {
                console.log("%c🤖 AI Model Visibility Log (Resume Builder)", "color: #4f46e5; font-weight: bold; font-size: 1.2em;");
                console.log(`%cProvider: %c${data.provider || 'default'}`, "font-weight: bold;", "color: #16a34a;");
                if (data.model) {
                    console.log(`%cModel: %c${data.model}`, "font-weight: bold;", "color: #2563eb;");
                }
                
                setResult(data.data);
                if (data.rx_api_response?.url) {
                    setRxUrl(data.rx_api_response.url);
                    setStatus({ type: 'success', message: '✨ Resume Created on rxresu.me! One click to style & PDF.' });
                } else if (data.rx_api_response?.error) {
                    setStatus({ type: 'error', message: `${data.rx_api_response.error}: ${data.rx_api_response.details || 'Unknown API issue'}` });
                } else {
                    setStatus({ type: 'success', message: '✨ Resume Optimized! Ready to push.' });
                }
            } else {
                throw new Error(data.error || 'Optimization failed');
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const addListItem = (type, item) => {
        setSections(prev => ({ ...prev, [type]: [...prev[type], item] }));
    };

    const removeListItem = (type, index) => {
        setSections(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const updateItem = (type, index, field, value) => {
        setSections(prev => {
            const newList = [...prev[type]];
            if (typeof newList[index] === 'object') {
                newList[index] = { ...newList[index], [field]: value };
            } else {
                newList[index] = value;
            }
            return { ...prev, [type]: newList };
        });
    };

    return (
        <div className="resume-builder-v2">
            <style jsx>{`
                /* ═══════════════════════════════════════════
                   ROOT CONTAINER
                   ═══════════════════════════════════════════ */
                .resume-builder-v2 {
                    --rb-accent: var(--accent-primary, #6366f1);
                    --rb-accent-glow: rgba(99, 102, 241, 0.18);
                    --rb-accent-glow-strong: rgba(99, 102, 241, 0.35);
                    --rb-radius: 1.5rem;
                    --rb-radius-sm: 1rem;
                    --rb-radius-xs: 0.75rem;
                    font-family: var(--font-inter, var(--font-outfit, system-ui, sans-serif));
                    color: var(--site-text);
                    background: var(--card-bg);
                    border-radius: 2.5rem;
                    border: 1px solid var(--card-border);
                    overflow: hidden;
                    box-shadow: var(--shadow-elite);
                }

                /* ═══════════════════════════════════════════
                   HEADER
                   ═══════════════════════════════════════════ */
                .rb-header {
                    padding: 56px 40px;
                    background: linear-gradient(135deg, var(--card-bg) 0%, var(--site-bg) 100%);
                    position: relative;
                    overflow: hidden;
                    border-bottom: 1px solid var(--card-border);
                }
                .rb-header::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -20%;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, var(--rb-accent-glow) 0%, transparent 70%);
                    z-index: 0;
                    pointer-events: none;
                }
                .rb-header-content { position: relative; z-index: 1; }
                .rb-header-content h1 {
                    font-size: 2.25rem;
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    margin-bottom: 12px;
                    background: linear-gradient(135deg, var(--site-text) 0%, var(--site-text-muted) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .rb-header-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    border-radius: 50px;
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 0.25em;
                    text-transform: uppercase;
                    background: var(--rb-accent-glow);
                    color: var(--rb-accent);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    margin-bottom: 16px;
                    cursor: default;
                }
                .rb-header-sub {
                    color: var(--site-text-muted);
                    font-weight: 500;
                    max-width: 600px;
                    line-height: 1.7;
                    font-size: 0.9rem;
                }

                /* ═══════════════════════════════════════════
                   MAIN GRID
                   ═══════════════════════════════════════════ */
                .rb-main {
                    padding: 40px;
                    display: grid;
                    grid-template-columns: 1fr 380px;
                    gap: 40px;
                }

                /* ═══════════════════════════════════════════
                   SECTION CARDS
                   ═══════════════════════════════════════════ */
                .rb-section-card {
                    background: var(--site-bg);
                    border-radius: var(--rb-radius);
                    padding: 28px;
                    border: 1px solid var(--card-border);
                    margin-bottom: 28px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-section-card:hover {
                    border-color: var(--card-hover-border);
                    box-shadow: var(--shadow-elite-hover);
                }

                /* ═══════════════════════════════════════════
                   LABELS
                   ═══════════════════════════════════════════ */
                .rb-label {
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: var(--rb-accent);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* ═══════════════════════════════════════════
                   INPUT FIELDS (Theme-Aware)
                   ═══════════════════════════════════════════ */
                .rb-input-v2,
                .rb-textarea-v2 {
                    width: 100%;
                    background: var(--card-bg);
                    border: 1.5px solid var(--card-border);
                    border-radius: var(--rb-radius-sm);
                    padding: 14px 18px;
                    color: var(--site-text);
                    font-weight: 600;
                    font-size: 0.9rem;
                    font-family: inherit;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: text;
                    outline: none;
                }
                .rb-input-v2::placeholder,
                .rb-textarea-v2::placeholder {
                    color: var(--site-text-muted);
                    opacity: 0.55;
                    font-weight: 500;
                }
                .rb-input-v2:hover,
                .rb-textarea-v2:hover {
                    border-color: var(--card-hover-border);
                    background: var(--site-bg);
                }
                .rb-input-v2:focus,
                .rb-textarea-v2:focus {
                    border-color: var(--rb-accent);
                    background: var(--site-bg);
                    box-shadow: 0 0 0 4px var(--rb-accent-glow);
                }

                /* ═══════════════════════════════════════════
                   ITEM ROWS (Experience / Projects)
                   ═══════════════════════════════════════════ */
                .rb-item-row {
                    padding: 24px;
                    background: var(--card-bg);
                    border: 1.5px solid var(--card-border);
                    border-radius: var(--rb-radius);
                    margin-bottom: 16px;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-item-row:hover {
                    border-color: var(--card-hover-border);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
                }

                /* Item header row: flex so delete button sits right */
                .rb-item-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .rb-item-header .rb-fields-grid {
                    flex: 1;
                    min-width: 0;
                    margin-bottom: 0;
                }
                .rb-item-fields-solo {
                    flex: 1;
                    min-width: 0;
                }

                /* ═══════════════════════════════════════════
                   DELETE BUTTON (Pro Styled)
                   ═══════════════════════════════════════════ */
                .rb-delete-btn {
                    width: 36px;
                    height: 36px;
                    min-width: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: transparent;
                    border: 1.5px solid transparent;
                    color: var(--site-text-muted);
                    opacity: 0;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                    margin-top: 6px;
                }
                .rb-item-row:hover .rb-delete-btn {
                    opacity: 1;
                }
                .rb-delete-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    transform: scale(1.1);
                }
                .rb-delete-btn:active {
                    transform: scale(0.95);
                }

                /* ═══════════════════════════════════════════
                   CHIP DELETE (Skills / Interests)
                   ═══════════════════════════════════════════ */
                .rb-chip-delete {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: var(--site-text-muted);
                    opacity: 0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                .skill-chip:hover .rb-chip-delete {
                    opacity: 1;
                }
                .rb-chip-delete:hover {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                    transform: scale(1.15);
                }

                /* ═══════════════════════════════════════════
                   ADD BUTTON
                   ═══════════════════════════════════════════ */
                .rb-add-btn {
                    width: 100%;
                    padding: 14px;
                    border: 2px dashed var(--card-border);
                    border-radius: var(--rb-radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    background: transparent;
                    font-weight: 800;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--site-text-muted);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-add-btn:hover {
                    border-color: var(--rb-accent);
                    color: var(--rb-accent);
                    background: var(--rb-accent-glow);
                    transform: translateY(-2px);
                }
                .rb-add-btn:active {
                    transform: translateY(0) scale(0.98);
                }

                /* ═══════════════════════════════════════════
                   SIDEBAR / ORCHESTRATOR PANEL
                   ═══════════════════════════════════════════ */
                .rb-sidebar {
                    position: sticky;
                    top: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .rb-orchest-card {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    padding: 28px;
                    border-radius: var(--rb-radius);
                    color: white;
                    box-shadow: 0 20px 40px -10px rgba(79, 70, 229, 0.35);
                }

                /* ═══════════════════════════════════════════
                   ACTION BUTTONS
                   ═══════════════════════════════════════════ */
                .rb-action-primary {
                    width: 100%;
                    padding: 18px;
                    background: #fff;
                    color: #4f46e5;
                    border: none;
                    border-radius: var(--rb-radius-sm);
                    font-weight: 900;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .rb-action-primary:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                }
                .rb-action-primary:active { transform: translateY(0) scale(0.98); }
                .rb-action-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .rb-action-secondary {
                    width: 100%;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: var(--rb-radius-sm);
                    color: white;
                    font-weight: 700;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-action-secondary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: white;
                    transform: translateY(-2px);
                    cursor: pointer;
                }
                .rb-action-secondary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* ═══════════════════════════════════════════
                   STATUS PILL
                   ═══════════════════════════════════════════ */
                .status-pill {
                    padding: 12px 18px;
                    border-radius: var(--rb-radius-sm);
                    font-size: 0.78rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: rb-slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .status-info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
                .status-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

                @keyframes rb-slideIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ═══════════════════════════════════════════
                   SKILL / INTEREST CHIPS
                   ═══════════════════════════════════════════ */
                .skill-chip {
                    padding: 8px 16px;
                    background: var(--card-bg);
                    border: 1.5px solid var(--card-border);
                    border-radius: 50px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    color: var(--site-text);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: default;
                    user-select: none;
                }
                .skill-chip:hover {
                    border-color: var(--rb-accent);
                    background: var(--rb-accent-glow);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px var(--rb-accent-glow);
                }
                .skill-chip.interest-chip {
                    border-color: rgba(236, 72, 153, 0.2);
                }
                .skill-chip.interest-chip:hover {
                    border-color: #ec4899;
                    background: rgba(236, 72, 153, 0.1);
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
                }
                .skill-chip.interest-chip .rb-chip-delete:hover {
                    background: rgba(236, 72, 153, 0.15);
                    color: #ec4899;
                }

                /* ═══════════════════════════════════════════
                   RECOMMENDATIONS PANEL
                   ═══════════════════════════════════════════ */
                .rb-reco-panel {
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: var(--rb-radius-sm);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .rb-reco-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 9px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin-bottom: 14px;
                    opacity: 0.85;
                }

                /* ═══════════════════════════════════════════
                   SUCCESS CARD (RxResu.me link)
                   ═══════════════════════════════════════════ */
                .rb-success-card {
                    background: rgba(16, 185, 129, 0.08);
                    border: 1.5px solid rgba(16, 185, 129, 0.2);
                    border-radius: var(--rb-radius);
                    padding: 24px;
                    text-align: center;
                    animation: rb-slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* ═══════════════════════════════════════════
                   SKILLS & INTERESTS GRID
                   ═══════════════════════════════════════════ */
                .rb-chips-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 28px;
                }

                /* ═══════════════════════════════════════════
                   EXPERIENCE / PROJECT INNER GRID
                   ═══════════════════════════════════════════ */
                .rb-fields-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                    margin-bottom: 14px;
                }

                /* ═══════════════════════════════════════════
                   RESPONSIVE BREAKPOINTS
                   ═══════════════════════════════════════════ */

                /* <= 1280px: Tighten sidebar */
                @media (max-width: 1280px) {
                    .rb-main { grid-template-columns: 1fr 340px; gap: 32px; }
                }

                /* <= 1024px: Stack layout */
                @media (max-width: 1024px) {
                    .rb-main {
                        grid-template-columns: 1fr;
                        padding: 28px;
                        gap: 28px;
                    }
                    .rb-sidebar {
                        position: static;
                    }
                    .resume-builder-v2 { border-radius: 2rem; }
                }

                /* <= 768px: Tablet */
                @media (max-width: 768px) {
                    .rb-header { padding: 40px 24px; }
                    .rb-header-content h1 { font-size: 1.65rem; }
                    .rb-main { padding: 20px; gap: 20px; }
                    .rb-section-card { padding: 22px; margin-bottom: 20px; border-radius: var(--rb-radius-sm); }
                    .rb-item-row { padding: 18px; border-radius: var(--rb-radius-sm); }
                    .rb-orchest-card { padding: 24px; border-radius: var(--rb-radius-sm); }
                    .rb-chips-grid { grid-template-columns: 1fr; gap: 20px; }
                    .rb-fields-grid { grid-template-columns: 1fr; }
                    .resume-builder-v2 { border-radius: 1.5rem; }
                }

                /* <= 480px: Mobile */
                @media (max-width: 480px) {
                    .rb-header { padding: 32px 16px; }
                    .rb-header-content h1 { font-size: 1.35rem; }
                    .rb-header-sub { font-size: 0.8rem; }
                    .rb-main { padding: 14px; gap: 14px; }
                    .rb-section-card { padding: 16px; margin-bottom: 14px; border-radius: var(--rb-radius-xs); }
                    .rb-item-row { padding: 14px; border-radius: var(--rb-radius-xs); }
                    .rb-input-v2, .rb-textarea-v2 { padding: 12px 14px; font-size: 0.85rem; border-radius: var(--rb-radius-xs); }
                    .rb-orchest-card { padding: 20px; border-radius: var(--rb-radius-xs); }
                    .rb-action-primary { padding: 16px; font-size: 0.8rem; border-radius: var(--rb-radius-xs); }
                    .rb-action-secondary { padding: 14px; font-size: 0.75rem; border-radius: var(--rb-radius-xs); }
                    .rb-label { font-size: 9px; margin-bottom: 14px; }
                    .rb-delete-btn { opacity: 0.7; width: 30px; height: 30px; min-width: 30px; }
                    .rb-add-btn { padding: 12px; font-size: 0.7rem; border-radius: var(--rb-radius-xs); }
                    .skill-chip { padding: 6px 12px; font-size: 0.78rem; }
                    .resume-builder-v2 { border-radius: 1.25rem; }
                }
            `}</style>

            {/* ═══════════ HEADER ═══════════ */}
            <div className="rb-header">
                <div className="rb-header-content">
                    <div className="rb-header-badge">
                        <Rocket size={14} />
                        Enterprise AI Grade
                    </div>
                    <h1>ULTIMATE AI RESUME BUILDER</h1>
                    <p className="rb-header-sub">
                        Refine your profile data with a personal touch, then let the 🥇 Master AI Orchestrator optimize for ATS and push directly to Reactive Resume.
                    </p>
                </div>
            </div>

            <div className="rb-main">
                {/* ═══════════ EDITOR AREA ═══════════ */}
                <div className="rb-editor">

                    {/* Target Role & JD */}
                    <div className="rb-section-card">
                        <div className="rb-label">
                            <Target size={14} /> TARGET POSITION
                            {!targetRole && initialData?.targetRole && (
                                <span className="ml-2 text-[8px] opacity-70 italic text-amber-500 animate-pulse">
                                    (Syncing with Dashboard: {initialData.targetRole})
                                </span>
                            )}
                        </div>
                        <input
                            className="rb-input-v2"
                            placeholder={initialData?.targetRole ? `Using Dashboard Goal: ${initialData.targetRole}` : "e.g. Senior Product Manager"}
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        />
                        <div style={{ marginTop: '24px' }}>
                            <div className="rb-label"><Search size={14} /> JOB DESCRIPTION (FOR KEYWORD SYNC)</div>
                            <textarea
                                className="rb-textarea-v2"
                                style={{ minHeight: '120px', resize: 'vertical' }}
                                placeholder="Paste the job description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div className="rb-section-card">
                        <div className="rb-label"><Briefcase size={14} /> WORK EXPERIENCE</div>
                        {sections.experience.map((exp, i) => (
                            <div key={i} className="rb-item-row">
                                <div className="rb-item-header">
                                    <div className="rb-fields-grid">
                                        <input className="rb-input-v2" placeholder="Company" value={exp.company || ''} onChange={(e) => updateItem('experience', i, 'company', e.target.value)} />
                                        <input className="rb-input-v2" placeholder="Role" value={exp.role || ''} onChange={(e) => updateItem('experience', i, 'role', e.target.value)} />
                                    </div>
                                    <button
                                        className="rb-delete-btn"
                                        onClick={() => removeListItem('experience', i)}
                                        title="Remove experience"
                                        type="button"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <textarea className="rb-textarea-v2" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Impact-driven description..." value={exp.description || ''} onChange={(e) => updateItem('experience', i, 'description', e.target.value)} />
                            </div>
                        ))}
                        <button className="rb-add-btn" onClick={() => addListItem('experience', { company: '', role: '', description: '' })} type="button">
                            <Plus size={16} /> Add Experience
                        </button>
                    </div>

                    {/* Projects */}
                    <div className="rb-section-card">
                        <div className="rb-label"><Cpu size={14} /> KEY PROJECTS</div>
                        {sections.projects.map((p, i) => (
                            <div key={i} className="rb-item-row">
                                <div className="rb-item-header">
                                    <div className="rb-item-fields-solo">
                                        <input className="rb-input-v2" style={{ width: '100%' }} placeholder="Project Title" value={p.title || ''} onChange={(e) => updateItem('projects', i, 'title', e.target.value)} />
                                    </div>
                                    <button
                                        className="rb-delete-btn"
                                        onClick={() => removeListItem('projects', i)}
                                        title="Remove project"
                                        type="button"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                                <textarea className="rb-textarea-v2" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Project Description & Tech Stack" value={p.description || ''} onChange={(e) => updateItem('projects', i, 'description', e.target.value)} />
                            </div>
                        ))}
                        <button className="rb-add-btn" onClick={() => addListItem('projects', { title: '', description: '' })} type="button">
                            <Plus size={16} /> Add Project
                        </button>
                    </div>

                    {/* Skills & Interests */}
                    <div className="rb-chips-grid">
                        <div className="rb-section-card" style={{ marginBottom: 0 }}>
                            <div className="rb-label"><Code size={14} /> SKILLS</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                {sections.skills.map((s, i) => (
                                    <div key={i} className="skill-chip">
                                        <span>{s}</span>
                                        <button
                                            className="rb-chip-delete"
                                            onClick={() => removeListItem('skills', i)}
                                            title="Remove skill"
                                            type="button"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                className="rb-input-v2"
                                style={{ fontSize: '0.85rem' }}
                                placeholder="Type and press Enter..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        addListItem('skills', e.target.value.trim());
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                        <div className="rb-section-card" style={{ marginBottom: 0 }}>
                            <div className="rb-label"><Heart size={14} /> PERSONAL INTERESTS</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                {sections.interests.map((it, i) => (
                                    <div key={i} className="skill-chip interest-chip">
                                        <span>{it}</span>
                                        <button
                                            className="rb-chip-delete"
                                            onClick={() => removeListItem('interests', i)}
                                            title="Remove interest"
                                            type="button"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                className="rb-input-v2"
                                style={{ fontSize: '0.85rem' }}
                                placeholder="Surfing, Origami, AI Art..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        addListItem('interests', e.target.value.trim());
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════ SIDEBAR ORCHESTRATOR ═══════════ */}
                <div className="rb-sidebar">
                    {status.message && (
                        <div className={`status-pill status-${status.type}`}>
                            {status.type === 'info' && <Cpu size={16} className="animate-spin" />}
                            {status.type === 'success' && <Check size={16} />}
                            {status.type === 'error' && <AlertCircle size={16} />}
                            {status.message}
                        </div>
                    )}

                    <div className="rb-orchest-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Sparkles size={22} style={{ opacity: 0.9 }} />
                            <h3 style={{ fontWeight: 900, letterSpacing: '0.2em', fontSize: '0.75rem', textTransform: 'uppercase', margin: 0 }}>ORCHESTRATOR</h3>
                        </div>

                        <p style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7, marginBottom: '28px', lineHeight: 1.7 }}>
                            Running the orchestrator will optimize your custom edits for ATS and prepare your push to Reactive Resume.
                        </p>

                        <button
                            className="rb-action-primary"
                            onClick={() => handleGenerate(false)}
                            disabled={loading}
                            style={{ marginBottom: '14px' }}
                            type="button"
                        >
                            {loading ? "SYNCING..." : "OPTIMIZE WITH AI"}
                            <Zap size={18} />
                        </button>

                        <button
                            className="rb-action-secondary"
                            onClick={() => handleGenerate(true)}
                            disabled={loading || rxUrl}
                            style={{ marginBottom: '24px' }}
                            type="button"
                        >
                            <Rocket size={16} />
                            PUSH TO REACTIVE RESUME
                        </button>

                        <div className="rb-reco-panel" style={{ padding: '20px' }}>
                            <div className="rb-reco-badge" style={{ marginBottom: '16px' }}>
                                <Info size={13} />
                                Master AI Insights
                            </div>
                            
                            {result ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {/* Score Metrics Section */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                        {/* ATS Score */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px 5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="36" height="36">
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#fbbf24" strokeWidth="3" 
                                                        strokeDasharray={100}
                                                        strokeDashoffset={100 - (100 * (result.ats_score || 85)) / 100}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 900, color: '#fff' }}>{result.ats_score || 85}%</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: '#fbbf24', textAlign: 'center' }}>ATS COMPATIBILITY</p>
                                        </div>

                                        {/* Recruiter Impact */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px 5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="36" height="36">
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3" 
                                                        strokeDasharray={100}
                                                        strokeDashoffset={100 - (100 * (result.recruiter_impact || 82)) / 100}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 900, color: '#fff' }}>{result.recruiter_impact || 82}%</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: '#10b981', textAlign: 'center' }}>RECRUITER IMPACT</p>
                                        </div>

                                        {/* Market Alignment */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px 5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="36" height="36">
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="#6366f1" strokeWidth="3" 
                                                        strokeDasharray={100}
                                                        strokeDashoffset={100 - (100 * (result.market_alignment || 90)) / 100}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span style={{ position: 'absolute', fontSize: '9px', fontWeight: 900, color: '#fff' }}>{result.market_alignment || 90}%</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: '#6366f1', textAlign: 'center' }}>MARKET ALIGNMENT</p>
                                        </div>
                                    </div>

                                    {/* Strategic Reasoning */}
                                    {result.strategic_reasoning && (
                                        <div style={{ fontSize: '10px', fontStyle: 'italic', opacity: 0.8, linePadding: '1.4', borderLeft: '2px solid #fbbf24', paddingLeft: '10px' }}>
                                            "{result.strategic_reasoning}"
                                        </div>
                                    )}

                                    {/* Keywords Section */}
                                    <div>
                                        <p style={{ margin: '0 0 8px 0', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5 }}>Strategic Keywords</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {(result.extracted_keywords || []).map((k, i) => (
                                                <span key={i} style={{ fontSize: '9px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)', fontWeight: 700 }}>
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Template & Color */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 900, opacity: 0.5 }}>TEMPLATE:</span>
                                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'white', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                                                {result.reactive_resume_metadata?.template || "Onyx"}
                                            </span>
                                        </div>
                                        {result.reactive_resume_metadata?.accentColor && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 900, opacity: 0.5 }}>ACCENT:</span>
                                                <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: result.reactive_resume_metadata.accentColor, border: '1px solid rgba(255,255,255,0.2)' }}></span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '10px', fontWeight: 600, opacity: 0.55, margin: 0 }}>AI insights will appear after optimization.</p>
                            )}
                        </div>
                    </div>

                    {rxUrl && (
                        <div className="rb-success-card">
                            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#10b981', marginBottom: '16px', letterSpacing: '0.1em' }}>Masterpiece Built!</p>
                            <a
                                href={rxUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rb-action-primary"
                                style={{ background: '#10b981', color: 'white', textDecoration: 'none', display: 'inline-flex' }}
                            >
                                VIEW ON RXRESU.ME
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
