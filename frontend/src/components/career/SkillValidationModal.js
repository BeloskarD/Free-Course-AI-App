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
} from "lucide-react";
import Link from "next/link";
import Surface from "../ui/Surface";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const normalizeSkillLabel = (skill) => {
  if (!skill) return "Core Competency";
  if (/project/i.test(skill)) return "Portfolio Projects";
  if (/validation|verified/i.test(skill)) return "Technical Validation";
  return skill;
};

const buildMcqSession = (rawSkill) => {
  const skill = normalizeSkillLabel(rawSkill);

  if (/project/i.test(skill)) {
    return {
      title: "Project Proof Quiz",
      description: "Answer a few quick questions about portfolio-quality work and delivery.",
      questions: [
        {
          prompt: "Which project evidence is strongest for recruiters?",
          options: ["Only a certificate", "A shipped demo with clear outcomes", "A long theory note", "A saved bookmark list"],
          correctIndex: 1,
        },
        {
          prompt: "What should every portfolio project include?",
          options: ["A problem statement and your role", "Only screenshots", "Only the final code zip", "A random logo"],
          correctIndex: 0,
        },
        {
          prompt: "What best improves project credibility?",
          options: ["No README", "Broken links", "Live demo or deployment evidence", "Hidden repository"],
          correctIndex: 2,
        },
      ],
    };
  }

  return {
    title: `${skill} Starter Quiz`,
    description: "This quick assessment checks your reasoning and fundamentals before updating your readiness score.",
    questions: [
      {
        prompt: `What is the best way to improve in ${skill}?`,
        options: ["Passive scrolling only", "Repeated hands-on practice with feedback", "Skipping fundamentals", "Memorizing terms without applying them"],
        correctIndex: 1,
      },
      {
        prompt: "Which signal is strongest for technical growth?",
        options: ["Proof of work", "Profile color theme", "Bookmark count", "Course title only"],
        correctIndex: 0,
      },
      {
        prompt: "What should you do after finding a weak area?",
        options: ["Ignore it", "Switch careers immediately", "Create a focused practice loop", "Remove it from your profile"],
        correctIndex: 2,
      },
    ],
  };
};

const buildCodeSession = (rawSkill) => {
  const skill = normalizeSkillLabel(rawSkill);

  if (/project/i.test(skill)) {
    return {
      title: "Project Proof Challenge",
      description: "Write a small helper that counts which projects are deployable and recruiter-ready.",
      prompt: "Write a JavaScript function named getReadyProjects that takes an array of projects and returns only the deployed ones.",
      starter: "function getReadyProjects(projects) {\n  // return deployed projects\n}\n",
      expectedKeywords: ["function", "return", "filter"],
    };
  }

  return {
    title: `${skill} Coding Challenge`,
    description: "Paste a small code snippet that shows structure, logic, and readable implementation.",
    prompt: `Write a small JavaScript function named improve${skill.replace(/[^a-zA-Z0-9]/g, "")}Plan that returns three focused practice tasks for this skill.`,
    starter: `function improve${skill.replace(/[^a-zA-Z0-9]/g, "")}Plan() {\n  return [];\n}\n`,
    expectedKeywords: ["function", "return", "[]"],
  };
};

