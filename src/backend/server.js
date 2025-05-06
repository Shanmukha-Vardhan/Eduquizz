// Eduquizz/src/backend/server.js

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const classroomRoutes = require('./routes/classroomRoutes'); // We still need this for other routes

const PORT = process.env.PORT || 3000;
const app = express();

connectDB();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`****** GLOBAL LOGGER: Received ${req.method} request for ${req.originalUrl} ******`);
  next();
});

// --- API Routes ---
console.log('Mounting API routes...');
app.use('/api/auth', authRoutes);
console.log('--> Auth routes mounted successfully on /api/auth');

// --- TEMPORARY TEST ROUTE FOR /api/classrooms ---
// This MUST be defined BEFORE the general classroomRoutes if it uses the same base path.
// However, for testing, let's make it very specific.
app.get('/api/classrooms/test-direct', (req, res) => {
  console.log('****** HIT DIRECT TEST ROUTE: /api/classrooms/test-direct ******');
  res.json({ message: "Direct test route for /api/classrooms/test-direct was hit!" });
});

// --- REGULAR ROUTE MOUNTING ---
app.use('/api/quizzes', quizRoutes);
console.log('--> Quiz routes mounted successfully on /api/quizzes');

app.use('/api/classrooms', classroomRoutes); // This is where your router should handle /api/classrooms/ and /api/classrooms/create
console.log('--> Classroom routes (router) mounted successfully on /api/classrooms');


app.get('/', (req, res) => {
  res.send('EduQuiz Backend API is running!');
});

// ... (error handlers and app.listen remain the same) ...
process.on('unhandledRejection', (reason, promise) => {
  console.error('****** UNHANDLED REJECTION ******');
  console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('****** UNCAUGHT EXCEPTION ******');
  console.error('Error:', error);
  console.error('!!! Server is likely in an unstable state. Exiting...');
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`****** Server is LIVE and listening on http://localhost:${PORT} ******`);
});

console.log('>>> Server script execution finished. Listener should be active.');
