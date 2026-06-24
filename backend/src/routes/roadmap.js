const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getRoadmap,
  updateTopicMeta,
  addProblemToTopic,
  removeProblemFromTopic,
  reorderTopicProblems,
} = require('../controllers/roadmapController');

const roadmapRouter = express.Router();

roadmapRouter.get('/', userMiddleware, getRoadmap);
roadmapRouter.put('/:topic', adminMiddleware, updateTopicMeta);
roadmapRouter.post('/:topic/problems', adminMiddleware, addProblemToTopic);
roadmapRouter.delete('/:topic/problems/:problemId', adminMiddleware, removeProblemFromTopic);
roadmapRouter.put('/:topic/reorder', adminMiddleware, reorderTopicProblems);

module.exports = roadmapRouter;
