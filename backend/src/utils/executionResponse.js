const {
  Judge0Error,
  getFirstSubmissionFailure,
} = require('../utils/judge0Errors');

function sendJudge0Error(res, error) {
  if (error instanceof Judge0Error) {
    return res.status(error.httpStatus).json({
      error: error.code,
      message: error.userMessage,
    });
  }

  console.error('Unexpected execution error:', error);

  return res.status(503).json({
    error: 'EXECUTION_UNKNOWN',
    message:
      'Code execution service temporarily unavailable. Please try again later.',
  });
}

module.exports = {
  Judge0Error,
  getFirstSubmissionFailure,
  sendJudge0Error,
};
