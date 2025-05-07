// Eduquizz/src/backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- Register Function (Modified for Admin Only) ---
exports.register = async (req, res) => {
  try {
    // --- PERMISSION CHECK: Only Admin can register new users ---
    // Note: This assumes the admin is already logged in and their req.user is set by authMiddleware
    // If this route itself shouldn't require auth (e.g., initial admin setup), this check needs adjustment.
    // For now, assume an admin must be logged in to create others.
    if (!req.user || req.user.role !== 'admin') {
        console.log('[authController] Register: Forbidden - User is not Admin:', req.user?.role);
        return res.status(403).json({ error: 'Forbidden: Only admins can register new users' });
    }
    // --- END PERMISSION CHECK ---

    const { name, email, password, role } = req.body; // Admin provides role

    // Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide name, email, password, and role' });
    }
    if (!['student', 'teacher'].includes(role)) { // Admin cannot create another admin via this route
        return res.status(400).json({ error: 'Invalid role specified. Can only create student or teacher.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user (without custom ID for now - Phase 5)
    user = new User({
      name,
      email,
      password: hashedPassword,
      role, // Role provided by admin
    });

    await user.save();
    console.log(`[authController] Register: Admin (${req.user.id}) successfully registered new user:`, user);

    // Optionally generate token for the newly created user? Or just confirm creation?
    // For now, just confirm creation. Admin doesn't need to log in as the new user immediately.
    res.status(201).json({ message: `${role} registered successfully`, userId: user.id, name: user.name, role: user.role });

  } catch (error) {
    console.error('[authController] Register: Error registering user:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// --- Login Function (No changes needed for Phase 1) ---
exports.login = async (req, res) => {
  // ... (your existing login code) ...
   try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email }); // Log email only for security

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(400).json({ error: 'Invalid credentials' }); // Generic message
    }
     console.log('Found user:', user._id);


    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch for user:', user._id);
      return res.status(400).json({ error: 'Invalid credentials' }); // Generic message
    }
     console.log('Password match: true');


    // Create JWT payload
    const payload = {
      id: user.id, // Use user.id (mongoose virtual) or user._id
      role: user.role,
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

     console.log('Generated token for user:', user._id);


    res.json({ token, role: user.role, userId: user.id, name: user.name }); // Send back token and basic user info

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};