import { useState, useEffect } from 'react';
import { Play, Clock, TrendingUp, ExternalLink, BookmarkPlus, BookmarkCheck, Loader2, Zap, Rocket } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useCreateMissionFromCourse } from '../app/lib/hooks';
import Modal from './ui/Modal';

export default function YouTubeVideoCard({ video, onClick, isSaved = false, onSaveSuccess, onRemoveSuccess }) {
  const { isMounted } = useTheme();
  const { token, user } = useAuth();
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

  const difficultyColors = {
    Beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Intermediate: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    Advanced: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    'All Levels': 'bg-[var(--site-text)]/5 text-[var(--site-text-muted)] border-[var(--card-border)]',
  };

  const typeIcons = {
    Tutorial: '📖',
    'Crash Course': '⚡',
    Project: '🔨',
    Explanation: '💡',
  };

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

  // Sanitize title
  const cleanTitle = (title) => {
    return title || "Untitled Video";
  };

  // Extract skill from video title
  const extractSkill = (video) => {
    const title = video.title?.toLowerCase() || '';
    const skillKeywords = [
      'javascript', 'python', 'react', 'node', 'typescript', 'java', 'css', 'html',
      'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'machine learning', 'ai',
      'data science', 'web development', 'mobile development', 'devops', 'cloud'
    ];
    for (const skill of skillKeywords) {
      if (title.includes(skill)) return skill.charAt(0).toUpperCase() + skill.slice(1);
    }
    return 'Programming';
  };

  const handleCreateMission = async (e) => {
    e.stopPropagation();
    if (!token || !user) {
      showNotification("Please login to create missions", "warning");
      return;
    }
    setCreatingMission(true);
    try {
      const videoData = {
        courseId: generateCourseId(video.title || ""),
        title: cleanTitle(video.title),
        skill: extractSkill(video),
        subSkill: video.difficulty || "All Levels",
        platform: "YouTube",
        link: video.link || "#",
      };
      const result = await createMissionMutation.mutateAsync(videoData);
      if (result.success) {
        showNotification("Video Mission created successfully! 🚀", "success");
        setTimeout(() => router.push('/mission-home'), 1500);
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

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!token || !user) {
      showNotification("Please login to save videos to your library", "warning");
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        // REMOVE from library - use courseId format that matches backend
        const courseId = generateCourseId(video.title || "");
        const result = await api.removeCourse(courseId, token);
        if (result?.success) {
          setSaved(false);
          // Refetch cache globally so Dashboard and other pages update immediately
          queryClient.refetchQueries({ queryKey: ['favorites'] });
          if (onRemoveSuccess) onRemoveSuccess();
          showNotification("Video removed from your library", "info");
        } else {
          throw new Error(result?.error || "Remove failed");
        }
      } else {
        // SAVE to library
        const videoData = {
          title: video.title || "Untitled Video",
          platform: "YouTube",
          type: "YouTube",
          price: 0,
          level: video.difficulty || "All Levels",
          language: "English",
          link: video.link || "#",
          thumbnail: video.thumbnail || "",
          creator: video.creator || "Unknown"
        };

        const result = await api.saveCourse(videoData, token);

        if (result.message === "Already saved") {
          showNotification("This video is already in your library!", "info");
          setSaved(true);
        } else if (result.success) {
          setSaved(true);
          // Refetch cache globally so Dashboard and other pages update immediately
          queryClient.refetchQueries({ queryKey: ['favorites'] });
          if (onSaveSuccess) onSaveSuccess();
          showNotification("Video saved to your library! 🎥", "success");
        } else {
          throw new Error(result.error || "Save failed");
        }
      }
    } catch (error) {
      showNotification(`Failed to ${saved ? 'remove' : 'save'} video. Please try again.`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onClick) onClick();
  };

  if (!isMounted) {
    return (
      <div className="h-[420px] rounded-[3rem] bg-[var(--site-text)]/5 animate-pulse" />
    );
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`
          group relative h-full card-elite p-8 flex flex-col justify-between btn-tactile !bg-[var(--card-bg)] border-[var(--card-border)] hover:-translate-y-2 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-[var(--shadow-elite-hover)]
          ${video.isBestMatch ? "ring-2 ring-rose-500/50 shadow-[0_0_40px_-10px_rgba(225,29,72,0.3)]" : ""}
        `}
      >
        {/* Best Match Spotlight Effect - Integrated for Best Fit across 300px-1600px */}
        {video.isBestMatch && (
          <div className="mb-6 flex animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg ring-1 ring-white/20 animate-pulse-slow">
              <Zap size={14} fill="currentColor" className="shrink-0" />
              <span className="whitespace-nowrap">AI Expert Choice</span>
            </div>
          </div>
        )}

        {/* Extreme Elite Ambient Glow */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-rose-600/5 via-transparent to-amber-600/5 transition-opacity duration-700 pointer-events-none
          ${video.isBestMatch ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `} />

        <div className="relative">
          {/* YouTube Thumbnail Preview - Elite Rendering */}
          <div className="relative mb-8 rounded-[2rem] overflow-hidden bg-neutral-100 dark:bg-neutral-900 aspect-video shadow-2xl flex items-center justify-center border border-[var(--card-border)] group-hover:border-rose-500/30 transition-all duration-500">
            {video.thumbnail ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-700 opacity-5 group-hover:opacity-15 transition-opacity duration-500" />
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-500 overflow-hidden">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-600 flex items-center justify-center shadow-2xl shadow-rose-500/40 group-hover:scale-110 group-hover:rotate-[5deg] group-hover:bg-rose-500 transition-all duration-700 border border-white/20 backdrop-blur-sm">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            </div>

            {/* Elite Type Badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 dark:bg-white/10 backdrop-blur-2xl text-white dark:text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center gap-2 border border-white/20 shadow-xl">
              <span className="text-base leading-none">{typeIcons[video.type] || '📹'}</span>
              {video.type}
            </div>

            {/* Save Button Overlay */}
            <div className="absolute top-4 right-4">
              <button
                onClick={handleToggleSave}
                disabled={saving}
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 border backdrop-blur-md btn-tactile cursor-pointer
                  ${saved
                    ? "bg-rose-600 text-white border-rose-500 shadow-xl shadow-rose-600/30 ring-4 ring-rose-500/20"
                    : "bg-black/60 text-white border-white/20 hover:bg-rose-600/90 hover:border-rose-500 hover:scale-110"
                  }
                  ${saving ? "animate-pulse" : ""}
                `}
                title={saved ? "Remove from Library" : "Save to Library"}
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : saved ? (
                  <BookmarkCheck size={20} strokeWidth={2.5} />
                ) : (
                  <BookmarkPlus size={20} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Video Metadata */}
          <div className="space-y-5 px-1">
            <h3 className="text-lg md:text-xl font-black text-[var(--site-text)] line-clamp-2 group-hover:text-rose-600 transition-colors duration-500 tracking-tighter leading-tight min-h-[3.5rem] flex items-start">
              {video.title}
            </h3>

            <div className="flex items-center gap-3 text-xs font-black text-[var(--site-text-muted)] group-hover:text-[var(--site-text)] transition-colors opacity-80 group-hover:opacity-100 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              {video.creator}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm transition-colors ${difficultyColors[video.difficulty] || difficultyColors['All Levels']}`}>
                {video.difficulty}
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--site-text)]/5 border border-[var(--card-border)] rounded-lg text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">
                <Clock size={12} className="text-rose-500" />
                {video.duration}
              </span>

              {video.viewCount && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--site-text)]/5 border border-[var(--card-border)] rounded-lg text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest">
                  <TrendingUp size={12} className="text-emerald-500" />
                  {video.viewCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Elite Action Buttons - Responsive & Professional */}
        <div className="mt-10 space-y-3 px-2">
          {/* Create Mission Button - Only for logged in users */}
          {user && (
            <button
              onClick={handleCreateMission}
              disabled={creatingMission}
              className="relative w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl overflow-hidden group/btn border border-transparent disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {creatingMission ? (
                <>
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <span className="truncate">Creating...</span>
                </>
              ) : (
                <>
                  <Rocket size={16} strokeWidth={2.5} className="shrink-0" />
                  <span className="truncate">Create Mission</span>
                </>
              )}
              {/* Subtle sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            </button>
          )}

          <button
            onClick={handleCardClick}
            className="relative w-full py-4 px-4 bg-[var(--site-text)] text-[var(--site-bg)] font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl overflow-hidden group/btn border border-transparent hover:border-[var(--site-text)]/20 cursor-pointer"
          >
            <span className="relative z-10 truncate">Open Video</span>
            <ExternalLink size={18} strokeWidth={2.5} className="relative z-10 shrink-0 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-500" />

            {/* Glossy sheen effect for "Professional" look */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
          </button>
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
