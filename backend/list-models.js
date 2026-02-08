require('dotenv').config();
const axios = require('axios');

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    console.log('\nListing available models via REST API...\n');

    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    console.log('Available models:');
    console.log('================');
    
    if (response.data && response.data.models) {
      response.data.models.forEach(model => {
        console.log(`\nName: ${model.name}`);
        console.log(`Display Name: ${model.displayName}`);
        console.log(`Description: ${model.description ||'N/A'}`);
        console.log(`Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log(`---`);
      });

      console.log('\n\nModel names to use in code:');
      response.data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .forEach(model => {
          // Extract model name from full path (models/gemini-pro -> gemini-pro)
          const modelName = model.name.split('/').pop();
          console.log(`  - "${modelName}"`);
        });
    } else {
      console.log('No models found or unexpected response format');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

listModels();
