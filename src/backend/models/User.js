const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'teacher', 'student'], // Ensure 'teacher' is included
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;