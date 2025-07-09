const User = require('../models/User');

const getUsers = async (req, res) => {
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
};

module.exports = {
  getUsers
};
