require('dotenv').config();
const { sendHRNotification, sendCandidateConfirmation } = require('./src/services/email.service');

async function testEmails() {
  console.log('Testing Email Notification System...\n');
  console.log('================================================');
  
  // Check SMTP configuration
  console.log('SMTP Configuration:');
  console.log('  Host:', process.env.SMTP_HOST || '❌ NOT SET');
  console.log('  Port:', process.env.SMTP_PORT || '❌ NOT SET');
  console.log('  User:', process.env.SMTP_USER || '❌ NOT SET');
  console.log('  Pass:', process.env.SMTP_PASS ? '✓ SET' : '❌ NOT SET');
  console.log('================================================\n');

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP not configured. Please set SMTP_* variables in .env file.\n');
    console.log('Example .env configuration:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password\n');
    process.exit(1);
  }

  // Test data for HR notification (high score candidate)
  const hrNotificationData = {
    hrEmail: process.env.TEST_HR_EMAIL || process.env.SMTP_USER, // Send to yourself for testing
    hrName: 'John HR Manager',
    jobId: 'JOB-TEST-12345',
    jobTitle: 'Senior Full Stack Developer',
    candidateName: 'Jane Doe',
    candidateEmail: 'jane.doe@example.com',
    matchScore: 92,
    resumeUrl: 'https://res.cloudinary.com/demo/sample-resume.pdf',
    keyHighlights: [
      '5+ years of experience with React and Node.js',
      'Strong problem-solving skills demonstrated in previous roles',
      'Excellent communication and team collaboration',
      'Proven track record of delivering projects on time',
      'Bachelor\'s degree in Computer Science'
    ]
  };

  // Test data for candidate confirmation
  const candidateConfirmationData = {
    candidateEmail: process.env.TEST_CANDIDATE_EMAIL || process.env.SMTP_USER, // Send to yourself for testing
    candidateName: 'Jane Doe',
    jobId: 'JOB-TEST-12345',
    jobTitle: 'Senior Full Stack Developer',
    companyName: 'Tech Innovations Inc.'
  };

  try {
    // Test 1: HR Notification (for high-scoring candidate)
    console.log('Test 1: Sending HR Notification Email...');
    console.log('  To:', hrNotificationData.hrEmail);
    console.log('  Candidate:', hrNotificationData.candidateName);
    console.log('  Score:', hrNotificationData.matchScore);
    
    const hrResult = await sendHRNotification(hrNotificationData);
    
    if (hrResult.sent) {
      console.log('  ✅ HR notification sent successfully!');
      console.log('  Message ID:', hrResult.messageId);
    } else {
      console.log('  ⚠️ HR notification not sent:', hrResult.reason);
    }
    console.log();

    // Test 2: Candidate Confirmation
    console.log('Test 2: Sending Candidate Confirmation Email...');
    console.log('  To:', candidateConfirmationData.candidateEmail);
    console.log('  Candidate:', candidateConfirmationData.candidateName);
    console.log('  Job:', candidateConfirmationData.jobTitle);
    
    const candidateResult = await sendCandidateConfirmation(candidateConfirmationData);
    
    if (candidateResult.sent) {
      console.log('  ✅ Candidate confirmation sent successfully!');
      console.log('  Message ID:', candidateResult.messageId);
    } else {
      console.log('  ⚠️ Candidate confirmation not sent:', candidateResult.reason);
    }
    console.log();

    console.log('================================================');
    console.log('✅ All tests completed successfully!');
    console.log('================================================\n');
    console.log('Check your email inbox at:', hrNotificationData.hrEmail);
    console.log('\nNote: Check spam folder if you don\'t see the emails.\n');
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.response) {
      console.error('Response:', error.response);
    }
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testEmails();
