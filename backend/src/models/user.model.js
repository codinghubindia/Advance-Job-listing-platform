const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * User Profile Model - Database operations for user profiles
 */

/**
 * Create user profile
 * @param {object} profileData - Profile information
 * @returns {Promise<object>} Created profile record
 */
const createUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .insert([
        {
          id: profileData.id,
          email: profileData.email,
          role: profileData.role,
          full_name: profileData.fullName || null,
          phone: profileData.phone || null,
          company_id: profileData.companyId || null,
          status: profileData.status || 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating user profile:', error);
      throw error;
    }

    logger.info(`User profile created: ${data.email} (${data.role})`);
    return data;
  } catch (error) {
    logger.error('Failed to create user profile:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} User profile or null
 */
const getUserProfileById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch user profile:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get user profile by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User profile or null
 */
const getUserProfileByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching user profile by email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch user profile by email:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Update user profile
 * @param {string} userId - User UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated profile
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const allowedUpdates = {
      full_name: updates.fullName,
      phone: updates.phone,
      company_id: updates.companyId,
      status: updates.status,
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const { data, error } = await supabase
      .from('users_profiles')
      .update(allowedUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Database error updating user profile:', error);
      throw error;
    }

    logger.info(`User profile updated: ${userId}`);
    return data;
  } catch (error) {
    logger.error('Failed to update user profile:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Update user role
 * @param {string} userId - User UUID
 * @param {string} newRole - New role
 * @returns {Promise<object>} Updated profile
 */
const updateUserRole = async (userId, newRole) => {
  try {
    const validRoles = ['candidate', 'hr_pending', 'hr_approved', 'admin'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const { data, error } = await supabase
      .from('users_profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Database error updating user role:', error);
      throw error;
    }

    logger.info(`User role updated: ${userId} -> ${newRole}`);
    return data;
  } catch (error) {
    logger.error('Failed to update user role:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get all users with filters
 * @param {object} filters - Filter criteria
 * @returns {Promise<array>} Array of user profiles
 */
const getAllUsers = async (filters = {}) => {
  try {
    let query = supabase
      .from('users_profiles')
      .select('*');

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Database error fetching users:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch users:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Delete user profile (soft delete by setting status)
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} Success status
 */
const deleteUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .update({ status: 'deleted' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Database error deleting user profile:', error);
      throw error;
    }

    logger.info(`User profile deleted: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete user profile:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get user statistics
 * @returns {Promise<object>} User statistics
 */
const getUserStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .select('role, status');

    if (error) {
      logger.error('Database error fetching user statistics:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      byRole: {},
      byStatus: {},
    };

    data.forEach((user) => {
      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      stats.byStatus[user.status] = (stats.byStatus[user.status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error('Failed to fetch user statistics:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

module.exports = {
  createUserProfile,
  getUserProfileById,
  getUserProfileByEmail,
  updateUserProfile,
  updateUserRole,
  getAllUsers,
  deleteUserProfile,
  getUserStatistics,
};
