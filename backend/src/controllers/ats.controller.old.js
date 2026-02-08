const { uploadFile } = require('../config/cloudinary');
const { parseResume } = require('../services/resumeParser.service');
const { calculateATSScore } = require('../services/atsScoring.service');
const { sendHRNotification, sendCandidateConfirmation } = require('../services/email.service');
const atsModel = require('../models/ats.model');
const jobsModel = require('../models/jobs.model');
const logger = require('../utils/logger');
const fs = require('fs').promises;

/**
 * ATS Controller - Business logic for resume parsing and scoring
 */

/**
 * Parse and score resume endpoint
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const parseAndScore = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded',
      });
    }

    const { jobId, jobDescription, hrEmail, hrName } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required',
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        error: 'jobDescription is required',
      });
    }

    if (!hrEmail) {
      return res.status(400).json({
        success: false,
        error: 'hrEmail is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hrEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hrEmail format',
      });
    }

    uploadedFilePath = req.file.path;
    logger.info(`Processing resume upload for job: ${jobId}`);

    // Step 1: Store/update job information in database
    logger.info('Storing job information...');
    await jobsModel.upsertJob({
      jobId,
      description: jobDescription,
      hrEmail,
      hrName: hrName || null,
    });
    logger.info('Job information stored');

    // Step 2: Upload resume to Cloudinary
    logger.info('Uploading resume to Cloudinary...');
    const cloudinaryResult = await uploadFile(uploadedFilePath, {
      folder: `ats-resumes/${jobId}`,
      resource_type: 'auto',
    });

    const resumeUrl = cloudinaryResult.secure_url;
    logger.info(`Resume uploaded to Cloudinary: ${resumeUrl}`);

    // Step 3: Parse resume using external API
    logger.info('Parsing resume...');
    const parsedResume = await parseResume(resumeUrl);
    logger.info('Resume parsed successfully');

    // Step 4: Store resume in database
    logger.info('Storing resume in database...');
    const resumeRecord = await atsModel.createResume({
      jobId,
      cloudinaryUrl: resumeUrl,
      parsedData: parsedResume,
    });
    logger.info(`Resume stored with ID: ${resumeRecord.id}`);

    // Step 5: Calculate ATS score
    logger.info('Calculating ATS score...');
    const scoringResult = await calculateATSScore(parsedResume, jobDescription);
    logger.info(`ATS score calculated: ${scoringResult.match_score}`);

    // Step 6: Save ATS score to database
    logger.info('Storing ATS score in database...');
    const scoreRecord = await atsModel.createATSScore({
      resumeId: resumeRecord.id,
      jobId,
      matchScore: scoringResult.match_score,
      shortlistProbability: scoringResult.shortlist_probability,
      salaryRange: scoringResult.salary_range,
      missingSkills: scoringResult.missing_skills,
      strongSkills: scoringResult.strong_skills,
      emailSent: false,
    });
    logger.info(`ATS score stored with ID: ${scoreRecord.id}`);

    // Step 7: Send email notification if match score > 80
    let emailSent = false;
    if (scoringResult.match_score > 80) {
      logger.info('High score detected, sending HR notification...');
      try {
        const candidateData = {
          name: parsedResume.personalInfo?.name || 'Unknown',
          email: parsedResume.personalInfo?.email || null,
          phone: parsedResume.personalInfo?.phone || null,
          jobId,
          resumeUrl,
          hrEmail, // Use the HR email specific to this job
          hrName: hrName || 'HR Team',
        };

        const emailResult = await sendHRNotification(candidateData, scoringResult);
        emailSent = emailResult.sent;

        if (emailSent) {
          // Update email sent status in database
          await atsModel.updateEmailSentStatus(scoreRecord.id, true);
          logger.info('HR notification sent and status updated');
        }

        // Optionally send confirmation to candidate
        if (candidateData.email) {
          await sendCandidateConfirmation(candidateData);
        }
      } catch (emailError) {
        logger.error('Email notification failed:', emailError.message);
        // Continue execution even if email fails
      }
    }

    // Step 8: Clean up uploaded file
    try {
      await fs.unlink(uploadedFilePath);
      logger.info('Temporary file cleaned up');
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file:', cleanupError.message);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        resumeId: resumeRecord.id,
        scoreId: scoreRecord.id,
        matchScore: scoringResult.match_score,
        shortlistProbability: scoringResult.shortlist_probability,
        salaryRange: scoringResult.salary_range,
        missingSkills: scoringResult.missing_skills,
        strongSkills: scoringResult.strong_skills,
        recommendation: scoringResult.recommendation,
        keyHighlights: scoringResult.key_highlights,
        areasOfConcern: scoringResult.areas_of_concern,
        emailSent,
        resumeUrl,
      },
    });
  } catch (error) {
    logger.error('Parse and score failed:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary file:', cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get ATS scores for a job
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getJobScores = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { minScore, emailSent } = req.query;

    const filters = {};
    if (minScore) {
      filters.minScore = parseInt(minScore, 10);
    }
    if (emailSent !== undefined) {
      filters.emailSent = emailSent === 'true';
    }

    logger.info(`Fetching ATS scores for job: ${jobId}`);
    const scores = await atsModel.getATSScoresByJobId(jobId, filters);

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        count: scores.length,
        scores,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch job scores:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get top candidates for a job
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getTopCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { limit } = req.query;

    const candidateLimit = limit ? parseInt(limit, 10) : 10;

    logger.info(`Fetching top ${candidateLimit} candidates for job: ${jobId}`);
    const candidates = await atsModel.getTopCandidates(jobId, candidateLimit);

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        count: candidates.length,
        candidates,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch top candidates:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Get resume details
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    logger.info(`Fetching resume: ${resumeId}`);
    const resume = await atsModel.getResumeById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    logger.error('Failed to fetch resume:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

/**
 * Delete resume
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    logger.info(`Deleting resume: ${resumeId}`);
    await atsModel.deleteResume(resumeId);

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete resume:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

module.exports = {
  parseAndScore,
  getJobScores,
  getTopCandidates,
  getResume,
  deleteResume,
};
