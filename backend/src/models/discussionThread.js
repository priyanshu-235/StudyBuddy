const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionThreadSchema = new Schema(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'problem',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    type: {
      type: String,
      enum: ['discussion', 'solution', 'blog'],
      default: 'discussion',
    },
    upvotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
  },
  { timestamps: true }
);

discussionThreadSchema.index({ problemId: 1, createdAt: -1 });
discussionThreadSchema.index({ problemId: 1, type: 1 });

const DiscussionThread = mongoose.model('discussionThread', discussionThreadSchema);

module.exports = DiscussionThread;
