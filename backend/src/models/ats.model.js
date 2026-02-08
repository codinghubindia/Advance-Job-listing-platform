const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * ATS Model - Database operations for resumes and ATS scores
 */

/**
 * Create a new resume record
 * @param {object} resumeData - Resume information
 * @returns {Promise<object>} Created resume record
 */
const createResume = async (resumeData) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert([
        {
          job_id: resumeData.jobId,
          candidate_user_id: resumeData.candidateUserId,
          cloudinary_url: resumeData.cloudinaryUrl,
          parsed_data: resumeData.parsedData,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating resume:', error);
      throw error;
    }

    logger.info(`Resume created in database: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Failed to create resume record:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get resume by ID
 * @param {string} resumeId - Resume UUID
 * @returns {Promise<object|null>} Resume record or null
 */
const getResumeById = async (resumeId) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching resume:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch resume:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get resumes by job ID
 * @param {string} jobId - Job identifier
 * @returns {Promise<array>} Array of resume records
 */
const getResumesByJobId = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('job_id', jobId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Database error fetching resumes:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch resumes:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Create ATS score record
 * @param {object} scoreData - ATS score information
 * @returns {Promise<object>} Created score record
 */
const createATSScore = async (scoreData) => {
  try {
    const { data, error } = await supabase
      .from('ats_scores')
      .insert([
        {
          resume_id: scoreData.resumeId,
          job_id: scoreData.jobId,
          match_score: scoreData.matchScore,
          shortlist_probability: scoreData.shortlistProbability,
          salary_range: scoreData.salaryRange,
          missing_skills: scoreData.missingSkills,
          strong_skills: scoreData.strongSkills,
          recommendation: scoreData.recommendation,
          key_highlights: scoreData.keyHighlights,
          areas_of_concern: scoreData.areasOfConcern,
          email_sent: scoreData.emailSent || false,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating ATS score:', error);
      throw error;
    }

    logger.info(`ATS score created in database: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Failed to create ATS score record:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get ATS score by ID
 * @param {string} scoreId - Score UUID
 * @returns {Promise<object|null>} Score record or null
 */
const getATSScoreById = async (scoreId) => {
  try {
    const { data, error } = await supabase
      .from('ats_scores')
      .select('*')
      .eq('id', scoreId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching ATS score:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch ATS score:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get ATS scores by job ID
 * @param {string} jobId - Job identifier
 * @param {object} filters - Optional filters (minScore, emailSent, etc.)
 * @returns {Promise<array>} Array of score records
 */
const getATSScoresByJobId = async (jobId, filters = {}) => {
  try {
    let query = supabase
      .from('ats_scores')
      .select(`
        *,
        resumes (
          cloudinary_url,
          parsed_data,
          uploaded_at
        )
      `)
      .eq('job_id', jobId);

    // Apply filters
    if (filters.minScore) {
      query = query.gte('match_score', filters.minScore);
    }
    if (filters.emailSent !== undefined) {
      query = query.eq('email_sent', filters.emailSent);
    }

    // Order by match score descending
    query = query.order('match_score', { ascending: false });

    const { data, error } = await query;

    if (error) {
      logger.error('Database error fetching ATS scores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch ATS scores:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Update email sent status for ATS score
 * @param {string} scoreId - Score UUID
 * @param {boolean} emailSent - Email sent status
 * @returns {Promise<object>} Updated score record
 */
const updateEmailSentStatus = async (scoreId, emailSent) => {
  try {
    const { data, error } = await supabase
      .from('ats_scores')
      .update({ email_sent: emailSent })
      .eq('id', scoreId)
      .select()
      .single();

    if (error) {
      logger.error('Database error updating email status:', error);
      throw error;
    }

    logger.info(`Email status updated for score: ${scoreId}`);
    return data;
  } catch (error) {
    logger.error('Failed to update email status:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get top candidates for a job
 * @param {string} jobId - Job identifier
 * @param {number} limit - Number of top candidates to retrieve
 * @returns {Promise<array>} Array of top candidate records
 */
const getTopCandidates = async (jobId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('ats_scores')
      .select(`
        *,
        resumes (
          cloudinary_url,
          parsed_data,
          uploaded_at
        )
      `)
      .eq('job_id', jobId)
      .order('match_score', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Database error fetching top candidates:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch top candidates:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Delete resume and associated scores
 * @param {string} resumeId - Resume UUID
 * @returns {Promise<boolean>} Success status
 */
const deleteResume = async (resumeId) => {
  try {
    // Scores will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (error) {
      logger.error('Database error deleting resume:', error);
      throw error;
    }

    logger.info(`Resume deleted: ${resumeId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete resume:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Check if candidate already applied for a job
 * @param {string} userId - Candidate user ID
 * @param {string} jobId - Job ID
 * @returns {Promise<object|null>} Application record or null
 */
const getApplicationByUserAndJob = async (userId, jobId) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('candidate_user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error checking application:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to check application:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get all applications by candidate user ID
 * @param {string} userId - Candidate user ID
 * @returns {Promise<array>} Array of applications with scores
 */
const getApplicationsByUserId = async (userId) => {
  try {
    // First, get all ats_scores with resumes for this user
    const { data: scoresData, error: scoresError } = await supabase
      .from('ats_scores')
      .select(`
        *,
        resumes!inner (
          id,
          job_id,
          cloudinary_url,
          parsed_data,
          uploaded_at,
          candidate_user_id
        )
      `)
      .eq('resumes.candidate_user_id', userId)
      .order('created_at', { ascending: false });

    if (scoresError) {
      logger.error('Database error fetching user applications:', scoresError);
      throw scoresError;
    }

    if (!scoresData || scoresData.length === 0) {
      return [];
    }

    // Extract unique job IDs
    const jobIds = [...new Set(scoresData.map(score => score.resumes.job_id))];

    // Fetch job details for all job IDs
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .in('job_id', jobIds);

    if (jobsError) {
      logger.error('Database error fetching job details:', jobsError);
      // Continue without job details rather than failing completely
    }

    // Create a map of jobs by job_id for quick lookup
    const jobsMap = {};
    if (jobsData) {
      jobsData.forEach(job => {
        jobsMap[job.job_id] = job;
      });
    }

    // Merge job details into scores data
    const mergedData = scoresData.map(score => ({
      ...score,
      job: jobsMap[score.resumes.job_id] || null,
    }));

    return mergedData;
  } catch (error) {
    logger.error('Failed to fetch user applications:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get application by ID (with joined data)
 * @param {number} applicationId - Application/Score ID
 * @returns {Promise<object|null>} Application details or null
 */
const getApplicationById = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('ats_scores')
      .select(`
        *,
        resumes (
          id,
          job_id,
          candidate_user_id,
          cloudinary_url,
          parsed_data,
          uploaded_at
        ),
        jobs (
          job_id,
          title,
          description,
          company_id,
          hr_email,
          hr_name,
          status
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching application:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch application:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

module.exports = {
  createResume,
  getResumeById,
  getResumesByJobId,
  createATSScore,
  getATSScoreById,
  getScoresByJobId: getATSScoresByJobId,
  updateEmailSentStatus,
  getTopCandidates,
  deleteResume,
  // New methods for candidate applications
  getApplicationByUserAndJob,
  getApplicationsByUserId,
  getApplicationById,
};
