'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { api } from '../../../services/api';
import {
    User,
    Lock,
    Mail,
    Camera,
    Save,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    Shield,
    Eye,
    EyeOff,
    AlertTriangle,
    Upload,
    X,
    ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * PROFILE SETTINGS PAGE
 * Allows users to update their profile information and password
 * Matches Extreme Elite design system with full responsiveness
 */

export default function ProfileSettingsPage() {
    const { user, token, loading: authLoading, refreshUser } = useAuth();
    const { notify } = useNotification();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const fileInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Check auth and redirect if not logged in
    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If no user/token after auth loaded, redirect to login
        if (!user && !token) {
            setRedirecting(true);
            router.replace('/auth/login');
        }
    }, [user, token, authLoading, router]);

    // Fetch profile on mount
    useEffect(() => {
        async function fetchProfile() {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const result = await api.getUserProfile(token);
                if (result.success && result.profile) {
                    setName(result.profile.name || '');
                    setEmail(result.profile.email || '');
                    setAvatar(result.profile.avatar || '');
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                if (notify) {
                    notify.error('Failed to load profile');
                }
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchProfile();
        }
    }, [token]);

    // Handle profile update
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const result = await api.updateProfile({
                name: name,
                avatar: avatar,
            }, token);

            if (result.success) {
                notify.success('Profile updated successfully!');
                // Refresh user data in AuthContext so dashboard shows updated info
                if (refreshUser) {
                    await refreshUser();
                }
            } else {
                notify.error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            notify.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Handle password change
    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validate passwords
        if (newPassword !== confirmPassword) {
            notify.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            notify.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);

        try {
            const result = await api.changePassword(
                currentPassword,
                newPassword,
                token
            );

            if (result.success) {
                notify.success('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                notify.error(result.error || 'Failed to change password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            notify.error('Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    // Show redirecting state
    if (redirecting || (authLoading && !user)) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
                <p className="text-[var(--site-text-muted)] font-bold">Redirecting to login...</p>
            </div>
        );
    }

    // Show not logged in message
    if (!user && !token && !authLoading) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] flex flex-col items-center justify-center gap-4 px-4">
                <AlertTriangle size={48} className="text-amber-500" />
                <h2 className="text-xl font-black text-[var(--site-text)]">Login Required</h2>
                <p className="text-[var(--site-text-muted)] text-center">
                    Please log in to access your profile settings.
                </p>
                <Link
                    href="/auth/login"
                    className="px-6 py-3 bg-[var(--accent-primary)] text-white font-black rounded-xl hover:scale-105 transition-all cursor-pointer"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--site-bg)] flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-[var(--site-text-muted)] hover:text-[var(--accent-primary)] mb-6 sm:mb-8 transition-colors font-bold cursor-pointer"
                >
                    <ArrowLeft size={18} />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                </Link>

                {/* Header */}
                <div className="mb-8 sm:mb-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 flex-shrink-0">
                            <User size={28} className="text-white sm:w-8 sm:h-8" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">Profile Settings</h1>
                            <p className="text-[var(--site-text-muted)] font-bold text-sm sm:text-base">
                                Manage your account settings and preferences
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Camera size={20} className="text-[var(--accent-primary)]" />
                        <h2 className="text-lg sm:text-xl font-black">Profile Information</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-5 sm:space-y-6">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-4">
                            {/* Avatar Preview */}
                            <div className="relative group">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden">
                                    {avatar ? (
                                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>

                                {/* Upload overlay on hover */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                >
                                    <Camera size={28} className="text-white" />
                                </div>

                                {/* Remove button if avatar exists */}
                                {avatar && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatar('')}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors cursor-pointer"
                                        aria-label="Remove avatar"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Check file size (max 2MB)
                                        if (file.size > 2 * 1024 * 1024) {
                                            notify.error('Image must be less than 2MB');
                                            return;
                                        }

                                        setUploadingAvatar(true);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setAvatar(reader.result);
                                            setUploadingAvatar(false);
                                        };
                                        reader.onerror = () => {
                                            notify.error('Failed to read image');
                                            setUploadingAvatar(false);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="hidden"
                            />

                            {/* Upload button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--site-text)]/5 hover:bg-[var(--site-text)]/10 border border-[var(--card-border)] rounded-xl font-bold text-sm text-[var(--site-text)] transition-all cursor-pointer disabled:opacity-50"
                            >
                                {uploadingAvatar ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Upload size={16} />
                                )}
                                {avatar ? 'Change Photo' : 'Upload Photo'}
                            </button>

                            <p className="text-[10px] sm:text-xs text-[var(--site-text-muted)] opacity-60 text-center">
                                JPG, PNG or GIF • Max 2MB
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs sm:text-sm font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full px-4 py-3 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-[var(--accent-primary)] focus:outline-none font-bold text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]/50 transition-all text-sm sm:text-base"
                            />
                        </div>

                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-xs sm:text-sm font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                                <Mail size={14} className="inline mr-1" />
                                Email (cannot be changed)
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] font-bold text-[var(--site-text-muted)] cursor-not-allowed text-sm sm:text-base"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                        >
                            {saving ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} className="sm:w-5 sm:h-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Password Section */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield size={20} className="text-emerald-500" />
                        <h2 className="text-lg sm:text-xl font-black">Change Password</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-5 sm:space-y-6">
                        {/* Current Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-emerald-500 focus:outline-none font-bold text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--site-text)]/10 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all cursor-pointer"
                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                >
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-emerald-500 focus:outline-none font-bold text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--site-text)]/10 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all cursor-pointer"
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-[10px] sm:text-xs text-[var(--site-text-muted)] opacity-60 mt-1.5">
                                Minimum 6 characters
                            </p>
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label className="block text-xs sm:text-sm font-black text-[var(--site-text-muted)] uppercase tracking-wider mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--site-text)]/5 border border-[var(--card-border)] focus:border-emerald-500 focus:outline-none font-bold text-[var(--site-text)] placeholder:text-[var(--site-text-muted)]/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--site-text)]/10 text-[var(--site-text-muted)] hover:text-[var(--site-text)] transition-all cursor-pointer"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Change Password Button */}
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                        >
                            {changingPassword ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <Lock size={18} className="sm:w-5 sm:h-5" />
                                    Change Password
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Security Info */}
                <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-[var(--site-text-muted)] opacity-60">
                    <Shield size={14} className="inline mr-1" />
                    Your data is encrypted and secure
                </div>
            </div>
        </div>
    );
}
