const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Jobs Model - Database operations for jobs and companies
 */

/**
 * Create or update a job record
 * @param {object} jobData - Job information
 * @returns {Promise<object>} Created/updated job record
 */
const upsertJob = async (jobData) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .upsert(
        {
          job_id: jobData.jobId,
          company_id: jobData.companyId || null,
          company_name: jobData.companyName || null,
          title: jobData.title || 'Untitled Position',
          description: jobData.description,
          requirements: jobData.requirements || null,
          location: jobData.location || null,
          salary_range: jobData.salaryRange || null,
          employment_type: jobData.employmentType || null,
          closing_date: jobData.closingDate || null,
          hr_email: jobData.hrEmail,
          hr_name: jobData.hrName || null,
          status: jobData.status || 'active',
          created_by: jobData.createdBy || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'job_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Database error upserting job:', error);
      throw error;
    }

    logger.info(`Job upserted in database: ${data.job_id}`);
    return data;
  } catch (error) {
    logger.error('Failed to upsert job record:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get job by job_id
 * @param {string} jobId - Job identifier
 * @returns {Promise<object|null>} Job record or null
 */
const getJobByJobId = async (jobId) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error fetching job:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch job:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get HR email for a job
 * @param {string} jobId - Job identifier
 * @returns {Promise<string|null>} HR email or null
 */
const getHREmailForJob = async (jobId) => {
  try {
    const job = await getJobByJobId(jobId);
    return job ? job.hr_email : null;
  } catch (error) {
    logger.error('Failed to get HR email for job:', error.message);
    return null;
  }
};

/**
 * Get all jobs for a company
 * @param {number} companyId - Company ID
 * @returns {Promise<array>} Array of job records
 */
const getJobsByCompany = async (companyId) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database error fetching jobs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch jobs:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Update job status
 * @param {string} jobId - Job identifier
 * @param {string} status - New status (active, closed, etc.)
 * @returns {Promise<object>} Updated job record
 */
const updateJobStatus = async (jobId, status) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      logger.error('Database error updating job status:', error);
      throw error;
    }

    logger.info(`Job status updated: ${jobId} -> ${status}`);
    return data;
  } catch (error) {
    logger.error('Failed to update job status:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Create a company record
 * @param {object} companyData - Company information
 * @returns {Promise<object>} Created company record
 */
const createCompany = async (companyData) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          name: companyData.name,
          email: companyData.email || null,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('Database error creating company:', error);
      throw error;
    }

    logger.info(`Company created: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (error) {
    logger.error('Failed to create company:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Get all jobs with optional filters
 * @param {object} filters - Filter options (status, companyId)
 * @returns {Promise<array>} Array of job records
 */
const getAllJobs = async (filters = {}) => {
  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Database error fetching all jobs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to fetch all jobs:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Create or update a job (alias for upsertJob with additional fields)
 * @param {object} jobData - Job information
 * @returns {Promise<object>} Created/updated job record
 */
const createOrUpdateJob = async (jobData) => {
  return upsertJob({
    ...jobData,
    createdBy: jobData.createdBy,
    requirements: jobData.requirements,
  });
};

/**
 * Update job
 * @param {string} jobId - Job identifier
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated job record or null
 */
const updateJob = async (jobId, updates) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error('Database error updating job:', error);
      throw error;
    }

    logger.info(`Job updated: ${jobId}`);
    return data;
  } catch (error) {
    logger.error('Failed to update job:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

/**
 * Delete job
 * @param {string} jobId - Job identifier
 * @returns {Promise<boolean>} Success status
 */
const deleteJob = async (jobId) => {
  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('job_id', jobId);

    if (error) {
      logger.error('Database error deleting job:', error);
      throw error;
    }

    logger.info(`Job deleted: ${jobId}`);
    return true;
  } catch (error) {
    logger.error('Failed to delete job:', error.message);
    throw new Error(`Database operation failed: ${error.message}`);
  }
};

module.exports = {
  upsertJob,
  createOrUpdateJob,
  getJobByJobId,
  getAllJobs,
  getHREmailForJob,
  getJobsByCompany,
  updateJob,
  updateJobStatus,
  deleteJob,
  createCompany,
};
