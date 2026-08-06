const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const runRateLimiter = require("../middleware/runRateLimiter");
const { submitCode } = require("../controllers/userSubmission");
const { runCode } = require("../controllers/runController");

submitRouter.post("/submit/:id", userMiddleware,runRateLimiter, submitCode);
submitRouter.post("/run/:id", userMiddleware, runRateLimiter, runCode);

module.exports = submitRouter;
