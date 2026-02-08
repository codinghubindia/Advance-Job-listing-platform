const supabase = require('../config/supabase');
const userModel = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token from Supabase Auth and attaches user to request
 */

/**
 * Authenticate user by verifying JWT token
 * Adds user object to req.user if valid
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
      });
    }

    try {
      // Use Supabase to verify the token (handles ES256 and HS256)
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        logger.warn('Supabase token verification failed:', error?.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
      }

      // Fetch user profile from database to get the correct role
      const profile = await userModel.getUserProfileById(user.id);

      if (!profile) {
        logger.warn('Profile not found for authenticated user:', user.email);
        return res.status(401).json({
          success: false,
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND',
        });
      }

      // Use role from database profile, not JWT metadata
      req.user = {
        id: user.id,
        email: user.email,
        role: profile.role, // Get role from database
        aud: user.aud,
      };

      logger.info(`User authenticated: ${req.user.email} (${req.user.role})`);
      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed:', jwtError.message);

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error',
    });
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token
 * Useful for endpoints that work differently for authenticated users
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      // Use Supabase to verify the token
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        req.user = null;
        return next();
      }

      // Fetch user profile from database to get the correct role
      const profile = await userModel.getUserProfileById(user.id);

      if (!profile) {
        req.user = null;
        return next();
      }

      // Extract user information with role from database
      req.user = {
        id: user.id,
        email: user.email,
        role: profile.role, // Get role from database
      };

      logger.info(`Optional auth - User: ${req.user.email} (${req.user.role})`);
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Refresh token validation
 * For endpoints that require a fresh token
 */
const requireFreshToken = (maxAgeSeconds = 3600) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - (req.user.exp - 3600); // Assuming 1 hour token lifetime

    if (tokenAge > maxAgeSeconds) {
      return res.status(401).json({
        success: false,
        error: 'Token is too old, please refresh',
        code: 'TOKEN_TOO_OLD',
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireFreshToken,
};
