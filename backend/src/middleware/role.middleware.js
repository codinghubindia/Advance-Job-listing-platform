const logger = require('../utils/logger');

/**
 * Role-Based Access Control Middleware
 * Controls access to routes based on user roles
 */

/**
 * Check if user has one of the allowed roles
 * @param {string[]} allowedRoles - Array of allowed role names
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Role check failed: User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Check if user has required role
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Role check failed: User ${req.user.email} has role '${userRole}', requires one of [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: userRole,
      });
    }

    logger.info(`Role check passed: User ${req.user.email} has role '${userRole}'`);
    next();
  };
};

/**
 * Require admin role
 * Shortcut for requireRole('admin')
 */
const requireAdmin = requireRole('admin');

/**
 * Require approved HR role
 * Shortcut for requireRole('hr_approved', 'admin')
 */
const requireApprovedHR = requireRole('hr_approved', 'admin');

/**
 * Require any HR role (pending or approved) or admin
 */
const requireAnyHR = requireRole('hr_pending', 'hr_approved', 'admin');

/**
 * Require candidate role
 */
const requireCandidate = requireRole('candidate');

/**
 * Check if user can access resource
 * For endpoints where users can only access their own resources
 * @param {string} userIdParam - Name of the parameter containing the user ID
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const requestedUserId = req.params[userIdParam] || req.body[userIdParam];

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is accessing their own resource
    if (req.user.id !== requestedUserId) {
      logger.warn(`Ownership check failed: User ${req.user.email} tried to access resource of ${requestedUserId}`);
      return res.status(403).json({
        success: false,
        error: 'You can only access your own resources',
        code: 'OWNERSHIP_REQUIRED',
      });
    }

    next();
  };
};

/**
 * Check if user's account status is active
 * Requires user to have been loaded with status field
 */
const requireActiveStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // If status is available and not active, block access
  if (req.user.status && req.user.status !== 'active') {
    logger.warn(`Status check failed: User ${req.user.email} has status '${req.user.status}'`);
    return res.status(403).json({
      success: false,
      error: 'Account is not active',
      code: 'ACCOUNT_INACTIVE',
      status: req.user.status,
    });
  }

  next();
};

/**
 * Rate limiting by role
 * Different rate limits for different roles
 */
const roleBasedRateLimit = {
  candidate: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  hr_pending: { maxRequests: 20, windowMs: 60000 },
  hr_approved: { maxRequests: 100, windowMs: 60000 },
  admin: { maxRequests: 1000, windowMs: 60000 },
};

/**
 * Get rate limit for user's role
 */
const getRateLimitForRole = (role) => {
  return roleBasedRateLimit[role] || roleBasedRateLimit.candidate;
};

/**
 * Middleware to attach rate limit info to response headers
 */
const addRateLimitHeaders = (req, res, next) => {
  if (req.user && req.user.role) {
    const limit = getRateLimitForRole(req.user.role);
    res.setHeader('X-RateLimit-Limit', limit.maxRequests);
    res.setHeader('X-RateLimit-Window', limit.windowMs);
  }
  next();
};

module.exports = {
  requireRole,
  requireAdmin,
  requireApprovedHR,
  requireAnyHR,
  requireCandidate,
  requireOwnership,
  requireActiveStatus,
  getRateLimitForRole,
  addRateLimitHeaders,
};
