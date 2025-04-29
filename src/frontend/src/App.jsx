import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './styles/App.css';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    console.log('Initial auth check:', { token, role });
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const ProtectedRoute = ({ children, allowedRole }) => {
    console.log('ProtectedRoute check:', { isAuthenticated, userRole, allowedRole });
    if (!isAuthenticated || (allowedRole && userRole !== allowedRole)) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>EduQuiz</h1>
          {isAuthenticated ? (
            <nav className="app-nav">
              <Link to="/admin" className="nav-link">Admin</Link>
              <Link to="/teacher" className="nav-link">Teacher</Link>
              <Link to="/student" className="nav-link">Student</Link>
              <button onClick={() => {
                localStorage.clear();
                setIsAuthenticated(false);
                setUserRole('');
              }}>Logout</button>
            </nav>
          ) : null}
        </header>
        <Routes>
          <Route path="/" element={<Login setAuth={setIsAuthenticated} setRole={setUserRole} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;