const Classroom = require('../models/Classroom');

exports.createClassroom = async (req, res) => {
  try {
    console.log('Creating classroom with:', req.body, 'User:', req.user);
    const { name } = req.body;
    if (!req.user || !req.user.id) {
      console.log('!!! Unauthorized: No user found');
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }
    // Role check
    if (req.user.role !== 'teacher') {
      console.log('Invalid role for classroom creation:', req.user.role);
      return res.status(403).json({ error: 'Invalid role' });
    }
    const teacher = req.user.id;
    const classroom = new Classroom({ name, teacher, students: [] });
    console.log('Saving classroom:', classroom);
    await classroom.save();
    console.log('Classroom saved successfully:', classroom._id);
    res.status(201).json(classroom);
  } catch (error) {
    console.error('Error creating classroom:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// In controllers/classroomController.js
exports.getClassrooms = async (req, res) => {
  try {
    console.log('[BACKEND LOG] getClassrooms: req.user is:', req.user); // Log 1
    const classrooms = await Classroom.find({ teacher: req.user.id }).populate('students');
    console.log('[BACKEND LOG] getClassrooms: Classrooms found by query:', classrooms); // Log 2 (ADD THIS LINE)
    res.json(classrooms);
  } catch (error) {
    console.error('[BACKEND LOG] getClassrooms: Error fetching classrooms:', error.message, error.stack); // Add error.stack
    res.status(500).json({ error: 'Server error' });
  }
};