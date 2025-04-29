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

exports.getClassrooms = async (req, res) => {
  try {
    console.log('Fetching classrooms for user:', req.user);
    const classrooms = await Classroom.find({ teacher: req.user.id }).populate('students');
    res.json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};