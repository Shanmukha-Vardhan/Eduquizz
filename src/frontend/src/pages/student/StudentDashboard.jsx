import React from 'react';
import '../../styles/StudentDashboard.css';

function StudentDashboard() {
  return (
    <div className="student-dashboard">
      <header className="student-header">
        <h1>Student Dashboard</h1>
      </header>
      <main className="student-main">
        <section className="classrooms">
          <h2>My Classrooms</h2>
          <div className="classroom-list">
            <div className="classroom-item">Classroom 1</div>
            {/* Add more dynamically later */}
          </div>
        </section>
        <section className="quizzes">
          <h2>Available Quizzes</h2>
          <ul className="quiz-list">
            <li>
              Quiz 1
              <button className="start-quiz-btn">Start</button>
            </li>
            {/* Add more quizzes dynamically later */}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;