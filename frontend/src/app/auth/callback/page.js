"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function OAuthCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { socialLogin } = useAuth();
    const [status, setStatus] = useState("processing"); // processing, success, error
    const [errorMessage, setErrorMessage] = useState("");
    const hasRun = useRef(false);

    useEffect(() => {
        // Guard: only run once
        if (hasRun.current) return;
        hasRun.current = true;

        const handleCallback = async () => {
            const token = searchParams.get("token");
            const code = searchParams.get("code");
            const error = searchParams.get("error");

            if (error) {
                setStatus("error");
                const errorMessages = {
                    authentication_failed: "Authentication failed. Please try again.",
                    oauth_denied: "You denied access. Please try again if this was a mistake.",
                    server_error: "A server error occurred. Please try again later.",
                };
                setErrorMessage(errorMessages[error] || "An unexpected error occurred.");
                setTimeout(() => router.push("/auth/login"), 3000);
                return;
            }

            try {
                const authToken = code ? await api.exchangeOAuthCode(code) : token;

                if (authToken) {
                    const success = await socialLogin(authToken);
                    if (success) {
                        setStatus("success");
                        setTimeout(() => router.push("/mission-home"), 800);
                    } else {
                        setStatus("error");
                        setErrorMessage("Failed to complete sign in. Please try again.");
                        setTimeout(() => router.push("/auth/login"), 3000);
                    }
                } else {
                    setStatus("error");
                    setErrorMessage("No authentication data received. Please try again.");
                    setTimeout(() => router.push("/auth/login"), 3000);
                }
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus("error");
                setErrorMessage("An unexpected error occurred during sign in.");
                setTimeout(() => router.push("/auth/login"), 3000);
            }
        };

        handleCallback();
    }, []); // Empty deps — runs once, guarded by ref

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--site-bg)] transition-colors duration-500 overflow-hidden relative">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />

            <div className="text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] bg-[var(--card-bg)] backdrop-blur-3xl border border-[var(--card-border)] shadow-[var(--shadow-elite)] max-w-sm mx-auto">

                    {/* Processing */}
                    {status === "processing" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-600/20">
                                <Loader2 className="animate-spin" size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tight mb-2">
                                    Signing you in
                                </h2>
                                <p className="text-[9px] sm:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] opacity-60">
                                    Please wait a moment...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Success */}
                    {status === "success" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-500">
                                <CheckCircle size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tight mb-2">
                                    Welcome!
                                </h2>
                                <p className="text-[9px] sm:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] opacity-60">
                                    Redirecting to dashboard...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {status === "error" && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-red-500/20 animate-in zoom-in duration-500">
                                <XCircle size={32} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-[var(--site-text)] tracking-tight mb-2">
                                    Sign In Failed
                                </h2>
                                <p className="text-xs sm:text-sm text-[var(--site-text-muted)] opacity-80 mb-3">
                                    {errorMessage}
                                </p>
                                <p className="text-[9px] sm:text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-[0.3em] opacity-60">
                                    Redirecting to login...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={null}>
            <OAuthCallbackContent />
        </Suspense>
    );
}
