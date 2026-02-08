const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

/**
 * Admin Routes
 * All routes require admin role
 */

// Apply authentication and admin role check to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * HR REQUESTS MANAGEMENT
 */

/**
 * GET /api/admin/hr-requests
 * Get all pending HR requests
 */
router.get('/hr-requests', adminController.getPendingHRRequests);

/**
 * GET /api/admin/hr-requests/all
 * Get all HR requests with optional status filter
 * Query params: ?status=pending|approved|rejected
 */
router.get('/hr-requests/all', adminController.getAllHRRequests);

/**
 * GET /api/admin/hr-requests/stats
 * Get HR request statistics
 */
router.get('/hr-requests/stats', adminController.getHRRequestStatistics);

/**
 * POST /api/admin/hr-requests/:id/approve
 * Approve an HR request
 * 
 * Body:
 * {
 *   companyName?: string,
 *   notes?: string,
 *   createCompany?: boolean (default: true)
 * }
 */
router.post('/hr-requests/:id/approve', adminController.approveHRRequest);

/**
 * POST /api/admin/hr-requests/:id/reject
 * Reject an HR request
 * 
 * Body:
 * {
 *   reason: string (required),
 *   notes?: string
 * }
 */
router.post('/hr-requests/:id/reject', adminController.rejectHRRequest);

/**
 * USER MANAGEMENT
 */

/**
 * GET /api/admin/users
 * Get all users with optional filters
 * Query params: ?role=candidate|hr_pending|hr_approved|admin&status=active|suspended|deleted
 */
router.get('/users', adminController.getAllUsers);

/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
router.get('/users/stats', adminController.getUserStatistics);

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 * 
 * Body:
 * {
 *   role: 'candidate' | 'hr_pending' | 'hr_approved' | 'admin'
 * }
 */
router.put('/users/:userId/role', adminController.updateUserRole);

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend user account
 * 
 * Body:
 * {
 *   reason: string (required)
 * }
 */
router.post('/users/:userId/suspend', adminController.suspendUser);

/**
 * POST /api/admin/users/:userId/reactivate
 * Reactivate suspended user account
 */
router.post('/users/:userId/reactivate', adminController.reactivateUser);

/**
 * DASHBOARD
 */

/**
 * GET /api/admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', adminController.getDashboard);

module.exports = router;
