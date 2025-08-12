const mongoose = require('mongoose');

const interviewLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobRole: { type: String, default: 'General' },
  questions: [String],
  answers: [String],
  feedback: [String],
  currentQuestionIndex: { type: Number, default: 0 },
  isAIGenerated: { type: Boolean, default: false },
  completedAt: Date,
  totalScore: Number,
  
  // Additional metadata
  interviewType: { 
    type: String, 
    enum: ['technical', 'behavioral', 'general', 'phone', 'video'], 
    default: 'general' 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  duration: Number, // in minutes
  
  // Voice/Speech analysis (for future features)
  speechMetrics: {
    pace: Number, // words per minute
    clarity: Number, // 1-10 scale
    fillerWords: Number,
    confidence: Number // 1-10 scale
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
interviewLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate duration if completed
  if (this.completedAt && !this.duration) {
    this.duration = Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  
  next();
});

// Virtual for completion status
interviewLogSchema.virtual('isCompleted').get(function() {
  return !!this.completedAt;
});

// Virtual for progress percentage
interviewLogSchema.virtual('progressPercentage').get(function() {
  const totalQuestions = 5;
  return Math.round((this.currentQuestionIndex / totalQuestions) * 100);
});

// Ensure virtual fields are serialized
interviewLogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('InterviewLog', interviewLogSchema);