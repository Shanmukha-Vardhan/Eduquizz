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
    // --- MODIFICATION: Use req.user.id ---
    if (!req.user || !req.user.id || !req.user.role) { // Check for req.user.id and req.user.role
        console.log('[quizRoutes] GET /: Unauthorized - User ID or role not found');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const currentUserId = req.user.id; // Use req.user.id
    const currentUserRole = req.user.role;
    // --- END MODIFICATION ---
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
        // For a teacher, find quizzes they created OR quizzes in their classrooms
        // Example: Quizzes in classrooms they teach
        const teacherClassrooms = await Classroom.find({ teacher: currentUserId });
        if (teacherClassrooms.length > 0) {
            const classroomIds = teacherClassrooms.map(c => c._id);
            quizzes = await Quiz.find({ classroom: { $in: classroomIds } }).populate('classroom', 'name').populate('createdBy', 'name email');
        }
        // Alternatively, or in addition, quizzes they created directly:
        // const createdQuizzes = await Quiz.find({ createdBy: currentUserId });
        // quizzes = quizzes.concat(createdQuizzes); // (Handle potential duplicates if needed)
        console.log('[quizRoutes] GET /: Quizzes for teacher found:', quizzes.length);
    }

    res.json(quizzes);
  } catch (error) {
    console.error('[quizRoutes] GET /: Error fetching quizzes:', error.message, error.stack);
    res.status(500).json({ error: 'Server error while fetching quizzes' });
  }
});

// POST create a new quiz
router.post('/create', authMiddleware, quizController.createQuiz); // This should use req.user.id inside quizController.createQuiz

// GET a specific quiz by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('classroom', 'name').populate('createdBy', 'name email');
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('[quizRoutes] GET /:id : Error fetching quiz:', error.message, error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST submit a quiz
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    console.log('Quiz submission:', { quizId: req.params.id, answers, studentId: req.user.id }); // Use req.user.id
    res.json({ message: 'Quiz submitted successfully' });
  } catch (error) {
    console.error('Error submitting quiz:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;