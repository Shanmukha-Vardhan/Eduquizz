const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom'); // Make sure this model exists and is correct
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET all quizzes for the student's enrolled classrooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching quizzes for user:', req.user);

    // Find all classrooms the current user is enrolled in
    const classrooms = await Classroom.find({ students: req.user.id });

    // Extract classroom IDs
    const classroomIds = classrooms.map(c => c._id);

    // Find quizzes where quiz.classroom is in classroomIds
    const quizzes = await Quiz.find({ classroom: { $in: classroomIds } });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET a specific quiz by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST submit a quiz (placeholder logic)
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    console.log('Quiz submission:', { quizId: req.params.id, answers });
    // TODO: Implement quiz evaluation logic
    res.json({ message: 'Quiz submitted successfully' });
  } catch (error) {
    console.error('Error submitting quiz:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
