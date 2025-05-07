// Eduquizz/src/backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const isAdmin = (req, res, next) => {
    // --- ADD DETAILED LOGGING ---
    console.log('[userRoutes] Entering isAdmin middleware...');
    console.log('[userRoutes] req.user object:', JSON.stringify(req.user, null, 2)); // Log the whole user object
    console.log('[userRoutes] req.user.role:', req.user?.role); // Log the role specifically
    // --- END LOGGING ---

    if (req.user && req.user.role === 'admin') {
        console.log('[userRoutes] isAdmin Check Passed. Calling next().');
        next();
    } else {
        console.log('[userRoutes] isAdmin Check Failed: Role is', req.user?.role, '. Sending 403.');
        res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};

router.get('/', authMiddleware, isAdmin, userController.getUsers);
module.exports = router;