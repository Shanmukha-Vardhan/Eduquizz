// Eduquizz/src/backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom'); // Needed to potentially check teacher assignment

exports.createQuiz = async (req, res) => {
  console.log('[quizController] Create: Attempting to create quiz...');
  try {
    // 1. Check Authentication and Role
    if (!req.user || !req.user.id) {
        console.log('[quizController] Create: Unauthorized - No user ID found');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role !== 'teacher') {
        console.log('[quizController] Create: Forbidden - Only teachers can create quizzes. Role:', req.user.role);
        return res.status(403).json({ error: 'Forbidden: Only teachers can create quizzes' });
    }
    const teacherId = req.user.id; // Logged-in teacher's ID

    // 2. Extract data from request body
    const { title, questions, classroom: classroomId } = req.body; // classroomId should be the ObjectId string

    // 3. Basic Validation
    if (!title || !questions || !classroomId || !Array.isArray(questions) || questions.length === 0) {
      console.log('[quizController] Create: Bad Request - Missing required fields.');
      return res.status(400).json({ error: 'Missing required quiz data (title, questions array, classroom ID)' });
    }
    // Deeper validation for question structure
    for (const q of questions) {
        if (!q.text?.trim() || !q.answer?.trim() || !Array.isArray(q.options) || q.options.length === 0 || q.options.some(opt => !opt?.trim())) {
            console.log('[quizController] Create: Bad Request - Invalid question structure:', q);
            return res.status(400).json({ error: 'Invalid question structure. Each question needs text, answer, and at least one non-empty option.' });
        }
        // Ensure answer matches one of the options
        if (!q.options.map(opt => opt.trim()).includes(q.answer.trim())) {
             console.log('[quizController] Create: Bad Request - Correct answer does not match any option:', q);
             return res.status(400).json({ error: `Correct answer "${q.answer}" must match one of the options for question "${q.text.substring(0,30)}...".` });
        }
    }

    // 4. Verify Teacher is assigned to the target Classroom (Security Check)
    const assignedClassroom = await Classroom.findOne({ _id: classroomId, teacher: teacherId });
    if (!assignedClassroom) {
        console.log(`[quizController] Create: Forbidden - Teacher ${teacherId} is not assigned to classroom ${classroomId}`);
        return res.status(403).json({ error: 'Forbidden: You can only create quizzes for classrooms you are assigned to.' });
    }

    // 5. Create and Save the Quiz
    const quiz = new Quiz({
      title: title.trim(),
      // Map questions to ensure only expected fields are saved and trim values
      questions: questions.map(q => ({
          text: q.text.trim(),
          options: q.options.map(opt => opt.trim()).filter(opt => opt), // Save trimmed, non-empty options
          answer: q.answer.trim(),
      })),
      classroom: classroomId,
      createdBy: teacherId // Save the creator's ID
    });

    await quiz.save();

    // Optional: Add the quiz reference to the Classroom document
    // assignedClassroom.quizzes.push(quiz._id);
    // await assignedClassroom.save();

    console.log('[quizController] Create: Quiz created successfully:', quiz._id);
    res.status(201).json(quiz); // Send back the created quiz object
    return; // Added return

  } catch (error) {
    console.error('[quizController] Create: Error creating quiz:', error.message, error.stack);
    // Handle potential validation errors from Mongoose
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid Classroom ID format.' });
    }
    if (!res.headersSent) {
        res.status(500).json({ error: 'Server error while creating quiz' });
    }
    return; // Added return
  }
};

// Add other functions later (getQuizById, updateQuiz, deleteQuiz, getResults etc.)
// exports.getQuizById = async (req, res) => { ... };