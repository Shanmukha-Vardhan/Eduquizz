// Eduquizz/src/backend/routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// --- MODIFICATION 1: Import your authentication middleware ---
const authMiddleware = require('../middleware/authMiddleware'); // Make sure this path is correct

// --- MODIFICATION 2: Add authMiddleware to the '/register' route definition ---
// Now, only authenticated users can even attempt this route,
// and authMiddleware will add req.user if the token is valid.
router.post('/register', authMiddleware, async (req, res) => { // Added authMiddleware here
  try {
    // --- MODIFICATION 3: Add Admin role check inside the handler ---
    if (!req.user || req.user.role !== 'admin') {
        console.log('[authRoutes] Register: Forbidden - User is not Admin:', req.user?.role);
        // Send 403 Forbidden if the logged-in user is not an admin
        return res.status(403).json({ error: 'Forbidden: Only admins can register new users' });
    }
    // --- END MODIFICATION 3 ---

    // Existing logic starts here: Admin provides details in the body
    const { name, email, password, role } = req.body; // Added 'name' based on authController logic

    // Basic validation (keep your existing validation or use this)
    if (!name || !email || !password || !role) {
      console.log('[authRoutes] Register: Missing required fields');
      return res.status(400).json({ error: 'Please provide name, email, password, and role' });
    }
    const validRoles = ['teacher', 'student']; // Admin cannot create another admin via this route
    if (!validRoles.includes(role)) {
      console.log('[authRoutes] Register: Invalid role provided:', role);
      return res.status(400).json({ error: 'Invalid role. Can only create student or teacher.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('[authRoutes] Register: User already exists with email:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name, // Make sure 'name' is included
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    // Log which admin created the user
    console.log(`[authRoutes] Register: Admin (${req.user.id}) successfully registered new ${role}:`, user._id);
    // Send back confirmation (don't send back password hash)
    res.status(201).json({ message: `${role} registered successfully`, userId: user._id, name: user.name, email: user.email, role: user.role });

  } catch (error) {
    console.error('[authRoutes] Register: Error registering user:', error.message, error.stack);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login route remains unchanged
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    console.log('Found user:', user._id);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log('Generated token for user:', user._id);
    // Send back necessary info for frontend state
    res.json({ token, role: user.role, userId: user.id, name: user.name });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;