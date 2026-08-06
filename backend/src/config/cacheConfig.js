const EXECUTION_CACHE_TTL_SECONDS = parseInt(
  process.env.EXECUTION_CACHE_TTL_SECONDS || '3600',
  10
);

const CACHE_KEY_PREFIX = 'run:';

const STATS_KEYS = {
  hits: 'cache:stats:hits',
  misses: 'cache:stats:misses',
  savedTimeMs: 'cache:stats:saved_time_ms',
};

module.exports = {
  EXECUTION_CACHE_TTL_SECONDS,
  CACHE_KEY_PREFIX,
  STATS_KEYS,
};
