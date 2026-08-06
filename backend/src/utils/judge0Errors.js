const USER_FACING_STATUS_IDS = new Set([4, 5, 6, 7, 8, 9, 10, 11, 12]);

const STATUS_EXPLANATIONS = {
  4: 'Output does not match the expected result.',
  5: 'Time limit exceeded. Try a more efficient approach.',
  6: 'Compilation failed. Fix the syntax or type errors below.',
  7: 'Runtime error (segmentation fault) — check array bounds and pointer usage.',
  8: 'Runtime error — file size limit exceeded.',
  9: 'Runtime error — floating point exception (e.g. division by zero).',
  10: 'Runtime error — program aborted unexpectedly.',
  11: 'Runtime error — program exited with a non-zero status code.',
  12: 'Runtime error occurred during execution.',
};

const SYSTEM_STATUS_EXPLANATION =
  'Execution failed due to a system error. Please try again.';

class Judge0Error extends Error {
  constructor({
    code,
    message,
    userMessage,
    httpStatus = 503,
    details = null,
    isUserFacing = false,
  }) {
    super(message || userMessage);
    this.name = 'Judge0Error';
    this.code = code;
    this.userMessage = userMessage;
    this.httpStatus = httpStatus;
    this.details = details;
    this.isUserFacing = isUserFacing;
  }
}

function extractApiMessage(data) {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    return data.trim() || null;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (data.error?.message) {
    return data.error.message;
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map((entry) => entry.message || entry).join('; ');
  }

  return null;
}

function sanitizeJudge0Text(raw) {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const text = raw
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\/box\/[^\s:]+\.(cpp|c|java|py|js)/gi, 'your code')
    .replace(/\/tmp\/[^\s:]+/g, '[temp]')
    .trim();

  if (!text) {
    return null;
  }

  const systemPatterns = [
    /judge0/i,
    /rapidapi/i,
    /isolate/i,
    /internal error/i,
    /authentication failed/i,
    /invalid api key/i,
  ];

  if (systemPatterns.some((pattern) => pattern.test(text))) {
    return null;
  }

  return text;
}

function parseAxiosJudge0Error(error) {
  if (error instanceof Judge0Error) {
    return error;
  }

  if (error.response) {
    const { status, data } = error.response;
    const apiMessage = sanitizeJudge0Text(extractApiMessage(data));

    if (status === 400 || status === 422) {
      return new Judge0Error({
        code: 'JUDGE0_INVALID_REQUEST',
        message: apiMessage || `Judge0 rejected the request (${status})`,
        userMessage:
          apiMessage ||
          'Your code could not be submitted for execution. Check your language and code.',
        httpStatus: 400,
        details: data,
        isUserFacing: Boolean(apiMessage),
      });
    }

    if (status === 429) {
      const retryAfter = error.response.headers?.['retry-after'];

      return new Judge0Error({
        code: 'JUDGE0_RATE_LIMIT',
        message: 'Judge0 rate limit exceeded',
        userMessage:
          'Code execution is temporarily busy. Please wait a moment and try again.',
        httpStatus: 429,
        details: { retryAfter },
        isUserFacing: true,
      });
    }

    if (status === 401 || status === 403) {
      return new Judge0Error({
        code: 'JUDGE0_AUTH',
        message: apiMessage || 'Judge0 authentication failed',
        userMessage:
          'Code execution service is unavailable. Please try again later.',
        httpStatus: 503,
        details: data,
        isUserFacing: false,
      });
    }

    if (status >= 500) {
      return new Judge0Error({
        code: 'JUDGE0_UNAVAILABLE',
        message: apiMessage || `Judge0 server error (${status})`,
        userMessage:
          'Code execution service is temporarily unavailable. Please try again later.',
        httpStatus: 503,
        details: data,
        isUserFacing: false,
      });
    }

    return new Judge0Error({
      code: 'JUDGE0_HTTP_ERROR',
      message: apiMessage || `Judge0 HTTP error (${status})`,
      userMessage:
        apiMessage ||
        'Code execution failed. Please try again.',
      httpStatus: status >= 400 && status < 500 ? 400 : 503,
      details: data,
      isUserFacing: Boolean(apiMessage) && status < 500,
    });
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new Judge0Error({
      code: 'JUDGE0_TIMEOUT',
      message: error.message,
      userMessage:
        'Code execution timed out while waiting for results. Please try again.',
      httpStatus: 503,
      isUserFacing: true,
    });
  }

  if (error.request) {
    return new Judge0Error({
      code: 'JUDGE0_NETWORK',
      message: error.message,
      userMessage:
        'Unable to reach the code execution service. Please try again later.',
      httpStatus: 503,
      isUserFacing: false,
    });
  }

  return new Judge0Error({
    code: 'JUDGE0_UNKNOWN',
    message: error.message,
    userMessage:
      'Code execution service temporarily unavailable. Please try again later.',
    httpStatus: 503,
    isUserFacing: false,
  });
}

