// Eduquizz/src/backend/routes/quizRoutes.js
const express = require('express');
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom');
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all quizzes for the student's/teacher's relevant classrooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
        console.log('[quizRoutes] GET /: Unauthorized - User ID or role not found');
        // --- ADD return ---
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    console.log('[quizRoutes] GET /: Fetching quizzes for user:', currentUserId, "Role:", currentUserRole);

    let quizzes = [];
    if (currentUserRole === 'student') {
        const studentClassrooms = await Classroom.find({ students: currentUserId });
        console.log('[quizRoutes] GET /: Student classrooms found:', studentClassrooms.length);
        if (studentClassrooms.length > 0) {
            const classroomIds = studentClassrooms.map(c => c._id);
            quizzes = await Quiz.find({ classroom: { $in: classroomIds } }).populate('classroom', 'name').populate('createdBy', 'name email');
            console.log('[quizRoutes] GET /: Quizzes for student found:', quizzes.length);
        }
    } else if (currentUserRole === 'teacher') {
        const teacherClassrooms = await Classroom.find({ teacher: currentUserId });
        if (teacherClassrooms.length > 0) {
            const classroomIds = teacherClassrooms.map(c => c._id);
            quizzes = await Quiz.find({ classroom: { $in: classroomIds } }).populate('classroom', 'name').populate('createdBy', 'name email');
        }
        console.log('[quizRoutes] GET /: Quizzes for teacher found:', quizzes.length);
    }

    res.json(quizzes);
    // --- ADD return ---
    return; // Explicitly stop execution after sending success response

  } catch (error) {
    console.error('[quizRoutes] GET /: Error fetching quizzes:', error.message, error.stack);
    // --- ADD return ---
    // Ensure we don't try to send another response if headers were somehow already sent before the error
    if (!res.headersSent) {
        res.status(500).json({ error: 'Server error while fetching quizzes' });
    }
    return; // Stop execution after sending error response
  }
});

// POST create a new quiz
router.post('/create', authMiddleware, quizController.createQuiz);

// GET a specific quiz by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('classroom', 'name').populate('createdBy', 'name email');
    if (!quiz) {
      // --- ADD return ---
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
    // --- ADD return ---
    return;
  } catch (error) {
    console.error('[quizRoutes] GET /:id : Error fetching quiz:', error.message, error.stack);
     if (!res.headersSent) {
        res.status(500).json({ error: 'Server error' });
     }
     return;
  }
});

// POST submit a quiz
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    console.log('Quiz submission:', { quizId: req.params.id, answers, studentId: req.user.id });
    res.json({ message: 'Quiz submitted successfully' });
    // --- ADD return ---
    return;
  } catch (error) {
    console.error('Error submitting quiz:', error.message);
     if (!res.headersSent) {
        res.status(500).json({ error: 'Server error' });
     }
     return;
  }
});

module.exports = router;