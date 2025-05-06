// Eduquizz/src/backend/controllers/classroomController.js
const Classroom = require('../models/Classroom');

exports.createClassroom = async (req, res) => {
  try {
    const { name } = req.body;
    // --- MODIFICATION: Use req.user.id ---
    if (!req.user || !req.user.id) { // Check for req.user.id
      console.log('[classroomController] Create: Unauthorized - No user ID found in req.user');
      return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    if (req.user.role !== 'teacher') {
      console.log('[classroomController] Create: Forbidden - Invalid role for classroom creation:', req.user.role);
      return res.status(403).json({ error: 'Forbidden: Only teachers can create classrooms' });
    }

    const teacherId = req.user.id; // Use req.user.id
    // --- END MODIFICATION ---
    console.log(`[classroomController] Create: Attempting to create classroom "${name}" for teacher ID: ${teacherId}`);

    const classroom = new Classroom({ name, teacher: teacherId, students: [], quizzes: [] });
    await classroom.save();

    console.log('[classroomController] Create: Classroom saved successfully:', classroom);
    res.status(201).json(classroom);
  } catch (error) {
    console.error('[classroomController] Create: Error creating classroom:', error);
    res.status(500).json({ error: 'Server error while creating classroom' });
  }
};

exports.getClassrooms = async (req, res) => {
  try {
    // --- MODIFICATION: Use req.user.id and check req.user.role ---
    if (!req.user || !req.user.id || !req.user.role) { // Check for req.user.id and req.user.role
        console.log('[classroomController] Get: Unauthorized - User ID or role not found in req.user');
        return res.status(401).json({ error: 'Unauthorized: User ID or role not found' });
    }

    let classroomsQuery = {};
    const currentUserId = req.user.id; // Use req.user.id
    const currentUserRole = req.user.role;
    // --- END MODIFICATION ---

    console.log(`[classroomController] Get: Fetching classrooms for user ID: ${currentUserId}, Role: ${currentUserRole}`);

    if (currentUserRole === 'teacher') {
        classroomsQuery = { teacher: currentUserId };
        console.log('[classroomController] Get: Querying for teacher');
    } else if (currentUserRole === 'student') {
        classroomsQuery = { students: currentUserId };
        console.log('[classroomController] Get: Querying for student');
    } else {
        console.log('[classroomController] Get: Role not permitted or unknown:', currentUserRole);
        return res.json([]);
    }

    const classrooms = await Classroom.find(classroomsQuery)
                                      .populate('teacher', 'name email')
                                      .populate('students', 'name email')
                                      .populate('quizzes', 'title');

    console.log('[classroomController] Get: Classrooms found:', classrooms.length);
    res.json(classrooms);
  } catch (error) {
    console.error('[classroomController] Get: Error fetching classrooms:', error.message, error.stack);
    res.status(500).json({ error: 'Server error while fetching classrooms' });
  }
};