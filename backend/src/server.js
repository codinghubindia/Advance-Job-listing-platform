require('dotenv').config();

// Wrap in try-catch to see startup errors
try {
  const app = require('./app');
  const logger = require('./utils/logger');
  const fs = require('fs');
  const path = require('path');

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'PARSER_API_KEY',
  'PARSER_ENDPOINT',
  'GEMINI_API_KEY',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars);
  logger.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Create necessary directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');

[uploadsDir, logsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Server configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info('='.repeat(60));
  logger.info(`🚀 ATS Score Engine API Server Started`);
  logger.info('='.repeat(60));
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Server running at: http://${HOST}:${PORT}`);
  logger.info(`Health check: http://${HOST}:${PORT}/api/ats/health`);
  logger.info('='.repeat(60));
  logger.info('Available Endpoints:');
  logger.info(`  POST   /api/ats/parse-and-score`);
  logger.info(`  GET    /api/ats/jobs/:jobId/scores`);
  logger.info(`  GET    /api/ats/jobs/:jobId/top-candidates`);
  logger.info(`  GET    /api/ats/resumes/:resumeId`);
  logger.info(`  DELETE /api/ats/resumes/:resumeId`);
  logger.info(`  GET    /api/ats/health`);
  logger.info('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('Server closed. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = server;

} catch (error) {
  console.error('STARTUP ERROR:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
