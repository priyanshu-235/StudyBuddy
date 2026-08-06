// Judge0 status codes — https://ce.judge0.com/statuses
export const JUDGE0_STATUS = {
  1: { description: 'In Queue', type: 'pending', userFacing: false },
  2: { description: 'Processing', type: 'pending', userFacing: false },
  3: { description: 'Accepted', type: 'success', userFacing: true },
  4: { description: 'Wrong Answer', type: 'error', userFacing: true },
  5: { description: 'Time Limit Exceeded', type: 'error', userFacing: true },
  6: { description: 'Compilation Error', type: 'error', userFacing: true },
  7: { description: 'Runtime Error (SIGSEGV)', type: 'error', userFacing: true },
  8: { description: 'Runtime Error (SIGXFSZ)', type: 'error', userFacing: true },
  9: { description: 'Runtime Error (SIGFPE)', type: 'error', userFacing: true },
  10: { description: 'Runtime Error (SIGABRT)', type: 'error', userFacing: true },
  11: { description: 'Runtime Error (NZEC)', type: 'error', userFacing: true },
  12: { description: 'Runtime Error (Other)', type: 'error', userFacing: true },
  13: { description: 'Internal Error', type: 'error', userFacing: false },
  14: { description: 'Exec Format Error', type: 'error', userFacing: false },
};

const USER_EXPLANATIONS = {
  4: 'Your output does not match the expected result for this test case.',
  5: 'Your code exceeded the time limit. Try a more efficient approach.',
  6: 'Your code could not be compiled. Fix the syntax or type errors below.',
  7: 'Segmentation fault — often caused by invalid memory access or out-of-bounds indexing.',
  8: 'File size limit exceeded during execution.',
  9: 'Floating point exception — check for division by zero or invalid math operations.',
  10: 'Your program aborted unexpectedly during execution.',
  11: 'Your program exited with a non-zero status code. Check edge cases and input handling.',
  12: 'A runtime error occurred while executing your code.',
};

const SYSTEM_FALLBACK = {
  status: 'Execution failed',
  explanation:
    'Something went wrong on our side while running your code. Please try again in a moment.',
};

const MAX_OUTPUT_LENGTH = 4000;

function sanitizeUserOutput(raw) {
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  let text = raw
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\/box\/[^\s:]+\.(cpp|c|java|py|js)/gi, 'your code')
    .replace(/\/tmp\/[^\s:]+/g, '[temp]')
    .replace(/\bat\s+[\w./\\-]+:\d+/g, '')
    .trim();

  if (!text) {
    return null;
  }

  if (text.length > MAX_OUTPUT_LENGTH) {
    text = `${text.slice(0, MAX_OUTPUT_LENGTH)}\n… (output truncated)`;
  }

  return text;
}

function isSystemNoise(text) {
  if (!text) return true;

  const noisePatterns = [
    /judge0/i,
    /rapidapi/i,
    /isolate/i,
    /docker/i,
    /internal error/i,
    /server error/i,
    /connection refused/i,
    /ECONNREFUSED/i,
  ];

  return noisePatterns.some((pattern) => pattern.test(text));
}

export function getJudge0StatusMessage(statusId) {
  const status = JUDGE0_STATUS[statusId];

  if (!status) {
    return { description: 'Unknown Error', type: 'error', userFacing: false };
  }

  return status;
}

export function getJudge0ErrorDetails(statusId, payload = {}) {
  if (statusId === 3) {
    return null;
  }

  const status = getJudge0StatusMessage(statusId);
  const stderr = payload.stderr;
  const compileOutput = payload.compile_output ?? payload.compileOutput;
  const judgeMessage = payload.message;

  if (!status.userFacing) {
    return {
      status: SYSTEM_FALLBACK.status,
      type: 'error',
      explanation: SYSTEM_FALLBACK.explanation,
      stderr: null,
      compileOutput: null,
      isUserFacing: false,
    };
  }

  const sanitizedCompile = sanitizeUserOutput(compileOutput);
  const sanitizedStderr = sanitizeUserOutput(stderr);
  const sanitizedMessage = sanitizeUserOutput(judgeMessage);

  let detail = null;

  if (statusId === 6) {
    detail = sanitizedCompile || sanitizedStderr;
  } else if (statusId === 4) {
    detail = null;
  } else {
    detail =
      sanitizedStderr ||
      (sanitizedMessage && !isSystemNoise(sanitizedMessage) ? sanitizedMessage : null);
  }

  return {
    status: status.description,
    type: status.type,
    explanation: USER_EXPLANATIONS[statusId] || 'An error occurred while running your code.',
    stderr: statusId === 6 ? null : detail,
    compileOutput: statusId === 6 ? detail : null,
    isUserFacing: true,
  };
}

export function getPrimaryRunFailure(testCases = []) {
  const failedCase = testCases.find((tc) => tc.status_id !== 3);
  if (!failedCase) {
    return null;
  }

  return getJudge0ErrorDetails(failedCase.status_id, failedCase);
}
