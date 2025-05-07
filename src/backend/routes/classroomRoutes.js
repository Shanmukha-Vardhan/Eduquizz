// Eduquizz/src/backend/routes/classroomRoutes.js
const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/classrooms/create (Admin Only - logic in controller)
router.post('/create', authMiddleware, classroomController.createClassroom);

// GET /api/classrooms (Logic depends on user role - handled in controller)
router.get('/', authMiddleware, classroomController.getClassrooms);

// POST /api/classrooms/:classroomId/enroll (Admin Only - logic in controller)
router.post('/:classroomId/enroll', authMiddleware, classroomController.enrollStudent);

// --- ADD THIS NEW ROUTE ---
// PUT /api/classrooms/:classroomId/assign-teacher (Admin Only - logic in controller)
router.put('/:classroomId/assign-teacher', authMiddleware, classroomController.assignTeacher);
// --- END OF NEW ROUTE ---

module.exports = router;