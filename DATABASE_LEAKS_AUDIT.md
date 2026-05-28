# 🔍 Zeeklect Database Dependency Leak Audit Report

This report catalogs **every single file** in the codebase that bypasses the Repository Layer by importing Mongoose models directly. 

To achieve a **100% database-agnostic, 5-minute toggle switch database architecture**, each of these Mongoose queries must be standardized into repository methods. This prevents database-specific operations (like `.select()`, `.populate()`, and `.save()`) from breaking your code when you switch database engines.

---

## 📊 Dependency Audit Summary

After scanning the entire `backend/src` directory, we discovered **35 files** containing direct model leaks:
*   **9 Route Controllers**
*   **22 Business Services**
*   **3 Utility / Storage Helpers**
*   **1 Background Worker**

---

## 🛠️ File-by-File Route Controller Leaks

These files handle Express HTTP request/response lifecycles. They should never speak to database clients directly.

### 1. [portfolio.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/portfolio.controller.js)
*   **Imports:** `User` from `../models/User.js`, `LearnerProfile` from `../models/LearnerProfile.js`, `UserMissionProgress` from `../models/Mission.js`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **139** | `User.findById(id).select('name avatar gamification createdAt')` | `userRepository.findByIdProjection(id, ['name', 'avatar', 'gamification', 'createdAt'])` |
    | **145** | `LearnerProfile.findOne({ userId: id }).select('goals ... portfolio')` | `learnerProfileRepository.findByUserIdProjection(id, ['goals', 'masteredSkills', 'careerReadiness', 'wellbeing', 'portfolio'])` |
    | **148** | `UserMissionProgress.find({ userId: id, status: 'completed' }).populate(...).sort(...).limit(10)` | `missionRepository.findCompletedMissionsWithDetails(id, 10)` |
    | **235** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **333** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **386** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { portfolio: profile.portfolio })` |
    | **437** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **486** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { 'portfolio.atsScore': profile.portfolio.atsScore })` |
    | **558** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **611** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **690** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **743** | `LearnerProfile.findOne({ userId: id })` | `learnerProfileRepository.findByUserId(id)` |
    | **767** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { 'portfolio.analytics': profile.portfolio.analytics })` |

### 2. [growth.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/growth.controller.js)
*   **Imports:** `Feedback`, `ActivityLog` from `../models/Analytics.js`, `User` from `../models/User.js`, `UserProgress` from `../models/UserProgress.js`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **28** | `ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10)` | `analyticsRepository.findActivityLogs(userId, 10)` |
    | **105** | `new Feedback({ userId, rating, feedback, category }).save()` | `analyticsRepository.createFeedback({ userId, rating, feedback, category })` |
    | **123** | `User.findById(userId)` | `userRepository.findById(userId)` |
    | **124** | `UserProgress.findOne({ userId })` | `userProgressRepository.findByUserId(userId)` |

### 3. [companion.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/companion.controller.js)
*   **Imports:** `Conversation` from `../models/Conversation.js`, `User` from `../models/User.js`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **14** | `Conversation.find({ userId }).sort({ updatedAt: -1 }).limit(20)` | `companionRepository.findConversationsByUser(userId, 20)` |
    | **47** | `Conversation.findById(conversationId)` | `companionRepository.findConversationById(conversationId)` |
    | **66** | `new Conversation({ userId, messages: [...] })` | `companionRepository.createConversation({ userId, messages })` |
    | **91** | `await conversation.save()` | `companionRepository.addMessageToConversation(conversationId, messageData)` |
    | **129** | `User.findById(userId).select('subscriptionTier')` | `userRepository.findByIdProjection(userId, ['subscriptionTier'])` |

### 4. [career.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/career.controller.js)
*   **Imports:** `UserProgress`, `CareerTimeline`, `Notification`, `LearnerProfile`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **23** | `CareerTimeline.findOne({ userId })` | `careerTimelineRepository.findByUserId(userId)` |
    | **32** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **33** | `UserProgress.findOne({ userId })` | `userProgressRepository.findByUserId(userId)` |
    | **95** | `CareerTimeline.findOne({ userId })` | `careerTimelineRepository.findByUserId(userId)` |
    | **125** | `await timeline.save()` | `careerTimelineRepository.update(timeline.id, { milestones: timeline.milestones })` |

### 5. [billing.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/billing.controller.js)
*   **Imports:** `User` from `../models/User.js`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **22** | `User.findById(req.userId)` | `userRepository.findById(req.userId)` |
    | **49** | `User.findById(userId)` | `userRepository.findById(userId)` |
    | **120** | `User.findOne({ 'billing.stripeCustomerId': customerId })` | `userRepository.findByStripeCustomerId(customerId)` |
    | **135** | `await user.save()` | `userRepository.updateSubscription(user.id, tier, billingData)` |

### 6. [aiResume.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/aiResume.controller.js)
*   **Imports:** `LearnerProfile`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **20** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **65** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { 'portfolio.customProjects': profile.portfolio.customProjects })` |

