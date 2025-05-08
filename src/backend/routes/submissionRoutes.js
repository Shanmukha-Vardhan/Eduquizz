// Eduquizz/src/backend/routes/submissionRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz'); // Needed to check quiz ownership/classroom
const Classroom = require('../models/Classroom'); // Needed to check teacher's classroom
const authMiddleware = require('../middleware/authMiddleware');

// GET all submissions for the logged-in student
router.get('/mystats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            console.log('[submissionRoutes GET /mystats] Forbidden: User role is not student:', req.user.role);
            return res.status(403).json({ error: 'Forbidden: Only students can access their submissions.' });
        }
        console.log('[submissionRoutes GET /mystats] Fetching submissions for student ID:', req.user.id);
        const submissions = await Submission.find({ student: req.user.id })
            .populate('quiz', 'title') // Populate the quiz title
            .sort({ submittedAt: -1 }); // Show most recent first

        // No need to check if !submissions, find returns empty array if none.
        console.log('[submissionRoutes GET /mystats] Found submissions:', submissions.length);
        res.json(submissions);
    } catch (error) {
        console.error('[submissionRoutes GET /mystats] Error fetching student submissions:', error);
        res.status(500).json({ error: 'Server error while fetching submissions.' });
    }
});

// GET all submissions for a specific quiz (for Teachers)
router.get('/quiz/:quizId', authMiddleware, async (req, res) => {
    try {
        const { quizId } = req.params;
        const teacherId = req.user.id;

        console.log(`[submissionRoutes GET /quiz/:quizId] Attempting to fetch submissions for quizId: ${quizId} by teacherId: ${teacherId}`);

        if (req.user.role !== 'teacher') {
            console.log(`[submissionRoutes GET /quiz/:quizId] Forbidden: User role is not teacher: ${req.user.role}`);
            return res.status(403).json({ error: 'Forbidden: Only teachers can view quiz submissions.' });
        }

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            console.log(`[submissionRoutes GET /quiz/:quizId] Invalid quizId format: ${quizId}`);
            return res.status(400).json({ error: 'Invalid quiz ID format.' });
        }

        // 1. Find the quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            console.log(`[submissionRoutes GET /quiz/:quizId] Quiz not found with ID: ${quizId}`);
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        // 2. Authorization: Check if the teacher is associated with this quiz's classroom
        //    or if the teacher created this quiz.
        let authorized = false;
        if (quiz.createdBy && quiz.createdBy.equals(teacherId)) {
            authorized = true;
            console.log(`[submissionRoutes GET /quiz/:quizId] Teacher ${teacherId} is the creator of quiz ${quizId}. Authorized.`);
        } else {
            const classroom = await Classroom.findById(quiz.classroom);
            if (classroom && classroom.teacher.equals(teacherId)) {
                authorized = true;
                console.log(`[submissionRoutes GET /quiz/:quizId] Teacher ${teacherId} teaches classroom ${classroom._id} for quiz ${quizId}. Authorized.`);
            }
        }

        if (!authorized) {
            console.log(`[submissionRoutes GET /quiz/:quizId] Teacher ${teacherId} is not authorized to view submissions for quiz ${quizId}.`);
            return res.status(403).json({ error: 'Forbidden: You are not authorized to view submissions for this quiz.' });
        }

        // 3. Fetch submissions for this quiz
        const submissions = await Submission.find({ quiz: quizId })
            .populate('student', 'name email') // Populate student's name and email
            .populate('quiz', 'title') // Populate quiz title (though we already have it, good for consistency)
            .sort({ submittedAt: -1 }); // Or sort by score, student name, etc.

        console.log(`[submissionRoutes GET /quiz/:quizId] Found ${submissions.length} submissions for quiz ${quizId}.`);
        res.json(submissions);

    } catch (error) {
        console.error(`[submissionRoutes GET /quiz/:quizId] Error fetching submissions for quiz ${req.params.quizId}:`, error);
        if (error.name === 'CastError') {
             return res.status(400).json({ error: 'Invalid ID format provided.' });
        }
        res.status(500).json({ error: 'Server error while fetching quiz submissions.' });
    }
});


module.exports = router;