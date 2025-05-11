// Eduquizz/src/backend/models/Quiz.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Good practice to alias mongoose.Schema

// Defines the structure for each question within a quiz
const questionSchema = new Schema({ // Changed to use Schema alias
  text: {
    type: String,
    required: [true, 'Question text is required']
  },
  questionType: { // <<< NEW FIELD
    type: String,
    required: [true, 'Question type is required.'],
    enum: {
        values: ['multiple-choice', 'true-false'],
        message: '{VALUE} is not a supported question type.'
    },
    default: 'multiple-choice'
  },
  options: [{
    type: String,
    // We'll make 'options' not strictly required at the schema level here,
    // because for true/false, the teacher might just select an answer
    // and the frontend/backend could auto-populate options if needed,
    // OR we enforce 2 options for true/false in the controller/pre-save hook.
    // For multiple-choice, it remains essential.
  }],
  answer: { // The correct answer (should match one of the options)
    type: String,
    required: [true, 'The correct answer is required']
  }
  // Mongoose adds _id to subdocuments in an array by default, which is usually fine.
});

// Defines the main quiz structure
const quizSchema = new Schema({ // Changed to use Schema alias
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true
  },
  questions: {
      type: [questionSchema], // Array of question subdocuments
      validate: [arrayMinLength, 'A quiz must have at least one question.'] // Custom validator message
  },
  classroom: { // Reference to the Classroom this quiz belongs to
    type: Schema.Types.ObjectId, // Changed to use Schema alias
    ref: 'Classroom',
    required: [true, 'Classroom assignment is required']
  },
  createdBy: { // Reference to the User (Teacher) who created the quiz
    type: Schema.Types.ObjectId, // Changed to use Schema alias
    ref: 'User', // Make sure 'User' is the correct name of your user model
    required: [true, 'Creator (teacher) ID is required']
  },
}, { timestamps: true }); // Adds createdAt and updatedAt

// Custom validator function for array minimum length
function arrayMinLength(val) {
  return val.length > 0;
}

// Optional: Pre-save hook for question-specific validation (good practice)
questionSchema.pre('validate', function(next) {
    // For 'multiple-choice', ensure there are at least 2 options and answer is one of them
    if (this.questionType === 'multiple-choice') {
        if (!this.options || this.options.filter(opt => opt && opt.trim() !== "").length < 2) {
            this.invalidate('options', 'Multiple-choice questions must have at least 2 non-empty options.', this.options);
        }
        // Ensure the answer is one of the provided non-empty options
        const nonEmptyOptions = this.options.map(opt => opt.trim()).filter(opt => opt);
        if (this.answer && !nonEmptyOptions.includes(this.answer.trim())) {
            this.invalidate('answer', 'The correct answer must be one of the provided non-empty options for multiple-choice.', this.answer);
        }
    }
    // For 'true-false', ensure there are exactly 2 options and answer is one of them
    else if (this.questionType === 'true-false') {
        const nonEmptyOptions = this.options ? this.options.map(opt => opt.trim()).filter(opt => opt) : [];
        if (nonEmptyOptions.length !== 2) {
            this.invalidate('options', 'True/False questions must have exactly 2 non-empty options provided by the teacher (e.g., "True", "False" or "Yes", "No").', this.options);
        }
        if (this.answer && nonEmptyOptions.length === 2 && !nonEmptyOptions.includes(this.answer.trim())) {
             this.invalidate('answer', 'The correct answer must be one of the two provided options for True/False.', this.answer);
        }
    }
    next();
});


module.exports = mongoose.model('Quiz', quizSchema);