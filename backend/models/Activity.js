const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  action: {
    type: String,
    enum: {
      values: ['created', 'updated', 'moved', 'assigned', 'deleted', 'completed'],
      message: 'Action must be one of: created, updated, moved, assigned, deleted, completed'
    },
    required: [true, 'Action is required']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false,
    index: true
  },
  taskTitle: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  details: {
    from: String,
    to: String,
    field: String,
    oldValue: mongoose.Schema.Types.Mixed, // Mixed type: Can store any data type (string, number, date, etc.)
    newValue: mongoose.Schema.Types.Mixed,
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We're using custom timestamp field
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ taskId: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 });

// Static method to get activities for tasks accessible by user
activitySchema.statics.getAccessibleActivities = function(userId, limit = 20) {
  return this.aggregate([
    {
      $lookup: {
        from: 'tasks',
        localField: 'taskId',
        foreignField: '_id',
        as: 'task'
      }
    },
    {
      $match: {
        $or: [
          { 'task.createdBy': new mongoose.Types.ObjectId(userId) },
          { 'task.assignedTo': new mongoose.Types.ObjectId(userId) },
          { taskId: { $exists: false } } // Activities without taskId (general activities)
        ]
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails',
        pipeline: [
          { $project: { name: 1, avatar: 1 } }
        ]
      }
    },
    {
      $addFields: {
        userDetails: { $arrayElemAt: ['$userDetails', 0] }
      }
    },
    {
      $project: {
        task: 0,
        __v: 0
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('Activity', activitySchema);
