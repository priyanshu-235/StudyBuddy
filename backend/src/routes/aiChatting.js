const express = require('express');
const aiRouter =  express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { aiTotalCallsLimiter } = require("../middleware/aiRateLimiter");
const { solveDoubt, solveDoubtStream } = require('../controllers/solveDoubt');

aiRouter.post('/chat', userMiddleware, aiTotalCallsLimiter, solveDoubt);
aiRouter.post('/chat/stream', userMiddleware, aiTotalCallsLimiter, solveDoubtStream);

module.exports = aiRouter;