function assertBatchSubmitResponse(data) {
  if (!Array.isArray(data)) {
    throw new Judge0Error({
      code: 'JUDGE0_INVALID_RESPONSE',
      message: 'Judge0 batch submit returned unexpected response',
      userMessage:
        'Code execution service returned an unexpected response. Please try again.',
      httpStatus: 503,
      isUserFacing: false,
    });
  }

  const rejected = data.find((entry) => entry?.error);

  if (rejected) {
    const userText = sanitizeJudge0Text(
      typeof rejected.error === 'string'
        ? rejected.error
        : extractApiMessage(rejected.error)
    );

    throw new Judge0Error({
      code: 'JUDGE0_SUBMIT_REJECTED',
      message: userText || 'Judge0 rejected one or more submissions',
      userMessage:
        userText ||
        'Your code could not be submitted for execution. Please check your code.',
      httpStatus: 400,
      details: rejected,
      isUserFacing: Boolean(userText),
    });
  }

  const missingToken = data.find((entry) => !entry?.token);

  if (missingToken) {
    throw new Judge0Error({
      code: 'JUDGE0_MISSING_TOKEN',
      message: 'Judge0 batch submit response missing token',
      userMessage:
        'Code execution failed to start. Please try again.',
      httpStatus: 503,
      details: missingToken,
      isUserFacing: false,
    });
  }

  return data;
}

function assertPollResponse(data) {
  if (!data?.submissions || !Array.isArray(data.submissions)) {
    throw new Judge0Error({
      code: 'JUDGE0_INVALID_POLL_RESPONSE',
      message: 'Judge0 poll returned unexpected response',
      userMessage:
        'Code execution service returned an unexpected response. Please try again.',
      httpStatus: 503,
      isUserFacing: false,
    });
  }

  return data.submissions;
}

function parseSubmissionResult(submission) {
  const statusId = submission?.status_id;

  if (!statusId || statusId === 3) {
    return null;
  }

  const isUserFacing = USER_FACING_STATUS_IDS.has(statusId);
  const compileOutput = sanitizeJudge0Text(submission.compile_output);
  const stderr = sanitizeJudge0Text(submission.stderr);
  const judgeMessage = sanitizeJudge0Text(submission.message);

  let detail = null;

  if (statusId === 6) {
    detail = compileOutput || stderr;
  } else if (statusId !== 4) {
    detail = stderr || judgeMessage;
  }

  return {
    statusId,
    status:
      submission.status?.description ||
      (isUserFacing ? 'Execution Error' : 'Execution failed'),
    explanation: isUserFacing
      ? STATUS_EXPLANATIONS[statusId] || 'An error occurred while running your code.'
      : SYSTEM_STATUS_EXPLANATION,
    detail,
    compileOutput: statusId === 6 ? detail : null,
    stderr: statusId !== 6 ? detail : null,
    isUserFacing,
  };
}

function getFirstSubmissionFailure(submissions) {
  return submissions.map(parseSubmissionResult).find(Boolean) || null;
}

module.exports = {
  Judge0Error,
  parseAxiosJudge0Error,
  assertBatchSubmitResponse,
  assertPollResponse,
  parseSubmissionResult,
  getFirstSubmissionFailure,
  sanitizeJudge0Text,
};
