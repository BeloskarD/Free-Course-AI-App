# 🔍 Mongoose Mutation Dependency Audit Report

This audit acts as our safety manual before enforcing deep-frozen POJOs in Phase 2. 

If we were to freeze repository returns today, **every database-writing endpoint in the application would crash instantly** due to the high volume of direct property mutations and `.save()` calls scattered across services and controllers.

---

## 📊 Mutation Hotspot Breakdown

We scanned the entire backend codebase for in-memory property assignments, sub-document mutations, and direct Mongoose document persistence triggers (`.save()`, `.markModified()`, `.populate()`).

### 1. [portfolio.controller.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/controllers/portfolio.controller.js) (Route Controller)
*   **Line 386:** `profile.portfolio.headline = headline; ... await profile.save();`
    *   *Severity:* **CRITICAL**
    *   *Why it fails:* `profile` is a deep-frozen POJO. Attempting to assign `headline` throws a `TypeError: Cannot assign to read-only property`. Calling `.save()` throws a `TypeError: profile.save is not a function`.
    *   *Safest Refactor:* Convert to `await learnerProfileRepository.updatePortfolioHeadline(req.userId, headline)`.
    *   *Blocks Phase 2:* **Yes.** Blocks full `LearnerProfile` freezing.
*   **Line 486:** `profile.portfolio.atsScore = score; ... await profile.save();`
    *   *Severity:* **CRITICAL**
    *   *Why it fails:* Same read-only assignment throw.
    *   *Safest Refactor:* `await learnerProfileRepository.updateATSScore(req.userId, score)`.
    *   *Blocks Phase 2:* **Yes.**
*   **Line 767:** `profile.portfolio.analytics = ...; await profile.save();`
    *   *Severity:* **CRITICAL**
    *   *Why it fails:* Direct nested structure assignment throw.
    *   *Safest Refactor:* `await learnerProfileRepository.incrementPortfolioViews(req.userId)`.
    *   *Blocks Phase 2:* **Yes.**

### 2. [mission.service.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/mission.service.js) (Core Business Engine)
*   **Lines 57, 246, 337, 404, 437, 511, 542, 561:** `progress.stages.push(...); await progress.save();` and `progress.status = 'completed'; await progress.save();`
    *   *Severity:* **CRITICAL**
    *   *Why it fails:* In-memory array push (`.push()`) on a deep-frozen array will throw a read-only mutation error, instantly halting all user learning missions.
    *   *Safest Refactor:* Abstract stage advancement into the adapter: `await missionRepository.advanceMissionStage(userId, missionId, stageData)`.
    *   *Blocks Phase 2:* **Yes.** Blocks freezing `MissionRepository`.

### 3. [pkgService.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/pkgService.js) (Personalization Engine)
*   **Lines 248, 367, 425, 447, 525, 560, 598, 622, 638, 742, 755:** Extensive in-memory sub-document array pushes (e.g. `pkg.skills.push(...)`, `pkg.wellbeing.moodTrend.push(...)`) followed by `await pkg.save()`.
    *   *Severity:* **CRITICAL**
    *   *Why it fails:* Over 15 different dynamic state arrays are mutated in memory. Deep-freezing `pkg` will immediately crash all intelligence search metrics and streak calculations.
    *   *Safest Refactor:* Move the entire state transitions inside `pkgRepository` concrete database updates, or utilize clean repository update methods passing calculated state variables.
    *   *Blocks Phase 2:* **Yes.** Blocks freezing `PkgRepository`.

### 4. [unifiedSkillSync.service.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/unifiedSkillSync.service.js) (Sync Service)
*   **Lines 79 & 98:** `profile.masteredSkills = ...; await profile.save();` and `progress.skills = ...; await progress.save();`
    *   *Severity:* **HIGH**
    *   *Why it fails:* Overwriting deep-frozen array structures throws mutation errors.
    *   *Safest Refactor:* Standardize via `await learnerProfileRepository.syncMasteredSkills(userId, masteredSkills)`.
    *   *Blocks Phase 2:* **Yes.**

### 5. [momentumService.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/momentumService.js) (Streak Engine)
*   **Line 289:** `progress.streak = streak; await progress.save();`
    *   *Severity:* **HIGH**
    *   *Why it fails:* Assignment exception on streak count update.
    *   *Safest Refactor:* `await userProgressRepository.updateStreak(userId, streak)`.
    *   *Blocks Phase 2:* **Yes.**

### 6. [hiringReadinessEngine.js](file:///d:/backup/FreeCourseApp/ai-learning-platform/backend/src/services/hiringReadinessEngine.js) (Analytics Service)
*   **Line 151:** `userProgress.hiringReadiness = score; await userProgress.save();`
    *   *Severity:* **HIGH**
    *   *Why it fails:* Read-only property throw.
    *   *Safest Refactor:* `await userProgressRepository.updateHiringReadiness(userId, score)`.
    *   *Blocks Phase 2:* **Yes.**

---

## 🏛️ Phase 2 Safety Classification

To guarantee absolute operational stability, we group repositories and backing services into three risk levels:

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│     SAFE FOR POJO MIGRATION     │   │     NEEDS PARTIAL REFACTOR      │   │   BLOCKED BY MUTATION COUPLING  │
├─────────────────────────────────┤   ├─────────────────────────────────┤   ├─────────────────────────────────┤
│ • RoleTaxonomyRepository        │   │ • UserRepository                │   │ • LearnerProfileRepository      │
│ • AchievementRepository         │   │   (Couple passport saves)       │   │ • UserProgressRepository        │
│                                 │   │                                 │   │ • MissionRepository             │
│                                 │   │                                 │   │ • PkgRepository                 │
└─────────────────────────────────┘   └─────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 🛡️ recommended Migration Strategy & Ordering

We must **never** run a big-bang refactoring. To decouple safely, we recommend the following sequence:

### 1. Repositories Migration Path (Least Complex First)
1.  **Step 1:** Migrate `RoleTaxonomyRepository` and `AchievementRepository` to return frozen POJOs. (Low mutation footprint).
2.  **Step 2:** Refactor Passport auth document assignments, then migrate `UserRepository`.
3.  **Step 3:** Refactor Portfolio controller mutations, then migrate `LearnerProfileRepository`.
4.  **Step 4:** Refactor streak, synchronization, and score mutations, then migrate `UserProgressRepository` and `MissionRepository`.
5.  **Step 5:** Refactor personalization state pushes, then migrate `PkgRepository` last.

### 2. Freeze Strategy: Soft Migration Mode (Highly Recommended)
> [!IMPORTANT]
> **Why Soft Migration is Required:** Deep-freezing entities immediately on Day 1 is too high-risk for a live system. Instead, we must implement a **Soft Migration Adapter Mode**.
> Repositories will return POJOs by default. However, adapters will attach a fallback proxy wrapper to POJOs: if calling code attempts to invoke Mongoose methods (like `.save()`), the adapter warns in console logs but routes the write safely in the background, preventing runtime HTTP crashes while exposing leak sources!

---

## 🧪 Safe Rollout Recommendation

We recommend splitting Phase 2 into two sub-phases:
*   **Phase 2A:** Normalizing repository returns to POJOs, returning plain JS objects mapped via `UserMapper` and `LearnerProfileMapper` but **without** active `Object.freeze` locks.
*   **Phase 2B:** Systematically refactoring direct `.save()` mutations in services into domain repository operations. Once a service is refactored, we turn on the strict freeze boundary (`Object.freeze`) for that repository!
