// src/frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, Link } from 'react-router-dom';
import './styles/App.css';

// Admin Pages
import AdminOverviewDashboard from './pages/admin/AdminOverviewDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import CreateUserPage from './pages/admin/CreateUserPage';
import AdminDashboard from './pages/admin/AdminDashboard'; 

// Teacher Pages
import TeacherOverviewDashboard from './pages/teacher/TeacherOverviewDashboard';
import MyClassroomsPage from './pages/teacher/MyClassroomsPage';
import CreateQuizPageTeacher from './pages/teacher/CreateQuizPageTeacher';
import QuizLibraryPage from './pages/teacher/QuizLibraryPage';

// Student Pages
import StudentOverviewDashboard from './pages/student/StudentOverviewDashboard'; 
import AvailableQuizzesPage from './pages/student/AvailableQuizzesPage';     
import MyResultsPage from './pages/student/MyResultsPage';                 
import QuizAttempt from './pages/student/QuizAttempt';

// Other Pages & Components
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (token && role) {
        setIsAuthenticated(true);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setUserRole('');
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  // AppRoutes is now directly rendering the main layout structure
  const AppRoutes = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
      localStorage.clear();
      setIsAuthenticated(false);
      setUserRole('');
      navigate('/');
    };

    const ProtectedRoute = ({ children, allowedRole, publicPage = false }) => {
      if (authLoading) {
        return null;
      }
      if (publicPage) {
        return children;
      }
      if (!isAuthenticated) {
         return <Navigate to="/" replace />;
      }
      if (allowedRole && userRole !== allowedRole) {
          let homePath = "/";
          if (userRole === 'admin') homePath = '/admin';
          else if (userRole === 'teacher') homePath = '/teacher';
          else if (userRole === 'student') homePath = '/student';
          return <Navigate to={homePath} replace />;
      }
      return children;
    };

    return (
        // This div is the main layout wrapper returned by AppRoutes
        <div className="app-layout"> 
            <Navbar 
                isAuthenticated={isAuthenticated} 
                userRole={userRole} 
                handleLogout={handleLogout} 
            />
            <main className="app-content">
              {authLoading ? (
                  <div className="loading-container"><p>Loading Application...</p></div>
              ) : (
                  <Routes>
                    <Route
                      path="/"
                      element={
                        !isAuthenticated ? (
                          <Login setAuth={setIsAuthenticated} setRole={setUserRole} />
                        ) : userRole === 'student' ? (
                          <Navigate to="/student" replace />
                        ) : userRole === 'admin' ? (
                          <Navigate to="/admin" replace />
                        ) : userRole === 'teacher' ? (
                          <Navigate to="/teacher" replace />
                        ) : (
                          <>
                            <p>Authenticated, but role ('{userRole}') is unknown. Logging out.</p>
                            {(() => { handleLogout(); return null; })()}
                          </>
                        )
                      }
                    />

                    {/* === ADMIN ROUTES === */}
                    <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminOverviewDashboard /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><ManageUsersPage /></ProtectedRoute>} />
                    <Route path="/admin/users/create" element={<ProtectedRoute allowedRole="admin"><CreateUserPage /></ProtectedRoute>} />
                    <Route path="/admin/classrooms" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} /> 
                    <Route path="/admin/quizzes" element={<ProtectedRoute allowedRole="admin"><div>Quiz Monitor Page (Admin) - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><div>Reports & Analytics Page (Admin) - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><div>Settings Page (Admin) - Coming Soon</div></ProtectedRoute>} />

                    {/* === TEACHER ROUTES === */}
                    <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><TeacherOverviewDashboard /></ProtectedRoute>} />
                    <Route path="/teacher/classrooms" element={<ProtectedRoute allowedRole="teacher"><MyClassroomsPage /></ProtectedRoute>} />
                    <Route path="/teacher/create-quiz" element={<ProtectedRoute allowedRole="teacher"><CreateQuizPageTeacher /></ProtectedRoute>} />
                    <Route path="/teacher/quiz-library" element={<ProtectedRoute allowedRole="teacher"><QuizLibraryPage /></ProtectedRoute>} />
                    <Route path="/teacher/student-performance" element={<ProtectedRoute allowedRole="teacher"><div>Student Performance Page (Teacher) - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/teacher/notifications" element={<ProtectedRoute allowedRole="teacher"><div>Notifications Page (Teacher) - Coming Soon</div></ProtectedRoute>} />
                    
                    {/* === STUDENT ROUTES === */}
                    <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentOverviewDashboard /></ProtectedRoute>} />
                    <Route path="/student/quizzes" element={<ProtectedRoute allowedRole="student"><AvailableQuizzesPage /></ProtectedRoute>} />
                    <Route path="/student/results" element={<ProtectedRoute allowedRole="student"><MyResultsPage /></ProtectedRoute>} />
                    <Route path="/student/upcoming" element={<ProtectedRoute allowedRole="student"><div>Upcoming Quizzes Page (Student) - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><div>My Profile Page (Student) - Coming Soon</div></ProtectedRoute>} />
                    
                    <Route path="/quiz/:quizId" element={<ProtectedRoute><QuizAttempt /></ProtectedRoute>} />
                    
                    <Route path="/help" element={<ProtectedRoute><div>Help / FAQ Page - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/contact-me" element={<ProtectedRoute publicPage={true}><div>Contact Me Page - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/privacy-policy" element={<ProtectedRoute publicPage={true}><div>Privacy Policy Page - Coming Soon</div></ProtectedRoute>} />
                    <Route path="/terms-of-service" element={<ProtectedRoute publicPage={true}><div>Terms of Service Page - Coming Soon</div></ProtectedRoute>} />

                    <Route path="*" element={
                        <div><h2>Page Not Found (404)</h2><p>The page you are looking for does not exist.</p><Link to="/">Go to Homepage</Link></div>
                    } />
                  </Routes>
              )}
            </main>
            <Footer />
        </div> // Closing tag for div.app-layout
    );
  }; // End of AppRoutes

  // The main App component now just sets up the Router and the top-level .App div
  return ( 
    <Router>
      <div className="App"> 
        <AppRoutes />
      </div>
    </Router> 
  );
}
export default App;