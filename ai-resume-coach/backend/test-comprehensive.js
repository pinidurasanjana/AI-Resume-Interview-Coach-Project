// Comprehensive test for the entire application
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testUser = {
  email: 'comprehensive@test.com',
  password: 'testpassword123'
};

let authToken = '';

async function runComprehensiveTest() {
  try {
    console.log('🚀 Running Comprehensive Application Test...\n');

    // 1. Authentication Test
    console.log('🔐 Testing Authentication...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('📝 Registering new user...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      authToken = registerResponse.data.token;
      console.log('✅ Registration successful');
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Resume Building Test
    console.log('\n📄 Testing Resume Building...');
    const resumeData = {
      personalInfo: {
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1234567890',
        location: 'San Francisco, CA',
        summary: 'Full-stack developer with 5 years of experience building scalable web applications.'
      },
      experience: [
        {
          company: 'TechStart Inc',
          position: 'Senior Full Stack Developer',
          startDate: '2021-01-01',
          endDate: 'Present',
          description: 'Lead development of React-based applications serving 100k+ users'
        }
      ],
      education: [
        {
          institution: 'Stanford University',
          degree: 'Master of Computer Science',
          graduationYear: '2020'
        }
      ],
      skills: ['React', 'Node.js', 'Python', 'AWS', 'MongoDB'],
      certifications: ['AWS Certified Solutions Architect', 'Google Cloud Professional']
    };

    const buildResponse = await axios.post(`${BASE_URL}/resume/build`, resumeData, { headers });
    console.log('✅ Resume built successfully');
    const resumeId = buildResponse.data.resume._id;

    // 3. Resume Suggestions Test
    console.log('\n💡 Testing Resume Suggestions...');
    const suggestionsResponse = await axios.post(`${BASE_URL}/resume/suggestions`, {
      jobRole: 'Full Stack Developer'
    }, { headers });
    console.log('✅ Resume suggestions retrieved');
    console.log(`📋 Number of suggestions: ${suggestionsResponse.data.suggestions.length}`);

    // 4. Interview Test
    console.log('\n🎤 Testing Interview System...');
    const startResponse = await axios.post(`${BASE_URL}/interview/start`, {
      jobRole: 'Full Stack Developer'
    }, { headers });
    console.log('✅ Interview started');
    const interviewId = startResponse.data.logId;

    const answerResponse = await axios.post(`${BASE_URL}/interview/answer`, {
      logId: interviewId,
      answer: 'I have 5 years of experience in full-stack development, working with React, Node.js, and cloud technologies. I led a team that built a high-traffic e-commerce platform.',
      isVoice: false
    }, { headers });
    console.log('✅ Interview answer submitted');

    // 5. Data Retrieval Tests
    console.log('\n📊 Testing Data Retrieval...');
    
    // Get resumes
    const resumesResponse = await axios.get(`${BASE_URL}/resume`, { headers });
    console.log(`✅ Retrieved ${resumesResponse.data.length} resumes`);
    
    // Get specific resume
    const specificResumeResponse = await axios.get(`${BASE_URL}/resume/${resumeId}`, { headers });
    console.log('✅ Retrieved specific resume');
    
    // Get interview logs
    const logsResponse = await axios.get(`${BASE_URL}/interview/logs`, { headers });
    console.log(`✅ Retrieved ${logsResponse.data.length} interview logs`);
    
    // Get specific interview
    const specificInterviewResponse = await axios.get(`${BASE_URL}/interview/${interviewId}`, { headers });
    console.log('✅ Retrieved specific interview');

    // 6. Summary
    console.log('\n🎉 COMPREHENSIVE TEST RESULTS:');
    console.log('=================================');
    console.log('✅ Authentication: WORKING');
    console.log('✅ Resume Building: WORKING');
    console.log('✅ Resume Suggestions: WORKING');
    console.log('✅ Interview System: WORKING');
    console.log('✅ Data Retrieval: WORKING');
    console.log('\n🚀 All systems operational! Your AI Resume Interview Coach is ready to use.');

  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📋 Error details:', error.response.data.details);
    }
  }
}

// Run the comprehensive test
runComprehensiveTest();
