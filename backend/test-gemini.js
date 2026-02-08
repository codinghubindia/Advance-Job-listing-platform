require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✓ GoogleGenerativeAI initialized');

    // List available models
    console.log('\nListing available models...');
    try {
      const models = await genAI.listModels();
      console.log('Available models:');
      for (const model of models) {
        console.log(`  - ${model.name} (${model.displayName})`);
        console.log(`    Supported: ${model.supportedGenerationMethods?.join(', ')}`);
      }
    } catch (error) {
      console.log('Could not list models:', error.message);
    }

    // Get model - try different model names
    const modelNames = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-001'];
    let model;
    let workingModelName;
    
    for (const modelName of modelNames) {
      try {
        console.log(`\nTrying model: ${modelName}...`);
        model = genAI.getGenerativeModel({ model: modelName });
        
        // Test if it actually works by making a simple call
        const testResult = await model.generateContent('test');
        await testResult.response;
        
        workingModelName = modelName;
        console.log(`✓ Model works: ${modelName}`);
        break;
      } catch (error) {
        console.log(`✗ Failed: ${error.message}`);
      }
    }

    if (!model) {
      throw new Error('None of the model names worked');
    }

    // Test simple prompt
    console.log(`\nSending test prompt to ${workingModelName}...`);
    const result = await model.generateContent('Say hello in 5 words');
    const response = await result.response;
    const text = response.text();

    console.log('✓ Response received:');
    console.log('---');
    console.log(text);
    console.log('---');

    // Test with JSON response
    console.log('\nTesting JSON response...');
    const jsonPrompt = `Respond with ONLY this JSON structure, nothing else:
{
  "test": "success",
  "score": 95
}`;

    const jsonResult = await model.generateContent(jsonPrompt);
    const jsonResponse = await jsonResult.response;
    const jsonText = jsonResponse.text();

    console.log('✓ JSON Response received:');
    console.log('---');
    console.log(jsonText);
    console.log('---');

    // Try to parse it
    const cleanText = jsonText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✓ Successfully parsed JSON:', parsed);
    } else {
      console.log('⚠ Could not extract JSON from response');
    }

    console.log(`\n✅ All tests passed! Gemini API is working correctly.`);
    console.log(`✅ Use model name: "${workingModelName}" in your code`);
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testGemini();
