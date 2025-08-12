const OpenAI = require('openai');
const InterviewLog = require('../models/InterviewLog');

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not found in environment variables');
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error('Error initializing OpenAI for interviews:', error.message);
}

// Mock interview questions by job role
const mockQuestions = {
  'Software Developer': [
    "Tell me about yourself and your experience in software development.",
    "What programming languages are you most comfortable with and why?",
    "Describe a challenging project you worked on and how you overcame obstacles.",
    "How do you approach debugging when you encounter a complex issue?",
    "What's your experience with version control systems like Git?"
  ],
  'Data Scientist': [
    "Tell me about your background in data science and analytics.",
    "What's your experience with machine learning algorithms?",
    "Describe a data analysis project where you extracted meaningful insights.",
    "How do you handle missing or dirty data in your datasets?",
    "What tools and programming languages do you use for data analysis?"
  ],
  'Product Manager': [
    "Tell me about your experience in product management.",
    "How do you prioritize features when you have limited resources?",
    "Describe a time when you had to make a difficult product decision.",
    "How do you gather and incorporate user feedback into product development?",
    "What metrics do you use to measure product success?"
  ],
  'Marketing Manager': [
    "Tell me about your marketing experience and background.",
    "How do you develop and execute marketing campaigns?",
    "Describe a successful marketing campaign you led.",
    "How do you measure the effectiveness of marketing initiatives?",
    "What's your experience with digital marketing channels?"
  ],
  'General': [
    "Tell me about yourself and your professional background.",
    "What are your greatest strengths and how do they apply to this role?",
    "Describe a challenging situation at work and how you handled it.",
    "Where do you see yourself in the next 5 years?",
    "Why are you interested in this position and our company?"
  ]
};

