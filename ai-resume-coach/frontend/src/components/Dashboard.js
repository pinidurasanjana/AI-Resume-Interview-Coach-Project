// frontend/src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Upload, 
  Award, 
  MessageCircle, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Brain,
  Star,
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const [resumes, setResumes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    resumeScore: 0,
    totalInterviews: 0,
    jobMatches: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch resumes
      const resumeRes = await axios.get('/api/resume/');
      setResumes(resumeRes.data);
      
      // Fetch interview logs
      const logsRes = await axios.get('/api/interview/logs');
      setLogs(logsRes.data);
      
      // Calculate stats
      const latestScore = resumeRes.data.length > 0 ? resumeRes.data[0].score || 0 : 0;
      setStats({
        resumeScore: latestScore,
        totalInterviews: logsRes.data.length,
        jobMatches: Math.floor(Math.random() * 30) + 15 // Mock data for job matches
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const StatsCard = ({ icon: Icon, title, value, change, color, link }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600'
    };

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer"
        onClick={() => link && (window.location.href = link)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className="text-green-600 text-sm font-medium mt-1">{change}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    );
  };

  const ProgressItem = ({ label, progress }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
        ></motion.div>
      </div>
    </div>
  );

  const ActivityItem = ({ action, time, score, type = 'resume' }) => {
    const getIcon = () => {
      switch (type) {
        case 'interview':
          return MessageCircle;
        case 'job':
          return Target;
        default:
          return FileText;
      }
    };

    const Icon = getIcon();

    return (
      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{action}</p>
          <p className="text-xs text-gray-500">{time}</p>
        </div>
        <div className="text-sm font-semibold text-green-600">{score}</div>
      </div>
    );
  };

  const QuickActionCard = ({ icon: Icon, title, description, link, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      green: 'from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700',
      purple: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
    };

    return (
      <Link to={link}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`bg-gradient-to-r ${colorClasses[color]} rounded-xl p-6 text-white cursor-pointer transition-all duration-200`}
        >
          <div className="flex items-center space-x-3">
            <Icon className="w-8 h-8" />
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm opacity-90">{description}</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto" />
          </div>
        </motion.div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Welcome back! 👋
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl opacity-90 mb-6"
          >
            Your AI-powered career advancement journey continues
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/resume-upload">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Analyze Resume</span>
              </button>
            </Link>
            <Link to="/mock-interview">
              <button className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Practice Interview</span>
              </button>
            </Link>
          </motion.div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-10 -left-8 w-32 h-32 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          icon={Award}
          title="Latest Resume Score"
          value={`${stats.resumeScore}%`}
          change={stats.resumeScore > 0 ? "+12% from last analysis" : null}
          color="blue"
        />
        <StatsCard
          icon={MessageCircle}
          title="Interviews Completed"
          value={stats.totalInterviews}
          change={stats.totalInterviews > 0 ? `+${Math.min(stats.totalInterviews, 5)} this week` : null}
          color="purple"
        />
        <StatsCard
          icon={Target}
          title="Job Matches"
          value={stats.jobMatches}
          change="+8 new matches"
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          icon={Upload}
          title="Upload Resume"
          description="Get AI-powered analysis and score"
          link="/resume-upload"
          color="blue"
        />
        <QuickActionCard
          icon={FileText}
          title="Build Resume"
          description="Create tailored resume with AI"
          link="/resume-builder"
          color="green"
        />
        <QuickActionCard
          icon={MessageCircle}
          title="Mock Interview"
          description="Practice with AI interviewer"
          link="/mock-interview"
          color="purple"
        />
      </div>

      {/* Recent Activity & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Progress Overview</span>
          </h3>
          <div className="space-y-4">
            <ProgressItem 
              label="Resume Optimization" 
              progress={Math.min(stats.resumeScore, 100)} 
            />
            <ProgressItem 
              label="Interview Skills" 
              progress={Math.min(stats.totalInterviews * 15, 100)} 
            />
            <ProgressItem 
              label="ATS Compatibility" 
              progress={Math.max(stats.resumeScore - 10, 0)} 
            />
            <ProgressItem 
              label="Skill Matching" 
              progress={Math.min(stats.jobMatches * 2, 100)} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>Recent Activity</span>
          </h3>
          <div className="space-y-4">
            {resumes.length === 0 && logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet. Start by uploading a resume!</p>
              </div>
            ) : (
              <>
                {resumes.slice(0, 2).map((resume, index) => (
                  <ActivityItem
                    key={`resume-${index}`}
                    action={`Resume analyzed - Score: ${resume.score}%`}
                    time={new Date(resume.createdAt).toLocaleDateString()}
                    score={`${resume.score}%`}
                    type="resume"
                  />
                ))}
                {logs.slice(0, 2).map((log, index) => (
                  <ActivityItem
                    key={`interview-${index}`}
                    action={`Mock interview - ${log.jobRole || 'General'}`}
                    time={new Date(log.createdAt).toLocaleDateString()}
                    score={`${log.questions?.length || 0} questions`}
                    type="interview"
                  />
                ))}
              </>
            )}
            
            {(resumes.length > 0 || logs.length > 0) && (
              <div className="pt-4 border-t">
                <Link 
                  to="/resume-analysis" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View all activity</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;