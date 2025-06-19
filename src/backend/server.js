require('dotenv').config(); 


const express = require('express');
const cors = require('cors');
const path = require('path'); // <<<--- IMPORT PATH MODULE
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize App ---
console.log('Initializing Express app...');
const app = express();

// --- Connect to Database ---
console.log('Attempting to connect to MongoDB...');
connectDB();

// --- Core Middleware ---
console.log('Applying CORS middleware...');
// For Glitch, you might need a more permissive CORS initially, or configure based on your Glitch app URL
app.use(cors()); 

console.log('Applying JSON body parser middleware...');
app.use(express.json());

console.log('Applying Global Request Logger middleware...');
app.use((req, res, next) => {
  console.log(`****** GLOBAL LOGGER: Received ${req.method} request for ${req.originalUrl} ******`);
  next();
});

// --- API Routes ---
console.log('Mounting API routes...');
app.use('/api/auth', authRoutes);
console.log('--> Auth routes mounted successfully on /api/auth');
app.use('/api/quizzes', quizRoutes);
console.log('--> Quiz routes mounted successfully on /api/quizzes');
app.use('/api/classrooms', classroomRoutes);
console.log('--> Classroom routes mounted successfully on /api/classrooms');
app.use('/api/users', userRoutes);
console.log('--> User routes mounted successfully on /api/users');
app.use('/api/submissions', submissionRoutes);
console.log('--> Submission routes mounted successfully on /api/submissions');

const frontendBuildPath = path.join(__dirname, '..', '..', 'src', 'frontend', 'build');
console.log(`Serving static files from: ${frontendBuildPath}`);

app.use(express.static(frontendBuildPath));

// For any GET request that doesn't match an API route, serve the React app's index.html
app.get('*', (req, res) => {

  const indexPath = path.join(frontendBuildPath, 'index.html');
  console.log(`Attempting to serve index.html from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {

      console.error('Error sending index.html:', err);
      res.status(500).send('Error serving application.');
    }
  });
});

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

// --- Start Server ---
console.log('Starting server listener...');
app.listen(PORT, () => {
  console.log(`****** Server is LIVE and listening on http://localhost:${PORT} (or Glitch's assigned port) ******`);
});

console.log('>>> Server script execution finished. Listener should be active.');