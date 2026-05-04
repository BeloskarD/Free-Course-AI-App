"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ShieldCheck,
  Code,
  Gamepad2,
  Lock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Star,
  Loader2,
  AlertTriangle,
  Briefcase,
  Target,
  Brain,
} from "lucide-react";
import Link from "next/link";
import Surface from "../ui/Surface";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "../../context/NotificationContext";

const normalizeSkillLabel = (skill) => {
  if (!skill) return "Core Competency";
  if (/project/i.test(skill)) return "Portfolio Projects";
  if (/validation|verified/i.test(skill)) return "Technical Validation";
  return skill;
};

const buildMcqSession = (rawSkill) => {
  const skill = normalizeSkillLabel(rawSkill).toLowerCase();

  // ── FRONTEND / UI REASONING ──
  if (skill.includes('frontend') || skill.includes('react') || skill.includes('javascript') || skill.includes('ui')) {
    return {
      title: "Frontend Architecture Probe",
      description: "Verify your ability to manage high-performance UI states and signal synchronization.",
      questions: [
        {
          prompt: "A real-time dashboard is experiencing lag due to frequent 'Hiring Signal' updates. Which optimization pattern is most effective for a Top 1% senior implementation?",
          options: ["Standard useState for every update", "Custom Hook with throttle/debounce and shallow equality checks", "Forcing a full page refresh on every signal", "Moving all UI logic to the backend"],
          correctIndex: 1,
        },
        {
          prompt: "When implementing a complex 'Cognitive Graph', how do you ensure the DOM remains responsive during large-scale node rendering?",
          options: ["Render all 10,000 nodes at once", "Use a Virtualized List or Canvas-based rendering for the graph layer", "Use a recursive function without a base case", "Disable all animations entirely"],
          correctIndex: 1,
        },
        {
          prompt: "What is the primary indicator of a 'Hardened' frontend architecture in a professional environment?",
          options: ["Large bundle size", "Error Boundaries with graceful recovery and comprehensive unit coverage", "Using only inline styles", "Removing all comments from code"],
          correctIndex: 1,
        },
      ],
    };
  }

  // ── BACKEND / ARCHITECTURE REASONING ──
  if (skill.includes('backend') || skill.includes('node') || skill.includes('api') || skill.includes('database') || skill.includes('python')) {
    return {
      title: "Backend Resilience Probe",
      description: "Verify your ability to build scalable, fault-tolerant intelligence systems.",
      questions: [
        {
          prompt: "Your 'Signal Propagation' service is experiencing a 'Thundering Herd' problem during peak usage. How do you implement a senior-level solution?",
          options: ["Increase server count infinitely", "Implement a Circuit Breaker pattern with exponential backoff and jitter", "Disable the service until traffic drops", "Remove all rate limits"],
          correctIndex: 1,
        },
        {
          prompt: "How do you ensure 'Personal Knowledge Graph' consistency across distributed microservices without sacrificing latency?",
          options: ["Global Mutex Lock on all requests", "Eventual Consistency with an Idempotency Key architecture", "Writing to a single text file", "Manual manual database sync every hour"],
          correctIndex: 1,
        },
        {
          prompt: "What is the most critical metric for a 'High-Fidelity' Career Intelligence API?",
          options: ["Line count of the controller", "P99 Latency and Error Rate under 1% stress", "Number of console.log statements", "Total color depth of the response"],
          correctIndex: 1,
        },
      ],
    };
  }

  // ── DEFAULT: ELITE CAREER STRATEGY ──
  return {
    title: "Professional Signal Probe",
    description: "Verify your strategic reasoning and ability to position your expertise for global roles.",
    questions: [
      {
        prompt: "Which 'Proof-of-Work' signal is most likely to move a candidate into the Top 1% for recruiters?",
        options: ["A basic completion certificate", "An open-source contribution or a live production deployment with measurable impact", "A list of 50+ watched tutorials", "A LinkedIn profile with 500+ generic connections"],
        correctIndex: 1,
      },
      {
        prompt: "How should a 'Top Ahead' professional handle a detected skill gap in their Career Radar?",
        options: ["Hide the gap from the profile", "Trigger a focused 'Mission' and validate the signal with an Industry Proof", "Wait for someone to teach them", "Switch roles to avoid the gap"],
        correctIndex: 1,
      },
      {
        prompt: "What defines a 'High-Fidelity' professional contribution in a remote engineering team?",
        options: ["Checking in code once a month", "Proactive technical documentation and self-documenting code with clear architectural intent", "Sending many Slack messages without technical substance", "Only working on assigned tickets without context"],
        correctIndex: 1,
      },
    ],
  };
};

