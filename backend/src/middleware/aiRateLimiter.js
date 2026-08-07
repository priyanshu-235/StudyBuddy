const User = require('../models/user');
const AI_MAX_TOTAL_CALLS = parseInt(process.env.AI_MAX_TOTAL_CALLS || '5', 10);

const aiTotalCallsLimiter = async (req, res, next) => {
  const userId = req.result?._id;

  if (!userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to use AI chat.',
    });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found.',
      });
    }

    // Skip limit check for admins
    if (user.role === 'admin') {
      req.userForAiTracking = user;
      return next();
    }

    // Check if user has exceeded total AI chat calls limit
    if (user.aiChatCalls >= AI_MAX_TOTAL_CALLS) {
      return res.status(429).json({
        error: 'Maximum AI calls exceeded',
        message: `You have exceeded the maximum limit of ${AI_MAX_TOTAL_CALLS} AI chat calls.`,
        maxCalls: AI_MAX_TOTAL_CALLS,
        usedCalls: user.aiChatCalls,
      });
    }

    // Attach user to request for incrementing after successful AI call
    req.userForAiTracking = user;
    return next();
  } catch (error) {
    console.error('Error checking AI call limit:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check AI call limit.',
    });
  }
};

const incrementAiCallCount = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user && user.role !== 'admin') {
      await User.findByIdAndUpdate(userId, {
        $inc: { aiChatCalls: 1 }
      });
    }
  } catch (error) {
    console.error('Error incrementing AI call count:', error);
  }
};

module.exports = { aiTotalCallsLimiter, incrementAiCallCount, AI_MAX_TOTAL_CALLS };
