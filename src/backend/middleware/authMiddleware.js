// Eduquizz/src/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // --- ADDED LOG ---
  console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Entering ---`);
  const authHeader = req.header('Authorization'); // Get header first
  // --- ADDED LOG ---
  console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Auth Header: ${authHeader}`);

  if (!authHeader) {
    console.log(`--- [authMiddleware] Path: ${req.originalUrl} - No Auth Header. Denying.`);
    return res.status(401).json({ error: 'No token, authorization denied (no header)' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token === authHeader) { // Check if 'Bearer ' was actually present and replaced
    console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Token malformed or missing after 'Bearer '. Denying.`);
    return res.status(401).json({ error: 'Token malformed' });
  }
  // --- ADDED LOG ---
  console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Token found: ${token.substring(0,10)}...`);

  try {
    // --- ADDED LOG ---
    console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Attempting to verify token...`);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // --- ADDED LOG ---
    console.log(`--- [authMiddleware] Path: ${req.originalUrl} - Token verified. Decoded:`, decoded);
    req.user = decoded;
    // --- ADDED LOG ---
    console.log(`--- [authMiddleware] Path: ${req.originalUrl} - req.user set. Calling next().`);
    next();
  } catch (err) {
    // --- ADDED LOG ---
    console.error(`--- [authMiddleware] Path: ${req.originalUrl} - Token verification error:`, err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};