const buildCodeSession = (rawSkill) => {
  const skill = normalizeSkillLabel(rawSkill).toLowerCase();

  // ── FRONTEND ARCHITECTURAL SNAPSHOT ──
  if (skill.includes('frontend') || skill.includes('react') || skill.includes('javascript') || skill.includes('ui')) {
    return {
      title: "UI Signal Debouncer",
      description: "Implement a production-grade utility to manage rapid hiring signal updates and prevent UI jitter.",
      prompt: "Write a JavaScript function named createSignalDebouncer that takes a callback and delay. It should return a function that, when called, cancels previous pending calls and schedules a new one.",
      starter: "function createSignalDebouncer(callback, delay) {\n  let timeoutId;\n  return function(...args) {\n    // Implement debouncing logic\n  };\n}\n",
      expectedKeywords: ["clearTimeout", "setTimeout", "return", "function"],
    };
  }

  // ── BACKEND ARCHITECTURAL SNAPSHOT ──
  if (skill.includes('backend') || skill.includes('node') || skill.includes('api') || skill.includes('database') || skill.includes('python')) {
    return {
      title: "Resilient Retry Handler",
      description: "Build a retry mechanism for a career-critical API request that fails due to intermittent network signals.",
      prompt: "Write a JavaScript function named executeWithRetry that takes an async task and maxRetries. It should attempt the task and retry if it fails, up to maxRetries, before throwing the error.",
      starter: "async function executeWithRetry(task, maxRetries) {\n  let lastError;\n  // Implement retry loop with try/catch\n}\n",
      expectedKeywords: ["async", "await", "try", "catch", "for", "throw"],
    };
  }

  // ── DEFAULT: ARCHITECTURAL BASELINE ──
  return {
    title: "Intelligence Asset Mapper",
    description: "Write a small utility to transform raw skill data into a structured cognitive asset for the PKG.",
    prompt: "Write a JavaScript function named mapSkillToAsset that takes a skill object and returns a formatted asset with a 'id', 'mastery', and 'isHardened' (true if mastery > 80) property.",
    starter: "function mapSkillToAsset(skill) {\n  return {\n    // return structured asset\n  };\n}\n",
    expectedKeywords: ["return", "id", "mastery", "isHardened", ">"],
  };
};

