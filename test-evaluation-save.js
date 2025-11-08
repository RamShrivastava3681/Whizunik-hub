const axios = require('axios');

// Test the evaluation save endpoint
async function testEvaluationSave() {
  try {
    console.log('🧪 Testing evaluation save endpoint...');
    
    // Mock token - you'll need to replace this with a real token
    const token = 'your_jwt_token_here'; // Replace with actual token
    
    const evaluationData = {
      applicationId: '690f9d901c33e936538faa29', // The application ID from logs
      decision: 'needs_more_info',
      score: 0,
      comments: 'Step-by-step evaluation in progress',
      riskAssessment: 'medium',
      recommendedAmount: 0,
      conditions: []
    };
    
    console.log('📤 Sending evaluation data:', evaluationData);
    
    const response = await axios.post('http://localhost:5000/api/evaluations', evaluationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testEvaluationSave();