const adminService = require('../services/admin.service');
const logger = require('../utils/logger');

/**
 * Admin Controller - Handles admin operations
 */

/**
 * Get pending HR requests
 * GET /api/admin/hr-requests
 */
const getPendingHRRequests = async (req, res) => {
  try {
    const requests = await adminService.getPendingHRRequests();

    return res.status(200).json({
      success: true,
      data: {
        count: requests.length,
        requests,
      },
    });
  } catch (error) {
    logger.error('Get pending HR requests error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch pending HR requests',
    });
  }
};

/**
 * Get all HR requests with optional filters
 * GET /api/admin/hr-requests/all
 */
const getAllHRRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const requests = await adminService.getAllHRRequests(filters);

    return res.status(200).json({
      success: true,
      data: {
        count: requests.length,
        filters,
        requests,
      },
    });
  } catch (error) {
    logger.error('Get all HR requests error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch HR requests',
    });
  }
};

/**
 * Approve HR request
 * POST /api/admin/hr-requests/:id/approve
 */
const approveHRRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, notes, createCompany } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required',
      });
    }

    const result = await adminService.approveHRRequest(
      parseInt(id, 10),
      req.user.id,
      {
        companyName,
        notes,
        createCompany,
      }
    );

    logger.info(`HR request approved: ${id} by admin ${req.user.email}`);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Approve HR request error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'HR request not found',
      });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to approve HR request',
    });
  }
};

/**
 * Reject HR request
 * POST /api/admin/hr-requests/:id/reject
 */
const rejectHRRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
    }

    const result = await adminService.rejectHRRequest(
      parseInt(id, 10),
      req.user.id,
      reason,
      notes
    );

    logger.info(`HR request rejected: ${id} by admin ${req.user.email}`);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Reject HR request error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'HR request not found',
      });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to reject HR request',
    });
  }
};

/**
 * Get HR request statistics
 * GET /api/admin/hr-requests/stats
 */
const getHRRequestStatistics = async (req, res) => {
  try {
    const stats = await adminService.getHRRequestStatistics();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get HR request statistics error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;

    const users = await adminService.getAllUsers(filters);

    return res.status(200).json({
      success: true,
      data: {
        count: users.length,
        filters,
        users,
      },
    });
  } catch (error) {
    logger.error('Get all users error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
const getUserStatistics = async (req, res) => {
  try {
    const stats = await adminService.getUserStatistics();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get user statistics error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
    });
  }
};

/**
 * Update user role
 * PUT /api/admin/users/:userId/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required',
      });
    }

    const updatedUser = await adminService.updateUserRole(
      userId,
      role,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User role updated successfully',
    });
  } catch (error) {
    logger.error('Update user role error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (error.message.includes('Invalid role')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update user role',
    });
  }
};

/**
 * Suspend user
 * POST /api/admin/users/:userId/suspend
 */
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Suspension reason is required',
      });
    }

    const result = await adminService.suspendUser(
      userId,
      req.user.id,
      reason
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Suspend user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (error.message.includes('Cannot suspend')) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to suspend user',
    });
  }
};

/**
 * Reactivate user
 * POST /api/admin/users/:userId/reactivate
 */
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const result = await adminService.reactivateUser(
      userId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Reactivate user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to reactivate user',
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStatistics();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

module.exports = {
  getPendingHRRequests,
  getAllHRRequests,
  approveHRRequest,
  rejectHRRequest,
  getHRRequestStatistics,
  getAllUsers,
  getUserStatistics,
  updateUserRole,
  suspendUser,
  reactivateUser,
  getDashboard,
};
