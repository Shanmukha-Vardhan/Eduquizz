// Eduquizz/src/backend/routes/quizRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom');
const Submission = require('../models/Submission');
const quizController = require('../controllers/quizController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all quizzes
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    let quizzesData = [];
    if (currentUserRole === 'student') {
        const studentClassrooms = await Classroom.find({ students: currentUserId });
        if (studentClassrooms.length > 0) {
            const classroomIds = studentClassrooms.map(c => c._id);
            let availableQuizzes = await Quiz.find({ classroom: { $in: classroomIds } })
                .populate('classroom', 'name').populate('createdBy', 'name email').lean();
            const studentSubmissions = await Submission.find({ student: currentUserId }, 'quiz').lean();
            const attemptedQuizIds = new Set(studentSubmissions.map(sub => sub.quiz.toString()));
            quizzesData = availableQuizzes.map(quiz => ({ ...quiz, hasAttempted: attemptedQuizIds.has(quiz._id.toString()) }));
        }
    } else if (currentUserRole === 'teacher') {
        const teacherClassrooms = await Classroom.find({ teacher: currentUserId });
        if (teacherClassrooms.length > 0) {
            const classroomIds = teacherClassrooms.map(c => c._id);
            quizzesData = await Quiz.find({ classroom: { $in: classroomIds } }).populate('classroom', 'name').populate('createdBy', 'name email');
        }
    } else if (currentUserRole === 'admin') {
        quizzesData = await Quiz.find({}).populate('classroom', 'name').populate('createdBy', 'name email');
    }
    res.json(quizzesData);
    return;
  } catch (error) {
    console.error('[quizRoutes GET /] Error fetching quizzes:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'Server error while fetching quizzes' });
    return;
  }
});

// POST create a new quiz
router.post('/create', authMiddleware, quizController.createQuiz);

// GET a specific quiz by ID
router.get('/:id', authMiddleware, async (req, res) => {
  const quizIdFromParams = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(quizIdFromParams)) {
        return res.status(400).json({ error: 'Invalid quiz ID format.' });
    }
    const quiz = await Quiz.findById(quizIdFromParams);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (req.user.role === 'student') {
        const classroomForQuiz = await Classroom.findById(quiz.classroom);
        if (!classroomForQuiz || !classroomForQuiz.students.some(id => id.equals(req.user.id))) {
            return res.status(403).json({ error: 'You are not authorized to access this quiz.' });
        }
    }
    const populatedQuiz = await Quiz.findById(quizIdFromParams).populate('classroom', 'name').populate('createdBy', 'name email');
    if (!populatedQuiz) return res.status(404).json({ error: 'Quiz found but could not be populated' });
    res.json(populatedQuiz);
    return;
  } catch (error) {
    console.error(`[quizRoutes GET /:id] Error fetching quiz ${quizIdFromParams}:`, error.message);
    if (!res.headersSent) {
        if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid quiz ID format' });
        res.status(500).json({ error: 'Server error' });
    }
    return;
  }
});

