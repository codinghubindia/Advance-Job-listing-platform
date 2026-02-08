const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Auth Controller - Handles authentication requests
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, role, companyName, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and role are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    const result = await authService.register({
      email,
      password,
      role,
      companyName,
      fullName,
      phone,
    });

    logger.info(`User registered successfully: ${email}`);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Register controller error:', error);

    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    logger.info(`User logged in successfully: ${email}`);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Login controller error:', error);

    if (error.message.includes('Invalid') || error.message.includes('not found')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    if (error.message.includes('suspended') || error.message.includes('deleted')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires authentication
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const profile = await authService.getCurrentUser(req.user.id, req.user.email, req.user.role);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 * Requires authentication
 */
const updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const { fullName, phone } = req.body;

    const updatedProfile = await authService.updateProfile(req.user.id, {
      fullName,
      phone,
    });

    logger.info(`Profile updated: ${req.user.email}`);

    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Update profile error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const result = await authService.requestPasswordReset(email);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Forgot password error:', error);

    // Always return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * Requires authentication
 */
const logout = async (req, res) => {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  forgotPassword,
  logout,
};
