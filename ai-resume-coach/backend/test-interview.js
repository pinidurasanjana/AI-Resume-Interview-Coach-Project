// Test script for interview functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials (you'll need to register first)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';
let interviewLogId = '';

async function testInterviewFlow() {
  try {
    console.log('🧪 Testing Interview Functionality...\n');

    // Step 1: Login (or register if needed)
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('📝 User not found, registering...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      authToken = registerResponse.data.token;
      console.log('✅ Registration successful');
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // Step 2: Start Interview
    console.log('\n🎤 Starting interview...');
    const startResponse = await axios.post(`${BASE_URL}/interview/start`, {
      jobRole: 'Software Developer'
    }, { headers });

    console.log('✅ Interview started successfully');
    console.log('📝 First question:', startResponse.data.question);
    console.log('🆔 Interview ID:', startResponse.data.logId);
    interviewLogId = startResponse.data.logId;

    // Step 3: Submit Answer
    console.log('\n💬 Submitting answer...');
    const answerResponse = await axios.post(`${BASE_URL}/interview/answer`, {
      logId: interviewLogId,
      answer: 'I have 3 years of experience in software development, working primarily with JavaScript, React, and Node.js. I\'ve built several web applications and am passionate about clean code and user experience.',
      isVoice: false
    }, { headers });

    console.log('✅ Answer submitted successfully');
    console.log('📋 Feedback:', answerResponse.data.feedback);
    if (answerResponse.data.nextQuestion) {
      console.log('❓ Next question:', answerResponse.data.nextQuestion);
    }

    // Step 4: Get Interview Logs
    console.log('\n📊 Fetching interview logs...');
    const logsResponse = await axios.get(`${BASE_URL}/interview/logs`, { headers });
    console.log('✅ Interview logs retrieved');
    console.log(`📈 Total interviews: ${logsResponse.data.length}`);

    // Step 5: Get Specific Interview
    console.log('\n🔍 Fetching specific interview...');
    const specificResponse = await axios.get(`${BASE_URL}/interview/${interviewLogId}`, { headers });
    console.log('✅ Specific interview retrieved');
    console.log(`📋 Questions so far: ${specificResponse.data.questions.length}`);
    console.log(`💬 Answers so far: ${specificResponse.data.answers.length}`);

    console.log('\n🎉 All tests passed! Interview functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testInterviewFlow();
