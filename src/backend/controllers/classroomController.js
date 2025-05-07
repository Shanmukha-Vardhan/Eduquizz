// Eduquizz/src/backend/controllers/classroomController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User'); // Make sure User model is imported

// --- createClassroom: Now Admin-only, requires teacherId in body ---
exports.createClassroom = async (req, res) => {
  try {
    // Permission Check: Only Admin can create
    if (!req.user || req.user.role !== 'admin') {
      console.log('[classroomController] Create: Forbidden - User is not Admin:', req.user?.role);
      return res.status(403).json({ error: 'Forbidden: Only admins can create classrooms' });
    }

    // Admin needs to provide name and the ID of the teacher to assign
    const { name, teacherId } = req.body;
    if (!name || !teacherId) {
      return res.status(400).json({ error: 'Classroom name and teacherId are required in the request body' });
    }

    console.log(`[classroomController] Create: Admin (${req.user.id}) attempting to create classroom "${name}" and assign teacher ID: ${teacherId}`);

    // Verify the provided teacherId corresponds to an actual teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      console.log(`[classroomController] Create: Teacher not found or user is not a teacher: ${teacherId}`);
      return res.status(404).json({ error: 'Teacher specified by teacherId not found or is not a teacher' });
    }

    // Create the classroom with the specified teacher
    const classroom = new Classroom({ name, teacher: teacherId, students: [], quizzes: [] });
    await classroom.save();

    console.log('[classroomController] Create: Classroom saved successfully:', classroom);
    // Populate teacher details before sending back
    await classroom.populate('teacher', 'name email');
    res.status(201).json(classroom);

  } catch (error) {
    console.error('[classroomController] Create: Error creating classroom:', error);
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid Teacher ID format' });
    }
    res.status(500).json({ error: 'Server error while creating classroom' });
  }
};

// --- getClassrooms: Logic remains mostly the same, fetches based on role ---
exports.getClassrooms = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
        console.log('[classroomController] Get: Unauthorized - User ID or role not found in req.user');
        return res.status(401).json({ error: 'Unauthorized: User ID or role not found' });
    }

    let classroomsQuery = {};
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    console.log(`[classroomController] Get: Fetching classrooms for user ID: ${currentUserId}, Role: ${currentUserRole}`);

    if (currentUserRole === 'teacher') {
        // Teacher sees classrooms they are assigned to
        classroomsQuery = { teacher: currentUserId };
        console.log('[classroomController] Get: Querying for teacher');
    } else if (currentUserRole === 'student') {
        // Student sees classrooms they are enrolled in
        classroomsQuery = { students: currentUserId };
        console.log('[classroomController] Get: Querying for student');
    } else if (currentUserRole === 'admin') {
        // Admin sees ALL classrooms
        classroomsQuery = {};
        console.log('[classroomController] Get: Querying for admin (all classrooms)');
    } else {
        console.log('[classroomController] Get: Role not permitted or unknown:', currentUserRole);
        return res.json([]);
    }

    const classrooms = await Classroom.find(classroomsQuery)
                                      .populate('teacher', 'name email') // Populate teacher details
                                      .populate('students', 'name email') // Populate student details
                                      // Removed quiz populate for now based on previous fix
                                      // .populate('quizzes', 'title');

    console.log('[classroomController] Get: Classrooms found:', classrooms.length);
    res.json(classrooms);
  } catch (error) {
    console.error('[classroomController] Get: Error fetching classrooms:', error.message, error.stack);
    res.status(500).json({ error: 'Server error while fetching classrooms' });
  }
};


// --- enrollStudent: Now Admin-only ---
exports.enrollStudent = async (req, res) => {
  try {
    // Permission Check: Only Admin can enroll
    if (!req.user || req.user.role !== 'admin') {
        console.log('[classroomController] Enroll: Forbidden - User is not Admin:', req.user?.role);
        return res.status(403).json({ error: 'Forbidden: Only admins can enroll students' });
    }

    const { classroomId } = req.params;
    const { studentId } = req.body;
    const adminId = req.user.id; // Log which admin did it

    console.log(`[classroomController] Enroll: Admin (${adminId}) attempting to enroll student ${studentId} into classroom ${classroomId}`);

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required in the request body' });
    }

    // 1. Find the classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      console.log(`[classroomController] Enroll: Classroom not found: ${classroomId}`);
      return res.status(404).json({ error: 'Classroom not found' });
    }
    // Admin doesn't need to own the classroom, so remove the ownership check

    // 2. Verify the student exists and has the 'student' role
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
        console.log(`[classroomController] Enroll: Student not found or user is not a student: ${studentId}`);
        return res.status(404).json({ error: 'Student not found or invalid user role' });
    }

    // 3. Add student if not already present
    if (classroom.students.includes(studentId)) {
      console.log(`[classroomController] Enroll: Student ${studentId} already enrolled in classroom ${classroomId}`);
      // Changed to 200 OK with message, as it's not strictly an error if already enrolled
      await classroom.populate('students', 'name email'); // Populate anyway before sending back
      return res.status(200).json({ message: 'Student already enrolled in this classroom', classroom });
    }

    classroom.students.push(studentId);
    await classroom.save();

    console.log(`[classroomController] Enroll: Student ${studentId} successfully enrolled in classroom ${classroomId}`);
    await classroom.populate('students', 'name email');
    res.json({ message: 'Student enrolled successfully', classroom });

  } catch (error) {
    console.error('[classroomController] Enroll: Error enrolling student:', error);
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid Classroom or Student ID format' });
    }
    res.status(500).json({ error: 'Server error while enrolling student' });
  }
};

// --- NEW FUNCTION: assignTeacher (Admin-only) ---
exports.assignTeacher = async (req, res) => {
    try {
        // Permission Check: Only Admin can assign
        if (!req.user || req.user.role !== 'admin') {
            console.log('[classroomController] AssignTeacher: Forbidden - User is not Admin:', req.user?.role);
            return res.status(403).json({ error: 'Forbidden: Only admins can assign teachers' });
        }

        const { classroomId } = req.params;
        const { teacherId } = req.body; // Get teacher ID from request body
        const adminId = req.user.id;

        console.log(`[classroomController] AssignTeacher: Admin (${adminId}) attempting to assign teacher ${teacherId} to classroom ${classroomId}`);

        if (!teacherId) {
            return res.status(400).json({ error: 'Teacher ID is required in the request body' });
        }

        // 1. Find the classroom
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            console.log(`[classroomController] AssignTeacher: Classroom not found: ${classroomId}`);
            return res.status(404).json({ error: 'Classroom not found' });
        }

        // 2. Verify the teacher exists and has the 'teacher' role
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            console.log(`[classroomController] AssignTeacher: Teacher not found or user is not a teacher: ${teacherId}`);
            return res.status(404).json({ error: 'Teacher not found or invalid user role' });
        }

        // 3. Update the teacher field
        classroom.teacher = teacherId;
        await classroom.save();

        console.log(`[classroomController] AssignTeacher: Teacher ${teacherId} successfully assigned to classroom ${classroomId}`);
        await classroom.populate('teacher', 'name email'); // Populate details before sending back
        res.json({ message: 'Teacher assigned successfully', classroom });

    } catch (error) {
        console.error('[classroomController] AssignTeacher: Error assigning teacher:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid Classroom or Teacher ID format' });
        }
        res.status(500).json({ error: 'Server error while assigning teacher' });
    }
};