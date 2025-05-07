// Eduquizz/src/backend/models/Quiz.js
const mongoose = require('mongoose');

// Defines the structure for each question within a quiz
const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'] // Added error message
  },
  options: [{ // Array of possible answer strings
    type: String,
    required: [true, 'At least one option is required']
  }],
  answer: { // The correct answer (should match one of the options)
    type: String,
    required: [true, 'The correct answer is required']
  },
  // You might remove the default _id for subdocuments if you don't need to query them directly
  // _id: false
});

// Defines the main quiz structure
const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  questions: {
      type: [questionSchema], // Array of question subdocuments
      validate: [arrayMinLength, '{PATH} requires at least one question'] // Ensure at least one question
  },
  classroom: { // Reference to the Classroom this quiz belongs to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Classroom assignment is required']
  },
  createdBy: { // Reference to the User (Teacher) who created the quiz
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator (teacher) ID is required'] // Important for filtering
  },
  // Optional fields you might add later:
  // timeLimit: { type: Number }, // Time limit in minutes
  // published: { type: Boolean, default: false },
  // dueDate: { type: Date },
}, { timestamps: true }); // Adds createdAt and updatedAt

// Custom validator function for array minimum length
function arrayMinLength(val) {
  return val.length > 0;
}

module.exports = mongoose.model('Quiz', quizSchema);