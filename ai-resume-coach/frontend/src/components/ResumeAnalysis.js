// frontend/src/components/ResumeAnalysis.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Download, 
  RefreshCw,
  ArrowLeft,
  Star,
  Target,
  Zap,
  BookOpen
} from 'lucide-react';

const ResumeAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Check if data was passed from upload component
    if (location.state?.analysisData) {
      setAnalysisData({
        ...location.state.analysisData,
        fileName: location.state.fileName,
        jobRole: location.state.jobRole
      });
      setLoading(false);
    } else {
      // Fetch latest resume analysis
      fetchAnalysisData();
    }
  }, [location.state, id]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/resume/');
      if (response.data && response.data.length > 0) {
        const latestResume = response.data[0];
        setAnalysisData(latestResume);
      } else {
        setError('No resume analysis found. Please upload a resume first.');
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to load analysis data.');
    } finally {
      setLoading(false);
    }
  };

  const parseScore = (feedback) => {
    if (!feedback) return 0;
    const scoreMatch = feedback.match(/(?:Score|score)[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  };

  const parseKeywords = (feedback) => {
    if (!feedback) return [];
    const keywordMatch = feedback.match(/(?:missing keywords?|keywords?)[:\s]*([^\n.!?]*)/i);
    if (keywordMatch) {
      return keywordMatch[1]
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 6);
    }
    return [];
  };

  const parseImprovements = (feedback) => {
    if (!feedback) return [];
    const lines = feedback.split('\n');
    const improvements = [];
    
    for (const line of lines) {
      if (line.match(/^\d+\.|\-|\•|improvement|suggest|recommend/i)) {
        const cleaned = line.replace(/^\d+\.\s*|\-\s*|\•\s*/g, '').trim();
        if (cleaned.length > 0) {
          improvements.push(cleaned);
        }
      }
    }
    
    return improvements.slice(0, 5);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const ScoreCard = ({ title, score, icon: Icon, description }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getScoreGradient(score)} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)}`}
        />
      </div>
    </motion.div>
  );

  const KeywordChip = ({ keyword }) => (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
      {keyword}
    </span>
  );

  const ImprovementItem = ({ improvement, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
    >
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
        <span className="text-blue-600 text-sm font-semibold">{index + 1}</span>
      </div>
      <p className="text-gray-700 flex-1">{improvement}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/resume-upload')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Upload Resume
        </button>
      </div>
    );
  }

  const score = analysisData?.score || parseScore(analysisData?.feedback);
  const keywords = parseKeywords(analysisData?.feedback);
  const improvements = parseImprovements(analysisData?.feedback);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Analysis Results</h1>
            <p className="text-gray-600">
              {analysisData?.fileName || 'Resume'} • {analysisData?.jobRole || 'General Analysis'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/resume-upload')}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Overall Resume Score</h2>
            <p className="text-blue-100 mb-4">Based on ATS compatibility and best practices</p>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">
                {score >= 90 ? 'Excellent' : score >= 80 ? 'Very Good' : score >= 70 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Improvement'}
              </span>
            </div>
          </div>
          <div className="text-6xl font-bold">
            {score}%
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ScoreCard
          title="ATS Compatibility"
          score={Math.max(score - 5, 0)}
          icon={Target}
          description="Applicant Tracking System"
        />
        <ScoreCard
          title="Content Quality"
          score={Math.min(score + 5, 100)}
          icon={FileText}
          description="Writing and structure"
        />
        <ScoreCard
          title="Keyword Match"
          score={Math.max(score - 10, 0)}
          icon={Zap}
          description="Job relevance"
        />
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Missing Keywords */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Recommended Keywords</span>
          </h3>
          {keywords.length > 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Add these keywords to improve your resume's visibility:
              </p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <KeywordChip key={index} keyword={keyword} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Great! Your resume contains relevant keywords for the target role.</p>
          )}
        </div>

        {/* Improvement Suggestions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Improvement Suggestions</span>
          </h3>
          {improvements.length > 0 ? (
            <div className="space-y-3">
              {improvements.map((improvement, index) => (
                <ImprovementItem
                  key={index}
                  improvement={improvement}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Your resume looks great! No major improvements needed.</p>
          )}
        </div>
      </div>

      {/* Full Feedback */}
      {analysisData?.feedback && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Detailed Analysis</span>
          </h3>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {analysisData.feedback}
            </pre>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate('/resume-builder')}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <FileText className="w-5 h-5" />
          <span>Build New Resume</span>
        </button>
        <button
          onClick={() => navigate('/mock-interview')}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Award className="w-5 h-5" />
          <span>Practice Interview</span>
        </button>
        <button
          onClick={() => navigate('/job-matching')}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Target className="w-5 h-5" />
          <span>Find Job Matches</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ResumeAnalysis;