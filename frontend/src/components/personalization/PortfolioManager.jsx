'use client';
import { useState, useEffect } from 'react';
import {
    User, Briefcase, GraduationCap, Code, Award, Globe, Settings, Zap,
    Plus, Trash2, Sparkles, Save, ExternalLink, ChevronRight, Check,
    Linkedin, Github, Twitter, Link2, Phone, Mail, MapPin, Calendar,
    Cpu, FileText, Search, AlertCircle, BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { getPublicAppUrl } from '../../lib/runtimeConfig';

// Tab definitions
const TABS = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'showcase', label: 'Showcase', icon: Award },
    { id: 'ai', label: 'AI Center', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings }
];

// ========== SHARED COMPONENTS ==========

/**
 * Premium Field Group Component
 * Standardizes labels and icon containers across all tabs
 */
const FieldGroup = ({ icon: Icon, label, children, iconColor = '#6366f1' }) => (
    <div className="pm-field-group">
        <label className="pm-label">
            <Icon size={14} style={{ color: iconColor }} />
            {label}
        </label>
        <div className="pm-field-wrapper">
            {children}
        </div>
    </div>
);

export default function PortfolioManager({ token, initialData }) {
    const [activeTab, setActiveTab] = useState('basic');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [aiLoading, setAiLoading] = useState({});

    // Portfolio state
    const [portfolio, setPortfolio] = useState({
        professionalSummary: initialData?.portfolio?.professionalSummary || '',
        headline: initialData?.portfolio?.headline || '',
        contactInfo: initialData?.portfolio?.contactInfo || {},
        careerObjective: initialData?.portfolio?.careerObjective || {},
        experience: initialData?.portfolio?.experience || [],
        education: initialData?.portfolio?.education || [],
        certificates: initialData?.portfolio?.certificates || [],
        customProjects: initialData?.portfolio?.customProjects || [],
        languages: initialData?.portfolio?.languages || [],
        softSkills: initialData?.portfolio?.softSkills || [],
        volunteering: initialData?.portfolio?.volunteering || [],
        awards: initialData?.portfolio?.awards || [],
        socialLinks: initialData?.portfolio?.socialLinks || {},
        featuredSkills: initialData?.portfolio?.featuredSkills || [],
        privacySettings: initialData?.portfolio?.privacySettings || {},
        portfolioTheme: initialData?.portfolio?.portfolioTheme || 'professional'
    });

    const [atsScore, setAtsScore] = useState(initialData?.portfolio?.atsScore || null);

    // Update field helper
    const updateField = (section, value) => {
        setPortfolio(prev => ({ ...prev, [section]: value }));
    };

    const updateNestedField = (section, key, value) => {
        setPortfolio(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value }
        }));
    };

    // Array helpers
    const addToArray = (section, item) => {
        setPortfolio(prev => ({
            ...prev,
            [section]: [...prev[section], item]
        }));
    };

    const removeFromArray = (section, index) => {
        setPortfolio(prev => ({
            ...prev,
            [section]: prev[section].filter((_, i) => i !== index)
        }));
    };

    const updateArrayItem = (section, index, updates) => {
        setPortfolio(prev => ({
            ...prev,
            [section]: prev[section].map((item, i) =>
                i === index ? { ...item, ...updates } : item
            )
        }));
    };

    // Save portfolio
    const handleSave = async () => {
        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            const result = await api.updatePortfolioSettings(portfolio, token);
            if (result.success) {
                setStatus({ type: 'success', message: 'Portfolio saved successfully!' });
            } else {
                throw new Error(result.error || 'Save failed');
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setSaving(false);
            setTimeout(() => setStatus({ type: '', message: '' }), 3000);
        }
    };

    // AI: Portfolio Strength Calculation
    const calculateStrength = () => {
        let score = 0;
        if (portfolio.headline) score += 10;
        if (portfolio.professionalSummary) score += 20;
        if (portfolio.experience?.length > 0) score += 20;
        if (portfolio.skills?.length > 0) score += 15;
        if (portfolio.customProjects?.length > 0) score += 15;
        if (portfolio.socialLinks?.linkedin || portfolio.socialLinks?.github) score += 10;
        if (portfolio.education?.length > 0) score += 10;
        return Math.min(100, score);
    };

    const strength = calculateStrength();

    // AI: Generate Bio
    const generateBio = async () => {
        setAiLoading(prev => ({ ...prev, bio: true }));
        try {
            const result = await api.generatePortfolioBio(token);
            if (result.success && result.summary) {
                updateField('professionalSummary', result.summary);
            }
        } catch (err) {
            console.error('Bio generation failed:', err);
        } finally {
            setAiLoading(prev => ({ ...prev, bio: false }));
        }
    };

    // AI: Analyze ATS
    const analyzeATS = async () => {
        setAiLoading(prev => ({ ...prev, ats: true }));
        try {
            const result = await api.analyzePortfolioATS(null, token);
            if (result.success) {
                setAtsScore(result.atsScore);
            }
        } catch (err) {
            console.error('ATS analysis failed:', err);
        } finally {
            setAiLoading(prev => ({ ...prev, ats: false }));
        }
    };

    // AI: Smart Polish Fallback (Client-side template engine)
    const smartPolishFallback = (section, original) => {
        const experienceVerbs = ["Spearheaded", "Architected", "Orchestrated", "Catalyzed", "Engineered", "Optimized", "Strategized", "Delivered"];
        const projectVerbs = ["Built and deployed", "Architected", "Engineered a scalable", "Modernized", "Developed an elite", "Integrated"];

        const verbs = section === 'experience' ? experienceVerbs : projectVerbs;
        const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

        // Simple logic to replace mundane verbs or prepend a strong one
        if (!original || original.length < 5) return original;

        const firstWord = original.split(' ')[0];
        const mundaneVerbs = ["Worked", "Did", "Made", "Used", "Helped", "Started"];

        if (mundaneVerbs.includes(firstWord)) {
            return original.replace(firstWord, randomVerb);
        }

        return `${randomVerb} ${original.charAt(0).toLowerCase()}${original.slice(1)}`;
    };

    // AI: Polish description
    const polishDescription = async (section, index) => {
        const key = `${section}-${index}`;
        setAiLoading(prev => ({ ...prev, [key]: true }));
        setStatus({ type: '', message: '' });

        try {
            const item = portfolio[section][index];
            const result = await api.refinePortfolio(
                section === 'experience' ? 'experience' : 'project',
                item,
                token
            );

            if (result.success && result.refined) {
                updateArrayItem(section, index, { description: result.refined });
                setStatus({ type: 'success', message: '✨ Content refined by AI Bytez!' });
            } else {
                // Trigger Smart Fallback
                const polished = smartPolishFallback(section, item.description);
                updateArrayItem(section, index, { description: polished });
                setStatus({ type: 'success', message: '✨ Content polished via Smart Fallback' });
            }
        } catch (err) {
            console.error('Polish failed, using fallback:', err);
            const item = portfolio[section][index];
            const polished = smartPolishFallback(section, item.description);
            updateArrayItem(section, index, { description: polished });
            setStatus({ type: 'success', message: '✨ Content polished via Smart Fallback' });
        } finally {
            setAiLoading(prev => ({ ...prev, [key]: false }));
            setTimeout(() => setStatus({ type: '', message: '' }), 4000);
        }
    };

    return (
        <div className="portfolio-manager">
            <style jsx>{`
                /* ========== PORTFOLIO MANAGER - INFINITE DETAIL PRO DESIGN ========== */
                :root {
                    --pm-glow-primary: rgba(99, 102, 241, 0.45);
                    --pm-glow-secondary: rgba(139, 92, 246, 0.35);
                    --pm-input-focus: #6366f1;
                    --pm-transition-pro: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    --pm-shadow-pro: 0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.05);
                    --pm-shadow-elite: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    --pm-shadow-inset: inset 0 2px 4px rgba(0,0,0,0.06);
                    --pm-accent-grad: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
                }

                .portfolio-manager {
                    background: var(--card-bg);
                    border-radius: 2rem;
                    border: 1px solid var(--card-border);
                    overflow: hidden;
                    box-shadow: var(--pm-shadow-elite);
                    font-family: var(--font-inter);
                    position: relative;
                }

                /* ========== HEADER - ELITE GLASSMORPHIC ========== */
                .pm-header {
                    padding: 28px 40px;
                    background: linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 24px;
                    position: relative;
                    overflow: hidden;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .pm-header::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -10%;
                    width: 60%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
                    pointer-events: none;
                }
                .pm-header::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                }
                .pm-title {
                    font-size: 1.85rem;
                    font-weight: 900;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    position: relative;
                    z-index: 1;
                    font-family: var(--font-outfit);
                    text-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                .pm-strength-container {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 180px;
                    position: relative;
                    z-index: 1;
                }
                .pm-strength-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.9);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .pm-strength-bar-bg {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .pm-strength-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #34d399);
                    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                }
                .pm-title-badge {
                    background: rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    color: white;
                    font-size: 0.55rem;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    border: 1px solid rgba(255,255,255,0.25);
                }
                .pm-save-btn {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    border: none;
                    padding: 14px 28px;
                    border-radius: 0.875rem;
                    font-weight: 800;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 12px 35px -8px rgba(16, 185, 129, 0.45);
                    position: relative;
                    z-index: 1;
                }
                .pm-save-btn:hover { 
                    transform: translateY(-3px) scale(1.03); 
                    box-shadow: 0 18px 45px -8px rgba(16, 185, 129, 0.55); 
                }
                .pm-save-btn:active { transform: scale(0.97); }
                .pm-save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .pm-print-btn {
                    position: fixed;
                    bottom: 100px;
                    right: 32px;
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 14px 28px;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
                    z-index: 9999;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .pm-print-btn:hover {
                    transform: scale(1.1) translateY(-5px);
                    box-shadow: 0 15px 35px rgba(99, 102, 241, 0.6);
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                }
                .pm-print-btn svg {
                    filter: drop-shadow(0 0 5px rgba(255,255,255,0.3));
                }

                @media print {
                    .pm-print-btn, .pm-header, .pm-tabs, .pm-status, .pm-add-btn, .pm-icon-btn, .pm-ai-btn {
                        display: none !important;
                    }
                }

                /* ========== TABS ========== */
                .pm-tabs {
                    display: flex;
                    background: var(--site-bg);
                    padding: 10px;
                    margin: 16px;
                    border-radius: 1rem;
                    overflow-x: auto;
                    scrollbar-width: none;
                    gap: 6px;
                    border: 1px solid var(--card-border);
                }
                .pm-tabs::-webkit-scrollbar { display: none; }
                .pm-tab {
                    padding: 14px 22px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--site-text-muted);
                    cursor: pointer;
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    white-space: nowrap;
                    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    border: 1.5px solid transparent;
                }
                .pm-tab:hover { 
                    background: var(--card-bg); 
                    color: var(--site-text);
                    border-color: var(--card-border);
                }
                .pm-tab.active {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    box-shadow: 0 10px 25px -6px rgba(99, 102, 241, 0.45);
                    border-color: transparent;
                }
                .pm-tab svg { width: 18px; height: 18px; flex-shrink: 0; }

                /* ========== CONTENT AREA ========== */
                .pm-content {
                    padding: 32px 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    overflow-y: auto;
                    height: calc(100% - 70px);
                    scrollbar-width: thin;
                    scrollbar-color: var(--card-border) transparent;
                }
                .pm-content::-webkit-scrollbar { width: 8px; }
                .pm-content::-webkit-scrollbar-track { background: transparent; }
                .pm-content::-webkit-scrollbar-thumb { 
                    background: var(--card-border); 
                    border-radius: 4px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }
                .pm-content::-webkit-scrollbar-thumb:hover { 
                    background: var(--site-text-muted); 
                    background-clip: padding-box;
                }

                /* ========== SECTIONS ========== */
                .pm-section {
                    margin-bottom: 32px;
                    padding: 28px;
                    background: linear-gradient(145deg, var(--card-bg) 0%, var(--site-bg) 100%);
                    border-radius: 1.5rem;
                    border: 1px solid var(--card-border);
                    transition: var(--pm-transition-pro);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px -15px rgba(0,0,0,0.05);
                }
                .pm-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: var(--pm-accent-grad);
                    opacity: 0.8;
                }
                .pm-section:hover {
                    border-color: rgba(99, 102, 241, 0.4);
                    box-shadow: 0 20px 40px -20px rgba(99, 102, 241, 0.2);
                    transform: translateY(-2px);
                }
                .pm-section-title {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: var(--site-text);
                    margin-bottom: 28px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    padding-bottom: 18px;
                    border-bottom: 2px solid var(--card-border);
                    position: relative;
                    font-family: var(--font-outfit);
                }
                .pm-section-title::after {
                    content: '';
                    position: absolute;
                    bottom: -1.5px;
                    left: 0;
                    width: 60px;
                    height: 1.5px;
                    background: #6366f1;
                }
                .pm-section-title svg {
                    color: #6366f1;
                    flex-shrink: 0;
                }

                /* ========== FORM ELEMENTS - INFINITE DETAIL ========== */
                .pm-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: var(--site-text-muted);
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    font-family: var(--font-outfit);
                    transition: var(--pm-transition-pro);
                }
                .pm-label svg {
                    width: 14px;
                    height: 14px;
                    color: #6366f1;
                    filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
                }
                .pm-field-wrapper {
                    position: relative;
                    width: 100%;
                }
                .pm-input, .pm-textarea, .pm-select {
                    width: 100%;
                    padding: 16px 20px;
                    border: 1.5px solid var(--card-border);
                    border-radius: 1.25rem;
                    background: var(--site-bg);
                    color: var(--site-text);
                    font-size: 0.95rem;
                    font-weight: 600;
                    transition: var(--pm-transition-pro);
                    font-family: var(--font-inter);
                    box-shadow: var(--pm-shadow-inset);
                    line-height: 1.5;
                }
                .pm-input:focus, .pm-textarea:focus, .pm-select:focus {
                    outline: none;
                    border-color: var(--pm-input-focus);
                    background: var(--card-bg);
                    box-shadow: 
                        var(--pm-shadow-inset),
                        0 0 0 4px rgba(99, 102, 241, 0.1),
                        0 20px 40px -15px rgba(99, 102, 241, 0.2);
                    transform: translateY(-2px);
                }
                .pm-input:hover, .pm-textarea:hover, .pm-select:hover {
                    border-color: rgba(99, 102, 241, 0.5);
                    background: var(--card-bg);
                }
                .pm-input::placeholder, .pm-textarea::placeholder { 
                    color: var(--site-text-muted); 
                    opacity: 0.4; 
                    font-weight: 500;
                }
                .pm-textarea { 
                    resize: vertical; 
                    min-height: 130px; 
                }
                .pm-select {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 18px center;
                }

                .pm-pro-tip {
                    margin-top: 16px;
                    padding: 12px 18px;
                    background: rgba(99, 102, 241, 0.05);
                    border: 1px solid rgba(99, 102, 241, 0.1);
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.75rem;
                    color: var(--site-text-muted);
                    font-weight: 500;
                }
                .pm-pro-tip svg { color: #6366f1; flex-shrink: 0; }

                .pm-stats-row {
                    margin-top: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                }
                .pm-badge {
                    padding: 6px 14px;
                    border-radius: 50px;
                    font-size: 0.65rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .pm-badge.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .pm-badge.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .pm-char-count { font-size: 0.7rem; font-weight: 700; color: var(--site-text-muted); opacity: 0.6; }

                .pm-section.accent-indigo { border-top: 4px solid #6366f1; }
                .pm-section.accent-emerald { border-top: 4px solid #10b981; }
                .pm-section.accent-amber { border-top: 4px solid #f59e0b; }
                .pm-section.accent-blue { border-top: 4px solid #3b82f6; }

                /* ========== AI BUTTONS - REFINED GLOW ========== */
                .pm-ai-btn {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
                    background-size: 200% 200%;
                    animation: pm-grad-shift 5s ease infinite;
                    color: white;
                    border: none;
                    padding: 14px 26px;
                    border-radius: 1rem;
                    font-size: 0.75rem;
                    font-weight: 900;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    transition: var(--pm-transition-pro);
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.4);
                    border: 1px solid rgba(255,255,255,0.2);
                    position: relative;
                    overflow: hidden;
                }
                @keyframes pm-grad-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .pm-ai-btn:hover { 
                    transform: translateY(-4px) scale(1.04); 
                    box-shadow: 0 20px 50px -10px rgba(99, 102, 241, 0.6);
                    filter: brightness(1.1);
                }
                .pm-ai-btn::after {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .pm-ai-btn:hover::after { opacity: 1; }
                .pm-ai-btn:active { transform: translateY(0) scale(0.96); }
                .pm-icon-btn {
                    width: 42px;
                    height: 42px;
                    border: none;
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: var(--pm-transition-pro);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .pm-icon-btn.danger {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.1);
                }
                .pm-icon-btn.danger:hover {
                    background: #ef4444;
                    color: white;
                    transform: scale(1.1) rotate(5deg);
                }
                .pm-icon-btn.ai {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
                    color: #6366f1;
                    border: 1px solid rgba(99, 102, 241, 0.2);
                }
                .pm-icon-btn.ai:hover {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    transform: scale(1.1) rotate(-5deg);
                }
                .pm-icon-btn:disabled { 
                    opacity: 0.5; 
                    cursor: not-allowed; 
                    transform: none !important; 
                }

                /* ========== CARDS - INFINITE DETAIL ========== */
                .pm-card {
                    background: var(--site-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 1.5rem;
                    padding: 26px;
                    margin-bottom: 26px;
                    transition: var(--pm-transition-pro);
                    position: relative;
                    box-shadow: 0 8px 25px -10px rgba(0,0,0,0.08);
                    overflow: hidden;
                }
                .pm-card:hover {
                    border-color: var(--pm-input-focus);
                    box-shadow: 0 25px 50px -20px rgba(99, 102, 241, 0.25);
                    transform: translateY(-6px) scale(1.01);
                }
                .pm-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 24px;
                }
                .pm-card-actions {
                    display: flex;
                    gap: 10px;
                }

                .pm-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                }

                /* ========== ADD BUTTON - PRO STYLE ========== */
                .pm-add-btn {
                    width: 100%;
                    padding: 20px;
                    background: transparent;
                    border: 2px dashed var(--card-border);
                    border-radius: 1.5rem;
                    color: var(--site-text-muted);
                    font-weight: 800;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: var(--pm-transition-pro);
                }
                .pm-add-btn:hover {
                    border-color: #6366f1;
                    color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                    transform: scale(1.01);
                }
                .pm-add-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .pm-count-badge {
                    margin-left: auto;
                    font-size: 0.65rem;
                    padding: 6px 14px;
                    background: rgba(99, 102, 241, 0.1);
                    border: 1px solid rgba(99, 102, 241, 0.2);
                    border-radius: 50px;
                    color: #6366f1;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .pm-timeline-controls {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .pm-connector {
                    color: var(--site-text-muted);
                    font-weight: 900;
                    opacity: 0.4;
                }

                .pm-input.headline {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #6366f1;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid var(--card-border);
                    border-radius: 0;
                    padding: 8px 0;
                    box-shadow: none;
                }
                .pm-input.headline:focus {
                    transform: none;
                    border-color: #6366f1;
                    background: transparent;
                }

                .pm-row-spaced {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    flex-wrap: wrap;
                }

                .pm-card.elite-border-left {
                    border-left: 5px solid #6366f1;
                }

                /* ========== SKILLS & TAGS - ELITE UI ========== */
                .pm-skill-entry {
                    display: grid;
                    grid-template-columns: 1fr auto auto;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 12px;
                    padding: 10px;
                    background: rgba(99, 102, 241, 0.03);
                    border-radius: 1rem;
                    border: 1px solid transparent;
                    transition: var(--pm-transition-pro);
                }
                .pm-skill-entry:hover {
                    background: var(--card-bg);
                    border-color: rgba(99, 102, 241, 0.2);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .pm-tag-editable {
                    background: var(--site-bg);
                    border: 1.5px solid var(--card-border);
                    padding: 8px 14px;
                    border-radius: 50px;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: var(--pm-transition-pro);
                    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
                }
                .pm-tag-editable:hover {
                    border-color: #6366f1;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(99, 102, 241, 0.15);
                }
                .pm-tag-input {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--site-text);
                    font-size: 0.8rem;
                    font-weight: 700;
                    width: 80px;
                }
                .pm-tag-editable button {
                    background: transparent;
                    border: none;
                    color: var(--site-text-muted);
                    font-size: 1.2rem;
                    cursor: pointer;
                    line-height: 1;
                    transition: color 0.2s;
                }
                .pm-tag-editable button:hover { color: #ef4444; }

                .pm-tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 16px;
                }

                /* ========== AI CENTER - DATA VISUALIZATION ========== */
                .pm-ats-card {
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    border-radius: 2rem;
                    padding: 40px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 40px;
                    box-shadow: 0 20px 50px -10px rgba(30, 27, 75, 0.4);
                    position: relative;
                    overflow: hidden;
                }
                .pm-ats-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -10%;
                    width: 50%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
                }
                .pm-score-main {
                    text-align: center;
                    position: relative;
                }
                .pm-score-value {
                    font-size: 5rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    line-height: 1;
                    text-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .pm-score-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    opacity: 0.7;
                    margin-top: 8px;
                    font-weight: 800;
                }
                .pm-score-breakdown {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    flex: 1;
                }
                .pm-score-item {
                    background: rgba(255,255,255,0.05);
                    padding: 20px;
                    border-radius: 1.25rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    text-align: center;
                    transition: transform 0.3s ease;
                }
                .pm-score-item:hover { transform: translateY(-5px); background: rgba(255,255,255,0.08); }
                .pm-score-item .val { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
                .pm-score-item .lbl { font-size: 0.6rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.1em; }

                /* ========== AI REVIEW - STRATEGIC ANALYSIS ========== */
                .pm-review-content {
                    display: flex;
                    flex-direction: column;
                    gap: 28px;
                }
                .pm-impression-block {
                    background: rgba(16, 185, 129, 0.04);
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    padding: 24px;
                    border-radius: 1.5rem;
                    position: relative;
                }
                .pm-impression-block h4 {
                    font-size: 0.85rem;
                    color: #059669;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 900;
                }
                .pm-impression-block p {
                    font-size: 0.95rem;
                    line-height: 1.6;
                    color: var(--site-text);
                    font-weight: 500;
                }
                .pm-pro-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                .pm-pro-card {
                    padding: 24px;
                    border-radius: 1.5rem;
                    border: 1px solid var(--card-border);
                }
                .pm-pro-card.success { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); }
                .pm-pro-card.warning { background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); }
                .pm-pro-card h5 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.8rem;
                    font-weight: 900;
                    margin-bottom: 18px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .pm-pro-card.success h5 { color: #059669; }
                .pm-pro-card.warning h5 { color: #d97706; }
                .pm-pro-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
                .pm-pro-card li { font-size: 0.88rem; line-height: 1.5; font-weight: 500; color: var(--site-text); position: relative; padding-left: 14px; }
                .pm-pro-card li::before { content: ''; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.5; }

                /* ========== STATUS MESSAGES ========== */
                .pm-status {
                    position: fixed;
                    bottom: 32px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    padding: 16px 32px;
                    border-radius: 50px;
                    font-size: 0.9rem;
                    font-weight: 800;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    backdrop-filter: blur(15px);
                    animation: pm-status-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes pm-status-pop {
                    from { bottom: -100px; opacity: 0; }
                    to { bottom: 32px; opacity: 1; }
                }
                .pm-status.success { 
                    background: rgba(16, 185, 129, 0.9); 
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .pm-status.error { 
                    background: rgba(239, 68, 68, 0.9); 
                    color: white;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                /* ========== ATS SCORE DISPLAY ========== */
                .ats-score-display {
                    background: linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
                    border-radius: 1.25rem;
                    padding: 32px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                .ats-score-display::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -30%;
                    width: 80%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
                    pointer-events: none;
                }
                .ats-main-score {
                    font-size: 4rem;
                    font-weight: 900;
                    text-align: center;
                    position: relative;
                    z-index: 1;
                    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .ats-breakdown {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-top: 24px;
                    position: relative;
                    z-index: 1;
                }
                .ats-item {
                    text-align: center;
                    padding: 18px 14px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 1rem;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .ats-item-value { 
                    font-size: 1.75rem; 
                    font-weight: 800; 
                }
                .ats-item-label { 
                    font-size: 0.65rem; 
                    opacity: 0.8; 
                    text-transform: uppercase; 
                    letter-spacing: 0.1em; 
                    margin-top: 6px; 
                }

                /* ========== ATS IMPROVEMENT SUGGESTIONS ========== */
                .ats-suggestions {
                    margin-top: 20px;
                    padding: 20px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .ats-suggestions-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-bottom: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .ats-suggestion-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px 14px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 0.75rem;
                    margin-bottom: 10px;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    border-left: 3px solid #10b981;
                }
                .ats-suggestion-item:last-child {
                    margin-bottom: 0;
                }
                .ats-suggestion-icon {
                    flex-shrink: 0;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #10b981;
                }

                /* ========== RESPONSIVE - ULTRA WIDE (1800px+) ========== */
                @media (min-width: 1800px) {
                    .pm-header { padding: 28px 40px; }
                    .pm-title { font-size: 1.6rem; gap: 16px; }
                    .pm-title-badge { font-size: 0.65rem; padding: 6px 16px; }
                    .pm-save-btn { padding: 18px 36px; font-size: 0.8rem; }
                    .pm-tabs { margin: 20px; padding: 12px; gap: 10px; }
                    .pm-tab { padding: 18px 28px; font-size: 0.85rem; }
                    .pm-content { padding: 40px; max-height: 850px; }
                    .pm-section { padding: 32px; margin-bottom: 36px; border-radius: 1.5rem; }
                    .pm-section-title { font-size: 1.05rem; margin-bottom: 24px; padding-bottom: 18px; }
                    .pm-input, .pm-textarea, .pm-select { padding: 18px 22px; font-size: 1rem; border-radius: 1rem; }
                    .pm-card { padding: 26px; border-radius: 1.25rem; }
                    .pm-ai-btn { padding: 16px 26px; font-size: 0.8rem; }
                    .pm-add-btn { padding: 22px; font-size: 0.9rem; }
                    .ats-main-score { font-size: 5rem; }
                }

                /* ========== RESPONSIVE - WIDE (1400px+) ========== */
                @media (min-width: 1400px) and (max-width: 1799px) {
                    .pm-header { padding: 24px 32px; }
                    .pm-title { font-size: 1.4rem; }
                    .pm-content { padding: 34px; }
                    .pm-section { padding: 28px; }
                }

                /* ========== RESPONSIVE - DESKTOP (1200px) ========== */
                @media (max-width: 1200px) {
                    .pm-col { min-width: 200px; }
                }

                /* ========== RESPONSIVE - TABLET (768px) ========== */
                @media (max-width: 768px) {
                    .portfolio-manager { border-radius: 1.25rem; }
                    .pm-header { padding: 18px 20px; }
                    .pm-title { font-size: 1.1rem; }
                    .pm-title-badge { font-size: 0.5rem; padding: 4px 10px; }
                    .pm-save-btn { padding: 12px 20px; font-size: 0.65rem; }
                    .pm-tabs { margin: 12px; padding: 8px; gap: 4px; border-radius: 0.875rem; }
                    .pm-tab { padding: 12px 16px; font-size: 0.7rem; gap: 8px; }
                    .pm-tab svg { width: 16px; height: 16px; }
                    .pm-content { padding: 20px; max-height: 650px; }
                    .pm-section { padding: 18px; margin-bottom: 22px; border-radius: 1rem; }
                    .pm-section-title { font-size: 0.85rem; margin-bottom: 14px; padding-bottom: 12px; }
                    .pm-row { flex-direction: column; gap: 16px; }
                    .pm-col { min-width: 100%; }
                    .pm-input, .pm-textarea, .pm-select { padding: 13px 16px; font-size: 0.88rem; }
                    .pm-card { padding: 16px; }
                    .pm-ai-btn { padding: 11px 18px; font-size: 0.68rem; }
                    .ats-breakdown { grid-template-columns: repeat(3, 1fr); gap: 10px; }
                    .ats-main-score { font-size: 3.5rem; }
                    .ats-item { padding: 14px 10px; }
                    .ats-item-value { font-size: 1.4rem; }
                }

                /* ========== RESPONSIVE - MOBILE (480px) ========== */
                @media (max-width: 480px) {
                    .portfolio-manager { border-radius: 1rem; }
                    .pm-header { 
                        padding: 16px; 
                        flex-direction: column; 
                        align-items: stretch; 
                        gap: 14px;
                    }
                    .pm-title { font-size: 1rem; justify-content: center; }
                    .pm-save-btn { width: 100%; justify-content: center; padding: 14px 20px; }
                    .pm-tabs { 
                        flex-wrap: nowrap; 
                        margin: 10px; 
                        padding: 6px;
                        border-radius: 0.75rem;
                    }
                    .pm-tab { 
                        padding: 10px 12px; 
                        font-size: 0.62rem; 
                        flex-direction: column; 
                        gap: 5px;
                        border-radius: 0.625rem;
                    }
                    .pm-tab svg { width: 16px; height: 16px; }
                    .pm-content { padding: 14px; max-height: 600px; }
                    .pm-section { padding: 14px; border-radius: 0.875rem; margin-bottom: 18px; }
                    .pm-section-title { 
                        font-size: 0.78rem; 
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-bottom: 12px;
                        padding-bottom: 10px;
                    }
                    .pm-input, .pm-textarea, .pm-select { 
                        padding: 12px 14px; 
                        font-size: 0.88rem; 
                        border-radius: 0.75rem;
                    }
                    .pm-label { font-size: 0.65rem; margin-bottom: 8px; }
                    .pm-ai-btn { 
                        width: 100%; 
                        justify-content: center; 
                        padding: 12px 16px;
                        font-size: 0.68rem;
                    }
                    .pm-card { padding: 14px; border-radius: 0.875rem; }
                    .pm-card-header { flex-direction: column; gap: 12px; }
                    .pm-card-actions { width: 100%; justify-content: flex-end; }
                    .pm-add-btn { padding: 16px; font-size: 0.75rem; }
                    .ats-score-display { padding: 24px 18px; border-radius: 1rem; }
                    .ats-breakdown { grid-template-columns: repeat(3, 1fr); gap: 8px; }
                    .ats-main-score { font-size: 3rem; }
                    .ats-item { padding: 12px 8px; border-radius: 0.75rem; }
                    .ats-item-value { font-size: 1.25rem; }
                    .ats-item-label { font-size: 0.55rem; }
                    .ats-suggestions { padding: 14px; }
                    .ats-suggestion-item { padding: 10px 12px; font-size: 0.8rem; }
                }

                /* ========== RESPONSIVE - SMALL MOBILE (360px) ========== */
                @media (max-width: 360px) {
                    .portfolio-manager { border-radius: 0.875rem; }
                    .pm-header { padding: 14px 12px; gap: 12px; }
                    .pm-title { font-size: 0.9rem; gap: 8px; }
                    .pm-title svg { width: 18px; height: 18px; }
                    .pm-title-badge { display: none; }
                    .pm-save-btn { padding: 12px 16px; font-size: 0.6rem; }
                    .pm-tabs { margin: 8px; padding: 5px; }
                    .pm-tab { 
                        padding: 8px 10px; 
                        font-size: 0.55rem; 
                        gap: 4px;
                    }
                    .pm-tab svg { width: 14px; height: 14px; }
                    .pm-content { padding: 10px; max-height: 550px; }
                    .pm-section { padding: 12px; margin-bottom: 14px; }
                    .pm-section-title { font-size: 0.72rem; gap: 6px; }
                    .pm-input, .pm-textarea, .pm-select { 
                        padding: 11px 12px; 
                        font-size: 0.85rem; 
                    }
                    .pm-icon-btn { width: 34px; height: 34px; }
                    .ats-main-score { font-size: 2.5rem; }
                    .ats-breakdown { gap: 6px; }
                    .ats-item-value { font-size: 1.1rem; }
                }

                /* ========== RESPONSIVE - ULTRA SMALL (300px) ========== */
                @media (max-width: 320px) {
                    .pm-header { padding: 12px 10px; }
                    .pm-title { font-size: 0.85rem; }
                    .pm-tabs { margin: 6px; }
                    .pm-tab { padding: 6px 8px; font-size: 0.5rem; }
                    .pm-content { padding: 8px; }
                    .pm-section { padding: 10px; }
                    .pm-input, .pm-textarea, .pm-select { padding: 10px; font-size: 0.82rem; }
                }
            `}</style>

            {/* Header */}
            <div className="pm-header">
                <div className="pm-title">
                    <Cpu className="animate-logo-float" size={24} />
                    Elite Portfolio Manager
                    <span className="pm-title-badge">Pro v4.1</span>
                </div>

                <div className="pm-strength-container">
                    <div className="pm-strength-header">
                        <span>Portfolio Strength</span>
                        <span>{strength}%</span>
                    </div>
                    <div className="pm-strength-bar-bg">
                        <div className="pm-strength-bar-fill" style={{ width: `${strength}%` }} />
                    </div>
                </div>

                <button
                    className="pm-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <span className="spinner" /> : <Zap size={16} />}
                    {saving ? 'Transmitting...' : 'Save Elite Profile'}
                </button>
            </div>

            {/* Tabs */}
            <div className="pm-tabs">
                {TABS.map(tab => (
                    <div
                        key={tab.id}
                        className={`pm-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon />
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="pm-content">
                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                    <BasicInfoTab
                        portfolio={portfolio}
                        updateField={updateField}
                        updateNestedField={updateNestedField}
                        generateBio={generateBio}
                        aiLoading={aiLoading}
                    />
                )}

                {/* EXPERIENCE TAB */}
                {activeTab === 'experience' && (
                    <ExperienceTab
                        portfolio={portfolio}
                        addToArray={addToArray}
                        removeFromArray={removeFromArray}
                        updateArrayItem={updateArrayItem}
                        polishDescription={polishDescription}
                        aiLoading={aiLoading}
                    />
                )}

                {/* SKILLS TAB */}
                {activeTab === 'skills' && (
                    <SkillsTab
                        portfolio={portfolio}
                        updateField={updateField}
                        addToArray={addToArray}
                        removeFromArray={removeFromArray}
                        updateArrayItem={updateArrayItem}
                    />
                )}

                {/* SHOWCASE TAB */}
                {activeTab === 'showcase' && (
                    <ShowcaseTab
                        portfolio={portfolio}
                        addToArray={addToArray}
                        removeFromArray={removeFromArray}
                        updateArrayItem={updateArrayItem}
                        polishDescription={polishDescription}
                        aiLoading={aiLoading}
                    />
                )}

                {/* AI CENTER TAB */}
                {activeTab === 'ai' && (
                    <AICenterTab
                        atsScore={atsScore}
                        analyzeATS={analyzeATS}
                        aiLoading={aiLoading}
                        token={token}
                    />
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <SettingsTab
                        portfolio={portfolio}
                        updateField={updateField}
                        updateNestedField={updateNestedField}
                    />
                )}
            </div>

            {/* Print Resume Button - Elite Positioning */}
            <button
                className="pm-print-btn"
                onClick={() => window.print()}
                title="Generate Professional PDF"
            >
                <FileText size={18} />
                <span>Export Elite CV</span>
            </button>

            {/* Status Message */}
            {status.message && (
                <div className={`pm-status ${status.type}`}>
                    {status.message}
                </div>
            )}
        </div>
    );
}

// ========== BASIC INFO TAB ==========
function BasicInfoTab({ portfolio, updateField, updateNestedField, generateBio, aiLoading }) {
    return (
        <>
            {/* Professional Identity Section */}
            <div className="pm-section accent-indigo">
                <div className="pm-section-title">
                    <User size={20} /> Professional Identity
                </div>

                <FieldGroup icon={Sparkles} label="Professional Headline" iconColor="#6366f1">
                    <input
                        type="text"
                        className="pm-input"
                        placeholder="e.g., Senior Full Stack Developer | AI Enthusiast"
                        value={portfolio.headline || ''}
                        onChange={e => updateField('headline', e.target.value)}
                    />
                </FieldGroup>

                <div className="pm-pro-tip">
                    <Zap size={14} />
                    <span>Pro tip: Match keywords from job descriptions for better ATS results.</span>
                </div>
            </div>

            {/* Expert Biography Section */}
            <div className="pm-section accent-emerald">
                <div className="pm-section-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Briefcase size={20} /> Expert Biography
                    </span>
                    <button className="pm-ai-btn" onClick={generateBio} disabled={aiLoading.bio}>
                        {aiLoading.bio ? 'Generating...' : <><Sparkles size={14} /> AI Masterwrite</>}
                    </button>
                </div>

                <FieldGroup icon={ChevronRight} label="Professional Summary" iconColor="#10b981">
                    <textarea
                        className="pm-textarea"
                        placeholder="Briefly describe your professional background, key strengths, and career goals..."
                        value={portfolio.professionalSummary || ''}
                        onChange={e => updateField('professionalSummary', e.target.value)}
                    />
                </FieldGroup>

                <div className="pm-stats-row">
                    <span className={`pm-badge ${portfolio.professionalSummary?.length >= 100 ? 'success' : 'warning'}`}>
                        {portfolio.professionalSummary?.length >= 100 ? <Check size={12} /> : null}
                        {portfolio.professionalSummary?.length >= 100 ? 'Good length for ATS' : 'Aim for 100+ characters'}
                    </span>
                    <span className="pm-char-count">
                        {portfolio.professionalSummary?.length || 0} characters
                    </span>
                </div>
            </div>

            {/* Contact Information Section */}
            <div className="pm-section accent-amber">
                <div className="pm-section-title">
                    <Mail size={20} /> Contact Information
                </div>

                <div className="pm-grid">
                    <FieldGroup icon={Mail} label="Email Address" iconColor="#f59e0b">
                        <input
                            type="email"
                            className="pm-input"
                            placeholder="your@email.com"
                            value={portfolio.contactInfo?.email || ''}
                            onChange={e => updateNestedField('contactInfo', 'email', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={Phone} label="Phone Number" iconColor="#f59e0b">
                        <input
                            type="tel"
                            className="pm-input"
                            placeholder="+1 (555) 123-4567"
                            value={portfolio.contactInfo?.phone || ''}
                            onChange={e => updateNestedField('contactInfo', 'phone', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={MapPin} label="Location" iconColor="#f59e0b">
                        <input
                            type="text"
                            className="pm-input"
                            placeholder="City, Country"
                            value={portfolio.contactInfo?.location || ''}
                            onChange={e => updateNestedField('contactInfo', 'location', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={Calendar} label="Availability" iconColor="#f59e0b">
                        <select
                            className="pm-select"
                            value={portfolio.contactInfo?.availability || 'not_looking'}
                            onChange={e => updateNestedField('contactInfo', 'availability', e.target.value)}
                        >
                            <option value="immediately">Available Immediately</option>
                            <option value="2_weeks">2 Weeks Notice</option>
                            <option value="1_month">1 Month Notice</option>
                            <option value="3_months">3+ Months</option>
                            <option value="not_looking">Not Looking</option>
                        </select>
                    </FieldGroup>
                </div>
            </div>

            {/* Social Links Section */}
            <div className="pm-section accent-blue">
                <div className="pm-section-title">
                    <Globe size={20} /> Social & Professional Links
                </div>

                <div className="pm-grid">
                    <FieldGroup icon={Linkedin} label="LinkedIn Profile" iconColor="#0077b5">
                        <input
                            type="url"
                            className="pm-input"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={portfolio.socialLinks?.linkedin || ''}
                            onChange={e => updateNestedField('socialLinks', 'linkedin', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={Github} label="GitHub Profile" iconColor="#333">
                        <input
                            type="url"
                            className="pm-input"
                            placeholder="https://github.com/username"
                            value={portfolio.socialLinks?.github || ''}
                            onChange={e => updateNestedField('socialLinks', 'github', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={Twitter} label="Twitter / X" iconColor="#1da1f2">
                        <input
                            type="url"
                            className="pm-input"
                            placeholder="https://twitter.com/handle"
                            value={portfolio.socialLinks?.twitter || ''}
                            onChange={e => updateNestedField('socialLinks', 'twitter', e.target.value)}
                        />
                    </FieldGroup>

                    <FieldGroup icon={Link2} label="Personal Website" iconColor="#6366f1">
                        <input
                            type="url"
                            className="pm-input"
                            placeholder="https://yourwebsite.com"
                            value={portfolio.socialLinks?.website || ''}
                            onChange={e => updateNestedField('socialLinks', 'website', e.target.value)}
                        />
                    </FieldGroup>
                </div>
            </div>
        </>
    );
}

// ========== EXPERIENCE TAB ==========
function ExperienceTab({ portfolio, addToArray, removeFromArray, updateArrayItem, polishDescription, aiLoading }) {
    const addExperience = () => {
        addToArray('experience', {
            role: '',
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: '',
            technologies: []
        });
    };

    const addEducation = () => {
        addToArray('education', {
            degree: '',
            fieldOfStudy: '',
            institution: '',
            startYear: '',
            endYear: ''
        });
    };

    const addCertificate = () => {
        addToArray('certificates', {
            title: '',
            issuer: '',
            issueDate: '',
            link: ''
        });
    };

    return (
        <>
            {/* Work Experience */}
            <div className="pm-section accent-indigo">
                <div className="pm-section-title">
                    <Briefcase size={20} /> Work Experience
                    <span className="pm-count-badge">
                        {portfolio.experience.length} Positions
                    </span>
                </div>

                {portfolio.experience.map((exp, idx) => (
                    <div key={idx} className="pm-card elite-border-left">
                        <div className="pm-card-header">
                            <div style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    className="pm-input headline"
                                    placeholder="Job Title (e.g., Senior Software Engineer)"
                                    value={exp.role}
                                    onChange={e => updateArrayItem('experience', idx, { role: e.target.value })}
                                />
                            </div>
                            <div className="pm-card-actions">
                                <button
                                    className="pm-icon-btn ai"
                                    onClick={() => polishDescription('experience', idx)}
                                    disabled={aiLoading[`experience-${idx}`]}
                                    title="AI Polish Description"
                                >
                                    <Sparkles size={16} />
                                </button>
                                <button
                                    className="pm-icon-btn danger"
                                    onClick={() => removeFromArray('experience', idx)}
                                    title="Remove Position"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="pm-grid">
                            <FieldGroup icon={Briefcase} label="Organization" iconColor="#6366f1">
                                <input
                                    type="text"
                                    className="pm-input"
                                    placeholder="Company Name"
                                    value={exp.company}
                                    onChange={e => updateArrayItem('experience', idx, { company: e.target.value })}
                                />
                            </FieldGroup>
                            <FieldGroup icon={Globe} label="Location" iconColor="#6366f1">
                                <input
                                    type="text"
                                    className="pm-input"
                                    placeholder="City, Country"
                                    value={exp.location || ''}
                                    onChange={e => updateArrayItem('experience', idx, { location: e.target.value })}
                                />
                            </FieldGroup>
                        </div>

                        <div className="pm-row-spaced" style={{ marginTop: 24 }}>
                            <FieldGroup icon={Calendar} label="Timeline" iconColor="#6366f1">
                                <div className="pm-timeline-controls">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Start (e.g., Jan 2020)"
                                        value={exp.startDate || ''}
                                        onChange={e => updateArrayItem('experience', idx, { startDate: e.target.value })}
                                    />
                                    <span className="pm-connector">—</span>
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="End (or Present)"
                                        value={exp.endDate || ''}
                                        onChange={e => updateArrayItem('experience', idx, { endDate: e.target.value })}
                                        disabled={exp.isCurrent}
                                    />
                                </div>
                            </FieldGroup>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <FieldGroup icon={ChevronRight} label="Impact & Responsibilities" iconColor="#8b5cf6">
                                <textarea
                                    className="pm-textarea"
                                    placeholder="Describe your achievements using action verbs..."
                                    value={exp.description}
                                    onChange={e => updateArrayItem('experience', idx, { description: e.target.value })}
                                />
                            </FieldGroup>
                        </div>
                    </div>
                ))}

                <button className="pm-add-btn" onClick={addExperience}>
                    <Plus size={18} /> Add Professional Position
                </button>
            </div>

            {/* Education */}
            <div className="pm-section accent-emerald">
                <div className="pm-section-title">
                    <GraduationCap size={20} /> Academic Foundation
                    <span className="pm-count-badge">
                        {portfolio.education.length} Degrees
                    </span>
                </div>

                {portfolio.education.map((edu, idx) => (
                    <div key={idx} className="pm-card" style={{ borderLeft: '5px solid #10b981' }}>
                        <div className="pm-card-header">
                            <div style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    className="pm-input headline"
                                    placeholder="Degree (e.g., Bachelor of Science)"
                                    value={edu.degree}
                                    onChange={e => updateArrayItem('education', idx, { degree: e.target.value })}
                                    style={{ color: '#10b981' }}
                                />
                            </div>
                            <div className="pm-card-actions">
                                <button
                                    className="pm-icon-btn danger"
                                    onClick={() => removeFromArray('education', idx)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="pm-grid">
                            <FieldGroup icon={BookOpen} label="Field of Study" iconColor="#10b981">
                                <input
                                    type="text"
                                    className="pm-input"
                                    placeholder="Major/Concentration"
                                    value={edu.fieldOfStudy}
                                    onChange={e => updateArrayItem('education', idx, { fieldOfStudy: e.target.value })}
                                />
                            </FieldGroup>
                            <FieldGroup icon={Search} label="Institution" iconColor="#10b981">
                                <input
                                    type="text"
                                    className="pm-input"
                                    placeholder="University/School Name"
                                    value={edu.institution}
                                    onChange={e => updateArrayItem('education', idx, { institution: e.target.value })}
                                />
                            </FieldGroup>
                        </div>

                        <div className="pm-row-spaced" style={{ marginTop: 24 }}>
                            <FieldGroup icon={Calendar} label="Academic Timeline" iconColor="#10b981">
                                <div className="pm-timeline-controls">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Start Year"
                                        value={edu.startYear}
                                        onChange={e => updateArrayItem('education', idx, { startYear: e.target.value })}
                                    />
                                    <span className="pm-connector">—</span>
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="End Year (or Expected)"
                                        value={edu.endYear}
                                        onChange={e => updateArrayItem('education', idx, { endYear: e.target.value })}
                                    />
                                </div>
                            </FieldGroup>
                        </div>
                    </div>
                ))}

                <button className="pm-add-btn" onClick={addEducation}>
                    <Plus size={18} /> Add Academic Credential
                </button>
            </div>

            {/* Certifications */}
            <div className="pm-section accent-amber">
                <div className="pm-section-title">
                    <Award size={20} /> Professional Certifications
                    <span className="pm-count-badge">
                        {portfolio.certificates.length} verified
                    </span>
                </div>

                <div className="pm-grid">
                    {portfolio.certificates.map((cert, idx) => (
                        <div key={idx} className="pm-card" style={{ borderTop: '4px solid #f59e0b', marginBottom: 0 }}>
                            <div className="pm-card-header" style={{ marginBottom: 16 }}>
                                <div style={{ flex: 1, fontWeight: 800, fontSize: '0.9rem', color: '#b45309' }}>
                                    {cert.title || 'Untitled Certification'}
                                </div>
                                <button
                                    className="pm-icon-btn danger"
                                    onClick={() => removeFromArray('certificates', idx)}
                                    style={{ width: 32, height: 32 }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <FieldGroup icon={Award} label="Certification Title" iconColor="#f59e0b">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Name of Certification"
                                        value={cert.title}
                                        onChange={e => updateArrayItem('certificates', idx, { title: e.target.value })}
                                    />
                                </FieldGroup>
                                <FieldGroup icon={Globe} label="Issuing Authority" iconColor="#f59e0b">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Issuer (e.g., AWS, Google)"
                                        value={cert.issuer}
                                        onChange={e => updateArrayItem('certificates', idx, { issuer: e.target.value })}
                                    />
                                </FieldGroup>
                                <FieldGroup icon={ExternalLink} label="Verification URL" iconColor="#f59e0b">
                                    <input
                                        type="url"
                                        className="pm-input"
                                        placeholder="https://verify.cert/id"
                                        value={cert.link}
                                        onChange={e => updateArrayItem('certificates', idx, { link: e.target.value })}
                                    />
                                </FieldGroup>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="pm-add-btn" onClick={addCertificate} style={{ marginTop: 24 }}>
                    <Plus size={18} /> Add Professional Certificate
                </button>
            </div>
        </>
    );
}

// ========== SKILLS TAB ==========
function SkillsTab({ portfolio, updateField, addToArray, removeFromArray, updateArrayItem }) {
    const addLanguage = () => {
        addToArray('languages', { name: '', proficiency: 'intermediate' });
    };

    const addSoftSkill = () => {
        addToArray('softSkills', { name: '' });
    };

    return (
        <div className="pm-tab-container">
            {/* Featured Skills */}
            <div className="pm-section accent-indigo">
                <div className="pm-section-title">
                    <Code size={20} /> Featured Technical Stack
                    <span className="pm-count-badge">Elite Focus</span>
                </div>

                <FieldGroup icon={Sparkles} label="Your Core Expertise" iconColor="#6366f1">
                    <textarea
                        className="pm-textarea"
                        placeholder="e.g., React, Node.js, Python, AWS, Docker, Kubernetes"
                        value={portfolio.featuredSkills?.join(', ') || ''}
                        onChange={e => updateField('featuredSkills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        style={{ minHeight: 100 }}
                    />
                </FieldGroup>

                <div className="pm-pro-tip">
                    <Zap size={14} />
                    <span>Pro Tip: List 5-8 priority skills. These form the primary matches for AI job analysis.</span>
                </div>
            </div>

            {/* Languages and Soft Skills Multi-column */}
            <div className="pm-grid">
                {/* Languages */}
                <div className="pm-section accent-emerald">
                    <div className="pm-section-title">
                        <Globe size={20} /> Linguistic Mastery
                    </div>

                    {portfolio.languages.map((lang, idx) => (
                        <div key={idx} className="pm-skill-entry">
                            <input
                                type="text"
                                className="pm-input pro-mini"
                                placeholder="Language"
                                value={lang.name}
                                onChange={e => updateArrayItem('languages', idx, { name: e.target.value })}
                            />
                            <select
                                className="pm-select pro-mini"
                                value={lang.proficiency}
                                onChange={e => updateArrayItem('languages', idx, { proficiency: e.target.value })}
                            >
                                <option value="native">Native</option>
                                <option value="fluent">Fluent</option>
                                <option value="professional">Professional</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="beginner">Beginner</option>
                            </select>
                            <button className="pm-icon-btn danger mini" onClick={() => removeFromArray('languages', idx)}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}

                    <button className="pm-add-btn mini" onClick={addLanguage}>
                        <Plus size={14} /> Add Language
                    </button>
                </div>

                {/* Soft Skills */}
                <div className="pm-section accent-amber">
                    <div className="pm-section-title">
                        <Search size={20} /> Human Skills
                    </div>

                    <div className="pm-tags-container">
                        {portfolio.softSkills.map((skill, idx) => (
                            <div key={idx} className="pm-tag-editable">
                                <input
                                    type="text"
                                    className="pm-tag-input"
                                    value={skill.name}
                                    onChange={e => updateArrayItem('softSkills', idx, { name: e.target.value })}
                                    placeholder="Skill..."
                                />
                                <button onClick={() => removeFromArray('softSkills', idx)}>×</button>
                            </div>
                        ))}
                    </div>

                    <button className="pm-add-btn mini" onClick={addSoftSkill}>
                        <Plus size={14} /> Add Soft Skill
                    </button>
                </div>
            </div>
        </div>
    );
}

// ========== SHOWCASE TAB ==========
function ShowcaseTab({ portfolio, addToArray, removeFromArray, updateArrayItem, polishDescription, aiLoading }) {
    const addProject = () => {
        addToArray('customProjects', {
            title: '',
            description: '',
            link: '',
            githubLink: '',
            technologies: []
        });
    };

    const addAward = () => {
        addToArray('awards', { title: '', issuer: '', date: '', description: '' });
    };

    return (
        <div className="pm-tab-container">
            {/* Featured Projects */}
            <div className="pm-section accent-indigo">
                <div className="pm-section-title">
                    <Code size={20} /> Featured Projects & Work
                    <span className="pm-count-badge">{portfolio.customProjects.length} Showcased</span>
                </div>

                {portfolio.customProjects.map((project, idx) => (
                    <div key={idx} className="pm-card elite-border-left">
                        <div className="pm-card-header">
                            <div style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    className="pm-input headline"
                                    placeholder="Project Title (e.g., E-commerce Platform)"
                                    value={project.title}
                                    onChange={e => updateArrayItem('customProjects', idx, { title: e.target.value })}
                                />
                            </div>
                            <div className="pm-card-actions">
                                <button
                                    className="pm-icon-btn ai"
                                    onClick={() => polishDescription('customProjects', idx)}
                                    disabled={aiLoading[`customProjects-${idx}`]}
                                    title="AI Polish Description"
                                >
                                    <Sparkles size={16} />
                                </button>
                                <button
                                    className="pm-icon-btn danger"
                                    onClick={() => removeFromArray('customProjects', idx)}
                                    title="Remove Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <FieldGroup icon={ChevronRight} label="Project Description & Impact" iconColor="#6366f1">
                                <textarea
                                    className="pm-textarea"
                                    placeholder="Outline the problem, your solution, and the measurable results..."
                                    value={project.description}
                                    onChange={e => updateArrayItem('customProjects', idx, { description: e.target.value })}
                                />
                            </FieldGroup>
                        </div>

                        <div className="pm-grid">
                            <FieldGroup icon={ExternalLink} label="Live Demo Link" iconColor="#6366f1">
                                <input
                                    type="url"
                                    className="pm-input"
                                    placeholder="https://yourproject.com"
                                    value={project.link}
                                    onChange={e => updateArrayItem('customProjects', idx, { link: e.target.value })}
                                />
                            </FieldGroup>
                            <FieldGroup icon={Github} label="Source Code" iconColor="#6366f1">
                                <input
                                    type="url"
                                    className="pm-input"
                                    placeholder="https://github.com/..."
                                    value={project.githubLink || ''}
                                    onChange={e => updateArrayItem('customProjects', idx, { githubLink: e.target.value })}
                                />
                            </FieldGroup>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <FieldGroup icon={Zap} label="Tech Stack Used" iconColor="#8b5cf6">
                                <input
                                    type="text"
                                    className="pm-input"
                                    placeholder="Enter comma-separated technologies (e.g., React, Supabase, Tailwind)"
                                    value={project.technologies?.join(', ') || ''}
                                    onChange={e => updateArrayItem('customProjects', idx, { technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                />
                            </FieldGroup>
                        </div>
                    </div>
                ))}

                <button className="pm-add-btn" onClick={addProject}>
                    <Plus size={18} /> Add New Project Showcase
                </button>
            </div>

            {/* Honors & Awards */}
            <div className="pm-section accent-amber">
                <div className="pm-section-title">
                    <Award size={20} /> Honors & Recognition
                </div>

                <div className="pm-grid">
                    {portfolio.awards.map((award, idx) => (
                        <div key={idx} className="pm-card" style={{ borderTop: '4px solid #f59e0b', marginBottom: 0 }}>
                            <div className="pm-card-header" style={{ marginBottom: 16 }}>
                                <div style={{ flex: 1, fontWeight: 800, fontSize: '0.9rem', color: '#b45309' }}>
                                    {award.title || 'Untitled Honor'}
                                </div>
                                <button className="pm-icon-btn danger" onClick={() => removeFromArray('awards', idx)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <FieldGroup icon={Award} label="Award Title" iconColor="#f59e0b">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Name of Award"
                                        value={award.title}
                                        onChange={e => updateArrayItem('awards', idx, { title: e.target.value })}
                                    />
                                </FieldGroup>
                                <FieldGroup icon={Globe} label="Issuing Authority" iconColor="#f59e0b">
                                    <input
                                        type="text"
                                        className="pm-input"
                                        placeholder="Organization Name"
                                        value={award.issuer}
                                        onChange={e => updateArrayItem('awards', idx, { issuer: e.target.value })}
                                    />
                                </FieldGroup>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="pm-add-btn" onClick={addAward} style={{ marginTop: 24 }}>
                    <Plus size={18} /> Add Recognition / Award
                </button>
            </div>
        </div>
    );
}

// ========== AI CENTER TAB ==========
function AICenterTab({ atsScore, analyzeATS, aiLoading, token }) {
    const [review, setReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const getFullReview = async () => {
        setReviewLoading(true);
        try {
            const result = await api.reviewPortfolio(token);
            if (result.success) setReview(result.review);
        } catch (err) {
            console.error('Review failed:', err);
        } finally {
            setReviewLoading(false);
        }
    };

    return (
        <div className="pm-tab-container">
            {/* ATS Score Section */}
            <div className="pm-section accent-indigo">
                <div className="pm-section-title" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Zap size={20} /> AI Talent Compatibility
                    </span>
                    <button className="pm-ai-btn" onClick={analyzeATS} disabled={aiLoading.ats}>
                        {aiLoading.ats ? 'Calculating...' : <><Sparkles size={14} /> Analyze Now</>}
                    </button>
                </div>

                {atsScore ? (
                    <div className="pm-ats-card">
                        <div className="pm-score-main">
                            <div className="pm-score-value">{atsScore.overall || 0}</div>
                            <div className="pm-score-label">Global Score</div>
                        </div>
                        <div className="pm-score-breakdown">
                            <div className="pm-score-item">
                                <div className="val">{atsScore.keywords || 0}</div>
                                <div className="lbl">Keywords</div>
                            </div>
                            <div className="pm-score-item">
                                <div className="val">{atsScore.formatting || 0}</div>
                                <div className="lbl">Structure</div>
                            </div>
                            <div className="pm-score-item">
                                <div className="val">{atsScore.completeness || 0}</div>
                                <div className="lbl">Content</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pm-empty-state">
                        <Zap size={48} />
                        <h3>Unlock Your Score</h3>
                        <p>Analyze your portfolio to see how well it's optimized for recruiters and ATS systems.</p>
                    </div>
                )}
            </div>

            {/* AI Review Section */}
            <div className="pm-section accent-emerald">
                <div className="pm-section-title" style={{ justifyContent: 'space-between' }}>
                    <span><Sparkles size={20} /> Strategic AI Review</span>
                    <button className="pm-ai-btn" onClick={getFullReview} disabled={reviewLoading}>
                        {reviewLoading ? 'Reviewing...' : 'Request Feedback'}
                    </button>
                </div>

                {review ? (
                    <div className="pm-review-content">
                        <div className="pm-impression-block">
                            <h4>Overall Impression</h4>
                            <p>{review.impression}</p>
                        </div>
                        <div className="pm-pro-grid">
                            <div className="pm-pro-card success">
                                <h5><Check size={16} /> Strengths</h5>
                                <ul>{review.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                            </div>
                            <div className="pm-pro-card warning">
                                <h5><AlertCircle size={16} /> Improvements</h5>
                                <ul>{review.improvements.map((imp, i) => <li key={i}><strong>{imp.area}:</strong> {imp.suggestion}</li>)}</ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="pm-empty-state">
                        <Sparkles size={48} />
                        <h3>AI Feedback Ready</h3>
                        <p>Get professional advice on how to improve your portfolio's impact.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ========== SETTINGS TAB ==========
function SettingsTab({ portfolio, updateField, updateNestedField }) {
    const [copied, setCopied] = useState(false);
    const publicUrl = `${getPublicAppUrl()}/portfolio/${portfolio.id || 'your-id'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Portfolio Dashboard Link */}
            <div className="pm-section" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                border: '1.5px solid #334155',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '2rem',
                padding: '32px',
                boxShadow: 'var(--pm-shadow-elite)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 200,
                    height: 200,
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div className="pm-section-title" style={{ color: 'white', borderBottomColor: 'rgba(255,255,255,0.1)', marginTop: 4 }}>
                    <ExternalLink size={18} style={{ color: '#818cf8' }} />
                    Public Portfolio Access
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16 }}>
                        This is your global portfolio link. Share it with recruiters, on your resume, or in your social bio.
                    </p>

                    <div style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.3)',
                        padding: 12,
                        borderRadius: 12,
                        border: '1.5px solid rgba(255,255,255,0.05)',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <code style={{
                            flex: 1,
                            fontSize: '0.85rem',
                            color: '#60a5fa',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {publicUrl}
                        </code>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 8,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="pm-section" style={{ background: 'var(--card-bg)' }}>
                <div className="pm-section-title">
                    <Settings size={18} /> Visibility Controls
                </div>

                <div className="pm-grid">
                    {[
                        { key: 'isPublic', label: 'Public Access', desc: 'Allows everyone to see your profile' },
                        { key: 'showEmail', label: 'Show Email', desc: 'Display contact email address' },
                        { key: 'showPhone', label: 'Show Phone', desc: 'Display phone contact info' },
                        { key: 'showLocation', label: 'Show Location', desc: 'Display city/country info' }
                    ].map(({ key, label, desc }) => (
                        <div key={key} className="pm-skill-entry"
                            style={{ gridTemplateColumns: '1fr auto', padding: '18px 24px', cursor: 'pointer' }}
                            onClick={() => updateNestedField('privacySettings', key, !portfolio.privacySettings?.[key])}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--site-text)', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--site-text-muted)', opacity: 0.7 }}>{desc}</div>
                            </div>
                            <div style={{
                                width: 44,
                                height: 24,
                                background: portfolio.privacySettings?.[key] ? '#10b981' : 'var(--card-border)',
                                borderRadius: 50,
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <div style={{
                                    width: 18,
                                    height: 18,
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: 3,
                                    left: portfolio.privacySettings?.[key] ? 23 : 3,
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Theme & Aesthetics */}
            <div className="pm-section accent-amber">
                <div className="pm-section-title">
                    <Award size={18} style={{ color: '#f59e0b' }} />
                    Visual Identity & Theme
                </div>

                <FieldGroup icon={Globe} label="Select Portfolio Style" iconColor="#f59e0b">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                        {['professional', 'creative', 'minimalist', 'tech', 'executive'].map(theme => (
                            <button
                                key={theme}
                                onClick={() => updateField('portfolioTheme', theme)}
                                style={{
                                    padding: '14px',
                                    borderRadius: 12,
                                    border: '2px solid',
                                    borderColor: portfolio.portfolioTheme === theme ? '#f59e0b' : 'var(--card-border)',
                                    background: portfolio.portfolioTheme === theme ? 'rgba(245, 158, 11, 0.05)' : 'var(--site-bg)',
                                    color: portfolio.portfolioTheme === theme ? '#f59e0b' : 'var(--site-text-muted)',
                                    fontWeight: 800,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {portfolio.portfolioTheme === theme && <Sparkles size={10} style={{ marginRight: 6 }} />}
                                {theme}
                            </button>
                        ))}
                    </div>
                </FieldGroup>
            </div>
        </div>
    );
}
