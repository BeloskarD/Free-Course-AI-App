import moment from 'moment';

// Calculate learning velocity (courses per week)
export const calculateVelocity = (userProgress) => {
  const courses = userProgress.coursesCompleted || [];
  if (courses.length === 0) {
    return { current: 0, trend: 0 };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const lastWeekCourses = courses.filter(c => c.completedAt >= oneWeekAgo).length;
  const previousWeekCourses = courses.filter(
    c => c.completedAt >= twoWeeksAgo && c.completedAt < oneWeekAgo
  ).length;

  const trend = previousWeekCourses > 0 
    ? ((lastWeekCourses - previousWeekCourses) / previousWeekCourses * 100).toFixed(0)
    : 0;

  return {
    current: lastWeekCourses,
    trend: Number(trend),
  };
};

// Calculate streak
export const calculateStreak = (userProgress) => {
  const activityLog = userProgress.activityLog || [];
  if (activityLog.length === 0) {
    return { current: 0, max: 0 };
  }

  const sortedActivities = activityLog
    .map(a => moment(a.date).format('YYYY-MM-DD'))
    .sort((a, b) => new Date(b) - new Date(a));

  const uniqueDates = [...new Set(sortedActivities)];

  let currentStreak = 0;
  const today = moment().format('YYYY-MM-DD');
  const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1;
    let checkDate = moment(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = moment(uniqueDates[i]);
      if (checkDate.diff(prevDate, 'days') === 1) {
        currentStreak++;
        checkDate = prevDate;
      } else {
        break;
      }
    }
  }

  return {
    current: currentStreak,
    max: userProgress.maxStreak || currentStreak,
  };
};

// Generate activity heatmap data (last 365 days)
export const generateActivityHeatmap = (userProgress) => {
  const activityLog = userProgress.activityLog || [];
  const heatmapData = {};

  for (let i = 0; i < 365; i++) {
    const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
    heatmapData[date] = 0;
  }

  activityLog.forEach(activity => {
    const date = moment(activity.date).format('YYYY-MM-DD');
    if (heatmapData.hasOwnProperty(date)) {
      heatmapData[date] += activity.count || 1;
    }
  });

  return heatmapData;
};

// Generate weekly progress (last 12 weeks)
export const generateWeeklyProgress = (userProgress) => {
  const courses = userProgress.coursesCompleted || [];
  const weeklyData = [];

  for (let i = 11; i >= 0; i--) {
    const weekStart = moment().subtract(i, 'weeks').startOf('week');
    const weekEnd = moment().subtract(i, 'weeks').endOf('week');
    
    const weekCourses = courses.filter(c => {
      const completedDate = moment(c.completedAt);
      return completedDate.isBetween(weekStart, weekEnd, null, '[]');
    }).length;

    weeklyData.push({
      value: weekCourses,
      week: `Week of ${weekStart.format('MMM D')}`,
      label: `W${12 - i}`,
      date: `${weekStart.format('MMM D')} - ${weekEnd.format('MMM D, YYYY')}`,
    });
  }

  return weeklyData;
};

// Calculate skill progress
export const calculateSkillProgress = (userProgress, user, userMissions = []) => {
  const skills = userProgress.skills || [];
  
  return skills.map(skill => {
    // RCA Fix: Aggregate mission data for this specific skill to fix "0h" and "Never" bugs
    const normalizedTarget = skill.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const skillMissions = userMissions.filter(m => {
      const skillName = m.missionId?.skill || m.skill; // Support both populated and unpopulated for safety
      if (!skillName) return false;
      const mSkillNorm = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return mSkillNorm === normalizedTarget && m.status === 'completed';
    });

    const coursesDone = skillMissions.length;
    let totalMinutes = 0;
    let lastDate = skill.lastPracticed;

    skillMissions.forEach(m => {
      // Sum minutes from all stages
      (m.stageProgress || []).forEach(sp => {
        totalMinutes += (sp.timeSpent || 0);
      });
      
      // Track most recent completion
      const compDate = new Date(m.completedAt || m.updatedAt);
      if (!lastDate || compDate > new Date(lastDate)) {
        lastDate = compDate;
      }
    });

    if (skillMissions.length > 0) {
      console.log(`[MomentumCalc] Found ${skillMissions.length} missions for skill: ${skill.name}. Total minutes: ${totalMinutes}`);
    }

    return {
      name: skill.name,
      category: skill.category || 'General',
      progress: skill.progress || 0,
      coursesCompleted: coursesDone || skill.coursesCompleted || 0,
      hoursSpent: Math.max(skill.hoursSpent || 0, Math.round(totalMinutes / 60)),
      lastPracticed: lastDate 
        ? moment(lastDate).fromNow()
        : 'Never',
      nextMilestone: getNextMilestone(skill.progress),
      description: `Progress in ${skill.name}`,
    };
  });
};

// Check and return achievements with unlock status
export const checkAchievements = async (userId, userProgress, allAchievements) => {
  const unlockedIds = (userProgress?.unlockedAchievements || []).map(a => 
    a.achievementId.toString()
  );

  return allAchievements.map(achievement => {
    const isUnlocked = unlockedIds.includes(achievement._id.toString());
    
    let progress = 0;
    if (!isUnlocked && achievement.criteria) {
      progress = calculateAchievementProgress(achievement.criteria, userProgress);
    }

    const unlocked = userProgress?.unlockedAchievements.find(
      a => a.achievementId.toString() === achievement._id.toString()
    );

    return {
      id: achievement._id,
      title: achievement.title,
      description: achievement.description,
      type: achievement.type,
      rarity: achievement.rarity,
      unlocked: isUnlocked,
      unlockedDate: unlocked ? moment(unlocked.unlockedAt).fromNow() : null,
      reward: achievement.reward,
      progress: !isUnlocked ? progress : undefined,
    };
  });
};

// Helper: Get next milestone for skill
function getNextMilestone(progress) {
  if (progress < 25) return 'Reach Beginner level (25%)';
  if (progress < 50) return 'Reach Intermediate level (50%)';
  if (progress < 75) return 'Reach Advanced level (75%)';
  if (progress < 90) return 'Reach Expert level (90%)';
  return 'Achieve full mastery (100%)';
}

// Helper: Calculate achievement progress
function calculateAchievementProgress(criteria, userProgress) {
  if (!userProgress) return 0;

  switch (criteria.type) {
    case 'courses_completed':
      const completed = (userProgress.coursesCompleted || []).length;
      return Math.min((completed / criteria.value) * 100, 100);
    
    case 'streak_days':
      const streak = userProgress.currentStreak || 0;
      return Math.min((streak / criteria.value) * 100, 100);
    
    case 'skill_mastery':
      const skill = (userProgress.skills || []).find(s => s.name === criteria.skillName);
      return skill ? skill.progress : 0;
    
    default:
      return 0;
  }
}
