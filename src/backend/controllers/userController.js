// Eduquizz/src/backend/controllers/userController.js
const User = require('../models/User');

// Get users, optionally filtered by role
exports.getUsers = async (req, res) => {
    // This route should be protected for Admin only by middleware in userRoutes.js
    try {
        const query = {};
        // Check for role query parameter (e.g., /api/users?role=teacher)
        if (req.query.role) {
            const allowedRoles = ['teacher', 'student', 'admin']; // Define allowed roles
            if (allowedRoles.includes(req.query.role)) {
                query.role = req.query.role;
            } else {
                console.log(`[userController] GetUsers: Invalid role requested: ${req.query.role}`);
                return res.status(400).json({ error: 'Invalid role specified' });
            }
        }
        // If no role specified, admin gets all users (or adjust as needed)

        console.log(`[userController] GetUsers: Fetching users with query:`, query);

        // Exclude passwords from the result using .select('-password')
        const users = await User.find(query).select('-password');

        console.log(`[userController] GetUsers: Found ${users.length} users.`);
        res.json(users);

    } catch (error) {
        console.error('[userController] GetUsers: Error fetching users:', error);
        res.status(500).json({ error: 'Server error while fetching users' });
    }
};
