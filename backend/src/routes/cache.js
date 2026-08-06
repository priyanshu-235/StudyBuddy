const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getCacheStats } = require('../controllers/cacheStatsController');

const cacheRouter = express.Router();

cacheRouter.get('/stats', adminMiddleware, getCacheStats);

module.exports = cacheRouter;
