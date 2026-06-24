const RoadmapTopic = require('../models/roadmapTopic');
const Problem = require('../models/problem');
const User = require('../models/user');

const DEFAULT_TOPICS = [
  {
    topic: 'array',
    title: 'Array',
    description: 'Learn array traversal, two pointers, sliding window, and more.',
  },
  {
    topic: 'linkedList',
    title: 'Linked List',
    description: 'Master linked list manipulation, reversal, and cycle detection.',
  },
  {
    topic: 'graph',
    title: 'Graph',
    description: 'Explore BFS, DFS, shortest paths, and graph algorithms.',
  },
  {
    topic: 'dp',
    title: 'Dynamic Programming',
    description: 'Build intuition for state transitions and optimal substructure.',
  },
];

const ensureDefaultTopics = async () => {
  for (const topicData of DEFAULT_TOPICS) {
    await RoadmapTopic.findOneAndUpdate(
      { topic: topicData.topic },
      { $setOnInsert: topicData },
      { upsert: true, new: true }
    );
  }
};

const getRoadmap = async (req, res) => {
  try {
    await ensureDefaultTopics();

    const user = await User.findById(req.result._id).select('problemSolved');
    const solvedSet = new Set(user.problemSolved.map((id) => id.toString()));

    const topics = await RoadmapTopic.find()
      .populate('problems.problemId', 'title difficulty tags')
      .sort({ topic: 1 })
      .lean();

    const formattedTopics = topics.map((topic) => {
      const problems = topic.problems
        .map((entry) => {
          const problem = entry.problemId;
          if (!problem) return null;
          return {
            _id: problem._id,
            title: problem.title,
            difficulty: problem.difficulty,
            tags: problem.tags,
            order: entry.order,
            isSolved: solvedSet.has(problem._id.toString()),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);

      const totalCount = problems.length;
      const solvedCount = problems.filter((p) => p.isSolved).length;

      return {
        _id: topic._id,
        topic: topic.topic,
        title: topic.title,
        description: topic.description,
        totalCount,
        solvedCount,
        progressPercent: totalCount ? Math.round((solvedCount / totalCount) * 100) : 0,
        problems,
      };
    });

    const overallTotal = formattedTopics.reduce((sum, t) => sum + t.totalCount, 0);
    const overallSolved = formattedTopics.reduce((sum, t) => sum + t.solvedCount, 0);

    const topicOrder = ['array', 'linkedList', 'graph', 'dp'];
    formattedTopics.sort(
      (a, b) => topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic)
    );

    res.status(200).json({
      topics: formattedTopics,
      overall: {
        totalCount: overallTotal,
        solvedCount: overallSolved,
        progressPercent: overallTotal
          ? Math.round((overallSolved / overallTotal) * 100)
          : 0,
      },
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const updateTopicMeta = async (req, res) => {
  try {
    const { topic } = req.params;
    const { title, description } = req.body;

    const updated = await RoadmapTopic.findOneAndUpdate(
      { topic },
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send('Topic not found');
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const addProblemToTopic = async (req, res) => {
  try {
    const { topic } = req.params;
    const { problemId } = req.body;

    if (!problemId) {
      return res.status(400).send('problemId is required');
    }

    const [topicDoc, problem] = await Promise.all([
      RoadmapTopic.findOne({ topic }),
      Problem.findById(problemId).select('_id title tags'),
    ]);

    if (!topicDoc) {
      return res.status(404).send('Topic not found');
    }

    if (!problem) {
      return res.status(404).send('Problem not found');
    }

    const alreadyExists = topicDoc.problems.some(
      (entry) => entry.problemId.toString() === problemId
    );

    if (alreadyExists) {
      return res.status(400).send('Problem already in this topic');
    }

    const nextOrder =
      topicDoc.problems.length > 0
        ? Math.max(...topicDoc.problems.map((p) => p.order)) + 1
        : 0;

    topicDoc.problems.push({ problemId, order: nextOrder });
    await topicDoc.save();

    res.status(201).json({
      message: 'Problem added to roadmap',
      problem: {
        _id: problem._id,
        title: problem.title,
        tags: problem.tags,
        order: nextOrder,
      },
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const removeProblemFromTopic = async (req, res) => {
  try {
    const { topic, problemId } = req.params;

    const topicDoc = await RoadmapTopic.findOne({ topic });
    if (!topicDoc) {
      return res.status(404).send('Topic not found');
    }

    const initialLength = topicDoc.problems.length;
    topicDoc.problems = topicDoc.problems.filter(
      (entry) => entry.problemId.toString() !== problemId
    );

    if (topicDoc.problems.length === initialLength) {
      return res.status(404).send('Problem not found in this topic');
    }

    await topicDoc.save();
    res.status(200).send('Problem removed from roadmap');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

const reorderTopicProblems = async (req, res) => {
  try {
    const { topic } = req.params;
    const { problemIds } = req.body;

    if (!Array.isArray(problemIds)) {
      return res.status(400).send('problemIds array is required');
    }

    const topicDoc = await RoadmapTopic.findOne({ topic });
    if (!topicDoc) {
      return res.status(404).send('Topic not found');
    }

    const orderMap = problemIds.reduce((acc, id, index) => {
      acc[id] = index;
      return acc;
    }, {});

    topicDoc.problems.forEach((entry) => {
      const id = entry.problemId.toString();
      if (orderMap[id] !== undefined) {
        entry.order = orderMap[id];
      }
    });

    topicDoc.problems.sort((a, b) => a.order - b.order);
    await topicDoc.save();

    res.status(200).send('Roadmap order updated');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

module.exports = {
  getRoadmap,
  updateTopicMeta,
  addProblemToTopic,
  removeProblemFromTopic,
  reorderTopicProblems,
};
