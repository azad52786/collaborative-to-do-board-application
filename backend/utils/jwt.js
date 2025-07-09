const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

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

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'collabboard-api',
    audience: 'collabboard-client'
  });
};

module.exports = {
  generateTokens,
  verifyToken,
  JWT_SECRET
};
