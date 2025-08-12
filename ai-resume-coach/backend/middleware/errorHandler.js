// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      msg: 'File too large. Maximum size is 5MB.',
      error: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      msg: 'Unexpected file field.',
      error: 'UNEXPECTED_FILE'
    });
  }

  // MongoDB errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      msg: 'Validation Error',
      errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      msg: 'Invalid ID format',
      error: 'INVALID_ID'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      msg: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      msg: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
  }

  // OpenAI errors
  if (err.name === 'OpenAIError') {
    return res.status(500).json({
      msg: 'AI service temporarily unavailable',
      error: 'AI_SERVICE_ERROR'
    });
  }

  // File system errors
  if (err.code === 'ENOENT') {
    return res.status(400).json({
      msg: 'File not found',
      error: 'FILE_NOT_FOUND'
    });
  }

  if (err.code === 'EACCES') {
    return res.status(500).json({
      msg: 'File access denied',
      error: 'FILE_ACCESS_DENIED'
    });
  }

  // Default error
  return res.status(500).json({
    msg: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
