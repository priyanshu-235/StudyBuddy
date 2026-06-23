const express = require('express');
const userMiddleware = require('../middleware/userMiddleware');
const {
  getThreadsByProblem,
  createThread,
  getThreadById,
  addComment,
  toggleThreadUpvote,
  toggleCommentUpvote,
  deleteThread,
  deleteComment,
} = require('../controllers/discussionController');

const discussionRouter = express.Router();

discussionRouter.get('/:problemId/threads', userMiddleware, getThreadsByProblem);
discussionRouter.post('/:problemId/threads', userMiddleware, createThread);
discussionRouter.get('/thread/:threadId', userMiddleware, getThreadById);
discussionRouter.post('/thread/:threadId/comments', userMiddleware, addComment);
discussionRouter.post('/thread/:threadId/upvote', userMiddleware, toggleThreadUpvote);
discussionRouter.post('/comment/:commentId/upvote', userMiddleware, toggleCommentUpvote);
discussionRouter.delete('/thread/:threadId', userMiddleware, deleteThread);
discussionRouter.delete('/comment/:commentId', userMiddleware, deleteComment);

module.exports = discussionRouter;
