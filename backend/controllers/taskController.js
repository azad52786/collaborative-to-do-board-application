const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.getAccessibleTasks(req.user.id);
    
    // Group tasks by status for frontend
    const groupedTasks = {
      todo: tasks.filter(task => task.status === 'todo'),
      inProgress: tasks.filter(task => task.status === 'inProgress'),
      done: tasks.filter(task => task.status === 'done')
    };

    res.json(groupedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: 'Failed to fetch tasks',
      code: 'FETCH_TASKS_FAILED'
    });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, dueDate } = req.body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: 'Task title is required',
        code: 'MISSING_TITLE'
      });
    }

    // Validate assigned user if provided
    let assignedUserId = null;
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo).select('_id name email avatar');
      if (!assignedUser) {
        return res.status(400).json({
          error: 'Assigned user not found',
          code: 'INVALID_ASSIGNED_USER'
        });
      }
      assignedUserId = assignedUser._id;
    }

    // Create new task
    const newTask = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      createdBy: req.user.id,
      assignedTo: assignedUserId,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'todo'
    });

    // Populate user data
    await newTask.populate('createdBy assignedTo', 'name email avatar');

    // Create activity log
    await Activity.create({
      user: req.user.id,
      action: 'created',
      taskId: newTask._id,
      taskTitle: newTask.title,
      details: {
        assignedUser: assignedUserId
      }
    });

    // Emit to all clients
    req.io.emit('taskCreated', { 
      task: newTask.toJSON(),
      user: req.userDoc.name,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      task: newTask.toJSON()
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Failed to create task',
      code: 'CREATE_TASK_FAILED'
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, title, description, priority, assignedTo, dueDate } = req.body;

    // Find task and check access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    if (!task.canAccess(req.user.id)) {
      return res.status(403).json({
        error: 'Access denied. You can only modify tasks you created or are assigned to.',
        code: 'ACCESS_DENIED'
      });
    }

    // Store old values for activity log
    const oldStatus = task.status;
    const oldTitle = task.title;

    // Update task fields
    if (status) task.status = status;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    // Handle assignedTo change
    if (assignedTo !== undefined) {
      if (assignedTo === null) {
        task.assignedTo = null;
      } else {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(400).json({
            error: 'Assigned user not found',
            code: 'INVALID_ASSIGNED_USER'
          });
        }
        task.assignedTo = assignedUser._id;
      }
    }

    await task.save();
    await task.populate('createdBy assignedTo', 'name email avatar');

    // Create activity log
    const activityData = {
      user: req.user.id,
      taskId: task._id,
      taskTitle: task.title,
      details: {}
    };

    if (status && status !== oldStatus) {
      activityData.action = 'moved';
      activityData.details.from = oldStatus;
      activityData.details.to = status;
    } else if (title && title !== oldTitle) {
      activityData.action = 'updated';
      activityData.details.field = 'title';
      activityData.details.oldValue = oldTitle;
      activityData.details.newValue = title;
    } else {
      activityData.action = 'updated';
    }

    await Activity.create(activityData);

    // Emit specific events based on action type
    if (activityData.action === 'moved') {
      // Task was moved between columns
      req.io.emit('taskMoved', {
        taskId: task._id,
        taskTitle: task.title,
        from: activityData.details.from,
        to: activityData.details.to,
        fromTitle: req.getColumnTitle(activityData.details.from),
        toTitle: req.getColumnTitle(activityData.details.to),
        user: req.userDoc.name,
        userId: req.user.id,
        task: task.toJSON()
      });
    } else {
      // Task was updated
      req.io.emit('taskUpdated', {
        task: task.toJSON(),
        user: req.userDoc.name,
        userId: req.user.id,
        action: activityData.action,
        details: activityData.details
      });
    }

    res.json({
      success: true,
      task: task.toJSON(),
      activityData // Return activity data for socket emission
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Failed to update task',
      code: 'UPDATE_TASK_FAILED'
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find task and check access
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Only creator can delete the task
    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. Only the task creator can delete it.',
        code: 'DELETE_ACCESS_DENIED'
      });
    }

    await Task.findByIdAndDelete(taskId);

    // Create activity log
    await Activity.create({
      user: req.user.id,
      action: 'deleted',
      taskTitle: task.title,
      details: {}
    });

    // Emit to all clients
    req.io.emit('taskDeleted', {
      taskId: taskId,
      user: req.userDoc.name,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
      taskId: taskId
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Failed to delete task',
      code: 'DELETE_TASK_FAILED'
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};
