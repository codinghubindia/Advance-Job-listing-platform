const jwt = require('jsonwebtoken');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-jwt.js <your-jwt-token>');
  console.log('\nYou can get your token from:');
  console.log('1. Login to the app');
  console.log('2. Open browser DevTools > Application > Local Storage');
  console.log('3. Copy the token value');
  process.exit(1);
}

console.log('=== JWT ANALYSIS (NO VERIFICATION) ===\n');

try {
  // Decode without verification to see the structure
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded) {
    console.log('❌ Failed to decode token - invalid format');
    process.exit(1);
  }
  
  console.log('Header:', JSON.stringify(decoded.header, null, 2));
  console.log('\nPayload:', JSON.stringify(decoded.payload, null, 2));
  
  // Check what algorithm wasused
  console.log('\n📌 Algorithm used:', decoded.header.alg);
  
  // Check issuer and audience
  console.log('📌 Issuer (iss):', decoded.payload.iss);
  console.log('📌 Audience (aud):', decoded.payload.aud);
  
  // Check expiration
  if (decoded.payload.exp) {
    const expirationDate = new Date(decoded.payload.exp * 1000);
    const now = new Date();
    const isExpired = now > expirationDate;
    console.log('📌 Expires at:', expirationDate.toLocaleString());
    console.log('📌 Is expired?', isExpired ? '❌ YES' : '✅ NO');
  }
  
  console.log('\n=== NOW TESTING VERIFICATION ===\n');
  
  // Try to verify with the JWT secret from .env
  require('dotenv').config();
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  
  console.log('JWT Secret length:', jwtSecret?.length || 0);
  console.log('JWT Secret (first 30 chars):', jwtSecret?.substring(0, 30) + '...');
  
  try {
    const verified = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256', 'RS256'], // Try both algorithms
    });
    console.log('\n✅ TOKEN VERIFIED SUCCESSFULLY!');
    console.log('User ID:', verified.sub);
    console.log('Email:', verified.email);
    console.log('Role:', verified.user_metadata?.role || verified.app_metadata?.role);
  } catch (verifyError) {
    console.log('\n❌ VERIFICATION FAILED');
    console.log('Error:', verifyError.name);
    console.log('Message:', verifyError.message);
    
    if (verifyError.name === 'JsonWebTokenError') {
      console.log('\n💡 TIP: The JWT secret is likely incorrect.');
      console.log('   Get the correct JWT secret from:');
      console.log('   Supabase Dashboard > Settings > API > JWT Settings > JWT Secret');
    }
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}
