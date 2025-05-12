// Eduquizz/src/backend/server.js

// Load environment variables FIRST
require('dotenv').config(); // Ensure .env is loaded if it's in this directory
// If .env is in the root of the repo, and Glitch runs from root, this might need adjustment
// or rely on Glitch's UI for .env vars. For now, assume .env is in src/backend/

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

// --- Serve Static Frontend Assets (React Build) ---
// This section is crucial for serving your built React app
// It should come AFTER your API routes but BEFORE any catch-all for the root.

// Determine the correct path to the frontend build directory
// __dirname in this file (src/backend/server.js) refers to /app/src/backend on Glitch
// We need to go up two levels to /app/, then into src/frontend/build/
const frontendBuildPath = path.join(__dirname, '..', '..', 'src', 'frontend', 'build');
console.log(`Serving static files from: ${frontendBuildPath}`);

app.use(express.static(frontendBuildPath));

// For any GET request that doesn't match an API route, serve the React app's index.html
// This allows React Router to handle client-side navigation.
app.get('*', (req, res) => {
  // Ensure the path to index.html is correct
  const indexPath = path.join(frontendBuildPath, 'index.html');
  console.log(`Attempting to serve index.html from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Log the error and send a 500 response if index.html can't be sent
      console.error('Error sending index.html:', err);
      res.status(500).send('Error serving application.');
    }
  });
});


// --- Root/Test Route for API (Optional, but good to have before static serving catch-all) ---
// If you want a specific /api root message, it should be before the app.get('*') for static serving.
// However, since /api/* is handled by your specific routers, a general app.get('/') for API status
// might be caught by the static serving if not placed carefully or if you have an index.html at the root.
// For simplicity, the static serving catch-all is often sufficient.
// If you had app.get('/', ...) here, ensure it doesn't conflict with serving index.html.

// --- Global Error Handlers (Good Practice) ---
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