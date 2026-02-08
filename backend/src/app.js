const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const atsRoutes = require('./routes/ats.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ats', atsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ATS Score Engine API',
    version: '2.0.0',
    endpoints: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/profile',
        forgotPassword: 'POST /api/auth/forgot-password',
        logout: 'POST /api/auth/logout',
      },
      admin: {
        hrRequests: 'GET /api/admin/hr-requests',
        approveHR: 'POST /api/admin/hr-requests/:id/approve',
        rejectHR: 'POST /api/admin/hr-requests/:id/reject',
        users: 'GET /api/admin/users',
        dashboard: 'GET /api/admin/dashboard',
      },
      ats: {
        health: '/api/ats/health',
        parseAndScore: 'POST /api/ats/parse-and-score',
        jobScores: 'GET /api/ats/jobs/:jobId/scores',
        topCandidates: 'GET /api/ats/jobs/:jobId/top-candidates',
        resume: 'GET /api/ats/resumes/:resumeId',
        deleteResume: 'DELETE /api/ats/resumes/:resumeId',
      },
    },
    documentation: 'See README.md for full documentation',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Application error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds the 5MB limit',
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

module.exports = app;
