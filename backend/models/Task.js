const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['todo', 'inProgress', 'done'],
      message: 'Status must be one of: todo, inProgress, done'
    },
    default: 'todo'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be one of: low, medium, high'
    },
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  position: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, position: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ createdBy: 1, assignedTo: 1 });

// Virtual for checking if user can access this task
taskSchema.methods.canAccess = function(userId) {
  return this.createdBy.toString() === userId || 
         (this.assignedTo && this.assignedTo.toString() === userId);
};

// Static method to get tasks accessible by user
taskSchema.statics.getAccessibleTasks = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { assignedTo: userId }
    ]
  }).populate('createdBy assignedTo', 'name email avatar');
};

module.exports = mongoose.model('Task', taskSchema);
