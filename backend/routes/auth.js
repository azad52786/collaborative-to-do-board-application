const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/authController');

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getProfile);

module.exports = router;
