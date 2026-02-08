const logger = require('./logger');

/**
 * Queue Stub - Placeholder for future job queue implementation
 * 
 * In production, replace this with a proper job queue like:
 * - Bull (with Redis)
 * - BullMQ
 * - AWS SQS
 * - RabbitMQ
 * 
 * This stub simulates async job processing for development.
 */

class QueueStub {
  constructor(name = 'default') {
    this.name = name;
    this.jobs = [];
    logger.info(`Queue stub initialized: ${name}`);
  }

  /**
   * Add a job to the queue
   * @param {string} jobName - Name of the job
   * @param {object} data - Job data
   * @param {object} options - Job options (delay, attempts, etc.)
   * @returns {Promise<object>} Job info
   */
  async add(jobName, data, options = {}) {
    const job = {
      id: Date.now().toString(),
      name: jobName,
      data,
      options,
      status: 'pending',
      createdAt: new Date(),
    };

    this.jobs.push(job);
    logger.info(`Job added to queue [${this.name}]: ${jobName}`, { jobId: job.id });

    // Simulate async processing
    if (options.delay) {
      logger.info(`Job delayed by ${options.delay}ms: ${job.id}`);
    }

    return job;
  }

  /**
   * Process jobs (stub implementation)
   * @param {string} jobName - Name of job to process
   * @param {function} processor - Processing function
   */
  process(jobName, processor) {
    logger.info(`Processor registered for job: ${jobName}`);
    
    // In a real queue, this would continuously process jobs
    // For now, we'll just log the registration
    return {
      jobName,
      processor: processor.name || 'anonymous',
    };
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {object|null} Job info
   */
  getJob(jobId) {
    return this.jobs.find((job) => job.id === jobId) || null;
  }

  /**
   * Get all jobs
   * @returns {array} All jobs
   */
  getAllJobs() {
    return this.jobs;
  }

  /**
   * Clear all jobs
   */
  clear() {
    this.jobs = [];
    logger.info(`Queue cleared: ${this.name}`);
  }
}

// Create default queue instances
const emailQueue = new QueueStub('email');
const parsingQueue = new QueueStub('parsing');
const scoringQueue = new QueueStub('scoring');

module.exports = {
  QueueStub,
  emailQueue,
  parsingQueue,
  scoringQueue,
};
