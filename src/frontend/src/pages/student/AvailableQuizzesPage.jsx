// Eduquizz/src/frontend/src/pages/student/AvailableQuizzesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/StudentDashboard.css'; 

function AvailableQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoadingQuizzes(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found.");
        setIsLoadingQuizzes(false);
        return;
      }
      try {
        const response = await axios.get('/api/quizzes', { 
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setQuizzes(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to fetch available quizzes.");
        setQuizzes([]);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId, hasAttempted) => {
    if (hasAttempted) {
      alert("You have already attempted this quiz. Reattempts are not currently allowed by your teacher for this quiz.");

      return;
    }
    navigate(`/quiz/${quizId}`);
  };

  return (
    <div className="available-quizzes-page student-dashboard-container">
      <header className="dashboard-header">
        <h1>Available Quizzes</h1>
      </header>

      <section className="quizzes card">
        {/* Removed h2 as page title serves this role */}
        {isLoadingQuizzes ? (
          <p>Loading quizzes...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : quizzes.length > 0 ? (
          <ul className="quiz-list">
            {quizzes.map((quiz) => (
              <li key={quiz._id} className="quiz-item">
                <div className="quiz-info">
                  <strong>{quiz.title || 'Unnamed Quiz'}</strong>
                  {quiz.classroom && quiz.classroom.name && (
                    <span className="quiz-classroom-info"> (Classroom: {quiz.classroom.name})</span>
                  )}
                  {quiz.hasAttempted && <span className="attempted-badge">Attempted</span>}
                </div>
                <button
                  className={`start-quiz-btn ${quiz.hasAttempted ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => handleStartQuiz(quiz._id, quiz.hasAttempted)}
                >
                  {quiz.hasAttempted ? 'View Score (N/A)' : 'Start Quiz'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
           <p>No quizzes available for your enrolled classrooms at the moment.</p>
        )}
      </section>
    </div>
  );
}

export default AvailableQuizzesPage;