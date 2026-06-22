const { createClient }  = require('redis');

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: 'redis-12138.c44.us-east-1-2.ec2.cloud.redislabs.com',
        port: 12138
    }
});

module.exports = redisClient;