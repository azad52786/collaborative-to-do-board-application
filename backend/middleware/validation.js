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

module.exports = {
  validateRegistration,
  validateLogin
};
