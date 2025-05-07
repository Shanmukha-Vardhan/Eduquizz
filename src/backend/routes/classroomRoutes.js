// Eduquizz/src/backend/routes/classroomRoutes.js
const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/classrooms/create (Admin Only)
router.post('/create', authMiddleware, classroomController.createClassroom);

// GET /api/classrooms (Logic depends on user role)
router.get('/', authMiddleware, classroomController.getClassrooms);

// POST /api/classrooms/:classroomId/enroll (Admin Only)
router.post('/:classroomId/enroll', authMiddleware, classroomController.enrollStudent);

// PUT /api/classrooms/:classroomId/assign-teacher (Admin Only)
router.put('/:classroomId/assign-teacher', authMiddleware, classroomController.assignTeacher);

// --- ADD THIS NEW ROUTE ---
// DELETE /api/classrooms/:classroomId (Admin Only)
router.delete('/:classroomId', authMiddleware, classroomController.deleteClassroom);
// --- END OF NEW ROUTE ---

module.exports = router;