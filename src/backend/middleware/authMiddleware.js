const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    // Role validation
    const validRoles = ['admin', 'teacher', 'student']; // Example valid roles
    if (!validRoles.includes(decoded.role)) {
      console.log('Invalid role:', decoded.role);
      return res.status(403).json({ error: 'Invalid role' });
    }
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;