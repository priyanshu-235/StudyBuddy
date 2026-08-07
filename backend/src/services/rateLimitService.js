const {
  RUN_RATE_LIMIT_MAX,
  RUN_RATE_LIMIT_WINDOW_SECONDS,
  RUN_RATE_LIMIT_KEY_PREFIX,
} = require('../config/rateLimitConfig');

function createRateLimitService(redisClient, options = {}) {
  const maxRequests = options.maxRequests ?? RUN_RATE_LIMIT_MAX;
  const windowSeconds = options.windowSeconds ?? RUN_RATE_LIMIT_WINDOW_SECONDS;
  const keyPrefix = options.keyPrefix ?? RUN_RATE_LIMIT_KEY_PREFIX;
  const isReady =
    options.isReady ?? (() => redisClient?.isReady ?? false);

  function buildKey(userId) {
    return `${keyPrefix}${userId}`;
  }

  async function checkLimit(userId) {
    if (!isReady()) {
      console.warn('[RateLimit] Redis unavailable — allowing request');
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
    }

    const key = buildKey(userId);

    try {
      const count = await redisClient.incr(key);

      if (count === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      const ttl = await redisClient.ttl(key);
      const remaining = Math.max(0, maxRequests - count);
      const allowed = count <= maxRequests;

      return {
        allowed,
        remaining,
        retryAfterSeconds: allowed ? 0 : Math.max(ttl, 1),
        limit: maxRequests,
        windowSeconds,
      };
    } catch (error) {
      console.warn('[RateLimit] Check failed — allowing request:', error.message);
      return { allowed: true, remaining: maxRequests, retryAfterSeconds: 0 };
    }
  }

  return { checkLimit };
}

module.exports = { createRateLimitService };
