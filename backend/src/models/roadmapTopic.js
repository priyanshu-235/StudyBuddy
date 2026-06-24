const mongoose = require('mongoose');
const { Schema } = mongoose;

const roadmapTopicSchema = new Schema(
  {
    topic: {
      type: String,
      enum: ['array', 'linkedList', 'graph', 'dp'],
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    problems: [
      {
        problemId: {
          type: Schema.Types.ObjectId,
          ref: 'problem',
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

const RoadmapTopic = mongoose.model('roadmapTopic', roadmapTopicSchema);

module.exports = RoadmapTopic;
