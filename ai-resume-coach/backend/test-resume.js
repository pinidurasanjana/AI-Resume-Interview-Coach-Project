// Test script for resume functionality
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = '';

async function testResumeFlow() {
  try {
    console.log('📄 Testing Resume Functionality...\n');

    // Step 1: Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = { Authorization: `Bearer ${authToken}` };

    // Step 2: Test Resume Builder
    console.log('\n🏗️ Testing resume builder...');
    const resumeData = {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        location: 'New York, NY',
        summary: 'Experienced software developer with passion for creating innovative solutions.'
      },
      experience: [
        {
          company: 'TechCorp',
          position: 'Software Developer',
          startDate: '2022-01-01',
          endDate: 'Present',
          description: 'Developed web applications using React and Node.js'
        }
      ],
      education: [
        {
          institution: 'University of Technology',
          degree: 'Bachelor of Computer Science',
          graduationYear: '2021'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      certifications: ['AWS Certified Developer']
    };

    const buildResponse = await axios.post(`${BASE_URL}/resume/build`, resumeData, { headers });
    console.log('✅ Resume built successfully');
    console.log(`📋 Resume ID: ${buildResponse.data.resume._id}`);

    // Step 3: Get Resume Suggestions
    console.log('\n💡 Getting resume suggestions...');
    const suggestionsResponse = await axios.post(`${BASE_URL}/resume/suggestions`, {
      jobRole: 'Frontend Developer'
    }, { headers });

    console.log('✅ Suggestions retrieved successfully');
    console.log('📝 Suggestions:', suggestionsResponse.data.suggestions);

    // Step 4: Get User Resumes
    console.log('\n📊 Fetching user resumes...');
    const resumesResponse = await axios.get(`${BASE_URL}/resume`, { headers });
    console.log('✅ User resumes retrieved');
    console.log(`📈 Total resumes: ${resumesResponse.data.length}`);

    console.log('\n🎉 All resume tests passed! Resume functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📋 Error details:', error.response.data.details);
    }
  }
}

// Run the test
testResumeFlow();
