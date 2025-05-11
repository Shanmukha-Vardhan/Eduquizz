// Eduquizz/src/backend/routes/submissionRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');         // Needed for authorization check
const Classroom = require('../models/Classroom'); // Needed for authorization check
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
            .populate('quiz', 'title')
            .sort({ submittedAt: -1 });

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

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            console.log(`[submissionRoutes GET /quiz/:quizId] Quiz not found with ID: ${quizId}`);
            return res.status(404).json({ error: 'Quiz not found.' });
        }

        let authorized = false;
        if (quiz.createdBy && quiz.createdBy.equals(teacherId)) {
            authorized = true;
        } else {
            const classroom = await Classroom.findById(quiz.classroom);
            if (classroom && classroom.teacher.equals(teacherId)) {
                authorized = true;
            }
        }

        if (!authorized) {
            console.log(`[submissionRoutes GET /quiz/:quizId] Teacher ${teacherId} is not authorized to view submissions for quiz ${quizId}.`);
            return res.status(403).json({ error: 'Forbidden: You are not authorized to view submissions for this quiz.' });
        }

        const submissions = await Submission.find({ quiz: quizId })
            .populate('student', 'name email')
            .populate('quiz', 'title')
            .sort({ submittedAt: -1 });

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


// --- NEW: DELETE a specific submission (for Teachers to allow reattempt) ---
router.delete('/:submissionId', authMiddleware, async (req, res) => {
    try {
        const { submissionId } = req.params;
        const teacherId = req.user.id; // Logged-in teacher

        console.log(`[submissionRoutes DELETE /:submissionId] Attempt to delete submission ${submissionId} by teacher ${teacherId}`);

        if (req.user.role !== 'teacher') {
            console.log(`[submissionRoutes DELETE /:submissionId] Forbidden: User role is not teacher: ${req.user.role}`);
            return res.status(403).json({ error: 'Forbidden: Only teachers can delete submissions.' });
        }

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            console.log(`[submissionRoutes DELETE /:submissionId] Invalid submissionId format: ${submissionId}`);
            return res.status(400).json({ error: 'Invalid submission ID format.' });
        }

        // 1. Find the submission
        const submission = await Submission.findById(submissionId).populate('quiz'); // Populate quiz to get quiz.createdBy and quiz.classroom
        if (!submission) {
            console.log(`[submissionRoutes DELETE /:submissionId] Submission not found: ${submissionId}`);
            return res.status(404).json({ error: 'Submission not found.' });
        }

        // 2. Authorization Check:
        // Teacher must be the creator of the quiz OR the teacher of the classroom the quiz belongs to.
        const quiz = submission.quiz; // This is the populated quiz object from the submission
        if (!quiz) {
            // Should not happen if submission exists and quiz ref is valid, but good check
            console.error(`[submissionRoutes DELETE /:submissionId] Critical error: Quiz data not found for submission ${submissionId}.`);
            return res.status(500).json({ error: 'Internal error: Could not verify quiz for submission.' });
        }

        let authorizedToDelete = false;
        if (quiz.createdBy && quiz.createdBy.equals(teacherId)) {
            authorizedToDelete = true;
            console.log(`[submissionRoutes DELETE /:submissionId] Teacher ${teacherId} is creator of quiz ${quiz._id}. Authorized.`);
        } else {
            const classroom = await Classroom.findById(quiz.classroom);
            if (classroom && classroom.teacher.equals(teacherId)) {
                authorizedToDelete = true;
                console.log(`[submissionRoutes DELETE /:submissionId] Teacher ${teacherId} teaches classroom ${classroom._id} for quiz ${quiz._id}. Authorized.`);
            }
        }

        if (!authorizedToDelete) {
            console.log(`[submissionRoutes DELETE /:submissionId] Teacher ${teacherId} not authorized to delete submission ${submissionId} for quiz ${quiz._id}.`);
            return res.status(403).json({ error: 'You are not authorized to delete this submission.' });
        }

        // 3. Delete the submission
        await Submission.findByIdAndDelete(submissionId);
        console.log(`[submissionRoutes DELETE /:submissionId] Submission ${submissionId} deleted successfully by teacher ${teacherId}.`);
        res.json({ message: 'Submission deleted successfully. Student can now reattempt the quiz.' });

    } catch (error) {
        console.error(`[submissionRoutes DELETE /:submissionId] Error deleting submission ${req.params.submissionId}:`, error);
        if (error.name === 'CastError') { // Handles invalid ObjectId format for submissionId
            return res.status(400).json({ error: 'Invalid submission ID format.' });
        }
        if (!res.headersSent) {
            res.status(500).json({ error: 'Server error while deleting submission.' });
        }
    }
});


module.exports = router;