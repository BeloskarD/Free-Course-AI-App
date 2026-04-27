import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

// ============================================
// PROFILE MANAGEMENT ROUTES
// ============================================

router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, userController.updateProfile);
router.put("/profile/password", authenticate, userController.changePassword);
router.put("/profile/preferences", authenticate, userController.updatePreferences);

// ============================================
// FAVORITES (SAVED COURSES)
// ============================================

router.get("/favorites", authenticate, userController.getFavorites);
router.post("/favorites", authenticate, userController.addFavorite);
router.delete("/favorites/:courseId", authenticate, userController.removeFavorite);

// ============================================
// SAVED ANALYSES
// ============================================

router.post("/save-analysis", authenticate, userController.saveAnalysis);
router.get("/saved-analyses", authenticate, userController.getSavedAnalyses);
router.delete("/saved-analyses/:role", authenticate, userController.deleteAnalysis);

export default router;
