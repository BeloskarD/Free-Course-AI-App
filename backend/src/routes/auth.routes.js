import express from 'express';
import passport from '../config/passport.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { 
    register, 
    login, 
    socialCallback, 
    socialError, 
    exchangeOAuthCode,
    changePassword 
} from '../controllers/auth.controller.js';

const router = express.Router();

// ─── Local Auth ───
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], login);

router.post('/exchange-code', exchangeOAuthCode);

// ─── Google OAuth ───
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/api/auth/social-error' }),
    socialCallback
);

// ─── GitHub OAuth ───
router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
);
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/api/auth/social-error' }),
    socialCallback
);

// ─── Twitter OAuth ───
router.get('/twitter',
    passport.authenticate('twitter', { session: false })
);
router.get('/twitter/callback',
    passport.authenticate('twitter', { session: false, failureRedirect: '/api/auth/social-error' }),
    socialCallback
);

// ─── Error route ───
router.get('/social-error', socialError);

// ─── Change Password ───
router.post('/change-password', authenticate, changePassword);

// ─── Check which providers are configured ───
router.get('/providers', (req, res) => {
    res.json({
        providers: {
            google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
            twitter: !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET),
        }
    });
});

export default router;
