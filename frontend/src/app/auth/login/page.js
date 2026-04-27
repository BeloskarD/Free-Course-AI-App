"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import Surface from "../../../components/ui/Surface";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ArrowRight,
  LogIn,
} from "lucide-react";
import Modal from "../../../components/ui/Modal";
import { api } from "../../../services/api";

// ─── SVG Brand Icons ───
const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
  </svg>
);

const TwitterIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [providers, setProviders] = useState({ google: false, github: false, twitter: false });
  const { login, register } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "error",
  });

  // Fetch available social providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await api.getAuthProviders();
        if (data.providers) setProviders(data.providers);
      } catch (err) {
        console.log("Could not fetch auth providers:", err);
      }
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let success = isLogin
      ? await login(email, password)
      : await register(email, password);
    if (success) {
      router.push("/mission-home");
    } else {
      setModalConfig({
        title: "Authentication Failed",
        message: isLogin
          ? "Invalid email or password. Please check your credentials and try again."
          : "Registration failed. This email might already be registered.",
        type: "error",
      });
      setShowModal(true);
    }
    setLoading(false);
  };

  const handleSocialLogin = (provider) => {
    if (!providers[provider]) {
      setModalConfig({
        title: "Provider Not Available",
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet. Please contact the administrator.`,
        type: "error",
      });
      setShowModal(true);
      return;
    }
    setSocialLoading(provider);
    // Redirect to backend OAuth endpoint
    const backendUrl = api.getBackendUrl();
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  const hasAnySocialProvider = providers.google || providers.github || providers.twitter;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--site-bg)] transition-colors duration-500 overflow-hidden relative">
      {/* ELITE AMBIENT ACCENTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700 relative z-10">
        {/* BREADCRUMB NAVIGATION */}
        <div className="mb-6 sm:mb-8">
          <Breadcrumb currentPage="Sign In" currentIcon={LogIn} />
        </div>

        {/* ELITE AUTH CARD */}
        <div className="p-5 sm:p-8 md:p-10 lg:p-14 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--card-border)] shadow-[var(--shadow-elite)] relative overflow-hidden group">
          {/* Subtle Inner Glow */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="text-center mb-6 sm:mb-8 md:mb-10 relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-2xl shadow-indigo-600/20 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
              <Sparkles size={24} className="sm:hidden" strokeWidth={2} />
              <Sparkles size={28} className="hidden sm:block md:hidden" strokeWidth={2} />
              <Sparkles size={36} className="hidden md:block" strokeWidth={2} />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[var(--site-text)] tracking-tighter mb-2 sm:mb-3 leading-tight">
              {isLogin ? "Welcome Back" : "Get Started"}
            </h1>
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.25em] sm:tracking-[0.35em] opacity-60">
              {isLogin ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          {/* ─── SOCIAL LOGIN BUTTONS ─── */}
          <div className="space-y-2.5 sm:space-y-3 relative z-10 mb-6 sm:mb-8">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin("google")}
              disabled={socialLoading === "google"}
              className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 md:py-4 px-4 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] hover:bg-[var(--site-text)]/[0.06] transition-all duration-300 group/social cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 active:scale-[0.98]"
            >
              {socialLoading === "google" ? (
                <Loader2 className="animate-spin text-[var(--site-text-muted)]" size={20} />
              ) : (
                <>
                  <GoogleIcon size={18} />
                  <span className="text-xs sm:text-sm font-bold text-[var(--site-text)] tracking-wide">
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialLogin("github")}
              disabled={socialLoading === "github"}
              className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 md:py-4 px-4 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] hover:bg-[var(--site-text)]/[0.06] transition-all duration-300 group/social cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 active:scale-[0.98]"
            >
              {socialLoading === "github" ? (
                <Loader2 className="animate-spin text-[var(--site-text-muted)]" size={20} />
              ) : (
                <>
                  <span className="text-[var(--site-text)]">
                    <GitHubIcon size={18} />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[var(--site-text)] tracking-wide">
                    Continue with GitHub
                  </span>
                </>
              )}
            </button>

            {/* Twitter/X */}
            <button
              type="button"
              onClick={() => handleSocialLogin("twitter")}
              disabled={socialLoading === "twitter"}
              className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 md:py-4 px-4 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] hover:border-[var(--card-hover-border)] hover:bg-[var(--site-text)]/[0.06] transition-all duration-300 group/social cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 active:scale-[0.98]"
            >
              {socialLoading === "twitter" ? (
                <Loader2 className="animate-spin text-[var(--site-text-muted)]" size={20} />
              ) : (
                <>
                  <span className="text-[var(--site-text)]">
                    <TwitterIcon size={18} />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[var(--site-text)] tracking-wide">
                    Continue with X
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ─── DIVIDER ─── */}
          <div className="relative z-10 flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-1 h-px bg-[var(--card-border)]" />
            <span className="text-[8px] sm:text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-50 whitespace-nowrap">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-[var(--card-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8 relative z-10">
            {/* Email Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1 sm:ml-2">
                Email Address
              </label>
              <div className="relative group/field">
                <div className="absolute left-4 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 text-[var(--site-text-muted)] group-focus-within/field:text-[var(--accent-primary)] transition-colors">
                  <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 md:pl-16 pr-3 sm:pr-4 md:pr-6 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-[var(--accent-primary)]/50 focus:bg-[var(--site-text)]/[0.08] outline-none text-[var(--site-text)] font-bold text-xs sm:text-sm md:text-base transition-all placeholder:text-[var(--site-text-muted)] placeholder:opacity-40"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.15em] sm:tracking-[0.2em] ml-1 sm:ml-2">
                Password
              </label>
              <div className="relative group/field">
                <div className="absolute left-4 sm:left-5 md:left-6 top-1/2 -translate-y-1/2 text-[var(--site-text-muted)] group-focus-within/field:text-[var(--accent-primary)] transition-colors">
                  <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 md:pl-16 pr-12 sm:pr-14 md:pr-16 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-[var(--accent-primary)]/50 focus:bg-[var(--site-text)]/[0.08] outline-none text-[var(--site-text)] font-bold text-xs sm:text-sm md:text-base transition-all placeholder:text-[var(--site-text-muted)] placeholder:opacity-40"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-all p-1 cursor-pointer"
                >
                  {showPass ? <Eye size={16} className="sm:w-[18px] sm:h-[18px]" /> : <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl shadow-indigo-600/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] btn-tactile"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Switch */}
          <div className="mt-6 sm:mt-8 md:mt-12 text-center relative z-10 border-t border-[var(--card-border)] pt-5 sm:pt-6 md:pt-8">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] transition-all uppercase tracking-[0.12em] sm:tracking-[0.15em] md:tracking-[0.2em] opacity-80 cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
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
    </div>
  );
}
