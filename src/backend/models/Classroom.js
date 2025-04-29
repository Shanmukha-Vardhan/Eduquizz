const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    classroom_name: { type: String, required: true },
    classroom_code: { type: String, required: true, unique: true },
    assigned_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Classroom', classroomSchema);