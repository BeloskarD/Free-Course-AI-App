"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../services/api";
import { getQueryClient } from "../app/lib/queryClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full profile from backend
  const fetchProfile = async (authToken) => {
    try {
      const result = await api.getUserProfile(authToken);
      if (result.success && result.profile) {
        setUser(prev => ({
          ...prev,
          name: result.profile.name || '',
          avatar: result.profile.avatar || '',
          email: result.profile.email || prev?.email,
          subscriptionTier: result.profile.subscriptionTier || 'free',
          onboardingStatus: result.profile.onboardingStatus || { roleDefined: false },
          onboardingComplete: result.profile.onboardingStatus?.roleDefined || false
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);

        // Check if token has expired (exp is in seconds, Date.now() in ms)
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn('⚠️ Token expired, clearing session...');
          localStorage.removeItem("token");
          setLoading(false);
          return;
        }

        setToken(savedToken);
        setUser({ id: decoded.userId || decoded.id, email: decoded.email || decoded.sub || "user" });
        // Fetch full profile after setting basic user
        fetchProfile(savedToken);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Function to refresh user data (call after profile update)
  const refreshUser = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  // Function to update user locally (for immediate UI update)
  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const register = async (email, password) => {
    try {
      const data = await api.register(email, password);
      if (data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        // Fetch full profile after registration
        fetchProfile(data.token);
        return true;
      }
    } catch (err) {
      console.error("Registration Failed:", err);
    }
    return false;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
      // Fetch full profile after login
      fetchProfile(data.token);
      return true;
    }
    return false;
  };

  // Social login: called from OAuth callback page with token from URL
  const socialLogin = useCallback(async (authToken) => {
    try {
      // Clear previous user's cached data
      const qc = getQueryClient();
      if (qc) qc.clear();

      localStorage.setItem("token", authToken);
      setToken(authToken);
      const decoded = jwtDecode(authToken);
      setUser({ id: decoded.userId || decoded.id, email: decoded.email || decoded.sub || "user" });
      // Fetch full profile to get name, avatar, email
      await fetchProfile(authToken);
      return true;
    } catch (err) {
      console.error("Social login failed:", err);
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear course search state on logout
    localStorage.removeItem("coursesSearchQuery");
    localStorage.removeItem("coursesShowSearchBar");

    // Clear ALL React Query cached data to prevent data leaking between users
    const qc = getQueryClient();
    if (qc) qc.clear();

    setToken(null);
    setUser(null);
    window.location.href = '/auth/login';
  };

  const value = { user, token, login, register, socialLogin, logout, loading, refreshUser, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
