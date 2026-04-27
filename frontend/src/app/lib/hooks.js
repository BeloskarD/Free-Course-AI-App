'use client';

/**
 * ZEEKLECT HOOKS
 * ==============
 * TanStack Query hooks for PKG, Guardian, and Missions.
 * Provides data fetching, caching, and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ============================================
// PKG HOOKS
// ============================================

export function usePKG() {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['pkg'],
        queryFn: () => api.getPKG(token),
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePKGSummary() {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['pkg-summary'],
        queryFn: () => api.getPKGSummary(token),
        enabled: !!token,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function usePKGEvent() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventType, data }) => api.sendPKGEvent(eventType, data, token),
        onSuccess: () => {
            // Invalidate PKG queries after event
            queryClient.invalidateQueries({ queryKey: ['pkg'] });
            queryClient.invalidateQueries({ queryKey: ['pkg-summary'] });
        },
    });
}

// ============================================
// GUARDIAN HOOKS
// ============================================

export function useGuardianEvaluation(sessionContext) {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['guardian-evaluate', sessionContext],
        queryFn: () => api.evaluateGuardian(sessionContext, token),
        enabled: !!token && !!sessionContext,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
}

export function useGuardianStatus() {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['guardian-status'],
        queryFn: () => api.getGuardianStatus(token),
        enabled: !!token,
        staleTime: 2 * 60 * 1000,
    });
}

export function useQuickGuardianCheck() {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['guardian-quick'],
        queryFn: () => api.quickGuardianCheck(token),
        enabled: !!token,
        staleTime: 60 * 1000,
    });
}

// ============================================
// MISSION HOOKS
// ============================================

export function useMissions(status = null) {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['missions', status],
        queryFn: () => api.getMissions(status, token),
        enabled: !!token,
        staleTime: 2 * 60 * 1000,
    });
}

export function useMission(missionId) {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['mission', missionId],
        queryFn: () => api.getMission(missionId, token),
        enabled: !!token && !!missionId,
        staleTime: 60 * 1000,
    });
}

export function useRecommendedMissions() {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['missions-recommended'],
        queryFn: () => api.getRecommendedMissions(token),
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStartMission() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (missionId) => api.startMission(missionId, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missions'] });
            queryClient.invalidateQueries({ queryKey: ['pkg'] });
        },
    });
}

export function useUpdateMissionStage() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ missionId, stageData }) => api.updateMissionStage(missionId, stageData, token),
        onSuccess: (_, { missionId }) => {
            queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
            queryClient.invalidateQueries({ queryKey: ['missions'] });
            queryClient.invalidateQueries({ queryKey: ['pkg'] });
        },
    });
}

export function useCompleteMission() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (missionId) => api.completeMission(missionId, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missions'] });
            queryClient.invalidateQueries({ queryKey: ['pkg'] });
        },
    });
}

export function useAbandonMission() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ missionId, reason }) => api.abandonMission(missionId, reason, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missions'] });
            queryClient.invalidateQueries({ queryKey: ['pkg'] });
        },
    });
}

export function useCreateMissionFromCourse() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (course) => api.createMissionFromCourse(course, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missions'] });
        },
    });
}
