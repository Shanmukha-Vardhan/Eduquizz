import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './styles/App.css';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>EduQuiz</h1>
          <nav className="app-nav">
            <Link to="/admin" className="nav-link">Admin</Link>
            <Link to="/teacher" className="nav-link">Teacher</Link>
            <Link to="/student" className="nav-link">Student</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/" element={<h2>Welcome to EduQuiz! Select a role above.</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;