const RUN_RATE_LIMIT_MAX = parseInt(process.env.RUN_RATE_LIMIT_MAX || '30', 10);
const RUN_RATE_LIMIT_WINDOW_SECONDS = parseInt(
  process.env.RUN_RATE_LIMIT_WINDOW_SECONDS || '60',
  10
);

const RUN_RATE_LIMIT_KEY_PREFIX = 'ratelimit:run:';

module.exports = {
  RUN_RATE_LIMIT_MAX,
  RUN_RATE_LIMIT_WINDOW_SECONDS,
  RUN_RATE_LIMIT_KEY_PREFIX,
};
