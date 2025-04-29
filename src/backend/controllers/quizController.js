const Quiz = require('../models/Quiz');

exports.createQuiz = async (req, res) => {
  try {
    const { title, questions, classroom } = req.body;
    const createdBy = req.user.id; // Assuming middleware sets req.user
    const quiz = new Quiz({ title, questions, classroom, createdBy });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};