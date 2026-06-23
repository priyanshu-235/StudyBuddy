const DiscussionThread = require('../models/discussionThread');
const DiscussionComment = require('../models/discussionComment');
const Problem = require('../models/problem');

const formatUser = (user) => ({
  _id: user?._id,
  firstName: user?.firstName,
});

const hasUpvoted = (upvotes, userId) =>
  upvotes.some((id) => id.toString() === userId.toString());

const getThreadsByProblem = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { type = 'all', sort = 'recent', page = 1, limit = 10 } = req.query;
    const userId = req.result._id;

    const problem = await Problem.findById(problemId).select('_id');
    if (!problem) {
      return res.status(404).send('Problem not found');
    }

    const filter = { problemId };
    if (type !== 'all') {
      filter.type = type;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    let threads;

    if (sort === 'upvotes') {
      const aggregated = await DiscussionThread.aggregate([
        { $match: filter },
        { $addFields: { upvoteCount: { $size: '$upvotes' } } },
        { $sort: { upvoteCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'author',
          },
        },
        { $unwind: '$author' },
      ]);

      threads = aggregated.map((thread) => ({
        ...thread,
        userId: { _id: thread.author._id, firstName: thread.author.firstName },
      }));
    } else {
      threads = await DiscussionThread.find(filter)
        .populate('userId', 'firstName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    }

    const [total] = await Promise.all([
      DiscussionThread.countDocuments(filter),
    ]);

    const threadIds = threads.map((thread) => thread._id);
    const commentCounts = await DiscussionComment.aggregate([
      { $match: { threadId: { $in: threadIds } } },
      { $group: { _id: '$threadId', count: { $sum: 1 } } },
    ]);

    const commentCountMap = commentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const formattedThreads = threads.map((thread) => ({
      _id: thread._id,
      title: thread.title,
      content: thread.content,
      type: thread.type,
      upvoteCount: thread.upvotes.length,
      commentCount: commentCountMap[thread._id.toString()] || 0,
      hasUpvoted: hasUpvoted(thread.upvotes, userId),
      user: formatUser(thread.userId),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    }));

    res.status(200).json({
      threads: formattedThreads,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const createThread = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { title, content, type = 'discussion' } = req.body;
    const userId = req.result._id;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).send('Title and content are required');
    }

    const problem = await Problem.findById(problemId).select('_id');
    if (!problem) {
      return res.status(404).send('Problem not found');
    }

    const thread = await DiscussionThread.create({
      problemId,
      userId,
      title: title.trim(),
      content: content.trim(),
      type,
      upvotes: [],
    });

    await thread.populate('userId', 'firstName');

    res.status(201).json({
      _id: thread._id,
      title: thread.title,
      content: thread.content,
      type: thread.type,
      upvoteCount: 0,
      commentCount: 0,
      hasUpvoted: false,
      user: formatUser(thread.userId),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.result._id;

    const thread = await DiscussionThread.findById(threadId)
      .populate('userId', 'firstName')
      .lean();

    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    const comments = await DiscussionComment.find({ threadId })
      .populate('userId', 'firstName')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({
      thread: {
        _id: thread._id,
        problemId: thread.problemId,
        title: thread.title,
        content: thread.content,
        type: thread.type,
        upvoteCount: thread.upvotes.length,
        hasUpvoted: hasUpvoted(thread.upvotes, userId),
        user: formatUser(thread.userId),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
      comments: comments.map((comment) => ({
        _id: comment._id,
        content: comment.content,
        upvoteCount: comment.upvotes.length,
        hasUpvoted: hasUpvoted(comment.upvotes, userId),
        user: formatUser(comment.userId),
        createdAt: comment.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const addComment = async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.result._id;

    if (!content?.trim()) {
      return res.status(400).send('Comment content is required');
    }

    const thread = await DiscussionThread.findById(threadId).select('_id');
    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    const comment = await DiscussionComment.create({
      threadId,
      userId,
      content: content.trim(),
      upvotes: [],
    });

    await comment.populate('userId', 'firstName');

    res.status(201).json({
      _id: comment._id,
      content: comment.content,
      upvoteCount: 0,
      hasUpvoted: false,
      user: formatUser(comment.userId),
      createdAt: comment.createdAt,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const toggleThreadUpvote = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.result._id;

    const thread = await DiscussionThread.findById(threadId);
    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    const alreadyUpvoted = hasUpvoted(thread.upvotes, userId);

    if (alreadyUpvoted) {
      thread.upvotes = thread.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      thread.upvotes.push(userId);
    }

    await thread.save();

    res.status(200).json({
      upvoteCount: thread.upvotes.length,
      hasUpvoted: !alreadyUpvoted,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const toggleCommentUpvote = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.result._id;

    const comment = await DiscussionComment.findById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    const alreadyUpvoted = hasUpvoted(comment.upvotes, userId);

    if (alreadyUpvoted) {
      comment.upvotes = comment.upvotes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.upvotes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      upvoteCount: comment.upvotes.length,
      hasUpvoted: !alreadyUpvoted,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.result._id;

    const thread = await DiscussionThread.findById(threadId);
    if (!thread) {
      return res.status(404).send('Thread not found');
    }

    if (
      thread.userId.toString() !== userId.toString() &&
      req.result.role !== 'admin'
    ) {
      return res.status(403).send('Not authorized to delete this thread');
    }

    await Promise.all([
      DiscussionComment.deleteMany({ threadId }),
      DiscussionThread.findByIdAndDelete(threadId),
    ]);

    res.status(200).send('Thread deleted successfully');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.result._id;

    const comment = await DiscussionComment.findById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }

    if (
      comment.userId.toString() !== userId.toString() &&
      req.result.role !== 'admin'
    ) {
      return res.status(403).send('Not authorized to delete this comment');
    }

    await DiscussionComment.findByIdAndDelete(commentId);

    res.status(200).send('Comment deleted successfully');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

module.exports = {
  getThreadsByProblem,
  createThread,
  getThreadById,
  addComment,
  toggleThreadUpvote,
  toggleCommentUpvote,
  deleteThread,
  deleteComment,
};
