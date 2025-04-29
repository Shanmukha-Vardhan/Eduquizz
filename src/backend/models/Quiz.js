const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    quiz_title: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    time_limit_minutes: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);