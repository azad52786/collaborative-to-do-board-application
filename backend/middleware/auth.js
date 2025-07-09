const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

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

    const decoded = verifyToken(token);

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

module.exports = {
  authenticateToken
};
