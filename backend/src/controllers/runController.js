const Problem = require('../models/problem');
const { HashGenerationError } = require('../utils/hashExecution');
const { normalizeSourceCode } = require('../utils/normalizeExecutionInput');
const judgeService = require('../services/judgeService');
const redisClient = require('../config/redis');
const { isRedisReady } = require('../config/redis');
const {
  createExecutionCacheService,
} = require('../services/executionCacheService');
const { sendJudge0Error } = require('../utils/executionResponse');

const executionCacheService = createExecutionCacheService(redisClient, {
  isReady: isRedisReady,
});

function normalizeLanguage(language) {
  return language === 'cpp' ? 'c++' : language;
}

function toTestCaseResult(cachedValue, testcase) {
  return {
    ...cachedValue,
    stdin: testcase.input,
    expected_output: testcase.output,
  };
}

function aggregateRunResults(testResults) {
  let testCasesPassed = 0;
  let runtime = 0;
  let memory = 0;
  let success = true;

  for (const test of testResults) {
    if (test.status_id === 3) {
      testCasesPassed += 1;
      runtime += parseFloat(test.time || 0);
      memory = Math.max(memory, test.memory || 0);
    } else {
      success = false;
    }
  }

  return {
    success,
    runtime,
    memory,
    testCasesPassed,
  };
}

const runCode = async (req, res) => {
  const requestStart = Date.now();

  try {
    const userId = req.result._id;
    const problemId = req.params.id;
    let { code, language } = req.body;

    if (!userId || !code || !problemId || !language) {
      return res.status(400).send('Some field missing');
    }

    language = normalizeLanguage(language);

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const languageId = judgeService.getLanguageById(language);
    if (!languageId) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const normalizedCode = normalizeSourceCode(code);
    const visibleTestCases = problem.visibleTestCases || [];
    const results = new Array(visibleTestCases.length);
    const missIndices = [];
    const missSubmissions = [];

    let allCached = visibleTestCases.length > 0;
    let totalLookupMs = 0;
    let hadCacheMiss = false;

    for (let index = 0; index < visibleTestCases.length; index += 1) {
      const testcase = visibleTestCases[index];

      let cacheLookup;

      try {
        cacheLookup = await executionCacheService.getCachedExecution(
          languageId,
          normalizedCode,
          testcase.input
        );
      } catch (error) {
        if (error instanceof HashGenerationError) {
          return res.status(500).json({
            error: 'Failed to generate execution hash',
            message: 'Unable to process code execution request.',
          });
        }

        throw error;
      }

      if (cacheLookup?.hit) {
        totalLookupMs += cacheLookup.lookupMs;
        results[index] = toTestCaseResult(cacheLookup.value, testcase);
        continue;
      }

      allCached = false;
      hadCacheMiss = true;

      if (cacheLookup?.lookupMs) {
        totalLookupMs += cacheLookup.lookupMs;
      }

      missIndices.push(index);
      missSubmissions.push({
        source_code: code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      });
    }

    let totalJudgeMs = 0;

    if (missSubmissions.length > 0) {
      const judgeStart = Date.now();
      const submitResult = await judgeService.submitBatch(missSubmissions);
      const resultTokens = submitResult.map((value) => value.token);
      const judgeResults = await judgeService.pollSubmissions(resultTokens);
      totalJudgeMs = Date.now() - judgeStart;

      await executionCacheService.recordCacheMiss();

      const judgeMsPerCase = Math.round(totalJudgeMs / missSubmissions.length);

      for (let missIndex = 0; missIndex < missIndices.length; missIndex += 1) {
        const resultIndex = missIndices[missIndex];
        const testcase = visibleTestCases[resultIndex];
        const judgeResult = judgeResults[missIndex];

        results[resultIndex] = judgeResult;

        await executionCacheService.setCachedExecution(
          languageId,
          normalizedCode,
          testcase.input,
          judgeResult,
          judgeMsPerCase
        );
      }
    }

    const aggregated = aggregateRunResults(results);
    const totalMs = Date.now() - requestStart;

    if (allCached) {
      console.log(
        `[RunCode] Cache HIT | Lookup ${totalLookupMs}ms | Total ${totalMs}ms`
      );
    } else if (hadCacheMiss) {
      console.log(
        `[RunCode] Cache MISS | Judge ${totalJudgeMs}ms | Lookup ${totalLookupMs}ms | Total ${totalMs}ms`
      );
    } else {
      console.log(`[RunCode] No test cases | Total ${totalMs}ms`);
    }

    return res.status(201).json({
      cached: allCached,
      output: {
        success: aggregated.success,
        testCases: results,
        runtime: aggregated.runtime,
        memory: aggregated.memory,
      },
    });
  } catch (error) {
    console.error('Run code error:', error);
    return sendJudge0Error(res, error);
  }
};

module.exports = { runCode };
