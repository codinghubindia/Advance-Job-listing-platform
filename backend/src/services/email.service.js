const { sendEmail } = require('../config/mailer');
const logger = require('../utils/logger');

/**
 * Send notification email to HR for high-scoring candidates
 * @param {object} data - Complete notification data
 * @returns {Promise<object>} Email send result
 */
const sendHRNotification = async (data) => {
  try {
    const hrEmail = data.hrEmail;

    if (!hrEmail) {
      logger.warn('HR email not provided for this job, skipping email notification');
      return { sent: false, reason: 'HR email not provided' };
    }

    logger.info(`Sending HR notification to: ${hrEmail} for candidate: ${data.candidateName}`);

    const mailOptions = {
      to: hrEmail,
      subject: `⭐ High-Scoring Candidate Alert: ${data.candidateName} (Score: ${data.matchScore})`,
      html: buildHREmailHTML(data),
      text: buildHREmailText(data),
    };

    const result = await sendEmail(mailOptions);

    logger.info(`HR notification sent successfully to ${hrEmail}`);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send HR notification:', error.message);
    throw new Error(`Email notification failed: ${error.message}`);
  }
};

/**
 * Build HTML content for HR notification email
 * @param {object} data - All notification data
 * @returns {string} HTML email content
 */
const buildHREmailHTML = (data) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .score-badge { display: inline-block; background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #667eea; }
    .section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
    .skill-tag { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 5px 12px; margin: 4px; border-radius: 4px; font-size: 14px; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; color: #555; }
    .footer { margin-top: 20px; padding: 15px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⭐ High-Scoring Candidate Alert</h1>
      <p style="margin: 10px 0 0 0;">A candidate has scored above your threshold!</p>
    </div>
    
    <div class="content">
      <div style="text-align: center; margin: 20px 0;">
        <div class="score-badge">Match Score: ${data.matchScore}/100</div>
      </div>

      <div class="section">
        <div class="section-title">📋 Candidate Information</div>
        <div class="info-row"><span class="label">Name:</span> ${data.candidateName}</div>
        <div class="info-row"><span class="label">Email:</span> ${data.candidateEmail || 'Not provided'}</div>
        <div class="info-row"><span class="label">Job:</span> ${data.jobTitle} (${data.jobId})</div>
        <div class="info-row"><span class="label">Resume:</span> <a href="${data.resumeUrl}" style="color: #667eea;">View Resume</a></div>
      </div>

      ${data.keyHighlights && data.keyHighlights.length > 0 ? `
      <div class="section">
        <div class="section-title">🌟 Key Highlights</div>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${data.keyHighlights.map((highlight) => `<li style="margin: 5px 0;">${highlight}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">📞 Next Steps</div>
        <p>Review the candidate's resume and consider scheduling an interview.</p>
        <p style="margin-top: 10px;">
          <a href="mailto:${data.candidateEmail}" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contact Candidate</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>This notification was sent to: <strong>${data.hrEmail}</strong></p>
      <p>This is an automated notification from the ATS Score Engine.</p>
      <p>Please review the candidate's full resume before making hiring decisions.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Build text content for HR notification email
 * @param {object} data - All notification data
 * @returns {string} Plain text email content
 */
const buildHREmailText = (data) => {
  return `
HIGH-SCORING CANDIDATE ALERT
============================

Match Score: ${data.matchScore}/100

CANDIDATE INFORMATION
---------------------
Name: ${data.candidateName}
Email: ${data.candidateEmail || 'Not provided'}
Job: ${data.jobTitle} (${data.jobId})
Resume URL: ${data.resumeUrl}

${data.keyHighlights && data.keyHighlights.length > 0 ? `
KEY HIGHLIGHTS
--------------
${data.keyHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}
` : ''}

NEXT STEPS
----------
Review the candidate's resume and consider scheduling an interview.
Contact: ${data.candidateEmail}

---
This is an automated notification from the ATS Score Engine.
Please review the candidate's full resume before making hiring decisions.
  `;
};

/**
 * Send confirmation email to candidate
 * @param {object} candidateData - Candidate information
 * @returns {Promise<object>} Email send result
 */
const sendCandidateConfirmation = async (candidateData) => {
  try {
    const email = candidateData.candidateEmail || candidateData.email;
    const name = candidateData.candidateName || candidateData.name;
    
    if (!email) {
      logger.warn('Candidate email not provided, skipping confirmation');
      return { sent: false, reason: 'No candidate email' };
    }

    logger.info(`Sending confirmation email to candidate: ${email}`);

    const mailOptions = {
      to: email,
      subject: 'Application Received - Thank You!',
      html: `
        <h2>Thank You for Your Application!</h2>
        <p>Dear ${name},</p>
        <p>We have received your application for <strong>${candidateData.jobTitle}</strong> at <strong>${candidateData.companyName}</strong>.</p>
        <p>Your resume has been successfully processed and will be reviewed by our hiring team.</p>
        <p>We will contact you if your qualifications match our requirements.</p>
        <br>
        <p>Best regards,<br>The Hiring Team</p>
      `,
      text: `
Dear ${name},

We have received your application for ${candidateData.jobTitle} at ${candidateData.companyName}.

Your resume has been successfully processed and will be reviewed by our hiring team.

We will contact you if your qualifications match our requirements.

Best regards,
The Hiring Team
      `,
    };

    const result = await sendEmail(mailOptions);
    logger.info(`Confirmation email sent to candidate: ${candidateData.email}`);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Failed to send candidate confirmation:', error.message);
    // Don't throw error - confirmation emails are not critical
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendHRNotification,
  sendCandidateConfirmation,
};
