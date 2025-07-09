const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import configurations and utilities
const connectDB = require('./config/database');
const socketHandlers = require('./utils/socketHandlers');
const { getColumnTitle } = require('./utils/helpers');

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const activityRoutes = require('./routes/activities');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3001', 
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:5175',
  "https://collaborative-to-do-board-applicati.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization,Accept",
  optionsSuccessStatus: 204,
}));

app.use(express.json({ limit: '10mb' }));

// Connect to database
connectDB();

// Socket.IO handlers
socketHandlers(io);

// Make io available to routes that need it
app.use((req, res, next) => {
  req.io = io;
  req.getColumnTitle = getColumnTitle;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CollabBoard API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
});
