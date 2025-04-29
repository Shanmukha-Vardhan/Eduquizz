const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/auth'); // Make sure this is required

// Apply auth middleware specifically to routes that need it
router.post('/create', authMiddleware, classroomController.createClassroom);
router.get('/', authMiddleware, classroomController.getClassrooms);

module.exports = router;