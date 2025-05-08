// Eduquizz/src/backend/server.js

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db'); // Import the DB connection function
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionRoutes = require('./routes/submissionRoutes'); // <<<--- IMPORT SUBMISSION ROUTES

// --- Configuration ---
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

// --- Initialize App ---
console.log('Initializing Express app...');
const app = express();

// --- Connect to Database ---
console.log('Attempting to connect to MongoDB...');
connectDB(); // Call the function to establish DB connection

// --- Core Middleware ---
console.log('Applying CORS middleware...');
app.use(cors()); // Enable Cross-Origin Resource Sharing

console.log('Applying JSON body parser middleware...');
app.use(express.json()); // Parse incoming JSON request bodies

console.log('Applying Global Request Logger middleware...');
app.use((req, res, next) => {
  console.log(`****** GLOBAL LOGGER: Received ${req.method} request for ${req.originalUrl} ******`);
  // Optional: Log headers if needed for debugging specific issues
  // console.log('Request Headers:', req.headers);
  next(); // Pass control to the next middleware/route
});

// --- API Routes ---
console.log('Mounting API routes...');

// Authentication routes (login, register)
app.use('/api/auth', authRoutes);
console.log('--> Auth routes mounted successfully on /api/auth');

// Quiz routes (plural)
app.use('/api/quizzes', quizRoutes);
console.log('--> Quiz routes mounted successfully on /api/quizzes');

// Classroom routes (plural)
app.use('/api/classrooms', classroomRoutes);
console.log('--> Classroom routes mounted successfully on /api/classrooms');

// User routes (for admin fetching user lists, etc.) (plural)
app.use('/api/users', userRoutes);
console.log('--> User routes mounted successfully on /api/users');

// Submission routes (plural)
app.use('/api/submissions', submissionRoutes); // <<<--- MOUNT SUBMISSION ROUTES
console.log('--> Submission routes mounted successfully on /api/submissions');


// --- Root/Test Route (Optional) ---
app.get('/', (req, res) => {
  res.send('EduQuiz Backend API is running!');
});

// --- Global Error Handlers (Good Practice) ---
// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('****** UNHANDLED REJECTION ******');
  console.error('Reason:', reason);
  // Avoid logging the whole promise object unless necessary, can be large
  // console.error('Promise:', promise);
});

// Catch uncaught synchronous exceptions
process.on('uncaughtException', (error) => {
  console.error('****** UNCAUGHT EXCEPTION ******');
  console.error('Error:', error);
  console.error('!!! Server is likely in an unstable state. Exiting...');
  // It's often recommended to exit gracefully after an uncaught exception
  // as the application state might be corrupt. Use process manager like PM2
  // in production to automatically restart.
  process.exit(1); // Consider if this is appropriate for your dev environment
});

// --- Start Server ---
console.log('Starting server listener...');
app.listen(PORT, () => {
  console.log(`****** Server is LIVE and listening on http://localhost:${PORT} ******`);
});

console.log('>>> Server script execution finished. Listener should be active.');