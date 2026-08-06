const redisClient = require('../config/redis');
const { isRedisReady } = require('../config/redis');
const {
  createExecutionCacheService,
} = require('../services/executionCacheService');

const executionCacheService = createExecutionCacheService(redisClient, {
  isReady: isRedisReady,
});

const getCacheStats = async (req, res) => {
  try {
    const stats = await executionCacheService.getCacheStats();

    return res.status(200).json({
      totalCacheHits: stats.totalCacheHits,
      totalCacheMisses: stats.totalCacheMisses,
      hitRatio: stats.hitRatio,
      averageSavedTimeMs: stats.averageSavedTimeMs,
      redisKeyCount: stats.redisKeyCount,
      ttlSeconds: stats.ttlSeconds,
      redisAvailable: stats.available,
    });
  } catch (error) {
    console.error('Cache stats error:', error);

    return res.status(500).json({
      error: 'Unable to retrieve cache statistics',
    });
  }
};

module.exports = { getCacheStats };
