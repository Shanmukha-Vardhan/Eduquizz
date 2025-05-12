// Eduquizz/src/frontend/src/pages/teacher/TeacherOverviewDashboard.jsx
import React from 'react';
import '../../styles/TeacherDashboard.css';

function TeacherOverviewDashboard() {
  return (
    <div className="teacher-overview-dashboard teacher-dashboard-container"> {}
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
      </header>
      
      <section className="card">
        <h2>Overview</h2>
        <p>Welcome to your Teacher Dashboard!</p>
        <p>Recent activity, upcoming quiz deadlines, and quick statistics will be displayed here in the future.</p>
        <p>Please use the navigation bar to manage your classrooms, quizzes, and view student performance.</p>
      </section>
    </div>
  );
}

export default TeacherOverviewDashboard;