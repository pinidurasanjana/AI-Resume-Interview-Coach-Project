const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filePath: { type: String }, // Made optional for builder-created resumes
  score: { type: Number, default: 0 },
  feedback: String,
  jobRole: { type: String, default: 'General' },
  
  // For AI-generated resumes
  generatedContent: String,
  isGenerated: { type: Boolean, default: false },
  
  // For ResumeBuilder data
  isBuilderData: { type: Boolean, default: false },
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    website: String,
    linkedin: String,
    github: String,
    summary: String
  },
  experience: [{
    id: String,
    company: String,
    position: String,
    startDate: String,
    endDate: String,
    current: Boolean,
    description: String,
    achievements: [String]
  }],
  education: [{
    id: String,
    institution: String,
    degree: String,
    field: String,
    startDate: String,
    endDate: String,
    gpa: String,
    achievements: [String]
  }],
  skills: [{
    id: String,
    name: String,
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    category: String
  }],
  projects: [{
    id: String,
    name: String,
    description: String,
    technologies: String,
    link: String,
    github: String
  }],
  certifications: [{
    id: String,
    name: String,
    issuer: String,
    date: String,
    expiryDate: String,
    credentialId: String
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);