const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const Resume = require('../models/Resume');
const User = require('../models/User');

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not found in environment variables');
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error('Error initializing OpenAI:', error.message);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Please upload PDF, DOC, DOCX, or TXT files.`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

exports.uploadResume = upload.single('resume');

exports.analyzeResume = async (req, res) => {
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { jobRole = 'General' } = req.body;
    const filePath = req.file.path;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ msg: 'Uploaded file not found' });
    }

    console.log(`Analyzing resume: ${filePath} for job role: ${jobRole}`);

    let resumeText = '';
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        resumeText = data.text;
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        resumeText = result.value;
      } else if (ext === '.doc') {
        // For .doc files, try mammoth (limited support)
        const result = await mammoth.extractRawText({ path: filePath });
        resumeText = result.value;
      } else if (ext === '.txt') {
        resumeText = fs.readFileSync(filePath, 'utf-8');
      } else {
        return res.status(400).json({ msg: 'Unsupported file format' });
      }
    } catch (parseError) {
      console.error('Error parsing file:', parseError);
      return res.status(400).json({ 
        msg: 'Error parsing resume file', 
        error: parseError.message 
      });
    }

    // Check if we extracted any text
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ 
        msg: 'No text could be extracted from the resume. Please ensure the file is not corrupted.' 
      });
    }

    console.log(`Extracted text length: ${resumeText.length} characters`);

    // Check if OpenAI is available
    if (!openai) {
      // Return mock analysis if OpenAI is not available
      const mockAnalysis = {
        score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
        feedback: `Resume Analysis for ${jobRole} position:

Score: ${Math.floor(Math.random() * 30) + 60}/100

Strengths:
• Clear contact information
• Relevant work experience
• Good formatting structure

Areas for Improvement:
• Add more industry-specific keywords
• Include quantifiable achievements
• Consider adding a professional summary
• Optimize for ATS compatibility

Missing Keywords (based on ${jobRole}):
• Industry-specific technical skills
• Action verbs for accomplishments
• Relevant certifications

Recommendations:
• Use bullet points for better readability
• Include metrics and numbers where possible
• Tailor content to job requirements
• Consider professional formatting

Note: This is a sample analysis. Configure OpenAI API key for detailed AI-powered analysis.`
      };

      const resume = new Resume({ 
        userId: req.user.id, 
        filePath, 
        score: mockAnalysis.score, 
        feedback: mockAnalysis.feedback,
        jobRole 
      });
      await resume.save();

      return res.json(mockAnalysis);
    }

    const prompt = `
You are a professional resume analyzer. Analyze the following resume text and provide a comprehensive evaluation:

Job Role Target: ${jobRole}

Please provide your analysis in the following format:

Score: [NUMBER]/100

STRENGTHS:
[List 3-5 key strengths]

AREAS FOR IMPROVEMENT:
[List 3-5 specific areas to improve]

MISSING KEYWORDS:
[List important keywords missing for ${jobRole} role]

ATS OPTIMIZATION:
[Specific suggestions for ATS compatibility]

RECOMMENDATIONS:
[3-5 actionable recommendations]

