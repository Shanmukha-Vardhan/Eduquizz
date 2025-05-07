// Eduquizz/src/backend/controllers/classroomController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const mongoose = require('mongoose');
// const Quiz = require('../models/Quiz'); // Uncomment if you implement quiz deletion with classroom

// --- createClassroom: Admin-only, requires teacherId in body ---
exports.createClassroom = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log('[classroomController] Create: Forbidden - User is not Admin:', req.user?.role);
      return res.status(403).json({ error: 'Forbidden: Only admins can create classrooms' });
    }
    const { name, teacherId } = req.body;
    if (!name || !teacherId) {
      return res.status(400).json({ error: 'Classroom name and teacherId are required in the request body' });
    }
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ error: 'Invalid Teacher ID format' });
    }
    console.log(`[classroomController] Create: Admin (${req.user.id}) attempting to create classroom "${name}" and assign teacher ID: ${teacherId}`);
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      console.log(`[classroomController] Create: Teacher not found or user is not a teacher: ${teacherId}`);
      return res.status(404).json({ error: 'Teacher specified by teacherId not found or is not a teacher' });
    }
    const classroom = new Classroom({ name, teacher: teacherId, students: [], quizzes: [] });
    await classroom.save();
    console.log('[classroomController] Create: Classroom saved successfully:', classroom);
    await classroom.populate('teacher', 'name email');
    res.status(201).json(classroom);
  } catch (error) {
    console.error('[classroomController] Create: Error creating classroom:', error);
    if (error.name === 'CastError') { return res.status(400).json({ error: 'Invalid Teacher ID format' });}
    res.status(500).json({ error: 'Server error while creating classroom' });
  }
};

// --- getClassrooms: Logic depends on user role ---
exports.getClassrooms = async (req, res) => {
  console.log('--- [classroomController] getClassrooms: Function Entered ---');
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
        classroomsQuery = { teacher: currentUserId };
        console.log('[classroomController] Get: Querying for teacher');
    } else if (currentUserRole === 'student') {
        classroomsQuery = { students: currentUserId };
        console.log('[classroomController] Get: Querying for student');
    } else if (currentUserRole === 'admin') {
        classroomsQuery = {};
        console.log('[classroomController] Get: Querying for admin (all classrooms)');
    } else {
        console.log('[classroomController] Get: Role not permitted or unknown:', currentUserRole);
        return res.json([]);
    }
    const classrooms = await Classroom.find(classroomsQuery)
                                      .populate('teacher', 'name email')
                                      .populate('students', 'name email');
    console.log('[classroomController] Get: Classrooms found (before res.json):', classrooms);
    res.json(classrooms);
  } catch (error) {
    console.error('[classroomController] Get: Error fetching classrooms:', error.message, error.stack);
    res.status(500).json({ error: 'Server error while fetching classrooms' });
  }
};

// --- enrollStudent: Admin-only, uses studentEmail ---
exports.enrollStudent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log('[classroomController] Enroll: Forbidden - User is not Admin:', req.user?.role);
      return res.status(403).json({ error: 'Forbidden: Only admins can enroll students' });
    }
    const { classroomId } = req.params;
    const { studentEmail } = req.body;
    const adminId = req.user.id;
    console.log(`[classroomController] Enroll: Admin (${adminId}) enrolling student with email ${studentEmail} into classroom ${classroomId}`);
    if (!studentEmail) { return res.status(400).json({ error: 'Student email is required in the request body' }); }
    if (!mongoose.Types.ObjectId.isValid(classroomId)) { return res.status(400).json({ error: 'Invalid Classroom ID format' }); }
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) { console.log(`[classroomController] Enroll: Classroom not found: ${classroomId}`); return res.status(404).json({ error: 'Classroom not found' }); }
    const studentToEnroll = await User.findOne({ email: studentEmail });
    if (!studentToEnroll) { console.log(`[classroomController] Enroll: Student with email ${studentEmail} not found.`); return res.status(404).json({ error: `Student with email ${studentEmail} not found` }); }
    if (studentToEnroll.role !== 'student') { console.log(`[classroomController] Enroll: User with email ${studentEmail} is not a student (role: ${studentToEnroll.role}).`); return res.status(400).json({ error: `User with email ${studentEmail} is not a student.` }); }
    const studentIdToActuallyEnroll = studentToEnroll._id;
    if (classroom.students.includes(studentIdToActuallyEnroll)) {
      console.log(`[classroomController] Enroll: Student ${studentIdToActuallyEnroll} already enrolled in classroom ${classroomId}`);
      await classroom.populate('students', 'name email');
      return res.status(200).json({ message: 'Student already enrolled in this classroom', classroom });
    }
    classroom.students.push(studentIdToActuallyEnroll);
    await classroom.save();
    console.log(`[classroomController] Enroll: Student ${studentIdToActuallyEnroll} successfully enrolled in classroom ${classroomId}`);
    await classroom.populate('students', 'name email');
    res.json({ message: 'Student enrolled successfully', classroom });
  } catch (error) {
    console.error('[classroomController] Enroll: Error enrolling student:', error);
    if (error.name === 'CastError') { return res.status(400).json({ error: 'Invalid Classroom ID format' }); }
    res.status(500).json({ error: 'Server error while enrolling student' });
  }
};

