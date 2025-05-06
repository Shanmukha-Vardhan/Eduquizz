// Eduquizz/src/backend/controllers/quizController.js
const Quiz = require('../models/Quiz');

exports.createQuiz = async (req, res) => {
  try {
    const { title, questions, classroom } = req.body;
    // --- MODIFICATION: Use req.user.id ---
    if (!req.user || !req.user.id) {
        console.log('[quizController] Create: Unauthorized - No user ID found');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role !== 'teacher') {
        console.log('[quizController] Create: Forbidden - Only teachers can create quizzes');
        return res.status(403).json({ error: 'Forbidden' });
    }
    const createdBy = req.user.id; // Use req.user.id
    // --- END MODIFICATION ---

    // Basic validation
    if (!title || !questions || !classroom || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Missing required quiz data or invalid questions format.' });
    }
    for (const q of questions) {
        if (!q.text || !q.options || !Array.isArray(q.options) || !q.answer) {
            return res.status(400).json({ error: 'Invalid question structure. Each question needs text, options array, and answer.' });
        }
    }

    const quiz = new Quiz({ title, questions, classroom, createdBy });
    await quiz.save();
    console.log('[quizController] Create: Quiz created successfully:', quiz);
    res.status(201).json(quiz);
  } catch (error) {
    console.error('[quizController] Create: Error creating quiz:', error.message, error.stack);
    res.status(500).json({ error: 'Server error while creating quiz' });
  }
};