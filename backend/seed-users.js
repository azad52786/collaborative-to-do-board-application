const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Task = require('./models/Task');
const Activity = require('./models/Activity');

// Sample users data
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: 'Password123'
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    password: 'Password123'
  },
  {
    name: 'Charlie Davis',
    email: 'charlie.davis@example.com',
    password: 'Password123'
  },
  {
    name: 'Diana Wilson',
    email: 'diana.wilson@example.com',
    password: 'Password123'
  },
  {
    name: 'Eve Martinez',
    email: 'eve.martinez@example.com',
    password: 'Password123'
  }
];

// Sample tasks to assign between users
const sampleTasks = [
  {
    title: 'Design Landing Page',
    description: 'Create a modern landing page design for the new product launch',
    status: 'todo',
    priority: 'high'
  },
  {
    title: 'Implement User Authentication',
    description: 'Set up JWT-based authentication system with proper validation',
    status: 'inProgress',
    priority: 'high'
  },
  {
    title: 'Create Database Schema',
    description: 'Design and implement MongoDB schema for the application',
    status: 'todo',
    priority: 'medium'
  },
  {
    title: 'Write Unit Tests',
    description: 'Create comprehensive unit tests for all API endpoints',
    status: 'todo',
    priority: 'medium'
  },
  {
    title: 'Setup CI/CD Pipeline',
    description: 'Configure continuous integration and deployment pipeline',
    status: 'done',
    priority: 'low'
  },
  {
    title: 'Code Review',
    description: 'Review and approve pull requests from team members',
    status: 'inProgress',
    priority: 'high'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing sample data...');
    await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
    await Task.deleteMany({ title: { $in: sampleTasks.map(t => t.title) } });
    await Activity.deleteMany({});
    console.log('✅ Cleared existing sample data');

    // Create users
    console.log('👥 Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        isActive: true,
        lastLoginAt: new Date()
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${savedUser.name} (${savedUser.email})`);
    }

    // Create tasks and assign them to different users
    console.log('📋 Creating and assigning tasks...');
    const createdTasks = [];
    
    for (let i = 0; i < sampleTasks.length; i++) {
      const taskData = sampleTasks[i];
      const creator = createdUsers[i % createdUsers.length]; // Rotate creators
      const assignee = createdUsers[(i + 1) % createdUsers.length]; // Assign to next user
      
      const task = new Task({
        ...taskData,
        createdBy: creator._id,
        assignedTo: assignee._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const savedTask = await task.save();
      createdTasks.push(savedTask);
      
      console.log(`✅ Created task: "${savedTask.title}"`);
      console.log(`   📝 Created by: ${creator.name}`);
      console.log(`   👤 Assigned to: ${assignee.name}`);
      console.log(`   📊 Status: ${savedTask.status}`);
      console.log(`   🎯 Priority: ${savedTask.priority}`);
      console.log('');

      // Create activity log for task creation
      const activity = new Activity({
        user: creator._id,
        action: 'created',
        taskId: savedTask._id,
        taskTitle: savedTask.title,
        details: {
          assignedUser: assignee._id
        },
        timestamp: new Date()
      });
      
      await activity.save();
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users created: ${createdUsers.length}`);
    console.log(`   📋 Tasks created: ${createdTasks.length}`);
    console.log(`   📝 Activities logged: ${createdTasks.length}`);
    
    console.log('\n🔑 Login credentials for testing:');
    sampleUsers.forEach(user => {
      console.log(`   📧 ${user.email} | 🔒 ${user.password}`);
    });

    console.log('\n🎯 Test Assignment Feature:');
    console.log('   1. Login with any user credentials above');
    console.log('   2. You will see tasks assigned to you in the dashboard');
    console.log('   3. Tasks you created will also be visible');
    console.log('   4. Try creating new tasks and assigning them to other users');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedDatabase();