const SkillValidationModal = ({ isOpen, onClose, skill, onValidated }) => {
  const { token } = useAuth();
  const displaySkill = normalizeSkillLabel(skill);
  const mcqSession = buildMcqSession(displaySkill);
  const codeSession = buildCodeSession(displaySkill);
  const [step, setStep] = useState("choice");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [codeAnswer, setCodeAnswer] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    setStep("choice");
    setResult(null);
    setErrorData(null);
    setSelectedAnswers([]);
    setCodeAnswer(buildCodeSession(skill).starter);

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, skill]);

  const submitValidation = async (type) => {
    setLoading(true);
    setErrorData(null);

    try {
      const payload = type === "mcq"
        ? {
            answers: selectedAnswers,
            correctAnswers: mcqSession.questions.map((question) => question.correctIndex),
          }
        : {
            code: codeAnswer,
            expectedKeywords: codeSession.expectedKeywords,
          };

      const res = await api.validateSkill(displaySkill, type, payload, token);
      if (!res.success) {
        throw new Error(res.message || "Validation could not be completed.");
      }

      setResult(res.data);
      setStep("result");
      onValidated?.(res.data);
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

  const handleStart = (type) => {
    if (type === "mcq") {
      setSelectedAnswers(Array(buildMcqSession(displaySkill).questions.length).fill(null));
    }
    if (type === "code") {
      setCodeAnswer(buildCodeSession(displaySkill).starter);
    }
    setStep(type);
  };

  const setAnswer = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  const canSubmitMcq = selectedAnswers.length === mcqSession.questions.length && selectedAnswers.every((answer) => Number.isInteger(answer));
  const canSubmitCode = codeAnswer.trim().length >= 10;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-black/90 dark:bg-black/95 backdrop-blur-3xl" onClick={onClose} />

      <div className="relative w-full h-full flex items-start justify-center px-4 sm:px-6 lg:pr-8 lg:pl-[calc(2rem+var(--sidebar-offset,0px))] pt-24 pb-6 md:pt-[104px] md:pb-8 pointer-events-none transition-all duration-500">
        <Surface className="w-full max-w-2xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group animate-in zoom-in-95 duration-500 pointer-events-auto">
          <div className="absolute top-0 right-0 w-[360px] h-[360px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-50 p-6 sm:px-10 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tighter truncate">
                  Career Boost
                </h2>
                <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60 truncate">
                  Verify {skill || "your next priority skill"}
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
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <ShieldCheck className="text-indigo-500" size={36} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--site-text)]">
                    Boost Your Hiring Readiness
                  </h3>
                  <p className="text-sm text-[var(--site-text-muted)] max-w-lg mx-auto leading-relaxed">
                    Start a guided starter validation for <strong>{displaySkill || "your highest-impact skill"}</strong>. This uses the same career engine scoring path as the dashboard and now includes an actual quiz or coding step before scoring.
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
                    <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto text-left">
                      <div className="flex items-center gap-3 text-xs font-bold text-[var(--site-text-muted)]">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Unlimited Skill Verifications
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-[var(--site-text-muted)]">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Advanced Career Projections
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-[var(--site-text-muted)]">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Priority Recruiter Visibility
                      </div>
                    </div>
                    <Link href="/settings/upgrade" className="w-full sm:w-auto inline-flex justify-center py-4 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl items-center gap-3">
                      {errorData.cta} <ArrowRight size={16} />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleStart("mcq")}
                        className="p-6 sm:p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-all group text-left cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors">
                          <Gamepad2 className="text-indigo-500 group-hover:text-white" size={24} />
                        </div>
                        <h4 className="text-xl font-black mb-2 tracking-tight">Knowledge Quiz</h4>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Fast starter probe</p>
                      </button>

                      <button
                        onClick={() => handleStart("code")}
                        className="p-6 sm:p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all group text-left cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 group-hover:bg-white/20 flex items-center justify-center mb-6 transition-colors">
                          <Code className="text-emerald-500 group-hover:text-white" size={24} />
                        </div>
                        <h4 className="text-xl font-black mb-2 tracking-tight">Coding Challenge</h4>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Execution starter probe</p>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {(step === "mcq" || step === "code") && (
              <div className="space-y-8 text-center py-6 animate-in slide-in-from-right-10 duration-500">
                <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Lock className="text-amber-500" size={40} />
                </div>
                <div className="space-y-3 max-w-lg mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--site-text)] tracking-tight">
                    Initializing {step.toUpperCase()} Session
                  </h3>
                  <p className="text-sm text-[var(--site-text-muted)] leading-relaxed">
                    We are preparing a starter validation for <strong>{displaySkill}</strong>. This keeps the dashboard responsive while still updating your readiness signal through the live career engine.
                  </p>
                </div>

                {step === "mcq" && (
                  <div className="space-y-4 text-left max-w-3xl mx-auto w-full">
                    <div>
                      <h4 className="text-xl font-black text-[var(--site-text)] tracking-tight">{mcqSession.title}</h4>
                      <p className="text-sm text-[var(--site-text-muted)] mt-2">{mcqSession.description}</p>
                    </div>

                    {mcqSession.questions.map((question, questionIndex) => (
                      <div key={question.prompt} className="p-5 rounded-[1.75rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-4">
                        <p className="text-sm font-black text-[var(--site-text)]">{questionIndex + 1}. {question.prompt}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = selectedAnswers[questionIndex] === optionIndex;
                            return (
                              <button
                                key={option}
                                onClick={() => setAnswer(questionIndex, optionIndex)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all font-bold text-sm cursor-pointer ${isSelected
                                  ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-500"
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
                )}

                {step === "code" && (
                  <div className="space-y-4 text-left max-w-3xl mx-auto w-full">
                    <div>
                      <h4 className="text-xl font-black text-[var(--site-text)] tracking-tight">{codeSession.title}</h4>
                      <p className="text-sm text-[var(--site-text-muted)] mt-2">{codeSession.description}</p>
                    </div>

                    <div className="p-5 rounded-[1.75rem] bg-[var(--site-text)]/[0.02] border border-[var(--card-border)] space-y-4">
                      <p className="text-sm font-black text-[var(--site-text)]">{codeSession.prompt}</p>
                      <textarea
                        value={codeAnswer}
                        onChange={(event) => setCodeAnswer(event.target.value)}
                        className="w-full min-h-[220px] rounded-[1.5rem] bg-slate-950/90 text-emerald-300 border border-emerald-500/20 p-5 outline-none font-mono text-sm resize-y"
                        spellCheck={false}
                      />
                      <p className="text-xs text-[var(--site-text-muted)]">
                        Evaluation checks for structure and key implementation hints: <span className="text-emerald-500 font-bold">{codeSession.expectedKeywords.join(", ")}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === "result" && result && (
              <div className="text-center space-y-8 animate-in slide-in-from-right-10 duration-500">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 size={64} />
                  </motion.div>
                  <div className="absolute top-0 right-[20%] sm:right-[28%]">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="text-amber-500">
                      <Star size={28} fill="currentColor" />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-[var(--site-text)] tracking-tighter">Validation Complete</h3>
                  <p className="text-lg font-black text-emerald-500 uppercase tracking-widest">
                    Score: {Math.round(result.validation.score)}%
                  </p>
                </div>

                <div className="p-6 sm:p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                  <div>
                    <p className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest mb-1">Impact</p>
                    <p className="font-black text-sm text-[var(--site-text)]">
                      {result.successSignal || `Hiring readiness updated to ${Math.round(result.newHiringScore || 0)}%`}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-widest">
                      Ready for bigger challenges
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shrink-0">
                    <Zap size={24} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:px-10 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
            <button
              onClick={step === "choice" ? onClose : () => setStep("choice")}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer text-[var(--site-text-muted)] hover:text-[var(--site-text)]"
            >
              {step === "choice" ? "Close" : "Back"}
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
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Submit Validation"}
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
