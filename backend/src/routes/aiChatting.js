const express = require('express');
const aiRouter =  express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const { solveDoubt, solveDoubtStream } = require('../controllers/solveDoubt');

aiRouter.post('/chat', userMiddleware, solveDoubt);
aiRouter.post('/chat/stream', userMiddleware, solveDoubtStream);

module.exports = aiRouter;