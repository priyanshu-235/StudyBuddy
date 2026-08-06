const redisClient = require('../config/redis');
const { isRedisReady } = require('../config/redis');
const { createRateLimitService } = require('../services/rateLimitService');

const runRateLimitService = createRateLimitService(redisClient, {
  isReady: isRedisReady,
});

const runRateLimiter = async (req, res, next) => {
  const userId = req.result?._id?.toString();

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to run code.',
    });
  }

  const result = await runRateLimitService.checkLimit(userId);

  res.setHeader('X-RateLimit-Limit', result.limit ?? '');
  res.setHeader('X-RateLimit-Remaining', result.remaining ?? '');

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfterSeconds);

    return res.status(429).json({
      error: 'Too many requests',
      message: `Run limit reached (${result.limit} runs per ${result.windowSeconds}s). Please wait ${result.retryAfterSeconds}s before trying again.`,
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }

  return next();
};

module.exports = runRateLimiter;