// POST submit a quiz
router.post('/:id/submit', authMiddleware, async (req, res) => {
  const quizId = req.params.id;
  const studentId = req.user.id;
  const submittedAnswers = req.body.answers;
  try {
    if (!mongoose.Types.ObjectId.isValid(quizId) || !Array.isArray(submittedAnswers)) {
        return res.status(400).json({ error: 'Invalid input.' });
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    const classroomForQuiz = await Classroom.findById(quiz.classroom);
    if (!classroomForQuiz || !classroomForQuiz.students.some(id => id.equals(studentId))) {
        return res.status(403).json({ error: 'Not authorized for this quiz.' });
    }
    const existingSubmission = await Submission.findOne({ quiz: quizId, student: studentId });
    if (existingSubmission) {
        return res.status(403).json({
            error: 'You have already submitted this quiz.', message: 'You have already submitted this quiz.',
            submissionId: existingSubmission._id, score: existingSubmission.score,
            totalQuestions: existingSubmission.totalQuestions, percentage: existingSubmission.percentage,
            answers: existingSubmission.answers
        });
    }
    let score = 0; const processedAnswers = [];
    for (const sa of submittedAnswers) {
        const qDb = quiz.questions.find(q => q._id.equals(sa.questionId));
        if (qDb) {
            const correct = qDb.answer === sa.selectedOption;
            if (correct) score++;
            processedAnswers.push({ questionId: qDb._id, questionText: qDb.text, selectedOption: sa.selectedOption, correctAnswer: qDb.answer, isCorrect: correct });
        }
    }
    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const newSubmission = new Submission({ quiz: quizId, student: studentId, answers: processedAnswers, score, totalQuestions, percentage: parseFloat(percentage.toFixed(2)) });
    await newSubmission.save();
    res.status(201).json({ message: 'Quiz submitted successfully!', submissionId: newSubmission._id, score, totalQuestions, percentage, answers: newSubmission.answers });
    return;
  } catch (error) {
    console.error(`[quizRoutes POST /:id/submit] Error submitting quiz ${quizId}:`, error.message);
    if (!res.headersSent) {
        if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format.' });
        res.status(500).json({ error: 'Server error.' });
    }
    return;
  }
});

// DELETE a quiz by ID
router.delete('/:quizId', authMiddleware, async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) return res.status(400).json({ error: 'Invalid quiz ID format.' });
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    let authorized = (userRole === 'admin') || (userRole === 'teacher' && quiz.createdBy.equals(userId));
    if (!authorized) return res.status(403).json({ error: 'Not authorized to delete this quiz.' });
    await Submission.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);
    res.json({ message: 'Quiz and associated submissions deleted successfully.' });
    return;
  } catch (error) {
    console.error(`[quizRoutes DELETE /:quizId] Error deleting quiz ${quizId}:`, error.message);
    if (!res.headersSent) {
        if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format.' });
        res.status(500).json({ error: 'Server error.' });
    }
    return;
  }
});

// --- NEW: PUT update a quiz by ID (for Teachers/Admins) ---
router.put('/:quizId', authMiddleware, async (req, res) => {
    try {
        const { quizId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const { title, classroom: classroomId, questions } = req.body;

        console.log(`[quizRoutes PUT /:quizId] Attempt to update quiz ${quizId} by user ${userId} (Role: ${userRole})`);

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ error: 'Invalid quiz ID format.' });
        }
        if (!title || !questions || !classroomId || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ error: 'Missing required quiz data for update.' });
        }
        for (const q of questions) { // Basic question validation
            if (!q.text?.trim() || !q.answer?.trim() || !Array.isArray(q.options) || q.options.length < 1 || q.options.some(opt => !opt?.trim())) {
                return res.status(400).json({ error: 'Invalid question structure in update.' });
            }
            if (!q.options.map(opt => opt.trim()).includes(q.answer.trim())) {
                 return res.status(400).json({ error: `Correct answer for "${q.text.substring(0,20)}..." must match an option.` });
            }
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

        let authorizedToEdit = (userRole === 'admin') || (userRole === 'teacher' && quiz.createdBy.equals(userId));
        if (!authorizedToEdit) {
            return res.status(403).json({ error: 'You are not authorized to edit this quiz.' });
        }

        if (userRole === 'teacher' && classroomId !== quiz.classroom.toString()) {
            const newAssignedClassroom = await Classroom.findOne({ _id: classroomId, teacher: userId });
            if (!newAssignedClassroom) {
                return res.status(403).json({ error: 'Forbidden: You can only assign quizzes to classrooms you teach.' });
            }
        }

        quiz.title = title.trim();
        quiz.classroom = classroomId;
        quiz.questions = questions.map(q => ({
            _id: q._id || new mongoose.Types.ObjectId(), // Preserve existing _id or generate new one for new questions
            text: q.text.trim(),
            options: q.options.map(opt => opt.trim()).filter(opt => opt),
            answer: q.answer.trim(),
        }));
        // quiz.updatedAt = Date.now(); // Mongoose handles this if timestamps: true is in schema

        const updatedQuiz = await quiz.save();
        console.log(`[quizRoutes PUT /:quizId] Quiz ${quizId} updated successfully.`);
        res.json(updatedQuiz);
        return;

    } catch (error) {
        console.error(`[quizRoutes PUT /:quizId] Error updating quiz ${req.params.quizId}:`, error);
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid ID format.' });
        if (!res.headersSent) res.status(500).json({ error: 'Server error while updating quiz.' });
        return;
    }
});

module.exports = router;
