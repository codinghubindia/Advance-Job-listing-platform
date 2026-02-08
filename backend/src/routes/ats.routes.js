const express = require('express');
const multer = require('multer');
const path = require('path');
const atsController = require('../controllers/ats.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireApprovedHR, requireRole } = require('../middleware/role.middleware');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Routes

/**
 * JOB MANAGEMENT ROUTES (HR/Admin only)
 */

/**
 * POST /api/ats/jobs
 * Create a new job posting
 * Requires HR (approved) or Admin role
 */
router.post('/jobs', authenticate, requireRole('hr_approved', 'admin'), atsController.createJob);

/**
 * GET /api/ats/jobs
 * Get all jobs (public for candidates to view)
 */
router.get('/jobs', atsController.getAllJobs);

/**
 * GET /api/ats/jobs/:jobId
 * Get specific job details (public)
 */
router.get('/jobs/:jobId', atsController.getJobById);

/**
 * PUT /api/ats/jobs/:jobId
 * Update job posting
 * Requires HR (approved) or Admin role
 */
router.put('/jobs/:jobId', authenticate, requireRole('hr_approved', 'admin'), atsController.updateJob);

/**
 * DELETE /api/ats/jobs/:jobId
 * Delete job posting
 * Requires HR (approved) or Admin role (must be job creator)
 */
router.delete('/jobs/:jobId', authenticate, requireRole('hr_approved', 'admin'), atsController.deleteJob);

/**
 * APPLICATION ROUTES (Candidates)
 */

/**
 * POST /api/ats/jobs/:jobId/apply
 * Apply for a job by uploading resume
 * Requires authentication (candidate role)
 * 
 * Body (multipart/form-data):
 * - resume: file (PDF, DOC, DOCX, TXT)
 */
router.post('/jobs/:jobId/apply', authenticate, requireRole('candidate'), upload.single('resume'), atsController.applyForJob);

/**
 * GET /api/ats/jobs/:jobId/applications
 * Get all applications/scores for a specific job
 * Requires HR (approved) or Admin role
 * 
 * Query params:
 * - minScore: number (optional) - Filter by minimum match score
 * - emailSent: boolean (optional) - Filter by email sent status
 */
router.get('/jobs/:jobId/applications', authenticate, requireRole('hr_approved', 'admin'), atsController.getJobApplications);

/**
 * GET /api/ats/jobs/:jobId/top-candidates
 * Get top candidates for a specific job
 * Requires HR (approved) or Admin role
 * 
 * Query params:
 * - limit: number (optional, default: 10) - Number of top candidates
 */
router.get('/jobs/:jobId/top-candidates', authenticate, requireRole('hr_approved', 'admin'), atsController.getTopCandidates);

/**
 * GET /api/ats/my-applications
 * Get candidate's own applications
 * Requires authentication (candidate role)
 */
router.get('/my-applications', authenticate, requireRole('candidate'), atsController.getMyApplications);

/**
 * GET /api/ats/applications/:applicationId
 * Get application details by ID
 * Requires authentication (HR/Admin to view any, Candidate to view own)
 */
router.get('/applications/:applicationId', authenticate, atsController.getApplication);

/**
 * DELETE /api/ats/applications/:applicationId
 * Delete an application and its associated scores
 * Requires Admin role only
 */
router.delete('/applications/:applicationId', authenticate, requireRole('admin'), atsController.deleteApplication);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ATS Score Engine API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
