const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Authentication Routes
 */

/**
 * POST /api/auth/register
 * Register a new user
 * 
 * Body:
 * {
 *   email: string,
 *   password: string,
 *   role: 'candidate' | 'hr',
 *   companyName?: string (required for HR),
 *   fullName?: string,
 *   phone?: string
 * }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 * 
 * Body:
 * {
 *   email: string,
 *   password: string
 * }
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Get current user profile
 * Requires authentication
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * PUT /api/auth/profile
 * Update current user profile
 * Requires authentication
 * 
 * Body:
 * {
 *   fullName?: string,
 *   phone?: string
 * }
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * 
 * Body:
 * {
 *   email: string
 * }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/logout
 * Logout current user
 * Requires authentication
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
