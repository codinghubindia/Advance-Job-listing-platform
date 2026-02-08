const { uploadFile } = require('../config/cloudinary');
const { parseResume } = require('../services/resumeParser.service');
const { calculateATSScore } = require('../services/atsScoring.service');
const { sendHRNotification, sendCandidateConfirmation } = require('../services/email.service');
const atsModel = require('../models/ats.model');
const jobsModel = require('../models/jobs.model');
const logger = require('../utils/logger');
const fs = require('fs').promises;

/**
 * ATS Controller - Job Management and Applications
 */

/**
 * Create a new job posting (HR/Admin only)
 */
const createJob = async (req, res) => {
  try {
    const { title, description, requirements, companyId, location, salaryRange, employmentType, closingDate } = req.body;
    const userId = req.user.id; // HR user creating the job

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required',
      });
    }

    // Generate unique jobId
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Get HR user's details for contact
    const hrEmail = req.user.email;
    const hrName = req.user.fullName || req.user.email;
    const companyIdToUse = companyId || req.user.companyId;

    // Create or update job
    const job = await jobsModel.createOrUpdateJob({
      jobId,
      companyId: companyIdToUse,
      companyName: req.user.companyName || 'Company',
      title,
      description,
      requirements,
      location,
      salaryRange,
      employmentType,
      closingDate,
      hrEmail,
      hrName,
      createdBy: userId,
      status: 'active',
    });

    logger.info(`Job created: ${jobId} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job,
    });
  } catch (error) {
    logger.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
      message: error.message,
    });
  }
};

/**
 * Get all jobs (public - candidates can view)
 */
const getAllJobs = async (req, res) => {
  try {
    const { status = 'active', companyId } = req.query;

    const jobs = await jobsModel.getAllJobs({ status, companyId });

    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: error.message,
    });
  }
};

/**
 * Get specific job by ID (public)
 */
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await jobsModel.getJobByJobId(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
      message: error.message,
    });
  }
};

/**
 * Update job posting (HR/Admin only - must be job creator or admin)
 */
const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing job to check ownership
    const existingJob = await jobsModel.getJobByJobId(jobId);

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if user is the creator or admin
    if (userRole !== 'admin' && existingJob.created_by !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit jobs you created',
      });
    }

    const job = await jobsModel.updateJob(jobId, updates);

    logger.info(`Job updated: ${jobId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
      message: error.message,
    });
  }
};

/**
 * Delete job posting (Must be job creator or admin)
 */
