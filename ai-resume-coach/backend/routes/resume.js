const express = require('express');
const auth = require('../middleware/authMiddleware');
const { 
  uploadResume, 
  analyzeResume, 
  buildResume, 
  getUserResumes,
  saveResumeData,
  getResumeById,
  getResumeSuggestions
} = require('../controllers/resumeController');

const router = express.Router();

// Upload and analyze resume
router.post('/upload', auth, uploadResume, analyzeResume);

// Build resume with AI
router.post('/build', auth, buildResume);

// Get resume suggestions
router.post('/suggestions', auth, getResumeSuggestions);

// Save resume data from ResumeBuilder
router.post('/save', auth, saveResumeData);

// Get all user resumes
router.get('/', auth, getUserResumes);

// Get specific resume by ID
router.get('/:id', auth, getResumeById);

module.exports = router;