import React from 'react';
import '../../styles/TeacherDashboard.css';

function TeacherDashboard() {
  return (
    <div className="teacher-dashboard">
      <header className="teacher-header">
        <h1>Teacher Dashboard</h1>
      </header>
      <main className="teacher-main">
        <section className="quiz-creation">
          <h2>Create Quiz</h2>
          <div className="quiz-form">
            <input type="text" placeholder="Quiz Title" />
            <textarea placeholder="Questions (e.g., 1. What is 2+2?)"></textarea>
            <button className="add-quiz-btn">Add Quiz</button>
          </div>
        </section>
        <section className="classroom-management">
          <h2>Classrooms</h2>
          <div className="classroom-list">
            <div className="classroom-card">
              <p>Classroom 1</p>
              <p>10 Students</p>
            </div>
            {/* Add more cards dynamically later */}
          </div>
        </section>
      </main>
    </div>
  );
}

export default TeacherDashboard;