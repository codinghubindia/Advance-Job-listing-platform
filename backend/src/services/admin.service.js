const userModel = require('../models/user.model');
const hrRequestModel = require('../models/hrRequest.model');
const jobsModel = require('../models/jobs.model');
const logger = require('../utils/logger');

/**
 * Admin Service - Handles admin operations and HR approval workflow
 */

/**
 * Transform HR request data for frontend
 * @param {object} request - Raw HR request from database
 * @returns {object} Transformed HR request
 */
const transformHRRequest = (request) => {
  return {
    id: request.id,
    userId: request.user_id,
    userEmail: request.user?.email || '',
    userName: request.user?.full_name || '',
    companyName: request.company_name,
    companyDomain: request.company_domain,
    jobTitle: request.job_title,
    phone: request.phone,
    message: request.message,
    status: request.status,
    requestedAt: request.created_at,
    reviewedAt: request.reviewed_at,
    reviewedBy: request.reviewer?.email || null,
    rejectionReason: request.rejection_reason,
    adminNotes: request.notes,
  };
};

/**
 * Get all pending HR requests
 * @returns {Promise<array>} Pending HR requests
 */
const getPendingHRRequests = async () => {
  try {
    const requests = await hrRequestModel.getAllHRRequests({ status: 'pending' });
    logger.info(`Retrieved ${requests.length} pending HR requests`);
    return requests.map(transformHRRequest);
  } catch (error) {
    logger.error('Error fetching pending HR requests:', error);
    throw error;
  }
};

/**
 * Get all HR requests (with optional filters)
 * @param {object} filters - Filter criteria
 * @returns {Promise<array>} HR requests
 */
const getAllHRRequests = async (filters = {}) => {
  try {
    const requests = await hrRequestModel.getAllHRRequests(filters);
    logger.info(`Retrieved ${requests.length} HR requests`);
    return requests.map(transformHRRequest);
  } catch (error) {
    logger.error('Error fetching HR requests:', error);
    throw error;
  }
};

/**
 * Approve HR request
 * @param {number} requestId - HR request ID
 * @param {string} adminId - Admin user ID
 * @param {object} approvalData - Optional approval data (companyName, notes)
 * @returns {Promise<object>} Approval result
 */
const approveHRRequest = async (requestId, adminId, approvalData = {}) => {
  try {
    // Get the HR request
    const request = await hrRequestModel.getHRRequestById(requestId);

    if (!request) {
      throw new Error('HR request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`HR request is already ${request.status}`);
    }

    // Update HR request status to approved
    const updatedRequest = await hrRequestModel.approveHRRequest(
      requestId,
      adminId,
      approvalData.notes || null
    );

    // Update user role to hr_approved
    await userModel.updateUserRole(request.user_id, 'hr_approved');
    logger.info(`User role updated to hr_approved: ${request.user_id}`);

    // Optionally create company if provided
    let company = null;
    if (approvalData.createCompany !== false) {
      try {
        company = await jobsModel.createCompany({
          name: approvalData.companyName || request.company_name,
          email: request.user?.email || null,
        });

        // Link user to company
        await userModel.updateUserProfile(request.user_id, {
          companyId: company.id,
        });

        logger.info(`Company created and linked: ${company.name} (ID: ${company.id})`);
      } catch (companyError) {
        logger.warn('Failed to create company:', companyError.message);
        // Continue even if company creation fails
      }
    }

    logger.info(`HR request approved: ${requestId} by admin ${adminId}`);

    return {
      request: updatedRequest,
      userRoleUpdated: true,
      company,
      message: 'HR request approved successfully. User can now create jobs.',
    };
  } catch (error) {
    logger.error('Error approving HR request:', error);
    throw error;
  }
};

/**
 * Reject HR request
 * @param {number} requestId - HR request ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Rejection reason
 * @param {string} notes - Optional notes
 * @returns {Promise<object>} Rejection result
 */
const rejectHRRequest = async (requestId, adminId, reason, notes = null) => {
  try {
    // Get the HR request
    const request = await hrRequestModel.getHRRequestById(requestId);

    if (!request) {
      throw new Error('HR request not found');
    }

    if (request.status !== 'pending') {
      throw new Error(`HR request is already ${request.status}`);
    }

    if (!reason) {
      throw new Error('Rejection reason is required');
    }

    // Update HR request status to rejected
    const updatedRequest = await hrRequestModel.rejectHRRequest(
      requestId,
      adminId,
      reason,
      notes
    );

    logger.info(`HR request rejected: ${requestId} by admin ${adminId}`);

    return {
      request: updatedRequest,
      message: 'HR request rejected',
    };
  } catch (error) {
    logger.error('Error rejecting HR request:', error);
    throw error;
  }
};

/**
 * Get HR request statistics
 * @returns {Promise<object>} Statistics
 */
const getHRRequestStatistics = async () => {
  try {
    const stats = await hrRequestModel.getHRRequestStatistics();
    return stats;
  } catch (error) {
    logger.error('Error fetching HR request statistics:', error);
    throw error;
  }
};

/**
 * Get all users
 * @param {object} filters - Filter criteria
 * @returns {Promise<array>} Users
 */
const getAllUsers = async (filters = {}) => {
  try {
    const users = await userModel.getAllUsers(filters);
    logger.info(`Retrieved ${users.length} users`);
    return users;
  } catch (error) {
    logger.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<object>} User statistics
 */
const getUserStatistics = async () => {
  try {
    const stats = await userModel.getUserStatistics();
    return stats;
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    throw error;
  }
};

/**
 * Update user role (admin only)
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @param {string} adminId - Admin user ID
 * @returns {Promise<object>} Updated user
 */
const updateUserRole = async (userId, newRole, adminId) => {
  try {
    const user = await userModel.getUserProfileById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await userModel.updateUserRole(userId, newRole);
    logger.info(`User role updated by admin: ${userId} -> ${newRole} (by ${adminId})`);

    return updatedUser;
  } catch (error) {
    logger.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Suspend user account
 * @param {string} userId - User ID
 * @param {string} adminId - Admin user ID
 * @param {string} reason - Suspension reason
 * @returns {Promise<object>} Updated user
 */
const suspendUser = async (userId, adminId, reason) => {
  try {
    const user = await userModel.getUserProfileById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      throw new Error('Cannot suspend admin users');
    }

    const updatedUser = await userModel.updateUserProfile(userId, {
      status: 'suspended',
    });

    logger.info(`User suspended: ${userId} by admin ${adminId}. Reason: ${reason}`);

    return {
      user: updatedUser,
      message: 'User account suspended',
    };
  } catch (error) {
    logger.error('Error suspending user:', error);
    throw error;
  }
};

/**
 * Reactivate suspended user
 * @param {string} userId - User ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<object>} Updated user
 */
const reactivateUser = async (userId, adminId) => {
  try {
    const user = await userModel.getUserProfileById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await userModel.updateUserProfile(userId, {
      status: 'active',
    });

    logger.info(`User reactivated: ${userId} by admin ${adminId}`);

    return {
      user: updatedUser,
      message: 'User account reactivated',
    };
  } catch (error) {
    logger.error('Error reactivating user:', error);
    throw error;
  }
};

/**
 * Get system dashboard statistics
 * @returns {Promise<object>} Dashboard statistics
 */
const getDashboardStatistics = async () => {
  try {
    const [userStats, hrRequestStats] = await Promise.all([
      getUserStatistics(),
      getHRRequestStatistics(),
    ]);

    return {
      users: userStats,
      hrRequests: hrRequestStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    throw error;
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
  getDashboardStatistics,
};
