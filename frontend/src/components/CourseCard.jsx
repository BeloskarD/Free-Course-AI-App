"use client";
import {
  BookOpen,
  Globe,
  BarChart3,
  ArrowRight,
  Sparkles,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  Rocket,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Modal from "./ui/Modal";
import { useCreateMissionFromCourse } from "../app/lib/hooks";
import { isDirectCourseLink } from "../utils/linkUtils";

import { useTheme } from "../context/ThemeContext";

export default function CourseCard({
  course,
  onClick,
  isSaved = false,
  onSaveSuccess,
  onRemoveSuccess,
}) {
  const { token, user } = useAuth();
  const { isMounted } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [creatingMission, setCreatingMission] = useState(false);

  // Create mission mutation
  const createMissionMutation = useCreateMissionFromCourse();

  // Sync with prop changes
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
  });

  // Sanitize title
  const cleanTitle = (title) => {
    if (!title) return "Untitled Course";
    return title
      .replace(/\b(\w+)\s+\1\b/gi, "$1")
      .replace(/^(Free|Paid|Course|Tutorial|Learn|Master)\s+/gi, "")
      .trim();
  };

  // Sanitize price - extract numeric value from AI-generated price strings
  const sanitizePrice = (price) => {
    if (typeof price === 'number') return price;
    if (!price || price === 'null' || price === 'undefined') return 0;

    // Convert to string for processing
    const priceStr = String(price);

    // If it's explicitly "Free" or similar, return 0
    if (/free|gratis|₹\s*0/i.test(priceStr)) return 0;

    // Extract first number from price string (e.g., "₹3,000 - ₹5,000" → 3000)
    const match = priceStr.replace(/,/g, '').match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 0; // Default to 0 if no number found
  };

  // Normalize type - handle AI-generated type strings like "Free/Paid Options"
  const normalizeType = (type) => {
    if (!type) return "Free";
    const typeStr = String(type).toLowerCase();

    // Check for various type patterns
    if (typeStr.includes('youtube')) return "YouTube";
    if (typeStr.includes('paid') && !typeStr.includes('free')) return "Paid";
    if (typeStr.includes('free') && typeStr.includes('paid')) return "Free"; // If both, default to Free
    if (typeStr.includes('free')) return "Free";
    if (typeStr.includes('paid') || typeStr.includes('premium') || typeStr.includes('subscription')) return "Paid";

    // Default mappings
    const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    if (['Free', 'Paid', 'YouTube'].includes(normalized)) return normalized;

    return "Free"; // Default fallback
  };

  // Get normalized type for this course
  const courseType = normalizeType(course.type);

  const showNotification = (message, type = "success") => {
    setModalConfig({
      title: type === "success" ? "Success" : type === "error" ? "Error" : type === "warning" ? "Login Required" : "Info",
      message,
      type,
    });
    setShowModal(true);
  };

  // Generate courseId matching backend format
  const generateCourseId = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 100);
  };

  // Extract skill from course title or platform
  const extractSkill = (course) => {
    // Priority 1: Use AI-provided exact skills if available
    if (course.coversSkills && Array.isArray(course.coversSkills) && course.coversSkills.length > 0) {
      return course.coversSkills[0];
    }

    const title = course.title?.toLowerCase() || '';
    // Common skill keywords
    const skillKeywords = [
      'javascript', 'python', 'react', 'node', 'typescript', 'java', 'css', 'html',
      'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning', 'ai',
      'data science', 'web development', 'mobile development', 'devops', 'cloud',
      'design', 'ux', 'ui', 'product management', 'agile', 'scrum'
    ];

    for (const skill of skillKeywords) {
      if (title.includes(skill)) {
        // preserve spacing before normalization by backend
        return skill; 
      }
    }

    // Fallback to generic concept instead of platform name
    return 'Core Programming';
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!token || !user) {
      showNotification("Please login to save courses to your library", "warning");
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        // REMOVE from library - use courseId format that matches backend
        const courseId = generateCourseId(course.title || "");
        const result = await api.removeCourse(courseId, token);
        if (result?.success) {
          setSaved(false);
          // Refetch cache globally so Dashboard and other pages update immediately
          queryClient.refetchQueries({ queryKey: ['favorites'] });
          if (onRemoveSuccess) onRemoveSuccess();
          showNotification("Course removed from your library", "info");
        } else {
          throw new Error(result?.error || "Remove failed");
        }
      } else {
        // SAVE to library - sanitize all fields with normalized values
        const courseData = {
          title: course.title || "Untitled Course",
          platform: course.platform || "Unknown",
          type: courseType, // Use normalized type
          price: sanitizePrice(course.price), // Sanitize price to ensure it's a number
          level: course.level || "All Levels",
          language: course.language || "English",
          link: course.link || "#",
        };
        const result = await api.saveCourse(courseData, token);
        if (result.message === "Already saved") {
          showNotification("This course is already in your library!", "info");
          setSaved(true);
        } else if (result.success) {
          setSaved(true);
          // Refetch cache globally so Dashboard and other pages update immediately
          queryClient.refetchQueries({ queryKey: ['favorites'] });
          if (onSaveSuccess) onSaveSuccess();
          showNotification("Course saved to your library! 🎉", "success");
        } else {
          throw new Error(result.error || "Save failed");
        }
      }
    } catch (error) {
      showNotification(`Failed to ${saved ? 'remove' : 'save'} course. Please try again.`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMission = async (e) => {
    e.stopPropagation();

    if (!token || !user) {
      showNotification("Please login to create missions", "warning");
      return;
    }

    setCreatingMission(true);

    try {
      const courseData = {
        courseId: generateCourseId(course.title || ""),
        title: cleanTitle(course.title || "Untitled Course"),
        skill: extractSkill(course),
        subSkill: course.level || "Fundamentals",
        platform: course.platform || "Unknown",
        link: course.link || "#",
      };

      const result = await createMissionMutation.mutateAsync(courseData);

      if (result.success) {
        showNotification("Mission created successfully! 🚀", "success");
        // Redirect to mission-home after short delay for toast visibility
        setTimeout(() => {
          router.push('/mission-home');
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create mission");
      }
    } catch (error) {
      console.error('Failed to create mission:', error);
      showNotification(error.message || "Failed to create mission. Please try again.", "error");
    } finally {
      setCreatingMission(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-[450px] rounded-[2.5rem] bg-[var(--site-text)]/5 animate-pulse" />
    );
  }

  return (
    <>
      <div
        onClick={onClick}
        className={`
          group relative h-full card-elite p-5 sm:p-6 lg:p-7 flex flex-col transition-all duration-500 hover:-translate-y-2 !bg-[var(--card-bg)] border-[var(--card-border)] cursor-pointer min-h-[380px] md:min-h-[420px]
          ${course.isBestMatch ? "ring-2 ring-[var(--accent-primary)] shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]" : ""}
        `}
      >
        {/* Extreme Elite Ambient Glow */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 transition-opacity duration-700 pointer-events-none
          ${course.isBestMatch ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `} />

        {/* Best Match Spotlight Effect - Integrated for Best Fit across 300px-1600px */}
        {course.isBestMatch && (
          <div className="mb-6 flex animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 lg:px-4 lg:py-2 bg-gradient-to-r from-[var(--accent-primary)] to-indigo-600 text-white text-[9px] sm:text-[10px] lg:text-[11px] font-extra-black uppercase tracking-[0.1em] rounded-xl lg:rounded-2xl shadow-lg ring-1 ring-white/20 animate-pulse-slow">
              <Zap size={14} fill="currentColor" className="shrink-0 scale-90 sm:scale-100 lg:scale-100" />
              <span className="whitespace-nowrap">AI Expert Choice</span>
            </div>
          </div>
        )}

        {/* Dynamic Sparkle - Elite Brand Detail */}
        <div className="absolute -right-8 -top-8 w-36 h-36 text-[var(--accent-primary)]/5 group-hover:scale-125 transition-transform duration-1000 pointer-events-none group-hover:opacity-20 opacity-0">
          <Sparkles size={144} />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Top Actions & Premium Badge */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex flex-col gap-2">
              <span className={`
                px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500
                ${courseType === "Free" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : ""}
                ${courseType === "Paid" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" : ""}
                ${courseType === "YouTube" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : ""}
              `}
              >
                {courseType}
              </span>
              {courseType === "Paid" && sanitizePrice(course.price) > 0 && (
                <span className="px-3 py-1 bg-[var(--site-text)]/5 text-[var(--site-text)] text-[11px] font-black rounded-lg border border-[var(--card-border)] w-fit">
                  ₹{sanitizePrice(course.price)}
                </span>
              )}
            </div>

            <button
              onClick={handleToggleSave}
              disabled={saving}
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border btn-tactile
                ${saved
                  ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-2xl shadow-indigo-600/30 ring-4 ring-indigo-500/10"
                  : "bg-[var(--card-bg)] text-[var(--site-text-muted)] border-[var(--card-border)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--site-text)]/5 shadow-md"
                }
                ${saving ? "animate-pulse" : ""}
              `}
              title={saved ? "Remove from Library" : "Save to Library"}
            >
              {saving ? (
                <Loader2 size={24} className="animate-spin" />
              ) : saved ? (
                <BookmarkCheck size={24} strokeWidth={2.5} />
              ) : (
                <BookmarkPlus size={24} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Title - Responsive for all screen sizes */}
          <div className="min-h-[4rem] sm:min-h-[4.5rem] mb-4 sm:mb-6 flex flex-col justify-center">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-black text-[var(--site-text)] tracking-tight leading-snug group-hover:text-[var(--accent-primary)] transition-colors duration-500 line-clamp-2">
              {cleanTitle(course.title)}
            </h3>
          </div>

          {/* Expert Reason - Remove Confusion Mission */}
          {course.whyThisCourse && (
            <div className="mb-6 p-4 rounded-2xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed font-medium text-[var(--site-text)] opacity-90 italic">
                  "{course.whyThisCourse}"
                </p>
              </div>
            </div>
          )}

          {/* Platform Identity */}
          <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] group-hover:bg-[var(--site-text)]/[0.06] transition-all duration-500">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Globe size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              
              <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">Platform</span>
              <span className="text-xs font-black text-[var(--site-text)] uppercase">
                {(() => {
                  if (course.platform && course.platform !== 'EdTech' && course.platform !== 'Visit Site') return course.platform;
                  const url = (course.link || course.url || '').toLowerCase();
                  if (url.includes('udemy.com')) return 'Udemy';
                  if (url.includes('coursera.org')) return 'Coursera';
                  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
                  if (url.includes('edx.org')) return 'edX';
                  if (url.includes('pluralsight.com')) return 'Pluralsight';
                  if (url.includes('simplilearn.com')) return 'Simplilearn';
                  if (url.includes('freecodecamp.org')) return 'FreeCodeCamp';
                  if (url.includes('github.com')) return 'GitHub';
                  if (url.includes('khanacademy.org')) return 'Khan Academy';
                  return course.platform || 'Direct Source';
                })()}
              </span>

            </div>
          </div>

          {/* Stats Bento */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] font-black uppercase text-[9px] tracking-widest shadow-sm group-hover:border-[var(--accent-primary)]/20 transition-all">
              <BarChart3 size={14} className="text-indigo-500" />
              <span className="truncate">{course.level}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--site-text-muted)] font-black uppercase text-[9px] tracking-widest shadow-sm group-hover:border-[var(--accent-primary)]/20 transition-all">
              <BookOpen size={14} className="text-blue-500" />
              <span className="truncate">{course.language}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 space-y-3">
            {/* Create Mission Button - Only for logged in users */}
            {user && (
              <button
                onClick={handleCreateMission}
                disabled={creatingMission}
                className="relative w-full py-3.5 sm:py-4 lg:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl lg:rounded-2xl text-[10px] sm:text-xs lg:text-xs uppercase tracking-[0.15em] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl overflow-hidden group/btn border border-transparent disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {creatingMission ? (
                  <>
                    <Loader2 size={16} className="animate-spin lg:scale-110" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={16} strokeWidth={2.5} className="lg:scale-110" />
                    <span>Create Mission</span>
                  </>
                )}
                {/* Subtle sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </button>
            )}

             {/* Open Course Button */}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 // v5 Zero-Confusion: Smart link selection + Protocol guard
                 const getBestLink = () => {
                   const rawLink = course.official_link || course.url || course.link;
                   if (!rawLink || rawLink === '#' || rawLink.startsWith('#')) return null;
                   
                   // Simple protocol guard
                   if (rawLink.startsWith('www.')) return `https://${rawLink}`;
                   return rawLink;
                 };

                 const targetUrl = getBestLink();
                 // Validate that the link is a direct course link, not a search/category page
                 if (targetUrl && isDirectCourseLink(targetUrl)) {
                   window.open(targetUrl, '_blank', 'noopener,noreferrer');
                 } else {
                   // Fallback to platform root to avoid 404/blank page
                   const platformRoot = course.platform?.toLowerCase().includes('udemy') ? 'https://www.udemy.com' : 'https://www.coursera.org';
                   window.open(platformRoot, '_blank', 'noopener,noreferrer');
                 }
               }}
               className="relative w-full py-4 sm:py-4.5 lg:py-5 bg-[var(--site-text)] text-[var(--site-bg)] font-black rounded-xl lg:rounded-2xl text-[10px] sm:text-xs lg:text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl overflow-hidden group/btn border border-transparent hover:border-[var(--site-text)]/20 cursor-pointer"
             >
              <span className="relative z-10">Open Course</span>
              <ArrowRight size={16} strokeWidth={3} className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300 lg:scale-110" />

              {/* Subtle sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </>
  );
}
