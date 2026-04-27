import { getApiBaseUrl } from '../lib/runtimeConfig';

// Dynamic API base - prioritizes Environment configuration while retaining robust fallbacks
const getApiBase = () => getApiBaseUrl();

export const API_BASE = getApiBase();

const fetchWithTimeout = async (input, init = {}, timeoutMs = 90000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const api = {
  // Helper to safely parse JSON and handle HTML/Empty responses
  async safeJson(res, url) {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`❌ [API Error] Expected JSON from ${url} but got ${contentType || 'blank'}:`, text.substring(0, 100));
      throw new Error(`Server returned invalid response format (${res.status}). Please check if the backend is running.`);
    }
    return await res.json();
  },

  async aiSearch(query, token, mode = "intelligence") {
    const res = await fetchWithTimeout(`${API_BASE}/ai/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, mode }),
    }, 90000);

    const responseData = await res.json().catch(() => ({}));

    if (res.status === 202 || (responseData.success && responseData.data?.jobId)) {
      return await this.pollJobStatus(responseData.data.jobId, token, { accessKey: responseData.data.accessKey });
    }

    if (!res.ok) {
      throw new Error(responseData.error || 'AI search failed');
    }

    return responseData;
  },

  /**
   * Universal Job Poller
   * Triggers when the backend pushes a heavy AI task to Agenda instead of blocking.
   */
  async pollJobStatus(jobId, token, options = {}, maxRetries = 120) {
    let retries = 0;
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          if (options?.accessKey) {
            // Backend expects the key either in header or query. 
            // Standardizing on Header 'X-Job-Access-Key' as verified in job.controller.js
            headers['X-Job-Access-Key'] = options.accessKey;
          }

          const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
            headers,
          });
          
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              const errorBody = await res.json().catch(() => ({}));
              reject(new Error(errorBody.error || 'You do not have access to this job'));
              return;
            }

            retries++;
            if (retries >= maxRetries) {
                console.error(`❌ [Poller] Job ${jobId} timed out after ${maxRetries} retries.`);
                reject(new Error("Job tracking timed out. Please try again."));
                return;
            }
            console.warn(`[Poller] Job status check failed (${res.status}). Retry ${retries}/${maxRetries}...`);
            setTimeout(poll, 4000);
            return;
          }

          const response = await res.json();
          
          if (!response.success || !response.data) {
             retries++;
             if (retries >= maxRetries) {
                 reject(new Error("Malformed job response."));
                 return;
             }
             setTimeout(poll, 4000);
             return;
          }

          const { status, result, error } = response.data;
          
          if (status === 'completed') {
            // Return the unflattened result directly to match direct API/Cache responses
            // This ensures components expecting `response.data` (like ResumeBuilder, Skill Gap) 
            // work correctly on the first load, instead of receiving a flattened object.
            resolve({ 
              success: true, 
              ...result
            });
          } else if (status === 'failed') {

            reject(new Error(error || "AI Background Worker Failed"));
          } else {
            // Processing or Queued => Check again in 4 seconds
            setTimeout(poll, 4000);
          }
        } catch (err) {
          reject(err);
        }
      };
      
      // Start polling loop
      setTimeout(poll, 2000);
    });
  },

  async youtubeSearch(query) {
    const cacheKey = `youtube_search_${query.toLowerCase().trim().replace(/[\s\-_]+/g, '_')}`;
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }

    const res = await fetch(`${API_BASE}/youtube/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    if (typeof window !== "undefined" && Array.isArray(data)) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
    }
    return data;
  },

  async register(email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async changePassword(currentPassword, newPassword, token) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return res.json();
  },

  getBackendUrl() {
    return API_BASE.replace('/api', '');
  },

  async getAuthProviders() {
    try {
      const res = await fetch(`${API_BASE}/auth/providers`);
      return res.json();
    } catch (err) {
      return { providers: { google: false, github: false, twitter: false } };
    }
  },

  async exchangeOAuthCode(code) {
    const res = await fetch(`${API_BASE}/auth/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error || 'Failed to exchange OAuth code');
    return data.token;
  },

  // --- Profile ---
  async getUserProfile(token) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return res.json();
  },

  async updateProfile(data, token) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // --- Favorites ---
  async getFavorites(token) {
    const res = await fetch(`${API_BASE}/user/favorites`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return this.safeJson(res, `${API_BASE}/user/favorites`);
  },

  async getMomentumData(token) {
    const res = await fetch(`${API_BASE}/momentum`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async saveCourse(courseData, token) {
    const res = await fetch(`${API_BASE}/user/favorites`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });
    return res.json();
  },

  async removeCourse(courseId, token) {
    const res = await fetch(`${API_BASE}/user/favorites/${courseId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- Career Acceleration ---
  async getCareerOverview(token) {
    const res = await fetch(`${API_BASE}/pathway-orchestrator/career-overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async recalibrateEngines(token) {
    const res = await fetch(`${API_BASE}/pathway-orchestrator/recalibrate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async getInterventions(token) {
    const res = await fetch(`${API_BASE}/reinforcement/interventions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async getNetworkInsight(token) {
    const res = await fetch(`${API_BASE}/network-insight`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  async generateOutreach(data, token) {
    const res = await fetch(`${API_BASE}/outreach-generator/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // --- Skill Analysis ---
  async analyzeSkillGap(role, token) {
    const res = await fetch(`${API_BASE}/skill-analysis/analyze-gap`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ targetRole: role }),
    });
    const data = await res.json();
    if (res.status === 202 || (data.success && data.data?.jobId)) {
      return await this.pollJobStatus(data.data.jobId, token, { accessKey: data.data.accessKey });
    }
    return data;
  },

  async saveSkillAnalysis(data, token) {
    const res = await fetch(`${API_BASE}/user/save-analysis`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSavedAnalyses(token) {
    const res = await fetch(`${API_BASE}/user/saved-analyses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async removeSavedAnalysis(role, token) {
    const res = await fetch(`${API_BASE}/user/saved-analyses/${encodeURIComponent(role)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- PKG ---
  async getPKG(token) {
    const res = await fetch(`${API_BASE}/pkg`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getPKGSummary(token) {
    const res = await fetch(`${API_BASE}/pkg/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getLearnerProfile(token) {
    const res = await fetch(`${API_BASE}/personalization/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateLearnerProfile(data, token) {
    const res = await fetch(`${API_BASE}/personalization/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSkillGraph(token) {
    const res = await fetch(`${API_BASE}/personalization/skill-graph`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async generateWeeklyPlan(token) {
    const res = await fetch(`${API_BASE}/personalization/plan/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateTaskStatus(taskId, status, token) {
    const res = await fetch(`${API_BASE}/personalization/task/${taskId}`, {
      method: "PATCH",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getHiringReadiness(token) {
    const res = await fetch(`${API_BASE}/personalization/readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- Wellbeing ---
  async getWellbeingStatus(token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async logBreak(data, token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing/break`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async requestStreakPause(data, token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing/streak-pause`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async logMood(data, token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing/mood`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateWellbeingSettings(data, token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing/settings`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async dismissBreakReminder(token) {
    const res = await fetch(`${API_BASE}/personalization/wellbeing/dismiss-break`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async sendPKGEvent(eventType, data, token) {
    const res = await fetch(`${API_BASE}/pkg/event`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: eventType, data }),
    });
    return res.json();
  },

  // --- Tools ---
  async getToolFavorites(token) {
    const res = await fetch(`${API_BASE}/tools/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async saveToolFavorite(toolData, token) {
    const res = await fetch(`${API_BASE}/tools/favorites`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(toolData),
    });
    return res.json();
  },

  async removeToolFavorite(toolName, token) {
    const res = await fetch(`${API_BASE}/tools/favorites/${encodeURIComponent(toolName)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- Career Engine ---
  async getHiringReadiness(token) {
    const res = await fetch(`${API_BASE}/career/readiness`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getDailyActions(token) {
    const res = await fetch(`${API_BASE}/career/daily-actions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.safeJson(res, `${API_BASE}/career/daily-actions`);
  },

  async logActivity(data, token) {
    const res = await fetch(`${API_BASE}/career/activity`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return this.safeJson(res, `${API_BASE}/career/activity`);
  },

  async validateSkill(skill, type, data, token) {
    const res = await fetch(`${API_BASE}/career/validate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ skill, type, data }),
    });
    return this.safeJson(res, `${API_BASE}/career/validate`);
  },

  async getCareerNotifications(token) {
    const res = await fetch(`${API_BASE}/career/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async markNotificationRead(id, token) {
    const res = await fetch(`${API_BASE}/career/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async deleteNotification(id, token) {
    const res = await fetch(`${API_BASE}/career/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getPublicCareerProfile(username) {
    const res = await fetch(`${API_BASE}/career/u/${username}`);
    return res.json();
  },

  // --- Graph Engine ---
  async getGraphEngine(token) {
    const res = await fetch(`${API_BASE}/graph-engine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async recalculateGraph(token) {
    const res = await fetch(`${API_BASE}/graph-engine/recalculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- Missions ---
  async getMissions(status, token) {
    const url = status ? `${API_BASE}/missions?status=${status}` : `${API_BASE}/missions`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.json();
  },

  async getActiveMissions(token) {
    const res = await fetch(`${API_BASE}/missions?status=active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async startMission(missionId, token) {
    const res = await fetch(`${API_BASE}/missions/${missionId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async completeMission(missionId, token) {
    const res = await fetch(`${API_BASE}/missions/${missionId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getMission(missionId, token) {
    const res = await fetch(`${API_BASE}/missions/${missionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getRecommendedMissions(token) {
    const res = await fetch(`${API_BASE}/missions/recommended`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateMissionStage(missionId, stageData, token) {
    const res = await fetch(`${API_BASE}/missions/${missionId}/stage`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(stageData)
    });
    return res.json();
  },

  async abandonMission(missionId, reason, token) {
    const res = await fetch(`${API_BASE}/missions/${missionId}/abandon`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reason })
    });
    return res.json();
  },

  async createMissionFromCourse(course, token) {
    const res = await fetch(`${API_BASE}/missions/from-course`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ course })
    });
    return res.json();
  },

  // --- Resume Orchestrator ---
  async resumeOrchestrator(data, token) {
    const res = await fetch(`${API_BASE}/ai-resume/resume-orchestrator`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const responseData = await res.json();
    if (res.status === 202 || (responseData.success && responseData.data?.jobId)) {
      return await this.pollJobStatus(responseData.data.jobId, token, { accessKey: responseData.data.accessKey });
    }
    return responseData;
  },

  async getCourseInsights(courseTitle) {
    const res = await fetch(`${API_BASE}/ai/course-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseTitle }),
    });
    return res.json();
  },

  // --- Companion ---
  async sendCompanionMessage(message, mode, context, sessionId, token) {
    const res = await fetch(`${API_BASE}/companion/message`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, mode, context, sessionId }),
    });
    return res.json();
  },

  async getCompanionHistory(sessionId, token) {
    const url = new URL(`${API_BASE}/companion/history`);
    if (sessionId) url.searchParams.append('sessionId', sessionId);
    
    const res = await fetch(url.toString(), {
      headers: { 
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    });
    return res.json();
  },

  async setCompanionMode(mode, sessionId, token) {
    const res = await fetch(`${API_BASE}/companion/mode`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ mode, sessionId }),
    });
    return res.json();
  },

  async clearCompanionHistory(sessionId, token) {
    const res = await fetch(`${API_BASE}/companion/clear`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ sessionId }),
    });
    return res.json();
  },

  // --- Opportunity Match ---
  async getOpportunityRadar(token, limit = 100) {
    const res = await fetch(`${API_BASE}/opportunity-match/radar?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getSavedOpportunities(token) {
    const res = await fetch(`${API_BASE}/opportunity-match/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateOpportunityStatus(signalId, status, token) {
    const res = await fetch(`${API_BASE}/opportunity-match/${signalId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async aiScanOpportunities(token) {
    const res = await fetch(`${API_BASE}/opportunity-match/ai-scan`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // --- Guardian ---
  async evaluateGuardian(data, token) {
    const res = await fetch(`${API_BASE}/guardian/evaluate`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getGuardianStatus(token) {
    const res = await fetch(`${API_BASE}/guardian/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async quickGuardianCheck(token) {
    const res = await fetch(`${API_BASE}/guardian/quick`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async getInterviewPrep(signalId, token) {
    const res = await fetch(`${API_BASE}/interview-prep/generate`, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ signalId }),
    });
    return res.json();
  },

  async getOpportunityTrends(token) {
    const res = await fetch(`${API_BASE}/opportunity-match/trends`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
