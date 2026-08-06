const { createClient } = require('redis');

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASS,
  socket: {
    host:
      process.env.REDIS_HOST ||
      'redis-16377.c264.ap-south-1-1.ec2.cloud.redislabs.com',
    port: parseInt(process.env.REDIS_PORT || '16377', 10),
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on('error', (error) => {
  console.warn('[Redis] Client error:', error.message);
});

redisClient.on('reconnecting', () => {
  console.warn('[Redis] Reconnecting...');
});

redisClient.on('ready', () => {
  console.log('[Redis] Client ready');
});

function isRedisReady() {
  return redisClient.isReady;
}

module.exports = redisClient;
module.exports.isRedisReady = isRedisReady;
