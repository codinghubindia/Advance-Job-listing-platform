const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * HR Requests Model - Database operations for HR approval workflow
 */

/**
 * Create HR request
 * @param {object} requestData - HR request information
 * @returns {Promise<object>} Created request record
 */
const createHRRequest = async (requestData) => {
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .insert([
        {
          user_id: requestData.userId,
          company_name: requestData.companyName,
          company_domain: requestData.companyDomain || null,
          job_title: requestData.jobTitle || null,
          phone: requestData.phone || null,
          message: requestData.message || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating HR request:', error);
      throw error;
    }

    logger.info(`HR request created for user: ${requestData.userId}`);
    return data;
  } catch (error) {
    logger.error('Failed to create HR request:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get HR request by ID
 * @param {number} requestId - Request ID
 * @returns {Promise<object|null>} HR request or null
 */
const getHRRequestById = async (requestId) => {
  try {
    const { data, error} = await supabase
      .from('hr_requests')
      .select(`
        *,
        user:users_profiles!hr_requests_user_id_fkey(id, email, full_name),
        reviewer:users_profiles!hr_requests_reviewed_by_fkey(id, email, full_name)
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching HR request:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch HR request:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get all HR requests with filters
 * @param {object} filters - Filter criteria
 * @returns {Promise<array>} Array of HR requests
 */
const getAllHRRequests = async (filters = {}) => {
  try {
    let query = supabase
      .from('hr_requests')
      .select(`
        *,
        user:users_profiles!hr_requests_user_id_fkey(id, email, full_name, phone),
        reviewer:users_profiles!hr_requests_reviewed_by_fkey(id, email, full_name)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Database error fetching HR requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch HR requests:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Approve HR request
 * @param {number} requestId - Request ID
 * @param {string} reviewerId - Admin user ID who approved
 * @param {string} notes - Optional notes
 * @returns {Promise<object>} Updated request
 */
const approveHRRequest = async (requestId, reviewerId, notes = null) => {
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        notes,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      logger.error('Database error approving HR request:', error);
      throw error;
    }

    logger.info(`HR request approved: ${requestId} by ${reviewerId}`);
    return data;
  } catch (error) {
    logger.error('Failed to approve HR request:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Reject HR request
 * @param {number} requestId - Request ID
 * @param {string} reviewerId - Admin user ID who rejected
 * @param {string} rejectionReason - Reason for rejection
 * @param {string} notes - Optional notes
 * @returns {Promise<object>} Updated request
 */
const rejectHRRequest = async (requestId, reviewerId, rejectionReason, notes = null) => {
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
        notes,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      logger.error('Database error rejecting HR request:', error);
      throw error;
    }

    logger.info(`HR request rejected: ${requestId} by ${reviewerId}`);
    return data;
  } catch (error) {
    logger.error('Failed to reject HR request:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get HR requests for a specific user
 * @param {string} userId - User UUID
 * @returns {Promise<array>} User's HR requests
 */
const getHRRequestsByUserId = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database error fetching user HR requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch user HR requests:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get HR request statistics
 * @returns {Promise<object>} Statistics
 */
const getHRRequestStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('hr_requests')
      .select('status');

    if (error) {
      logger.error('Database error fetching HR request statistics:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    data.forEach((request) => {
      stats[request.status] = (stats[request.status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error('Failed to fetch HR request statistics:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

module.exports = {
  createHRRequest,
  getHRRequestById,
  getAllHRRequests,
  approveHRRequest,
  rejectHRRequest,
  getHRRequestsByUserId,
  getHRRequestStatistics,
};
