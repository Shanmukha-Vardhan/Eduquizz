// Eduquizz/src/frontend/src/pages/student/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/StudentDashboard.css'; // Make sure this CSS file exists and is styled

function StudentDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [quizzes, setQuizzes] = useState([]); // Will now include 'hasAttempted'
  const [submissions, setSubmissions] = useState([]); // For quiz history
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true); // Loading state for submissions
  const [error, setError] = useState(null); // Combined error state for simplicity

  const navigate = useNavigate();

  console.log("StudentDashboard: Component rendering/re-rendering");

  useEffect(() => {
    console.log("StudentDashboard: useEffect triggered to fetch data.");
    const token = localStorage.getItem('token');

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoadingClassrooms(false);
      setLoadingQuizzes(false);
      setLoadingSubmissions(false);
      return;
    }

    const fetchData = async () => {
        setLoadingClassrooms(true);
        setLoadingQuizzes(true);
        setLoadingSubmissions(true);
        setError(null); // Clear previous errors

        const currentToken = localStorage.getItem('token'); // Re-fetch in case it changed
        if (!currentToken) {
            setError("Auth token disappeared during fetch operation.");
            setLoadingClassrooms(false);
            setLoadingQuizzes(false);
            setLoadingSubmissions(false);
            return;
        }

        try {
            // Fetch Classrooms
            console.log("[StudentDashboard] Attempting to fetch classrooms...");
            const classroomResponse = await fetch('/api/classrooms', {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!classroomResponse.ok) {
                const errText = await classroomResponse.text();
                throw new Error(`Fetching classrooms failed: ${classroomResponse.status} ${errText.substring(0,100)}`);
            }
            const classroomData = await classroomResponse.json();
            console.log("[StudentDashboard] Fetched classrooms:", classroomData);
            setClassrooms(Array.isArray(classroomData) ? classroomData : []);
        } catch (err) {
            console.error("[StudentDashboard] Error fetching classrooms:", err);
            setError(prev => (prev ? prev + " | " : "") + err.message);
            setClassrooms([]);
        } finally {
            setLoadingClassrooms(false);
        }

        try {
            // Fetch Quizzes (now includes 'hasAttempted')
            console.log("[StudentDashboard] Attempting to fetch quizzes...");
            const quizResponse = await fetch('/api/quizzes', {
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!quizResponse.ok) {
                const errText = await quizResponse.text();
                throw new Error(`Fetching quizzes failed: ${quizResponse.status} ${errText.substring(0,100)}`);
            }
            const quizData = await quizResponse.json();
            console.log("[StudentDashboard] Fetched quizzes (with attempt status):", quizData);
            setQuizzes(Array.isArray(quizData) ? quizData : []);
        } catch (err) {
            console.error("[StudentDashboard] Error fetching quizzes:", err);
            setError(prev => (prev ? prev + " | " : "") + err.message);
            setQuizzes([]);
        } finally {
            setLoadingQuizzes(false);
        }

        try {
            // Fetch Submissions History
            console.log("[StudentDashboard] Attempting to fetch submission history...");
            const submissionResponse = await fetch('/api/submissions/mystats', { // New endpoint
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!submissionResponse.ok) {
                const errText = await submissionResponse.text();
                throw new Error(`Fetching submissions failed: ${submissionResponse.status} ${errText.substring(0,100)}`);
            }
            const submissionData = await submissionResponse.json();
            console.log("[StudentDashboard] Fetched submissions:", submissionData);
            setSubmissions(Array.isArray(submissionData) ? submissionData : []);
        } catch (err) {
            console.error("[StudentDashboard] Error fetching submissions:", err);
            setError(prev => (prev ? prev + " | " : "") + err.message);
            setSubmissions([]);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    fetchData();

  }, []);

  const handleStartQuiz = (quizId, hasAttempted) => {
    if (hasAttempted) {
      // Optionally, navigate to a page showing their previous attempt,
      // or just inform them they've already taken it.
      // For now, we can just log and prevent navigation, or navigate to the results if we had a dedicated results page.
      // The button should ideally be disabled or different if hasAttempted is true.
      alert("You have already attempted this quiz. Reattempts are not currently allowed.");
      // Or, find the submission and navigate to a results view:
      // const submission = submissions.find(sub => sub.quiz._id === quizId);
      // if (submission) navigate(`/quiz/results/${submission._id}`); // Example route
      return;
    }
    console.log(`StudentDashboard: Navigating to quiz with ID: ${quizId}`);
    navigate(`/quiz/${quizId}`);
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return dateString; // fallback
    }
  };


  if (error && !loadingClassrooms && !loadingQuizzes && !loadingSubmissions) { // Show global error if all loading is done
    return (
      <div className="student-dashboard error-message" style={{ padding: '20px', color: 'red' }}>
        <h1>Student Dashboard</h1>
        <p>An error occurred: {error}</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <h1>Student Dashboard</h1>
      </header>
      <main className="student-main">
        <section className="classrooms card">
          <h2>My Classrooms</h2>
          {loadingClassrooms ? (
            <p>Loading classrooms...</p>
          ) : classrooms.length > 0 ? (
            <div className="classroom-list">
              {classrooms.map((classroom) => (
                <div className="classroom-item" key={classroom._id}>
                  {classroom.name || 'Unnamed Classroom'}
                </div>
              ))}
            </div>
          ) : (
            <p>{error && error.includes("classrooms") ? "Could not load classrooms." : "No classrooms available."}</p>
          )}
        </section>

        <section className="quizzes card">
          <h2>Available Quizzes</h2>
          {loadingQuizzes ? (
            <p>Loading quizzes...</p>
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
                    // disabled={quiz.hasAttempted} // Alternative: disable button
                  >
                    {quiz.hasAttempted ? 'View Score (N/A)' : 'Start Quiz'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             <p>{error && error.includes("quizzes") ? "Could not load quizzes." : "No quizzes available for your enrolled classrooms."}</p>
          )}
        </section>

        <section className="submissions-history card">
            <h2>My Quiz Attempts</h2>
            {loadingSubmissions ? (
                <p>Loading submission history...</p>
            ) : submissions.length > 0 ? (
                <table className="submissions-table">
                    <thead>
                        <tr>
                            <th>Quiz Title</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Date Submitted</th>
                            {/* <th>Actions</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map(sub => (
                            <tr key={sub._id}>
                                <td>{sub.quiz?.title || 'N/A'}</td>
                                <td>{sub.score} / {sub.totalQuestions}</td>
                                <td>{sub.percentage}%</td>
                                <td>{formatDate(sub.submittedAt)}</td>
                                {/* <td><button onClick={() => navigate(`/quiz/results/${sub._id}`)}>View Details</button></td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>{error && error.includes("submissions") ? "Could not load submission history." : "You have not attempted any quizzes yet."}</p>
            )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;