const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  questions: [{ text: String, options: [String], correctAnswer: String }],
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;