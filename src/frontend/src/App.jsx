// src/frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './styles/App.css';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard'; // Ensure this path is correct
import Login from './pages/Login';
import QuizAttempt from './pages/student/QuizAttempt'; // New import

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  console.log(
    `%c App Render: Auth=${isAuthenticated}, Role='${userRole}', Loading=${authLoading}`,
    'color: orange; font-weight: bold;'
  );

  useEffect(() => {
    console.log('%c App useEffect Running: Checking auth...', 'color: yellow;');
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      console.log('%c   useEffect checkAuth: Found in localStorage:', 'color: yellow;', { token, role });
      if (token && role) {
        console.log('%c   useEffect checkAuth: Setting state: Auth=true, Role=', role, 'color: yellow;');
        setIsAuthenticated(true);
        setUserRole(role);
      } else {
        console.log('%c   useEffect checkAuth: No token/role found, ensuring logged out state.', 'color: yellow;');
        setIsAuthenticated(false);
        setUserRole('');
      }
      console.log('%c   useEffect checkAuth: Setting authLoading=false', 'color: yellow;');
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const AppRoutes = () => {
    const navigate = useNavigate();

    const ProtectedRoute = ({ children, allowedRole }) => {
      console.log(
        `%c ProtectedRoute Check: Path=${window.location.pathname}, AllowedRole='${allowedRole}', AppState: Auth=${isAuthenticated}, Role='${userRole}', Loading=${authLoading}`,
        'color: cyan; font-weight: bold;'
      );

      if (authLoading) {
        console.log('%c   ProtectedRoute: Still loading auth state. Rendering null.', 'color: cyan;');
        return null;
      }

      if (!isAuthenticated) {
         console.log('%c   ProtectedRoute: Not Authenticated! Redirecting to / (from ProtectedRoute)', 'color: red; font-weight: bold;');
         return <Navigate to="/" replace />;
      }

      if (allowedRole && userRole !== allowedRole) {
          console.log(`%c   ProtectedRoute: Role Mismatch! UserRole='${userRole}', AllowedRole='${allowedRole}'. Redirecting to / (from ProtectedRoute)`, 'color: red; font-weight: bold;');
          return <Navigate to="/" replace />;
      }

      console.log('%c   ProtectedRoute: Access Granted. Rendering children.', 'color: limegreen; font-weight: bold;');
      return children;
    };

    const handleLogout = () => {
      console.log('%c handleLogout: Clearing localStorage and resetting state...', 'color: magenta;');
      localStorage.clear();
      setIsAuthenticated(false);
      setUserRole('');
      navigate('/');
    };

    console.log(`%c AppRoutes Render Check: Auth=${isAuthenticated}, Role='${userRole}', Loading=${authLoading}`, 'color: lightblue;');

    return (
        <>
            <header className="app-header">
              <h1>EduQuiz</h1>
              {isAuthenticated && !authLoading ? (
                <nav className="app-nav">
                  <button onClick={handleLogout}>Logout</button>
                </nav>
              ) : null}
            </header>

            {authLoading ? (
                <p>Loading Application...</p>
            ) : (
                <Routes>
                  <Route
                    path="/"
                    element={
                      !isAuthenticated ? (
                        <Login setAuth={setIsAuthenticated} setRole={setUserRole} />
                      ) : userRole === 'student' ? (
                        // If already on /student, let the /student route handle it.
                        // If on /, navigate to /student.
                        window.location.pathname === '/student' ? (
                            <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
                        ) : (
                            <Navigate to="/student" replace />
                        )
                      ) : userRole === 'admin' ? (
                        window.location.pathname === '/admin' ? (
                            <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
                        ) : (
                            <Navigate to="/admin" replace />
                        )
                      ) : userRole === 'teacher' ? (
                        window.location.pathname === '/teacher' ? (
                            <ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>
                        ) : (
                            <Navigate to="/teacher" replace />
                        )
                      ) : (
                        // Fallback if authenticated but role unknown or not on a dashboard path yet
                        // This could also be a redirect to login if role is truly unexpected
                        <>
                          <p>Authenticated, but role ('{userRole}') is unknown or no dashboard path matched for current path: {window.location.pathname}.</p>
                          <p>Consider redirecting to login or an error page.</p>
                        </>
                      )
                    }
                  />

                  {/* Specific Protected Routes */}
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
                        <StudentDashboard /> {/* Use the simplified version for this test */}
                      </ProtectedRoute>
                    }
                  />

                  {/* Quiz Route */}
                  <Route
  path="/quiz/:quizId"
  element={
    <ProtectedRoute> {/* Allow any authenticated user for now */}
      <QuizAttempt />
    </ProtectedRoute>
  }
/>

                  {/* Catch-all 404 */}
                  <Route path="*" element={<p>Page Not Found (404) - from catch-all</p>} />
                </Routes>
            )}
        </>
    );
  };

  return (
    <Router>
       <div className="App">
         <AppRoutes />
       </div>
    </Router>
  );
}

export default App;