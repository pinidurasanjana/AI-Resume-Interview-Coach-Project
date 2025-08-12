// frontend/src/components/JobMatching.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Search, 
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Clock,
  Building,
  Star
} from 'lucide-react';

const JobMatching = () => {
  const [formData, setFormData] = useState({
    skills: '',
    experience: '',
    location: '',
    salaryRange: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showJobs, setShowJobs] = useState(false);
  const [suggestions, setSuggestions] = useState('');

  // Mock job data for demonstration
  const mockJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      type: 'Full-time',
      posted: '2 days ago',
      match: 95,
      description: 'Join our dynamic team building cutting-edge web applications using React, TypeScript, and modern tools.',
      requirements: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git'],
      benefits: ['Health Insurance', 'Remote Work', '401k Matching']
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$100k - $140k',
      type: 'Full-time',
      posted: '1 week ago',
      match: 88,
      description: 'Build scalable web applications from frontend to backend in a fast-paced startup environment.',
      requirements: ['Node.js', 'React', 'MongoDB', 'AWS', 'Docker'],
      benefits: ['Equity Options', 'Flexible Hours', 'Learning Budget']
    },
    {
      id: 3,
      title: 'React Developer',
      company: 'Digital Solutions',
      location: 'New York, NY',
      salary: '$90k - $120k',
      type: 'Contract',
      posted: '3 days ago',
      match: 82,
      description: 'Develop responsive user interfaces for enterprise clients using React and modern JavaScript.',
      requirements: ['React', 'JavaScript', 'HTML/CSS', 'Redux', 'REST APIs'],
      benefits: ['Competitive Rate', 'Project Variety', 'Skill Development']
    }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.skills.trim() || !formData.experience.trim()) {
      setError('Please fill in skills and experience fields');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI suggestions based on input
      const mockSuggestions = `Based on your skills and experience, here are personalized career recommendations:

🎯 **Recommended Positions:**
• Senior Frontend Developer - Your React and JavaScript skills are in high demand
• Full Stack Engineer - Your experience spans both frontend and backend development
• Technical Lead - Your experience level suggests leadership opportunities

💡 **Skill Enhancement:**
• Consider learning TypeScript to increase marketability
• Cloud platforms (AWS/Azure) are highly valued
• DevOps skills could open additional opportunities

📈 **Market Insights:**
• Frontend roles are growing 15% year-over-year
• Remote opportunities have increased significantly
• Companies are prioritizing candidates with your skill set

🎯 **Next Steps:**
• Update your portfolio with recent projects
• Consider obtaining relevant certifications
• Network within the tech community`;

      setSuggestions(mockSuggestions);
      setShowJobs(true);
    } catch (err) {
      setError('Failed to generate job matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const JobCard = ({ job }) => {
    const getMatchColor = (match) => {
      if (match >= 90) return 'text-green-600 bg-green-50';
      if (match >= 80) return 'text-blue-600 bg-blue-50';
      if (match >= 70) return 'text-yellow-600 bg-yellow-50';
      return 'text-gray-600 bg-gray-50';
    };

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-semibold text-lg text-gray-900 mb-1">{job.title}</h4>
            <div className="flex items-center space-x-2 text-gray-600 mb-2">
              <Building className="w-4 h-4" />
              <span className="text-sm">{job.company}</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(job.match)}`}>
            {job.match}% match
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <DollarSign className="w-4 h-4" />
            <span>{job.salary}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <Clock className="w-4 h-4" />
            <span>{job.posted} • {job.type}</span>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-3">{job.description}</p>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">Key Requirements:</p>
          <div className="flex flex-wrap gap-1">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="text-gray-500 text-xs px-2 py-1">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2">
          <span>View Details</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Job Matching</h2>
        <p className="text-gray-600">Find jobs that match your skills and experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Target className="w-4 h-4" />
                <span>Skills *</span>
              </label>
              <textarea
                rows={3}
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                placeholder="List your technical skills, programming languages, tools..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Briefcase className="w-4 h-4" />
                <span>Experience *</span>
              </label>
              <textarea
                rows={4}
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="Describe your work experience, years in field, key achievements..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>Preferred Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State or 'Remote'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4" />
                <span>Salary Range</span>
              </label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                placeholder="e.g., $80k - $120k"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{loading ? 'Finding Matches...' : 'Find Job Matches'}</span>
            </motion.button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          {!showJobs ? (
            <div className="flex flex-col items-center justify-center h-full min-h-96 text-center">
              <Target className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Recommendations</h3>
              <p className="text-gray-600">Enter your skills and experience to find matching job opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Career Suggestions</h3>
              {suggestions && (
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {suggestions}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Listings */}
      {showJobs && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Recommended Jobs</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>{mockJobs.length} matches found</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default JobMatching;
