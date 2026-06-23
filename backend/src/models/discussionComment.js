const mongoose = require('mongoose');
const { Schema } = mongoose;

const discussionCommentSchema = new Schema(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'discussionThread',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
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

discussionCommentSchema.index({ threadId: 1, createdAt: 1 });

const DiscussionComment = mongoose.model('discussionComment', discussionCommentSchema);

module.exports = DiscussionComment;
