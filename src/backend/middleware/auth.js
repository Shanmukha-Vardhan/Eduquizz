const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('--- Entering Auth Middleware ---'); // Log entry
  const authHeader = req.header('Authorization');
  console.log('Auth Header:', authHeader); // Log the header value

  const token = authHeader?.replace('Bearer ', ''); // Use optional chaining

  if (!token) {
    console.log('!!! Auth Middleware: No token found.');
    // Return explicitly to stop further processing
    return res.status(401).json({ error: 'No token provided' });
  }

  console.log('Auth Middleware: Token found:', token.substring(0, 10) + '...'); // Log beginning of token

  try {
    console.log('Auth Middleware: Attempting to verify token...');
    // Ensure JWT_SECRET is loaded correctly
    if (!process.env.JWT_SECRET) {
         console.error("!!! CRITICAL: JWT_SECRET is not defined in environment variables!");
         // Return error instead of letting jwt.verify crash potentially
         return res.status(500).json({ error: "Server configuration error." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware: Token verified successfully. Decoded payload:', decoded);

    // Add decoded user info to the request object
    req.user = decoded;
    console.log('Auth Middleware: Added user to req object:', req.user);

    console.log('Auth Middleware: Calling next()...');
    next(); // Pass control to the next middleware/route handler
    console.log('--- Exiting Auth Middleware (Success) ---');

  } catch (error) {
    console.error('!!! Error in Auth Middleware catch block !!!');
    console.error('Error verifying token:', error.message); // Log specific JWT error
    console.error('Error stack:', error.stack);
    // Check if response already sent before sending another one
    if (!res.headersSent) {
       res.status(401).json({ error: 'Invalid token' });
    }
    console.log('--- Exiting Auth Middleware (Caught Error) ---');
    // IMPORTANT: DO NOT call next() here if there's an error
  }
};