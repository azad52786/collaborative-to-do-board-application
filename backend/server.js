const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Task = require('./models/Task');
const Activity = require('./models/Activity');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    // Use MongoDB Atlas URI from environment
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://azadkaji63:nRXmtQ0Qk8Y3AJIt@cluster0.yk6ah33.mongodb.net/collabboard?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Test the connection and create default admin user
    await createDefaultUser();
    
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.log('💡 Please check:');
    console.log('   1. Your internet connection');
    console.log('   2. MongoDB Atlas credentials');
    console.log('   3. IP whitelist in MongoDB Atlas');
    process.exit(1);
  }
};

// Helper function to create default user
const createDefaultUser = async () => {
  try {
    const adminUser = await User.findOne({ email: 'admin@collabboard.com' });
    if (!adminUser) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'Admin User',
        email: 'admin@collabboard.com',
        password: hashedPassword,
        avatar: 'AD',
        isActive: true
      });
      console.log('✅ Default admin user created (admin@collabboard.com / admin123)');
    } else {
      console.log('✅ Default admin user exists');
    }
  } catch (error) {
    console.log('⚠️  Could not create default user:', error.message);
  }
};

// Connect to database
connectDB();

// JWT Secret and configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

// Helper function to generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'collabboard-api',
    audience: 'collabboard-client'
  });

  const refreshToken = jwt.sign(
    { id: user._id.toString(), type: 'refresh' },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'collabboard-api',
      audience: 'collabboard-client'
    }
  );

  return { accessToken, refreshToken };
};

// Enhanced auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'collabboard-api',
      audience: 'collabboard-client'
    });

    // Find user to ensure they still exist
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else {
      return res.status(403).json({ 
        error: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  }
};

// Input validation middleware
const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;

  // Check required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Name, email, and password are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Validate name
  if (name.trim().length < 2) {
    return res.status(400).json({
      error: 'Name must be at least 2 characters long',
      code: 'INVALID_NAME'
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address',
      code: 'INVALID_EMAIL'
    });
  }

  // Validate password
  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long',
      code: 'INVALID_PASSWORD'
    });
  }

  // Check password strength (optional)
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return res.status(400).json({
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      code: 'WEAK_PASSWORD'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
      code: 'MISSING_CREDENTIALS'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Please enter a valid email address',
      code: 'INVALID_EMAIL'
    });
  }

  next();
};

// Routes
app.post('/api/auth/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password with higher salt rounds for production
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: name.trim().slice(0, 2).toUpperCase(),
      isActive: true,
      lastLoginAt: new Date()
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Store refresh token
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Return user data (password excluded by schema)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: accessToken,
      refreshToken,
      user: newUser.toJSON()
    });

    console.log(`New user registered: ${normalizedEmail}`);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to create account. Please try again.',
      code: 'REGISTRATION_FAILED'
    });
  }
});

app.post('/api/auth/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Return user data (password excluded by schema)
    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: user.toJSON()
    });

    console.log(`User logged in: ${normalizedEmail}`);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.',
      code: 'LOGIN_FAILED'
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: 'collabboard-api',
      audience: 'collabboard-client'
    });

    // Find user and check if refresh token matches
    const user = await User.findOne({ 
      _id: decoded.id, 
      refreshToken: refreshToken,
      isActive: true 
    });

    if (!user) {
      return res.status(403).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Update stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      // Clear refresh token
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

// Task Routes with User Access Control
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    // Get tasks that user created or is assigned to
    const tasks = await Task.getAccessibleTasks(req.user.id);
    
    // Group tasks by status for frontend compatibility
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
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
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
    io.emit('taskCreated', { 
      task: newTask.toJSON(),
      user: req.userDoc.name
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
});

// Update task (move between columns, edit details)
app.put('/api/tasks/:taskId', authenticateToken, async (req, res) => {
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

    // Emit to all clients
    io.emit('taskUpdated', {
      task: task.toJSON(),
      user: req.userDoc.name,
      action: activityData.action,
      details: activityData.details
    });

    res.json({
      success: true,
      task: task.toJSON()
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Failed to update task',
      code: 'UPDATE_TASK_FAILED'
    });
  }
});

// Delete task
app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
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
    io.emit('taskDeleted', {
      taskId: taskId,
      user: req.userDoc.name
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Failed to delete task',
      code: 'DELETE_TASK_FAILED'
    });
  }
});

app.get('/api/activities', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await Activity.getAccessibleActivities(req.user.id, limit);
    
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      error: 'Failed to fetch activities',
      code: 'FETCH_ACTIVITIES_FAILED'
    });
  }
});

// Get all users for task assignment
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email avatar')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      code: 'FETCH_USERS_FAILED'
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('taskMoved', async (data) => {
    try {
      console.log('Task moved:', data);
      
      const { taskId, fromStatus, toStatus, userId } = data;
      
      // Update task in database
      const task = await Task.findById(taskId);
      if (task && task.canAccess(userId)) {
        task.status = toStatus;
        await task.save();
        
        // Create activity
        await Activity.create({
          user: userId,
          action: 'moved',
          taskId: task._id,
          taskTitle: task.title,
          details: {
            from: fromStatus,
            to: toStatus
          }
        });
      }
      
      // Broadcast to all clients
      socket.broadcast.emit('taskUpdated', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Task moved error:', error);
    }
  });

  socket.on('taskUpdated', async (data) => {
    try {
      console.log('Task updated:', data);
      
      // Simulate conflict detection (for demo)
      if (Math.random() < 0.1) { // 10% chance of conflict
        const randomTask = await Task.findOne().limit(1);
        if (randomTask) {
          socket.emit('conflictDetected', {
            task: randomTask.title,
            localVersion: {
              title: 'Local Version',
              description: 'Local description',
              priority: 'high',
              lastModified: new Date().toISOString()
            },
            remoteVersion: {
              title: 'Remote Version',
              description: 'Remote description',
              priority: 'medium',
              lastModified: new Date().toISOString()
            },
            user: 'Another User'
          });
        }
      }

      socket.broadcast.emit('taskUpdated', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Task updated error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
