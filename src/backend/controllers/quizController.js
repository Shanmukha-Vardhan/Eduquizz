// Eduquizz/src/backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Classroom = require('../models/Classroom');

exports.createQuiz = async (req, res) => {
  console.log('[quizController] Create: Attempting to create quiz...');
  try {
    if (!req.user || !req.user.id || req.user.role !== 'teacher') {
        console.log('[quizController] Create: Unauthorized or invalid role.');
        return res.status(req.user && req.user.id ? 403 : 401).json({ error: 'Unauthorized or Forbidden' });
    }
    const teacherId = req.user.id;

    const { title, questions, classroom: classroomId } = req.body;

    // Basic structural validation
    if (!title || !classroomId || !Array.isArray(questions) || questions.length === 0) {
      console.log('[quizController] Create: Bad Request - Missing required fields (title, classroomId, or questions array).');
      return res.status(400).json({ error: 'Missing required quiz data: title, classroom ID, and at least one question.' });
    }

    // Validate classroom ownership
    const assignedClassroom = await Classroom.findOne({ _id: classroomId, teacher: teacherId });
    if (!assignedClassroom) {
        console.log(`[quizController] Create: Forbidden - Teacher ${teacherId} is not assigned to classroom ${classroomId}`);
        return res.status(403).json({ error: 'Forbidden: You can only create quizzes for classrooms you are assigned to.' });
    }

    // Process and validate questions from the request
    const processedQuestions = [];
    for (const q_req of questions) {
        if (!q_req.text?.trim() || !q_req.answer?.trim() || !q_req.questionType?.trim()) {
            console.log('[quizController] Create: Bad Request - Each question must have text, answer, and questionType.', q_req);
            return res.status(400).json({ error: 'Each question must have text, answer, and a question type.' });
        }

        const questionData = {
            text: q_req.text.trim(),
            questionType: q_req.questionType.trim(),
            answer: q_req.answer.trim(),
            options: [] // Initialize options
        };

        // Handle options based on questionType
        if (q_req.questionType === 'multiple-choice') {
            if (!Array.isArray(q_req.options) || q_req.options.filter(opt => opt && opt.trim() !== "").length < 2) {
                console.log('[quizController] Create: Bad Request - Multiple-choice questions need at least 2 non-empty options.', q_req);
                return res.status(400).json({ error: `Question "${questionData.text.substring(0,30)}..." (multiple-choice) requires at least 2 non-empty options.` });
            }
            questionData.options = q_req.options.map(opt => opt.trim()).filter(opt => opt); // Store trimmed, non-empty options
            if (!questionData.options.includes(questionData.answer)) {
                console.log('[quizController] Create: Bad Request - Answer not in options for multiple-choice.', q_req);
                return res.status(400).json({ error: `For question "${questionData.text.substring(0,30)}...", the answer "${questionData.answer}" must be one of the provided options.` });
            }
        } else if (q_req.questionType === 'true-false') {
            if (!Array.isArray(q_req.options) || q_req.options.filter(opt => opt && opt.trim() !== "").length !== 2) {
                console.log('[quizController] Create: Bad Request - True/False questions need exactly 2 non-empty options.', q_req);
                return res.status(400).json({ error: `Question "${questionData.text.substring(0,30)}..." (true/false) requires exactly 2 non-empty options (e.g., "True", "False").` });
            }
            questionData.options = q_req.options.map(opt => opt.trim()).filter(opt => opt); // Store trimmed, non-empty options
            if (!questionData.options.includes(questionData.answer)) {
                console.log('[quizController] Create: Bad Request - Answer not in options for true/false.', q_req);
                return res.status(400).json({ error: `For question "${questionData.text.substring(0,30)}...", the answer "${questionData.answer}" must be one of the two provided options.` });
            }
        }
        // No specific option handling for other types for now, but they must exist if defined in enum

        processedQuestions.push(questionData);
    }

    const newQuiz = new Quiz({
      title: title.trim(),
      classroom: classroomId,
      questions: processedQuestions, // Use the validated and processed questions
      createdBy: teacherId
    });

    await newQuiz.save(); // This will trigger the pre-save hooks in Quiz.js model as well

    console.log('[quizController] Create: Quiz created successfully:', newQuiz._id);
    res.status(201).json(newQuiz); // Send back the full created quiz object

  } catch (error) {
    console.error('[quizController] Create: Error creating quiz:', error.message, error.stack);
    if (error.name === 'ValidationError') { // Mongoose validation error
        // Extract a more user-friendly message if possible
        let messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ error: messages.join(', ') });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid Classroom ID format or other cast error.' });
    }
    if (!res.headersSent) {
        res.status(500).json({ error: 'Server error while creating quiz' });
    }
  }
};

// Other controller functions (getQuizById, updateQuiz, deleteQuiz, etc. would go here)
// We will implement updateQuiz later when we do Quiz Editing.