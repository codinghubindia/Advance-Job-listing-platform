const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Parse resume using external Resume Parser API
 * @param {string} resumeUrl - URL of the resume to parse
 * @returns {Promise<object>} Parsed resume data
 */
const parseResume = async (resumeUrl) => {
  try {
    const apiKey = process.env.PARSER_API_KEY;
    const endpoint = process.env.PARSER_ENDPOINT;

    if (!apiKey || !endpoint) {
      throw new Error('PARSER_API_KEY and PARSER_ENDPOINT must be configured');
    }

    logger.info(`Parsing resume from URL: ${resumeUrl}`);

    // Call external parser API - GET request with URL as query parameter
    const response = await axios.get(
      `${endpoint}?url=${encodeURIComponent(resumeUrl)}`,
      {
        headers: {
          'apikey': apiKey,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (!response.data) {
      throw new Error('Empty response from parser API');
    }

    logger.info('Resume parsed successfully');

    // Normalize the parsed data structure
    const parsedData = normalizeParserResponse(response.data);
    return parsedData;
  } catch (error) {
    logger.error('Resume parsing failed:', error.message);
    
    if (error.response) {
      logger.error('Parser API error response:', {
        status: error.response.status,
        data: error.response.data,
      });
      throw new Error(`Parser API error: ${error.response.status} - ${error.response.statusText}`);
    }
    
    throw new Error(`Resume parsing failed: ${error.message}`);
  }
};

/**
 * Normalize parser response to standard format
 * Different parser APIs may return different structures
 * @param {object} data - Raw parser response
 * @returns {object} Normalized resume data
 */
const normalizeParserResponse = (data) => {
  // This is a generic normalization - adjust based on your actual parser API
  return {
    personalInfo: {
      name: data.name || data.full_name || '',
      email: data.email || '',
      phone: data.phone || data.phone_number || '',
      location: data.location || data.address || '',
      linkedin: data.linkedin || data.social_links?.linkedin || '',
      portfolio: data.portfolio || data.website || '',
    },
    summary: data.summary || data.objective || '',
    experience: Array.isArray(data.experience) ? data.experience.map((exp) => ({
      title: exp.title || exp.position || '',
      company: exp.company || exp.organization || '',
      location: exp.location || '',
      startDate: exp.start_date || exp.from || '',
      endDate: exp.end_date || exp.to || '',
      description: exp.description || exp.responsibilities || '',
      duration: exp.duration || '',
    })) : [],
    education: Array.isArray(data.education) ? data.education.map((edu) => ({
      degree: edu.degree || edu.qualification || '',
      institution: edu.institution || edu.school || edu.university || '',
      location: edu.location || '',
      graduationDate: edu.graduation_date || edu.year || '',
      gpa: edu.gpa || '',
    })) : [],
    skills: {
      technical: data.skills?.technical || data.technical_skills || [],
      soft: data.skills?.soft || data.soft_skills || [],
      all: data.skills || [],
    },
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    languages: Array.isArray(data.languages) ? data.languages : [],
    totalExperience: data.total_experience || data.years_of_experience || '',
    rawData: data, // Keep original data for reference
  };
};

/**
 * Extract key skills from parsed resume
 * @param {object} parsedResume - Normalized resume data
 * @returns {array} List of skills
 */
const extractSkills = (parsedResume) => {
  const skills = [];

  if (parsedResume.skills?.technical) {
    skills.push(...parsedResume.skills.technical);
  }
  if (parsedResume.skills?.all) {
    skills.push(...parsedResume.skills.all);
  }

  // Remove duplicates and empty values
  return [...new Set(skills.filter((skill) => skill && skill.trim()))];
};

/**
 * Calculate years of experience from parsed resume
 * @param {object} parsedResume - Normalized resume data
 * @returns {number} Total years of experience
 */
const calculateExperience = (parsedResume) => {
  if (parsedResume.totalExperience) {
    const match = parsedResume.totalExperience.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Calculate from experience array
  let totalMonths = 0;
  if (Array.isArray(parsedResume.experience)) {
    parsedResume.experience.forEach((exp) => {
      if (exp.duration) {
        const match = exp.duration.match(/(\d+)/);
        if (match) {
          totalMonths += parseInt(match[1], 10);
        }
      }
    });
  }

  return Math.floor(totalMonths / 12);
};

module.exports = {
  parseResume,
  normalizeParserResponse,
  extractSkills,
  calculateExperience,
};
