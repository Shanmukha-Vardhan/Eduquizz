// Eduquizz/src/frontend/src/components/Navbar.jsx
import React from 'react';
import { NavLink, Link } from 'react-router-dom'; 
import '../styles/Navbar.css';

function Navbar({ isAuthenticated, userRole, handleLogout }) {

  const renderNavLinks = () => {
    if (!isAuthenticated) {
      return null; 
    }

    let links = [];
    let dashboardPath = "/"; 

    if (userRole === 'admin') {
      dashboardPath = "/admin";
      links = [
        { to: dashboardPath, text: 'Dashboard' },
        { to: "/admin/users", text: 'Manage Users' }, 
        { to: "/admin/classrooms", text: 'Classroom Control' },
        { to: "/admin/quizzes", text: 'Quiz Monitor' }, 
        { to: "/admin/reports", text: 'Reports & Analytics' }, 
        { to: "/admin/settings", text: 'Settings' } 
      ];
    } else if (userRole === 'teacher') {
      dashboardPath = "/teacher";
      links = [
        { to: dashboardPath, text: 'Dashboard' },
        { to: "/teacher/classrooms", text: 'My Classrooms' },
        { to: "/teacher/create-quiz", text: 'Create Quiz' }, 
        { to: "/teacher/quiz-library", text: 'Quiz Library' },
        { to: "/teacher/student-performance", text: 'Student Performance' },
        { to: "/teacher/notifications", text: 'Notifications' } 
      ];
    } else if (userRole === 'student') {
      dashboardPath = "/student";
      links = [
        { to: dashboardPath, text: 'Home' }, 
        { to: "/student/results", text: 'My Results' }, 
        { to: "/student/upcoming", text: 'Upcoming Quizzes' },
        { to: "/student/profile", text: 'My Profile' },
        { to: "/help", text: 'Help / FAQ' }
      ];
    }

    return (
      <>
        {links.map(link => (
          <li key={link.text}>
            <NavLink 
              to={link.to} 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              {link.text}
            </NavLink>
          </li>
        ))}
      </>
    );
  };

  return (
    <nav className="navbar-main">
      <div className="navbar-container">
        <Link to={isAuthenticated && userRole ? (userRole === 'admin' ? '/admin' : userRole === 'teacher' ? '/teacher' : '/student') : '/'} className="navbar-logo">
          .SHANMUKHA
        </Link>
        
        {isAuthenticated && (
          <ul className="navbar-menu">
            {renderNavLinks()}
            {}
            {userRole === 'admin' && (
                 <li><button className="nav-button quick-action-btn">Create User</button></li>
            )}
            {userRole === 'teacher' && (
                 <li><button className="nav-button quick-action-btn">Add Question</button></li>
            )}
            <li>
              <button onClick={handleLogout} className="nav-button logout-btn">Logout</button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default Navbar;