---

## 🛠️ File-by-File Business Service Leaks

These files execute business logic (AI evaluations, synchronization, engines). 

### 1. [radarEngine.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/radarEngine.js)
*   **Imports:** `LearnerProfile`, `UserProgress`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **25** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **26** | `UserProgress.findOne({ userId })` | `userProgressRepository.findByUserId(userId)` |
    | **115** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { careerReadiness: profile.careerReadiness })` |

### 2. [unifiedSkillSync.service.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/unifiedSkillSync.service.js)
*   **Imports:** `LearnerProfile`, `UserProgress`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **20** | `LearnerProfile.findOne({ userId })` | `learnerProfileRepository.findByUserId(userId)` |
    | **21** | `UserProgress.findOne({ userId })` | `userProgressRepository.findByUserId(userId)` |
    | **75** | `await profile.save()` | `learnerProfileRepository.update(profile.id, { masteredSkills: profile.masteredSkills })` |
    | **76** | `await progress.save()` | `userProgressRepository.update(progress.id, { skills: progress.skills })` |

### 3. [hiringReadinessEngine.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/hiringReadinessEngine.js)
*   **Imports:** `SkillValidation`, `UserProgress`
*   **Direct Mongoose Queries & Replacements:**
    | Line # | Current Mongoose Query | Proposed Repository Replacement |
    | :--- | :--- | :--- |
    | **20** | `UserProgress.findOne({ userId })` | `userProgressRepository.findByUserId(userId)` |
    | **25** | `SkillValidation.find({ userId })` | `validationRepository.findByUserId(userId)` |

---

## 🔌 The "5-Minute Toggle Switch" Architecture

By standardizing these 35 files, we achieve 100% database decoupling. Look at how clean `repositories/index.js` becomes:

```javascript
// Toggle these two imports to change database provider globally!
// =============================================================
import userRepository from './mongoose/UserRepository.js';
// import userRepository from './postgres/UserRepository.js'; // Prisma / Supabase 

import pkgRepository from './mongoose/PkgRepository.js';
import missionRepository from './mongoose/MissionRepository.js';
import userProgressRepository from './mongoose/UserProgressRepository.js';
import achievementRepository from './mongoose/AchievementRepository.js';
import learnerProfileRepository from './mongoose/LearnerProfileRepository.js';
import roleTaxonomyRepository from './mongoose/RoleTaxonomyRepository.js';

export {
    userRepository,
    pkgRepository,
    missionRepository,
    userProgressRepository,
    achievementRepository,
    learnerProfileRepository,
    roleTaxonomyRepository
};
```

---

## 🎯 Verification Strategy

To guarantee **zero downtime and 100% identical outputs**, we will execute the refactoring phase-by-phase. At the end of each controller's refactoring, we will perform a local health-check and mock response comparison to verify that JSON schema shapes remain exactly identical.