exports.startInterview = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { jobRole = 'General' } = req.body;

    // Validate job role
    if (!jobRole || typeof jobRole !== 'string') {
      return res.status(400).json({ msg: 'Valid job role is required' });
    }

    console.log(`Starting interview for user ${req.user.id}, job role: ${jobRole}`);

    let firstQuestion;
    let isAIGenerated = false;

    // Try to use AI first, fallback to mock questions
    if (openai) {
      try {
        const prompt = `
You are an experienced interviewer conducting a professional job interview for a ${jobRole} position.

Your task:
1. Ask ONE well-crafted, relevant interview question
2. Make it appropriate for the ${jobRole} role
3. Keep it professional and engaging
4. Don't provide instructions - just ask the question

Ask the first question now:`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        });

        firstQuestion = completion.choices[0].message.content.trim();
        isAIGenerated = true;
        console.log('AI-generated question:', firstQuestion);

      } catch (openaiError) {
        console.error('OpenAI error in startInterview:', openaiError);
        
        // Fallback to mock questions
        const questions = mockQuestions[jobRole] || mockQuestions['General'];
        firstQuestion = questions[0];
        console.log('Using fallback question:', firstQuestion);
      }
    } else {
      // Use mock questions when OpenAI is not available
      const questions = mockQuestions[jobRole] || mockQuestions['General'];
      firstQuestion = questions[0];
      console.log('OpenAI not available, using mock question:', firstQuestion);
    }

    // Create interview log
    const log = new InterviewLog({ 
      userId: req.user.id, 
      jobRole, 
      questions: [firstQuestion], 
      answers: [], 
      feedback: [],
      isAIGenerated,
      currentQuestionIndex: 0
    });
    
    await log.save();

    res.json({ 
      question: firstQuestion, 
      logId: log._id,
      jobRole,
      questionNumber: 1,
      totalQuestions: 5,
      isAIGenerated
    });

  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ 
      msg: 'Error starting interview', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { logId, answer, isVoice = false } = req.body;

    // Validate required fields
    if (!logId || !answer) {
      return res.status(400).json({ msg: 'Log ID and answer are required' });
    }

    if (typeof answer !== 'string' || answer.trim().length === 0) {
      return res.status(400).json({ msg: 'Valid answer is required' });
    }

    // Find the interview log
    const log = await InterviewLog.findOne({ 
      _id: logId, 
      userId: req.user.id 
    });
    
    if (!log) {
      return res.status(404).json({ msg: 'Interview session not found' });
    }

    console.log(`Processing answer for log ${logId}, question ${log.currentQuestionIndex + 1}`);

    // Add the answer to the log
    log.answers.push(answer.trim());
    log.currentQuestionIndex = (log.currentQuestionIndex || 0) + 1;

    let feedback = '';
    let nextQuestion = null;
    let isComplete = false;

    // Generate feedback and next question
    if (openai && log.isAIGenerated) {
      try {
        // Analyze speech if voice input
        let speechAnalysis = '';
        if (isVoice) {
          speechAnalysis = '\n\nSpeech Analysis: Your response was clear and well-paced. Try to minimize filler words like "um" and "uh" for better impact.';
        }

        const currentQuestion = log.questions[log.questions.length - 1];
        const isLastQuestion = log.currentQuestionIndex >= 5;

        const prompt = isLastQuestion ? 
          `As an experienced interviewer, provide final feedback for this ${log.jobRole} interview.

Question: ${currentQuestion}
Answer: ${answer}

Provide:
1. Specific feedback on this answer (strengths and areas for improvement)
2. Overall interview summary
3. Final recommendations for the candidate

Format your response professionally.${speechAnalysis}` :

          `As an experienced interviewer for a ${log.jobRole} position, analyze this response and continue the interview.

Question: ${currentQuestion}
Answer: ${answer}

Provide:
1. Constructive feedback on the answer (2-3 sentences)
2. One follow-up question that's relevant to ${log.jobRole}

Format: 
FEEDBACK: [your feedback]
NEXT QUESTION: [your next question]${speechAnalysis}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        });

        const response = completion.choices[0].message.content;
        
        if (isLastQuestion) {
          feedback = response;
          isComplete = true;
        } else {
          // Parse feedback and next question
          const feedbackMatch = response.match(/FEEDBACK:\s*(.*?)(?=NEXT QUESTION:|$)/s);
          const questionMatch = response.match(/NEXT QUESTION:\s*(.*?)$/s);
          
          feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Good response. Keep up the good work!';
          nextQuestion = questionMatch ? questionMatch[1].trim() : null;
          
          if (nextQuestion) {
            log.questions.push(nextQuestion);
          }
        }

      } catch (openaiError) {
        console.error('OpenAI error in submitAnswer:', openaiError);
        
        // Fallback feedback and questions
        feedback = this.generateMockFeedback(answer, isVoice);
        
        if (log.currentQuestionIndex < 5) {
          const questionSet = mockQuestions[log.jobRole] || mockQuestions['General'];
          if (log.currentQuestionIndex < questionSet.length) {
            nextQuestion = questionSet[log.currentQuestionIndex];
            log.questions.push(nextQuestion);
          }
        } else {
          isComplete = true;
          feedback += '\n\nThank you for completing the interview! Overall, you provided thoughtful responses. Continue practicing to build confidence and clarity in your answers.';
        }
      }
    } else {
      // Use mock feedback system
      feedback = this.generateMockFeedback(answer, isVoice);
      
      if (log.currentQuestionIndex < 5) {
        const questionSet = mockQuestions[log.jobRole] || mockQuestions['General'];
        if (log.currentQuestionIndex < questionSet.length) {
          nextQuestion = questionSet[log.currentQuestionIndex];
          log.questions.push(nextQuestion);
        }
      } else {
        isComplete = true;
        feedback += '\n\nInterview completed! You\'ve answered all questions. Review the feedback to improve your interview skills.';
      }
    }

    // Save feedback and update log
    log.feedback.push(feedback);
    if (isComplete) {
      log.completedAt = new Date();
    }
    
    await log.save();

    res.json({ 
      feedback, 
      nextQuestion,
      questionNumber: log.currentQuestionIndex + 1,
      totalQuestions: 5,
      isComplete,
      progress: Math.round((log.currentQuestionIndex / 5) * 100)
    });

  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ 
      msg: 'Error processing answer', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Helper function for mock feedback
exports.generateMockFeedback = (answer, isVoice) => {
  const feedbackTemplates = [
    "Good response! Your answer shows relevant experience. Try to provide more specific examples to strengthen your response.",
    "Well articulated! You demonstrated good knowledge. Consider elaborating on the impact of your actions.",
    "Nice answer! You covered the key points. Adding quantifiable results would make your response even stronger.",
    "Solid response! Your experience is relevant. Try to structure your answer using the STAR method (Situation, Task, Action, Result).",
    "Great insight! Your answer shows good understanding. Consider providing a brief example to illustrate your point."
  ];

  let feedback = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  
  if (isVoice) {
    feedback += " Your speech was clear and confident. Remember to pause briefly between points for better emphasis.";
  }
  
  return feedback;
};

exports.getInterviewLogs = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const logs = await InterviewLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 interviews
      .select('-userId'); // Don't expose user ID for security

    res.json(logs);
  } catch (err) {
    console.error('Get interview logs error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// New endpoint to get a specific interview log by ID
exports.getInterviewById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { id } = req.params;
    const log = await InterviewLog.findOne({ 
      _id: id, 
      userId: req.user.id 
    }).select('-userId');

    if (!log) {
      return res.status(404).json({ msg: 'Interview log not found' });
    }

    res.json(log);
  } catch (err) {
    console.error('Get interview by ID error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// New endpoint to delete an interview log
exports.deleteInterview = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'User not authenticated' });
    }

    const { id } = req.params;
    const log = await InterviewLog.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!log) {
      return res.status(404).json({ msg: 'Interview log not found' });
    }

    res.json({ msg: 'Interview log deleted successfully' });
  } catch (err) {
    console.error('Delete interview error:', err);
    res.status(500).json({ 
      msg: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};