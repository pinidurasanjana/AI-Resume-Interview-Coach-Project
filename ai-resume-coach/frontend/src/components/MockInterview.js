// frontend/src/components/MockInterview.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Send, 
  Users, 
  Brain,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  RotateCcw,
  Award,
  ArrowRight,
  Lightbulb
} from 'lucide-react';

const MockInterview = () => {
  const [jobRole, setJobRole] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [logId, setLogId] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions] = useState(5); // Limit to 5 questions
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [answerHistory, setAnswerHistory] = useState([]);

  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentAnswer(prev => prev + finalTranscript + ' ');
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (interviewStarted && !interviewCompleted) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interviewStarted, interviewCompleted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startInterview = async () => {
    if (!jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/interview/start', { jobRole: jobRole.trim() });
      setCurrentQuestion(response.data.question);
      setLogId(response.data.logId);
      setInterviewStarted(true);
      setQuestionNumber(1);
      setTimeElapsed(0);
    } catch (err) {
      console.error('Error starting interview:', err);
      setError(err.response?.data?.msg || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/interview/answer', {
        logId,
        answer: currentAnswer.trim(),
        isVoice: isRecording
      });

      // Store the current Q&A
      setAnswerHistory(prev => [...prev, {
        question: currentQuestion,
        answer: currentAnswer.trim(),
        feedback: response.data.feedback
      }]);

      setFeedback(response.data.feedback);

      if (response.data.nextQuestion && questionNumber < totalQuestions) {
        // Continue with next question
        setTimeout(() => {
          setCurrentQuestion(response.data.nextQuestion);
          setCurrentAnswer('');
          setFeedback('');
          setQuestionNumber(prev => prev + 1);
        }, 3000); // Show feedback for 3 seconds
      } else {
        // Interview completed
        setTimeout(() => {
          setInterviewCompleted(true);
          setInterviewStarted(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.response?.data?.msg || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognition) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const resetInterview = () => {
    setJobRole('');
    setCurrentQuestion('');
    setCurrentAnswer('');
    setFeedback('');
    setLogId(null);
    setQuestionNumber(0);
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setIsRecording(false);
    setTimeElapsed(0);
    setAnswerHistory([]);
    setError('');
  };
  // Interview setup screen
  if (!interviewStarted && !interviewCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mock Interview</h2>
            <p className="text-gray-600">Practice with our AI interviewer and get instant feedback</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Role *
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager, Sales Associate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <motion.button
                onClick={startInterview}
                disabled={loading || !jobRole.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <>
                        <Play className="w-5 h-5" />
                        <span>Start Interview</span>
                    </>
                )}
                </motion.button>
            </div>

            <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Interview Tips
                </h3>
                <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span className="text-sm">Speak clearly and confidently</span>
                    </li>
                    <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span className="text-sm">Take your time to think before answering</span>
                    </li>
                    <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600" />
                    <span className="text-sm">Use specific examples from your experience</span>
                    </li>
                </ul>
                </div>
            </div>
            </div>
        </div>
        </motion.div>
    );
    }

    // Rest of the component would go here
    return null;
};

export default MockInterview;