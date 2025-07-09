const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTokens, verifyToken } = require('../utils/jwt');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
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
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
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
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

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
};

const logout = async (req, res) => {
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
};

const getProfile = async (req, res) => {
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
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};
