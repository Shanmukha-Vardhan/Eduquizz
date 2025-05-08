// Eduquizz/src/backend/models/Submission.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubmittedAnswerSchema = new Schema({
    questionId: { // This should ideally be the _id of the question subdocument from the Quiz model
        type: Schema.Types.ObjectId, // Or String if you are using question text as an identifier (less robust)
        required: true
    },
    questionText: { // Storing the question text for easier review of submission
        type: String,
        required: true
    },
    selectedOption: {
        type: String,
        required: true // Or allow empty if student can skip questions
    },
    correctAnswer: { // Storing the correct answer for easier review
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    }
}, { _id: false }); // No separate _id for each submitted answer object within the array

const SubmissionSchema = new Schema({
    quiz: { // Reference to the Quiz
        type: Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    student: { // Reference to the User (student)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [SubmittedAnswerSchema], // Array of submitted answers
    score: { // Number of correct answers
        type: Number,
        required: true
    },
    totalQuestions: { // Total number of questions in the quiz at the time of submission
        type: Number,
        required: true
    },
    percentage: {
        type: Number,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Submission', SubmissionSchema);