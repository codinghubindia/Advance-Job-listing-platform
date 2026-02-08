const { createClient } = require('@supabase/supabase-js');
const userModel = require('../models/user.model');
const hrRequestModel = require('../models/hrRequest.model');
const logger = require('../utils/logger');

// Create Supabase client for auth operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For client-side operations

/**
 * Auth Service - Handles user authentication and registration
 */

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} User data with token
 */
const register = async (userData) => {
  try {
    const { email, password, role, companyName, fullName, phone } = userData;

    // Validate required fields
    if (!email || !password || !role) {
      throw new Error('Email, password, and role are required');
    }

    // Validate role
    const validRoles = ['candidate', 'hr'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role. Must be "candidate" or "hr"');
    }

    // If HR role, company name is required
    if (role === 'hr' && !companyName) {
      throw new Error('Company name is required for HR registration');
    }

    // Create auth client for signup
    const authClient = createClient(supabaseUrl, supabaseAnonKey || process.env.SUPABASE_SERVICE_KEY);

    // Determine actual role (HR users start as hr_pending)
    const actualRole = role === 'hr' ? 'hr_pending' : 'candidate';

    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: actualRole,
          full_name: fullName || null,
        },
      },
    });

    if (authError) {
      logger.error('Supabase auth signup error:', authError);
      throw new Error(`Registration failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    logger.info(`User registered in Supabase Auth: ${email}`);

    // Create user profile in database
    const profile = await userModel.createUserProfile({
      id: authData.user.id,
      email: authData.user.email,
      role: actualRole,
      fullName: fullName || null,
      phone: phone || null,
      status: 'active',
    });

    // If HR role, create HR request for approval
    if (role === 'hr') {
      await hrRequestModel.createHRRequest({
        userId: authData.user.id,
        companyName,
        phone: phone || null,
        message: `HR registration request for ${companyName}`,
      });

      logger.info(`HR request created for user: ${email}`);
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        companyName: role === 'hr' ? companyName : null,
        status: profile.status,
      },
      token: authData.session?.access_token,
      session: authData.session,
      message: role === 'hr' 
        ? 'Registration successful. Your HR access request is pending admin approval.' 
        : 'Registration successful.',
    };
  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User data with token
 */
const login = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Create auth client for login
    const authClient = createClient(supabaseUrl, supabaseAnonKey || process.env.SUPABASE_SERVICE_KEY);

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.error('Supabase auth login error:', authError);
      throw new Error(`Login failed: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('Login failed');
    }

    logger.info(`User logged in: ${email}`);

    // Get user profile from database
    let profile = await userModel.getUserProfileById(authData.user.id);

    // If profile doesn't exist, create it from auth data (sync issue fix)
    if (!profile) {
      logger.warn(`Profile not found for user ${authData.user.id}, creating from auth data`);
      
      const role = authData.user.user_metadata?.role || 'candidate';
      
      profile = await userModel.createUserProfile({
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        fullName: authData.user.user_metadata?.full_name || null,
        phone: authData.user.user_metadata?.phone || null,
        status: 'active',
      });
      
      logger.info(`Auto-created profile for user: ${email}`);
    }

    // Check if account is active
    if (profile.status !== 'active') {
      throw new Error(`Account is ${profile.status}. Please contact support.`);
    }

    // Get company name if HR user
    let companyName = null;
    if (profile.role === 'hr_pending' || profile.role === 'hr_approved') {
      const hrRequests = await hrRequestModel.getHRRequestsByUserId(authData.user.id);
      if (hrRequests && hrRequests.length > 0) {
        companyName = hrRequests[0].company_name;
      }
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        companyName: companyName,
        companyId: profile.company_id,
        status: profile.status,
      },
      token: authData.session?.access_token,
      session: authData.session,
    };
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Get current user profile
 * @param {string} userId - User ID from JWT
 * @param {string} email - User email from JWT
 * @param {string} role - User role from JWT
 * @returns {Promise<object>} User profile
 */
const getCurrentUser = async (userId, email = null, role = 'candidate') => {
  try {
    let profile = await userModel.getUserProfileById(userId);

    // If profile doesn't exist, create it from JWT data (sync issue fix)
    if (!profile) {
      logger.warn(`Profile not found for user ${userId}, creating from JWT data`);
      
      profile = await userModel.createUserProfile({
        id: userId,
        email: email || 'unknown@temp.com',
        role: role || 'candidate',
        fullName: null,
        phone: null,
        status: 'active',
      });
      
      logger.info(`Auto-created profile for user: ${email}`);
    }

    // Get company name if HR user
    let companyName = null;
    let hrRequests = [];
    if (profile.role === 'hr_pending' || profile.role === 'hr_approved') {
      hrRequests = await hrRequestModel.getHRRequestsByUserId(userId);
      if (hrRequests && hrRequests.length > 0) {
        companyName = hrRequests[0].company_name;
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      phone: profile.phone,
      companyName: companyName,
      companyId: profile.company_id,
      status: profile.status,
      createdAt: profile.created_at,
      hrRequests,
    };
  } catch (error) {
    logger.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} Updated profile
 */
const updateProfile = async (userId, updates) => {
  try {
    const profile = await userModel.updateUserProfile(userId, updates);

    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      phone: profile.phone,
      companyId: profile.company_id,
      status: profile.status,
    };
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<object>} Reset result
 */
const requestPasswordReset = async (email) => {
  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey || process.env.SUPABASE_SERVICE_KEY);

    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      logger.error('Password reset request error:', error);
      throw new Error(`Password reset failed: ${error.message}`);
    }

    logger.info(`Password reset requested for: ${email}`);

    return {
      message: 'Password reset email sent',
    };
  } catch (error) {
    logger.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Logout user (client-side operation, but we can log it)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Logout result
 */
const logout = async (userId) => {
  try {
    logger.info(`User logged out: ${userId}`);

    return {
      message: 'Logged out successfully',
    };
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  requestPasswordReset,
  logout,
};
