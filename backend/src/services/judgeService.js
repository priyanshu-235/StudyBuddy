const axios = require('axios');
const {
  Judge0Error,
  parseAxiosJudge0Error,
  assertBatchSubmitResponse,
  assertPollResponse,
} = require('../utils/judge0Errors');

const JUDGE0_BATCH_URL = 'https://judge0-ce.p.rapidapi.com/submissions/batch';
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30;

const LANGUAGE_IDS = {
  'c++': 54,
  java: 62,
  javascript: 63,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getLanguageById(lang) {
  return LANGUAGE_IDS[lang.toLowerCase()];
}

function getJudge0Headers() {
  if (!process.env.JUDGE0_KEY) {
    throw new Judge0Error({
      code: 'JUDGE0_CONFIG',
      message: 'JUDGE0_KEY is not configured',
      userMessage:
        'Code execution service is not configured. Please contact support.',
      httpStatus: 503,
      isUserFacing: false,
    });
  }

  return {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json',
  };
}

async function submitBatch(submissions) {
  try {
    const response = await axios.request({
      method: 'POST',
      url: JUDGE0_BATCH_URL,
      params: { base64_encoded: 'false' },
      headers: getJudge0Headers(),
      data: { submissions },
      timeout: 30000,
    });

    return assertBatchSubmitResponse(response.data);
  } catch (error) {
    throw parseAxiosJudge0Error(error);
  }
}

async function pollSubmissions(resultTokens) {
  const options = {
    method: 'GET',
    url: JUDGE0_BATCH_URL,
    params: {
      tokens: resultTokens.join(','),
      base64_encoded: 'false',
      fields: '*',
    },
    headers: getJudge0Headers(),
    timeout: 30000,
  };

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.request(options);
      const submissions = assertPollResponse(response.data);
      const isComplete = submissions.every((result) => result.status_id > 2);

      if (isComplete) {
        return submissions;
      }
    } catch (error) {
      throw parseAxiosJudge0Error(error);
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Judge0Error({
    code: 'JUDGE0_POLL_TIMEOUT',
    message: `Judge0 polling exceeded ${MAX_POLL_ATTEMPTS} attempts`,
    userMessage:
      'Code execution took too long to complete. Please try again.',
    httpStatus: 503,
    isUserFacing: true,
  });
}

module.exports = {
  getLanguageById,
  submitBatch,
  pollSubmissions,
  Judge0Error,
};