const SkillValidationModal = ({ isOpen, onClose, skill, onValidated }) => {
  const { token } = useAuth();
  const { notify } = useNotification();
  const displaySkill = normalizeSkillLabel(skill);
  const mcqSession = buildMcqSession(displaySkill);
  const codeSession = buildCodeSession(displaySkill);
  const [step, setStep] = useState("choice");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [codeAnswer, setCodeAnswer] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dynamicProbe, setDynamicProbe] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // --- RESET STATE FOR NEW SESSION ---
    setStep("choice");
    setResult(null);
    setErrorData(null);
    setSelectedAnswers([]);
    setDynamicProbe(null);
    setStrategyData(null);
    setCodeAnswer("");
    setIsGenerating(false);
    setIsSyncing(false);

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  useEffect(() => {
    if (step === "strategy" && !strategyData && !isGenerating) {
      fetchStrategy();
    }
  }, [step]);

  const fetchStrategy = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generateStrategy(displaySkill, token);
      if (res.success) {
        setStrategyData(res.data);
      }
    } catch (err) {
      console.error("Strategy generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitValidation = async (type) => {
    setLoading(true);
    setErrorData(null);

    try {
      const activeProbe = dynamicProbe || (type === "mcq" ? mcqSession : codeSession);
      
      const payload = type === "mcq"
        ? {
            answers: selectedAnswers,
            correctAnswers: activeProbe.questions.map((question) => question.correctIndex),
          }
        : {
            code: codeAnswer,
            expectedKeywords: activeProbe.expectedKeywords,
          };

      const res = await api.validateSkill(displaySkill, type, payload, token);
      if (!res.success) {
        throw new Error(res.message || "Validation could not be completed.");
      }

      await finalizeValidation(res.data);
    } catch (error) {
      const message = error.message || "Validation failed. Please try again.";

      if (message.toLowerCase().includes("limit")) {
        setErrorData({
          type: "limit",
          message: "Weekly verification limit reached (3/week for Free tier).",
          cta: "Unlock Unlimited Validations with Pro",
        });
      } else {
        setErrorData({
          type: "error",
          message,
        });
      }

      setStep("choice");
    } finally {
      setLoading(false);
    }
  };

  const finalizeValidation = async (data) => {
    setIsSyncing(true);
    try {
      // Refresh all career intelligence data
      await queryClient.invalidateQueries(['hiring-readiness']);
      await queryClient.invalidateQueries(['career-overview']);
      await queryClient.invalidateQueries(['pkg-summary']);
      await queryClient.invalidateQueries(['skill-graph']);
      
      setResult(data);
      setStep("result");
      onValidated?.(data);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStart = async (type) => {
    setIsGenerating(true);
    setStep("generating");
    try {
      const res = await api.generateProbe(displaySkill, type, token);
      if (res.success && res.data) {
        setDynamicProbe(res.data);
        if (type === "mcq") {
          setSelectedAnswers(Array(res.data.questions?.length || 0).fill(null));
        } else {
          setCodeAnswer(res.data.starter || buildCodeSession(displaySkill).starter);
        }
        setStep(type);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.warn("Using baseline probes", err);
      const baseline = type === "mcq" ? buildMcqSession(displaySkill) : buildCodeSession(displaySkill);
      setDynamicProbe(baseline);
      if (type === "mcq") {
        setSelectedAnswers(Array(baseline.questions.length).fill(null));
      } else {
        setCodeAnswer(baseline.starter);
      }
      setStep(type);
    } finally {
      setIsGenerating(false);
    }
  };

  const setAnswer = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const handleUpgrade = async () => {
    if (!token) {
      window.location.href = "/auth/login";
      return;
    }

    setIsStartingCheckout(true);
    try {
      const res = await api.createCheckoutSession(token, "skill_validation");
      if (!res.success || !res.data?.url) {
        throw new Error(res.message || "Unable to start checkout right now.");
      }

      window.location.href = res.data.url;
    } catch (error) {
      notify.error(error.message || "Unable to start checkout right now.");
      setIsStartingCheckout(false);
    }
  };

  const canSubmitMcq = selectedAnswers.length === mcqSession.questions.length && selectedAnswers.every((answer) => Number.isInteger(answer));
  const canSubmitCode = codeAnswer.trim().length >= 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-3xl" onClick={onClose} />

      <div className="relative w-full h-full flex items-start justify-center px-4 sm:px-6 lg:pr-8 lg:pl-[calc(2rem+var(--sidebar-offset,0px))] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
        <Surface className="w-full max-w-3xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 duration-500 pointer-events-auto">
          <div className="absolute top-0 right-0 w-[360px] h-[360px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-50 p-6 sm:px-10 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tighter truncate">
                  Career Building Guider
                </h2>
                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60 truncate">
                  Hardening Signal: {skill || "Global Readiness"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[var(--site-text)]/5 hover:bg-rose-500/10 text-[var(--site-text-muted)] hover:text-rose-500 flex items-center justify-center transition-all border border-[var(--card-border)] cursor-pointer active:scale-90 shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto premium-scroll px-6 sm:px-10 py-8 lg:py-10">
            {step === "choice" && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <div className="text-center space-y-3">
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20 relative group/icon">
                    <ShieldCheck className="text-indigo-500 group-hover/icon:scale-110 transition-transform" size={36} />
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-50 group-hover/icon:scale-100 transition-all opacity-0 group-hover/icon:opacity-100" />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--site-text)]">
                    Activate Your Hiring Signal
                  </h3>
                  <p className="text-sm text-[var(--site-text-muted)] max-w-xl mx-auto leading-relaxed">
                    Move beyond theory. Validate your <strong>{displaySkill}</strong> through professional simulations to lock in your position in the global job market.
                  </p>
                </div>

                {errorData?.type === "limit" ? (
                  <div className="space-y-8 text-center py-4">
                    <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
                      <Lock className="text-amber-500" size={32} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight">Unlimited Proof-of-Work</h3>
                      <p className="text-sm text-[var(--site-text-muted)] max-w-md mx-auto">
                        {errorData.message}
                      </p>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={isStartingCheckout}
                      className="w-full sm:w-auto inline-flex justify-center py-4 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl items-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isStartingCheckout ? <Loader2 size={16} className="animate-spin" /> : null}
                      {errorData.cta} <ArrowRight size={16} />
                    </button>
                    <Link href="/pricing?source=skill_validation" className="block text-[11px] font-black uppercase tracking-[0.25em] text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                      View full plan details
                    </Link>
                  </div>
                ) : (
                  <>
                    {errorData?.type === "error" && (
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-start gap-3">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <span>{errorData.message}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => handleStart("mcq")}
                        className="p-6 rounded-[2rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:bg-indigo-500 hover:text-white transition-all group text-left cursor-pointer relative overflow-hidden"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors">
                          <Target className="text-indigo-500 group-hover:text-white" size={20} />
                        </div>
                        <h4 className="text-lg font-black mb-1 tracking-tight">Knowledge Proof</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Logic & Reasoning Audit</p>
                      </button>

                      <button
                        onClick={() => handleStart("code")}
                        className="p-6 rounded-[2rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:bg-emerald-500 hover:text-white transition-all group text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors">
                          <Code className="text-emerald-500 group-hover:text-white" size={20} />
                        </div>
                        <h4 className="text-lg font-black mb-1 tracking-tight">Industry Simulation</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Production-Grade Probe</p>
                      </button>

                      <button
                        onClick={() => setStep("strategy")}
                        className="p-6 rounded-[2rem] bg-[var(--site-text)]/5 border border-[var(--card-border)] hover:bg-purple-600 hover:text-white transition-all group text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors">
                          <Brain className="text-purple-500 group-hover:text-white" size={20} />
                        </div>
                        <h4 className="text-lg font-black mb-1 tracking-tight">AI Strategy</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Hiring Roadmap Session</p>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === "strategy" && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 py-6">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-purple-500/10 flex items-center justify-center mx-auto border border-purple-500/20">
                    <Brain className="text-purple-500" size={36} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-[var(--site-text)] tracking-tight">AI Career Strategy</h3>
                    <p className="text-sm text-[var(--site-text-muted)] max-w-lg mx-auto">Positioning <strong>{displaySkill}</strong> for the Top 1% of the global market.</p>
                  </div>
                </div>

                {isGenerating ? (
                  <div className="p-8 rounded-[2.5rem] bg-purple-500/5 border border-purple-500/10 text-left space-y-4">
                    <div className="flex items-center gap-3 text-purple-500 font-bold text-xs uppercase tracking-widest">
                      <Zap size={16} className="animate-pulse" /> Generating Strategic Intel...
                    </div>
                    <div className="h-2 w-full bg-[var(--card-border)] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-purple-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "95%" }}
                        transition={{ duration: 4 }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--site-text-muted)] italic">Consulting market signals and your PKG profile...</p>
                  </div>
                ) : strategyData ? (
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Market Position</p>
                      <p className="text-sm font-bold text-[var(--site-text)] leading-relaxed">{strategyData.marketPosition}</p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Immediate Target Action</p>
                      <p className="text-sm font-bold text-[var(--site-text)] leading-relaxed">{strategyData.targetAction}</p>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 space-y-3">
                      <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Portfolio Strategy</p>
                      <p className="text-sm font-bold text-[var(--site-text)] leading-relaxed">{strategyData.portfolioAdvice}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {strategyData.keywords?.map(kw => (
                        <span key={kw} className="px-3 py-1 rounded-full bg-[var(--site-text)]/5 text-[10px] font-black uppercase tracking-widest text-[var(--site-text-muted)] border border-[var(--card-border)]">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                   <div className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 text-center">
                     <p className="text-sm font-bold text-rose-500">Failed to generate strategy. Please try again.</p>
                   </div>
                )}
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                    <Brain size={40} className="text-indigo-500 animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    <Code size={12} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tighter">Generating AI Probe</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1 opacity-60">Consulting Industry Standards</p>
                </div>
              </div>
            )}

            {step === "mcq" && !isGenerating && dynamicProbe && (
              <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight">
                    {dynamicProbe.title}
                  </h3>
                  <p className="text-sm text-[var(--site-text-muted)] max-w-2xl leading-relaxed">
                    {dynamicProbe.description}
                  </p>
                </div>

                <div className="space-y-6 text-left max-w-3xl mx-auto w-full">
                  {dynamicProbe.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="p-6 rounded-[2rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-4">
                      <p className="text-sm font-black text-[var(--site-text)]">{questionIndex + 1}. {question.prompt}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedAnswers[questionIndex] === optionIndex;
                          return (
                            <button
                              key={optionIndex}
                              onClick={() => setAnswer(questionIndex, optionIndex)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all font-bold text-xs cursor-pointer ${isSelected
                                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-500 shadow-lg shadow-indigo-500/10"
                                : "bg-[var(--site-text)]/[0.02] border-[var(--card-border)] text-[var(--site-text-muted)] hover:border-indigo-500/20"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "code" && !isGenerating && dynamicProbe && (
              <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                <div className="text-left space-y-2">
                  <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tight">
                    {dynamicProbe.title}
                  </h3>
                  <p className="text-sm text-[var(--site-text-muted)] max-w-2xl leading-relaxed">
                    {dynamicProbe.description}
                  </p>
                </div>

                <div className="p-6 rounded-[2.5rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-4 text-left">
                  <p className="text-sm font-black text-[var(--site-text)]">{dynamicProbe.prompt}</p>
                  <textarea
                    value={codeAnswer}
                    onChange={(event) => setCodeAnswer(event.target.value)}
                    className="w-full min-h-[220px] rounded-[2rem] bg-slate-950/95 text-emerald-400 border border-emerald-500/30 p-6 outline-none font-mono text-sm resize-y shadow-inner"
                    spellCheck={false}
                  />
                  <div className="flex items-center gap-3">
                     <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                       Architectural Snapshot
                     </div>
                     {dynamicProbe.expectedKeywords && (
                       <p className="text-[10px] text-[var(--site-text-muted)]">
                         Awaiting Patterns: <span className="text-emerald-500 font-bold">{dynamicProbe.expectedKeywords.join(", ")}</span>
                       </p>
                     )}
                  </div>
                </div>
              </div>
            )}

            {isSyncing && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                    <Loader2 size={40} className="text-indigo-500 animate-spin" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    <Zap size={12} className="text-white fill-current" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tighter">Propagating Signal</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1 opacity-60">Updating Cognitive Genome</p>
                </div>
              </div>
            )}

            {step === "generating" && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                    <Brain size={40} className="text-indigo-500 animate-pulse" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                    <Code size={12} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-[var(--site-text)] tracking-tighter">Generating AI Probe</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1 opacity-60">Consulting Industry Standards</p>
                </div>
              </div>
            )}

            {step === "result" && result && !isSyncing && (
              <div className="text-center space-y-10 animate-in slide-in-from-right-10 duration-500 py-4">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 size={56} />
                  </motion.div>
                  <div className="absolute top-0 right-[20%] sm:right-[32%]">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="text-amber-500">
                      <Star size={24} fill="currentColor" />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl sm:text-5xl font-black text-[var(--site-text)] tracking-tighter">Signal Hardened</h3>
                  <p className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">
                    Hiring Score: {Math.round(result.validation.score)}%
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                   <div className="p-6 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 text-left flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Career Alignment</p>
                        <p className="text-sm font-black text-[var(--site-text)] leading-tight">
                          {result.successSignal || `Readiness improved to ${Math.round(result.newHiringScore || 0)}%`}
                        </p>
                      </div>
                      <Briefcase size={20} className="text-indigo-500 mt-4" />
                   </div>
                   
                   <div className="p-6 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 text-left flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Matching Roles</p>
                        <p className="text-sm font-black text-[var(--site-text)] leading-tight">
                          Senior {displaySkill} Engineer, Solution Architect
                        </p>
                      </div>
                      <Target size={20} className="text-emerald-500 mt-4" />
                   </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 inline-flex items-center gap-3">
                   <Zap size={14} className="text-amber-500" />
                   <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">Signal Synced to Career Radar</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:px-10 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
            <button
              onClick={step === "choice" ? onClose : () => setStep("choice")}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer text-[var(--site-text-muted)] hover:text-[var(--site-text)] hover:bg-[var(--site-text)]/5"
            >
              {step === "choice" ? "Close" : "Back to Selection"}
            </button>

            {step === "result" && (
              <button
                onClick={onClose}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Return to Dashboard <ArrowRight size={16} />
              </button>
            )}

            {(step === "mcq" || step === "code") && (
              <button
                onClick={() => submitValidation(step)}
                disabled={loading || (step === "mcq" ? !canSubmitMcq : !canSubmitCode)}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify Signal"}
                {!loading && <ArrowRight size={16} />}
              </button>
            )}
          </div>
        </Surface>
      </div>

      <style jsx>{`
        .premium-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .premium-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .premium-scroll::-webkit-scrollbar-thumb {
          background: rgba(var(--site-text-rgb), 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default SkillValidationModal;
