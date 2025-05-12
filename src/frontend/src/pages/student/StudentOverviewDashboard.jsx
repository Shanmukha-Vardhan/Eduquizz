// Eduquizz/src/frontend/src/pages/student/StudentOverviewDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/StudentDashboard.css'; // Share styles

function StudentOverviewDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [error, setError] = useState(null); 

  // Fetch Enrolled Classrooms
  useEffect(() => {
    const fetchClassrooms = async () => {
      setIsLoadingClassrooms(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found.");
        setIsLoadingClassrooms(false);
        return;
      }
      try {
        const response = await axios.get('/api/classrooms', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setClassrooms(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to fetch classrooms.");
        setClassrooms([]);
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  return (
    <div className="student-overview-dashboard student-dashboard-container">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
      </header>

      <section className="welcome-section card">
        <h2>Welcome!</h2>
        <p>Here's an overview of your current status. Use the navigation bar to take quizzes or view your results.</p>
        {}
      </section>

      <section className="classrooms card"> {}
        <h2>My Classrooms</h2>
        {isLoadingClassrooms ? (
          <p>Loading classrooms...</p>
        ) : error && !classrooms.length ? ( 
          <p className="error-message">{error.includes("classrooms") ? error : "Could not load classrooms."}</p>
        ) : classrooms.length > 0 ? (
          <div className="classroom-list">
            {classrooms.map((classroom) => (
              <div className="classroom-item" key={classroom._id}>
                {classroom.name || 'Unnamed Classroom'}
              </div>
            ))}
          </div>
        ) : (
          <p>You are not currently enrolled in any classrooms.</p>
        )}
      </section>

      {/* Quick links to other student pages */}
      <section className="quick-links-section card">
        <h2>Quick Links</h2>
        <div className="quick-links-container">
            <Link to="/student/quizzes" className="btn btn-primary">View Available Quizzes</Link>
            <Link to="/student/results" className="btn btn-info">View My Results</Link>
        </div>
      </section>
    </div>
  );
}

export default StudentOverviewDashboard;