// --- assignTeacher: Admin-only ---
exports.assignTeacher = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            console.log('[classroomController] AssignTeacher: Forbidden - User is not Admin:', req.user?.role);
            return res.status(403).json({ error: 'Forbidden: Only admins can assign teachers' });
        }
        const { classroomId } = req.params;
        const { teacherId } = req.body;
        const adminId = req.user.id;
        console.log(`[classroomController] AssignTeacher: Admin (${adminId}) attempting to assign teacher ${teacherId} to classroom ${classroomId}`);
        if (!teacherId) { return res.status(400).json({ error: 'Teacher ID is required in the request body' }); }
        if (!mongoose.Types.ObjectId.isValid(classroomId) || !mongoose.Types.ObjectId.isValid(teacherId)) {
            return res.status(400).json({ error: 'Invalid Classroom or Teacher ID format' });
        }
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) { console.log(`[classroomController] AssignTeacher: Classroom not found: ${classroomId}`); return res.status(404).json({ error: 'Classroom not found' }); }
        const teacher = await User.findById(teacherId);
        if (!teacher || teacher.role !== 'teacher') { console.log(`[classroomController] AssignTeacher: Teacher not found or user is not a teacher: ${teacherId}`); return res.status(404).json({ error: 'Teacher not found or invalid user role' }); }
        classroom.teacher = teacherId;
        await classroom.save();
        console.log(`[classroomController] AssignTeacher: Teacher ${teacherId} successfully assigned to classroom ${classroomId}`);
        await classroom.populate('teacher', 'name email');
        res.json({ message: 'Teacher assigned successfully', classroom });
    } catch (error) {
        console.error('[classroomController] AssignTeacher: Error assigning teacher:', error);
        if (error.name === 'CastError') { return res.status(400).json({ error: 'Invalid Classroom or Teacher ID format' }); }
        res.status(500).json({ error: 'Server error while assigning teacher' });
    }
};

// --- deleteClassroom: Admin-only ---
exports.deleteClassroom = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            console.log('[classroomController] Delete: Forbidden - User is not Admin:', req.user?.role);
            return res.status(403).json({ error: 'Forbidden: Only admins can delete classrooms' });
        }
        const { classroomId } = req.params;
        const adminId = req.user.id;
        console.log(`[classroomController] Delete: Admin (${adminId}) attempting to delete classroom ${classroomId}`);
        if (!mongoose.Types.ObjectId.isValid(classroomId)) {
            console.log(`[classroomController] Delete: Invalid Classroom ID format: ${classroomId}`);
            return res.status(400).json({ error: 'Invalid Classroom ID format' });
        }
        const deletedClassroom = await Classroom.findByIdAndDelete(classroomId);
        if (!deletedClassroom) {
            console.log(`[classroomController] Delete: Classroom not found: ${classroomId}`);
            return res.status(404).json({ error: 'Classroom not found' });
        }
        // Optional: Delete associated quizzes
        // const Quiz = require('../models/Quiz');
        // const deleteQuizResult = await Quiz.deleteMany({ classroom: classroomId });
        // console.log(`[classroomController] Delete: Deleted ${deleteQuizResult.deletedCount} quizzes associated with classroom ${classroomId}`);
        console.log(`[classroomController] Delete: Classroom ${classroomId} deleted successfully.`);
        res.json({ message: 'Classroom deleted successfully', classroomId: classroomId });
    } catch (error) {
        console.error('[classroomController] Delete: Error deleting classroom:', error);
        if (error.name === 'CastError') { return res.status(400).json({ error: 'Invalid Classroom ID format (caught in general catch)' }); }
        res.status(500).json({ error: 'Server error while deleting classroom' });
    }
};
