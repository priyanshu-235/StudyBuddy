const express = require('express');
const activityRouter = express.Router();
const { getYearlyActivity } = require('../controllers/activityController');
const userMiddleware = require('../middleware/userMiddleware');

activityRouter.get('/yearly', userMiddleware, getYearlyActivity);

module.exports = activityRouter;
