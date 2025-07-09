const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Atlas connected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Please check your MongoDB Atlas credentials and connection string');
    process.exit(1);
  }
};

module.exports = connectDB;