const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get existing job to check ownership
    const existingJob = await jobsModel.getJobByJobId(jobId);

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    // Check if user is the creator or admin
    if (userRole !== 'admin' && existingJob.created_by !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete jobs you created',
      });
    }

    await jobsModel.deleteJob(jobId);

    logger.info(`Job deleted: ${jobId} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job',
      message: error.message,
    });
  }
};

/**
 * Apply for a job (Candidate only)
 * Candidate uploads resume, system scores it automatically
 */
const applyForJob = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded',
      });
    }

    const { jobId } = req.params;
    const candidateUserId = req.user.id;
    const candidateEmail = req.user.email;
    const candidateName = req.user.fullName || req.user.email;

    uploadedFilePath = req.file.path;

    // Get job details
    const job = await jobsModel.getJobByJobId(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This job is no longer accepting applications',
      });
    }

    // Check if candidate already applied
    const existingApplication = await atsModel.getApplicationByUserAndJob(candidateUserId, jobId);
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied for this job',
      });
    }

    logger.info(`Processing application for job ${jobId} from candidate ${candidateUserId}`);

    // Step 1: Upload to Cloudinary
    const cloudinaryResult = await uploadFile(uploadedFilePath);
    const resumeUrl = cloudinaryResult.secure_url;

    logger.info('Resume uploaded to Cloudinary:', resumeUrl);

    // Step 2: Parse resume using the Cloudinary URL
    const parsedData = await parseResume(resumeUrl);

    logger.info('Resume parsed successfully');

    // Step 3: Store resume in database
    const resume = await atsModel.createResume({
      jobId,
      candidateUserId,
      cloudinaryUrl: resumeUrl,
      parsedData: parsedData,
    });

    logger.info(`Resume stored with ID: ${resume.id}`);

    // Step 4: Calculate ATS score using LLM
    const scoringResult = await calculateATSScore(parsedData, job.description);

    logger.info('ATS score calculated:', scoringResult.match_score);

    // Step 5: Store ATS score
    const atsScore = await atsModel.createATSScore({
      resumeId: resume.id,
      jobId: job.job_id,
      matchScore: scoringResult.match_score,
      shortlistProbability: scoringResult.shortlist_probability,
      salaryRange: scoringResult.salary_range,
      missingSkills: scoringResult.missing_skills,
      strongSkills: scoringResult.strong_skills,
      recommendation: scoringResult.recommendation,
      keyHighlights: scoringResult.key_highlights,
      areasOfConcern: scoringResult.areas_of_concern,
    });

    logger.info(`ATS score stored with ID: ${atsScore.id}`);

    // Step 6: Send notification emails
    let emailSent = false;

    try {
      // Notify HR if score is high (>= 80)
      if (scoringResult.match_score >= 80) {
        await sendHRNotification({
          hrEmail: job.hr_email,
          hrName: job.hr_name,
          jobId: job.job_id,
          jobTitle: job.title,
          candidateName,
          candidateEmail,
          matchScore: scoringResult.match_score,
          resumeUrl,
          keyHighlights: scoringResult.key_highlights,
        });

        logger.info(`HR notification sent to ${job.hr_email}`);
      }

      // Send confirmation to candidate
      await sendCandidateConfirmation({
        candidateEmail,
        candidateName,
        jobId: job.job_id,
        jobTitle: job.title,
        companyName: job.company_name || 'the company',
      });

      emailSent = true;
      logger.info(`Candidate confirmation sent to ${candidateEmail}`);

      // Update email sent status
      await atsModel.updateEmailSentStatus(atsScore.id, true);
    } catch (emailError) {
      logger.error('Email notification failed:', emailError);
      // Don't fail the whole request if email fails
    }

    // Step 7: Clean up uploaded file
    try {
      await fs.unlink(uploadedFilePath);
      logger.info('Temporary file cleaned up');
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Step 8: Return response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: atsScore.id,
        resumeId: resume.id,
        jobId: job.job_id,
        jobTitle: job.title,
        matchScore: scoringResult.matchScore,
        shortlistProbability: scoringResult.shortlistProbability,
        salaryRange: scoringResult.salaryRange,
        missingSkills: scoringResult.missingSkills,
        strongSkills: scoringResult.strongSkills,
        recommendation: scoringResult.recommendation,
        keyHighlights: scoringResult.keyHighlights,
        areasOfConcern: scoringResult.areasOfConcern,
        emailSent,
        resumeUrl,
        appliedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error processing application:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temporary file:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process application',
      message: error.message,
    });
  }
};

/**
 * Get all applications for a job (HR/Admin only)
 */
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { minScore, emailSent } = req.query;

    const filters = {};
    if (minScore) filters.minScore = parseInt(minScore);
    if (emailSent !== undefined) filters.emailSent = emailSent === 'true';

    const applications = await atsModel.getScoresByJobId(jobId, filters);

    res.status(200).json({
      success: true,
      data: {
        jobId,
        count: applications.length,
        applications,
      },
    });
  } catch (error) {
    logger.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message,
    });
  }
};

/**
 * Get top candidates for a job (HR/Admin only)
 */
const getTopCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const topCandidates = await atsModel.getTopCandidates(jobId, limit);

    res.status(200).json({
      success: true,
      data: {
        jobId,
        count: topCandidates.length,
        candidates: topCandidates,
      },
    });
  } catch (error) {
    logger.error('Error fetching top candidates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top candidates',
      message: error.message,
    });
  }
};

/**
 * Get candidate's own applications
 */
const getMyApplications = async (req, res) => {
  try {
    const candidateUserId = req.user.id;

    const applications = await atsModel.getApplicationsByUserId(candidateUserId);

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    logger.error('Error fetching my applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message,
    });
  }
};

/**
 * Get application details
 * HR/Admin can view any, Candidate can only view own
 */
const getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const application = await atsModel.getApplicationById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      });
    }

    // Check permissions: candidates can only view their own
    if (userRole === 'candidate' && application.candidate_user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own applications',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    logger.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application',
      message: error.message,
    });
  }
};

/**
 * Delete application (Admin only)
 */
const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    await atsModel.deleteResume(applicationId);

    logger.info(`Application deleted: ${applicationId}`);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application',
      message: error.message,
    });
  }
};

module.exports = {
  // Job management
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  // Applications
  applyForJob,
  getJobApplications,
  getTopCandidates,
  getMyApplications,
  getApplication,
  deleteApplication,
};
