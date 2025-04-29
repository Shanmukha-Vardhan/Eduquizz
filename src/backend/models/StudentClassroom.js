const mongoose = require('mongoose');

const studentClassroomSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true }
});

module.exports = mongoose.model('StudentClassroom', studentClassroomSchema);