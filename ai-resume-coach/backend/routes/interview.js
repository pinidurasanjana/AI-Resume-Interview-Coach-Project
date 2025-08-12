const express = require('express');
const auth = require('../middleware/authMiddleware');
const { 
  startInterview, 
  submitAnswer, 
  getInterviewLogs,
  getInterviewById,
  deleteInterview 
} = require('../controllers/interviewController');

const router = express.Router();

// Start a new interview session
router.post('/start', auth, startInterview);

// Submit an answer and get feedback + next question
router.post('/answer', auth, submitAnswer);

// Get all interview logs for the user
router.get('/logs', auth, getInterviewLogs);

// Get a specific interview log by ID
router.get('/:id', auth, getInterviewById);

// Delete an interview log
router.delete('/:id', auth, deleteInterview);

module.exports = router;