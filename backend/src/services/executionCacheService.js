const {
  CACHE_KEY_PREFIX,
  EXECUTION_CACHE_TTL_SECONDS,
  STATS_KEYS,
} = require('../config/cacheConfig');
const { generateExecutionHash } = require('../utils/hashExecution');

function createExecutionCacheService(redisClient, options = {}) {
  const ttlSeconds =
    options.ttlSeconds ?? EXECUTION_CACHE_TTL_SECONDS;
  const isReady =
    options.isReady ?? (() => redisClient?.isReady ?? false);

  function buildCacheKey(hash) {
    return `${CACHE_KEY_PREFIX}${hash}`;
  }

  function serializeJudgeResult(judgeResult, judgeMs) {
    const cachedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    return {
      stdout: judgeResult.stdout ?? null,
      stderr: judgeResult.stderr ?? null,
      compile_output: judgeResult.compile_output ?? null,
      message: judgeResult.message ?? null,
      status: judgeResult.status ?? null,
      status_id: judgeResult.status_id,
      memory: judgeResult.memory,
      time: judgeResult.time,
      token: judgeResult.token ?? null,
      language_id: judgeResult.language_id,
      stdin: judgeResult.stdin ?? null,
      expected_output: judgeResult.expected_output ?? null,
      cachedAt,
      expiresAt,
      estimatedJudgeMs: judgeMs ?? 0,
    };
  }

  async function incrementStat(key, amount = 1) {
    if (!isReady()) {
      return;
    }

    try {
      await redisClient.incrBy(key, amount);
    } catch (error) {
      console.warn(`[ExecutionCache] Failed to increment stat ${key}:`, error.message);
    }
  }

  async function getCachedExecution(languageId, sourceCode, stdin) {
    if (!isReady()) {
      console.warn('[ExecutionCache] Redis unavailable — skipping cache lookup');
      return null;
    }

    const lookupStart = Date.now();

    try {
      const hash = generateExecutionHash(languageId, sourceCode, stdin);
      const key = buildCacheKey(hash);
      const raw = await redisClient.get(key);
      const lookupMs = Date.now() - lookupStart;

      if (!raw) {
        return { hit: false, lookupMs, hash };
      }

      const cached = JSON.parse(raw);
      await incrementStat(STATS_KEYS.hits);

      if (cached.estimatedJudgeMs > 0) {
        await incrementStat(STATS_KEYS.savedTimeMs, cached.estimatedJudgeMs);
      }

      return { hit: true, lookupMs, hash, value: cached };
    } catch (error) {
      console.warn('[ExecutionCache] Cache lookup failed:', error.message);
      return null;
    }
  }

  async function setCachedExecution(
    languageId,
    sourceCode,
    stdin,
    judgeResult,
    judgeMs
  ) {
    if (!isReady()) {
      return false;
    }

    try {
      const hash = generateExecutionHash(languageId, sourceCode, stdin);
      const key = buildCacheKey(hash);
      const value = serializeJudgeResult(judgeResult, judgeMs);

      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('[ExecutionCache] Cache write failed:', error.message);
      return false;
    }
  }

  async function recordCacheMiss() {
    await incrementStat(STATS_KEYS.misses);
  }

  async function getCacheStats() {
    if (!isReady()) {
      return {
        available: false,
        totalCacheHits: 0,
        totalCacheMisses: 0,
        hitRatio: 0,
        averageSavedTimeMs: 0,
        redisKeyCount: 0,
      };
    }

    const [hitsRaw, missesRaw, savedTimeRaw] = await Promise.all([
      redisClient.get(STATS_KEYS.hits),
      redisClient.get(STATS_KEYS.misses),
      redisClient.get(STATS_KEYS.savedTimeMs),
    ]);

    const totalCacheHits = parseInt(hitsRaw || '0', 10);
    const totalCacheMisses = parseInt(missesRaw || '0', 10);
    const totalSavedTimeMs = parseInt(savedTimeRaw || '0', 10);
    const totalLookups = totalCacheHits + totalCacheMisses;
    const hitRatio =
      totalLookups === 0
        ? 0
        : Number((totalCacheHits / totalLookups).toFixed(4));
    const averageSavedTimeMs =
      totalCacheHits === 0
        ? 0
        : Math.round(totalSavedTimeMs / totalCacheHits);

    let redisKeyCount = 0;

    for await (const _key of redisClient.scanIterator({
      MATCH: `${CACHE_KEY_PREFIX}*`,
      COUNT: 100,
    })) {
      redisKeyCount += 1;
    }

    return {
      available: true,
      totalCacheHits,
      totalCacheMisses,
      hitRatio,
      averageSavedTimeMs,
      redisKeyCount,
      ttlSeconds,
    };
  }

  return {
    getCachedExecution,
    setCachedExecution,
    recordCacheMiss,
    getCacheStats,
    ttlSeconds,
  };
}

module.exports = {
  createExecutionCacheService,
};