Resume Text:
${resumeText.substring(0, 4000)} ${resumeText.length > 4000 ? '...' : ''}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const feedback = completion.choices[0].message.content;

      // Parse score from feedback
      const scoreMatch = feedback.match(/Score:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75; // Default score if not found

      const resume = new Resume({ 
        userId: req.user.id, 
        filePath, 
        score, 
        feedback,
        jobRole 
      });
      await resume.save();

      // Clean up uploaded file after processing (optional)
      // fs.unlinkSync(filePath);

      res.json({ score, feedback });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Return mock analysis if OpenAI fails
      const fallbackScore = Math.floor(Math.random() * 30) + 60;
      const fallbackFeedback = `Resume Analysis (Fallback Mode):

Score: ${fallbackScore}/100

Your resume has been processed, but detailed AI analysis is currently unavailable.

General Recommendations:
• Ensure clear contact information
• Use action verbs to describe achievements
• Include relevant keywords for ${jobRole}
• Quantify accomplishments with numbers
• Maintain consistent formatting
• Optimize for ATS systems

Please try again later for detailed AI-powered analysis.`;

      const resume = new Resume({ 
        userId: req.user.id, 
        filePath, 
        score: fallbackScore, 
        feedback: fallbackFeedback,
        jobRole 
      });
      await resume.save();

      res.json({ score: fallbackScore, feedback: fallbackFeedback });
    }

  } catch (err) {
    console.error('Resume analysis error:', err);
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      msg: 'Error analyzing resume', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.buildResume = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { 
      personalInfo, 
      experience, 
      education, 
      skills, 
      certifications,
      // Legacy support for old format
      workExperience, 
      jobDescription 
    } = req.body;

    // Validate required fields - support both new and legacy formats
    if (!personalInfo && !experience && !workExperience && !skills && !education) {
      return res.status(400).json({ 
        msg: 'Please provide at least personal info, experience, skills, or education information' 
      });
    }

    // Format data for prompt
    const formattedPersonalInfo = personalInfo ? `
Name: ${personalInfo.fullName || 'Not provided'}
Email: ${personalInfo.email || 'Not provided'}
Phone: ${personalInfo.phone || 'Not provided'}
Location: ${personalInfo.location || 'Not provided'}
Summary: ${personalInfo.summary || 'Not provided'}
` : 'Not provided';

    const formattedExperience = experience && experience.length > 0 ? 
      experience.map(exp => `
• ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description || 'No description provided'}
`).join('\n') : (workExperience || 'Not provided');

    const formattedEducation = education && education.length > 0 ?
      education.map(edu => `
• ${edu.degree} - ${edu.institution} (${edu.graduationYear || 'In progress'})
`).join('\n') : 'Not provided';

    const formattedSkills = Array.isArray(skills) ? 
      (typeof skills[0] === 'string' ? skills.join(', ') : skills.map(s => s.name || s).join(', '))
      : (skills || 'Not provided');

    // Convert skills array for database storage
    const skillsForDB = Array.isArray(skills) ? 
      (typeof skills[0] === 'string' ? 
        skills.map((skill, index) => ({ id: index.toString(), name: skill, level: 'Intermediate' })) :
        skills
      ) : [];

    const formattedCertifications = certifications && certifications.length > 0 ?
      (typeof certifications[0] === 'string' ? 
        certifications.join(', ') : 
        certifications.map(cert => cert.name || cert).join(', ')
      ) : 'Not provided';

    // Convert certifications for database storage  
    const certificationsForDB = certifications && certifications.length > 0 ?
      (typeof certifications[0] === 'string' ?
        certifications.map((cert, index) => ({ id: index.toString(), name: cert })) :
        certifications
      ) : [];

    const prompt = `
You are a professional resume writer. Create a well-formatted, ATS-friendly resume based on the following information:

PERSONAL INFORMATION:
${formattedPersonalInfo}

WORK EXPERIENCE: 
${formattedExperience}

EDUCATION:
${formattedEducation}

SKILLS: 
${formattedSkills}

CERTIFICATIONS:
${formattedCertifications}

${jobDescription ? `TARGET JOB DESCRIPTION: ${jobDescription}` : ''}

Please format the resume with:
1. Clear section headers
2. Bullet points for achievements
3. Action verbs
4. Quantifiable results where possible
5. Professional formatting
6. ATS-friendly structure

Format as plain text with clear sections and proper spacing.
`;

    try {
      if (!openai) {
        // Return mock resume if OpenAI is not available
        const mockResume = `
${personalInfo?.fullName?.toUpperCase() || 'PROFESSIONAL'} RESUME

CONTACT INFORMATION
${personalInfo?.fullName || 'Your Name'}
${personalInfo?.email || 'your.email@example.com'}
${personalInfo?.phone || '+1234567890'}
${personalInfo?.location || 'Your Location'}

PROFESSIONAL SUMMARY
${personalInfo?.summary || 'Experienced professional with strong background in the specified field. Proven track record of delivering results and contributing to team success.'}

WORK EXPERIENCE
${formattedExperience !== 'Not provided' ? formattedExperience : '• Previous Role - Company Name\n  • Achieved measurable results through dedicated work\n  • Collaborated effectively with cross-functional teams\n  • Demonstrated leadership and problem-solving skills'}

SKILLS
${formattedSkills !== 'Not provided' ? formattedSkills : 'Technical Skills, Communication, Leadership, Problem-solving'}

EDUCATION
${formattedEducation !== 'Not provided' ? formattedEducation : '• Degree - Institution Name\n  • Relevant coursework and achievements'}

${formattedCertifications !== 'Not provided' ? `CERTIFICATIONS\n${formattedCertifications}` : ''}

Note: This is a template resume. Configure OpenAI API key for AI-generated personalized content.
`;

        // Save the generated resume
        const resume = new Resume({
          userId: req.user.id,
          personalInfo: personalInfo || {},
          experience: experience || [],
          education: education || [],
          skills: skillsForDB,
          certifications: certificationsForDB,
          generatedContent: mockResume,
          score: 75,
          feedback: 'Template resume generated. Add OpenAI API key for personalized content.',
          isGenerated: true
        });
        
        await resume.save();

        return res.json({ 
          generatedResume: mockResume,
          resume: resume
        });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const generatedResume = completion.choices[0].message.content;
      
      // Save the generated resume
      const resume = new Resume({
        userId: req.user.id,
        personalInfo: personalInfo || {},
        experience: experience || [],
        education: education || [],
        skills: skillsForDB,
        certifications: certificationsForDB,
        generatedContent: generatedResume,
        score: 85, // Default score for AI-generated resumes
        feedback: 'AI-generated resume based on provided information',
        isGenerated: true
      });
      
      await resume.save();

      res.json({ 
        generatedResume,
        resume: resume
      });
    } catch (openaiError) {
      console.error('OpenAI API error in buildResume:', openaiError);
      
      // Return fallback template
      const fallbackResume = `
${personalInfo?.fullName?.toUpperCase() || 'PROFESSIONAL'} RESUME TEMPLATE

PROFESSIONAL SUMMARY
Dynamic professional with experience in ${jobDescription ? 'the target industry' : 'various fields'}. 
Skilled in delivering high-quality results and driving organizational success.

WORK EXPERIENCE
${formattedExperience !== 'Not provided' ? formattedExperience : 'Please add your work experience details including:\n• Job titles and company names\n• Employment dates\n• Key responsibilities and achievements\n• Quantifiable results and impact'}

CORE SKILLS
${formattedSkills !== 'Not provided' ? formattedSkills : 'Please list your relevant skills including:\n• Technical skills\n• Software proficiency\n• Industry-specific knowledge\n• Soft skills and certifications'}

EDUCATION
${formattedEducation !== 'Not provided' ? formattedEducation : 'Please add your educational background:\n• Degree and institution\n• Graduation date\n• Relevant coursework\n• Academic achievements'}

${formattedCertifications !== 'Not provided' ? `CERTIFICATIONS\n${formattedCertifications}` : ''}

Note: AI-powered resume generation is temporarily unavailable. Please customize this template with your specific information.
`;

      // Save the fallback resume
      const resume = new Resume({
        userId: req.user.id,
        personalInfo: personalInfo || {},
        experience: experience || [],
        education: education || [],
        skills: skillsForDB,
        certifications: certificationsForDB,
        generatedContent: fallbackResume,
        score: 70,
        feedback: 'Fallback template generated due to AI service unavailability',
        isGenerated: true
      });
      
      await resume.save();

      res.json({ 
        generatedResume: fallbackResume,
        resume: resume
      });
    }

  } catch (err) {
    console.error('Build resume error:', err);
    res.status(500).json({ 
      msg: 'Error building resume', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.getUserResumes = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const resumes = await Resume.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-filePath') // Don't expose file paths for security
      .limit(50); // Limit to last 50 resumes
    
    res.json(resumes);
  } catch (err) {
    console.error('Get user resumes error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// New endpoint to save resume data from ResumeBuilder
exports.saveResumeData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { personalInfo, experience, education, skills, projects, certifications } = req.body;

    // Validate that at least some data is provided
    if (!personalInfo || !personalInfo.fullName) {
      return res.status(400).json({ msg: 'Personal information with full name is required' });
    }

    const resumeData = {
      userId: req.user.id,
      personalInfo,
      experience: experience || [],
      education: education || [],
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
      isBuilderData: true,
      score: 0, // Will be calculated later
      feedback: 'Resume data saved from builder'
    };

    const resume = new Resume(resumeData);
    await resume.save();

    res.json({ 
      msg: 'Resume data saved successfully', 
      resumeId: resume._id,
      resume: resume 
    });
  } catch (err) {
    console.error('Save resume data error:', err);
    res.status(500).json({ 
      msg: 'Error saving resume data', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// New endpoint to get a specific resume by ID
exports.getResumeById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { id } = req.params;
    const resume = await Resume.findOne({ 
      _id: id, 
      userId: req.user.id 
    }).select('-filePath');

    if (!resume) {
      return res.status(404).json({ msg: 'Resume not found' });
    }

    res.json(resume);
  } catch (err) {
    console.error('Get resume by ID error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Resume suggestions endpoint
exports.getResumeSuggestions = async (req, res) => {
  try {
    const { jobRole } = req.body;
    
    if (!jobRole) {
      return res.status(400).json({ msg: 'Job role is required' });
    }

    // Mock suggestions for different job roles
    const suggestionsMap = {
      'Frontend Developer': [
        'Include experience with modern JavaScript frameworks (React, Vue, Angular)',
        'Highlight responsive design and CSS expertise',
        'Mention experience with version control (Git)',
        'Add projects that demonstrate UI/UX skills',
        'Include performance optimization experience'
      ],
      'Backend Developer': [
        'Emphasize database design and management skills',
        'Include API development and integration experience',
        'Mention cloud platform experience (AWS, Azure, GCP)',
        'Add microservices and scalability experience',
        'Include testing and CI/CD pipeline knowledge'
      ],
      'Full Stack Developer': [
        'Balance frontend and backend technologies',
        'Mention experience with complete project lifecycle',
        'Include database and API design skills',
        'Add deployment and DevOps experience',
        'Emphasize problem-solving and system design abilities'
      ],
      'Software Developer': [
        'Include programming languages relevant to target companies',
        'Mention software development lifecycle experience',
        'Add problem-solving and algorithmic thinking examples',
        'Include collaborative development and code review experience',
        'Emphasize continuous learning and adaptation'
      ],
      'Data Scientist': [
        'Include statistical analysis and machine learning experience',
        'Mention data visualization and storytelling skills',
        'Add experience with Python, R, or similar languages',
        'Include big data and cloud computing experience',
        'Emphasize business impact of data insights'
      ]
    };

    const suggestions = suggestionsMap[jobRole] || [
      'Tailor your resume to the specific job requirements',
      'Include quantifiable achievements and metrics',
      'Use action verbs to describe your responsibilities',
      'Keep your resume concise and well-formatted',
      'Include relevant keywords from the job description'
    ];

    res.json({ 
      suggestions,
      jobRole,
      message: `Resume suggestions for ${jobRole} role`
    });

  } catch (err) {
    console.error('Resume suggestions error:', err);
    res.status(500).json({ 
      msg: 'Error getting resume suggestions', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};