const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Calculate ATS score using LLM API
 * @param {object} parsedResume - Parsed resume data
 * @param {string} jobDescription - Job description text
 * @returns {Promise<object>} ATS scoring result
 */
const calculateATSScore = async (parsedResume, jobDescription) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY must be configured in environment variables');
    }

    logger.info('Calculating ATS score using Gemini AI');

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare the prompt for the LLM
    const prompt = buildScoringPrompt(parsedResume, jobDescription);

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info('Gemini AI response received');

    // Extract and parse the LLM response
    const parsedResult = parseGeminiResponse(text);
    logger.info('ATS score calculated successfully', { matchScore: parsedResult.match_score });

    return parsedResult;
  } catch (error) {
    logger.error('ATS scoring failed:', error.message);

    if (error.response) {
      logger.error('Gemini API error response:', {
        status: error.response?.status,
        message: error.message,
      });
    }

    // Return fallback scores if LLM fails
    logger.warn('Using fallback ATS scores due to LLM failure');
    return generateFallbackScore(parsedResume, jobDescription);
  }
};

/**
 * Build prompt for LLM scoring
 * @param {object} parsedResume - Parsed resume data
 * @param {string} jobDescription - Job description
 * @returns {string} Formatted prompt
 */
const buildScoringPrompt = (parsedResume, jobDescription) => {
  const resumeSummary = {
    name: parsedResume.personalInfo?.name || 'Unknown',
    experience: parsedResume.totalExperience || 'Not specified',
    skills: parsedResume.skills?.all || [],
    education: parsedResume.education || [],
    workHistory: parsedResume.experience?.map((exp) => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
    })) || [],
  };

  return `You are an expert ATS (Applicant Tracking System) scoring engine. Analyze the following resume against the job description and provide a detailed scoring analysis.

**Job Description:**
${jobDescription}

**Resume Summary:**
Name: ${resumeSummary.name}
Total Experience: ${resumeSummary.experience}
Skills: ${resumeSummary.skills.join(', ')}
Education: ${JSON.stringify(resumeSummary.education)}
Work History: ${JSON.stringify(resumeSummary.workHistory)}

**Task:**
Analyze the resume and provide a JSON response with the following structure:
{
  "match_score": <integer 0-100>,
  "shortlist_probability": <decimal 0.00-1.00>,
  "salary_range": {
    "min": <integer>,
    "max": <integer>
  },
  "missing_skills": [<array of strings>],
  "strong_skills": [<array of strings>],
  "recommendation": "<string: detailed recommendation>",
  "key_highlights": [<array of strings>],
  "areas_of_concern": [<array of strings>]
}

**Scoring Criteria:**
- match_score: Overall fit (0-100)
- shortlist_probability: Likelihood of shortlisting (0.00-1.00)
- salary_range: Estimated salary based on experience and skills
- missing_skills: Skills mentioned in job description but missing from resume
- strong_skills: Skills from resume that strongly match job requirements
- recommendation: Brief recommendation for hiring decision
- key_highlights: Top 3-5 strengths
- areas_of_concern: Potential weaknesses or gaps

Respond ONLY with valid JSON. Do not include any explanation outside the JSON structure.`;
};

/**
 * Parse Gemini response and extract scoring data
 * @param {string} responseText - Gemini text response
 * @returns {object} Parsed scoring result
 */
const parseGeminiResponse = (responseText) => {
  try {
    if (!responseText) {
      throw new Error('No text content in Gemini response');
    }

    logger.info('Parsing Gemini response...');

    // Remove markdown code blocks if present
    let cleanText = responseText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      match_score: parseInt(parsed.match_score, 10) || 0,
      shortlist_probability: parseFloat(parsed.shortlist_probability) || 0,
      salary_range: {
        min: parseInt(parsed.salary_range?.min, 10) || 0,
        max: parseInt(parsed.salary_range?.max, 10) || 0,
      },
      missing_skills: Array.isArray(parsed.missing_skills) ? parsed.missing_skills : [],
      strong_skills: Array.isArray(parsed.strong_skills) ? parsed.strong_skills : [],
      recommendation: parsed.recommendation || '',
      key_highlights: Array.isArray(parsed.key_highlights) ? parsed.key_highlights : [],
      areas_of_concern: Array.isArray(parsed.areas_of_concern) ? parsed.areas_of_concern : [],
    };
  } catch (error) {
    logger.error('Failed to parse Gemini response:', error.message);
    logger.error('Response text:', responseText?.substring(0, 500));
    throw new Error('Invalid Gemini response format');
  }
};

/**
 * Generate fallback score when LLM is unavailable
 * @param {object} parsedResume - Parsed resume data
 * @param {string} jobDescription - Job description
 * @returns {object} Fallback scoring result
 */
const generateFallbackScore = (parsedResume, jobDescription) => {
  // Simple keyword matching as fallback
  const resumeText = JSON.stringify(parsedResume).toLowerCase();
  const jobText = jobDescription.toLowerCase();
  
  // Extract key skills from job description
  const commonSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws',
    'docker', 'kubernetes', 'git', 'agile', 'rest api', 'mongodb',
  ];

  const foundSkills = commonSkills.filter((skill) => 
    resumeText.includes(skill) && jobText.includes(skill)
  );

  const missingSkills = commonSkills.filter((skill) => 
    jobText.includes(skill) && !resumeText.includes(skill)
  );

  // Calculate basic match score
  const matchScore = Math.min(100, Math.round((foundSkills.length / Math.max(commonSkills.filter((s) => jobText.includes(s)).length, 1)) * 100));

  return {
    match_score: matchScore,
    shortlist_probability: matchScore / 100,
    salary_range: {
      min: 60000,
      max: 100000,
    },
    missing_skills: missingSkills.slice(0, 5),
    strong_skills: foundSkills.slice(0, 5),
    recommendation: 'Fallback scoring used - manual review recommended',
    key_highlights: ['Automated scoring unavailable'],
    areas_of_concern: ['LLM scoring service unavailable'],
  };
};

module.exports = {
  calculateATSScore,
  buildScoringPrompt,
  parseGeminiResponse,
  generateFallbackScore,
};