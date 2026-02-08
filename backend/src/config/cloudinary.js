const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Validate configuration
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  logger.error('Missing Cloudinary configuration in environment variables');
  throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set');
}

logger.info('Cloudinary configured successfully');

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path or buffer
 * @param {object} options - Upload options
 * @returns {Promise<object>} Upload result
 */
const uploadFile = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'ats-resumes',
      resource_type: 'auto',
      ...options,
    };

    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    logger.info(`File uploaded to Cloudinary: ${result.secure_url}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary upload failed:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Cloudinary deletion failed:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
};
