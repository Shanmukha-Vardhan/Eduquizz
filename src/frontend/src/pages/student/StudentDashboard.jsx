// Eduquizz/src/frontend/src/pages/student/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/StudentDashboard.css';

function StudentDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [error, setError] = useState(null);

  console.log("StudentDashboard: Component rendering/re-rendering");

  useEffect(() => {
    console.log("StudentDashboard: useEffect triggered to fetch data.");
    const token = localStorage.getItem('token');

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoadingClassrooms(false);
      setLoadingQuizzes(false);
      return;
    }

    const fetchClassrooms = async () => {
      console.log("[FRONTEND LOG][StudentDashboard] Attempting to fetch classrooms...");
      setLoadingClassrooms(true);
      // setError(null); // Reset error before new fetch if desired, or manage combined errors
      const currentToken = localStorage.getItem('token'); // Re-fetch token in case it changed (though unlikely here)
      if (!currentToken) {
        setError("Auth token not found in fetchClassrooms");
        setLoadingClassrooms(false);
        return;
      }

      try {
        // --- MODIFICATION: Use PLURAL path ---
        const response = await fetch('/api/classrooms', { // WAS: /api/classroom
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("[FRONTEND LOG][StudentDashboard] Fetch classrooms API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[FRONTEND LOG][StudentDashboard] Error fetching classrooms:", response.status, response.statusText, "Error body:", errorText);
          // Accumulate errors or set specific errors
          setError(prev => (prev ? prev + " | " : "") + `Error fetching classrooms: ${response.statusText} - ${errorText.substring(0,100)}`);
          setClassrooms([]);
          return; // Important to return here if you don't want to proceed
        }

        const data = await response.json();
        console.log("[FRONTEND LOG][StudentDashboard] Fetched and parsed classrooms data:", data);
        setClassrooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[FRONTEND LOG][StudentDashboard] Network or JSON parsing error during fetchClassrooms:", err);
        setError(prev => (prev ? prev + " | " : "") + `An error occurred fetching classrooms: ${err.message}`);
        setClassrooms([]);
      } finally {
        setLoadingClassrooms(false);
      }
    };

    const fetchQuizzes = async () => {
      console.log("[FRONTEND LOG][StudentDashboard] Attempting to fetch quizzes...");
      setLoadingQuizzes(true);
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        setError("Auth token not found in fetchQuizzes");
        setLoadingQuizzes(false);
        return;
      }

      try {
        // --- MODIFICATION: Use PLURAL path ---
        const response = await fetch('/api/quizzes', { // WAS: /api/quiz
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });

        console.log("[FRONTEND LOG][StudentDashboard] Fetch quizzes API response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[FRONTEND LOG][StudentDashboard] Error fetching quizzes:", response.status, response.statusText, "Error body:", errorText);
          setError(prev => (prev ? prev + " | " : "") + `Error fetching quizzes: ${errorText.substring(0,100)}`);
          setQuizzes([]);
          return;
        }

        const data = await response.json();
        console.log("[FRONTEND LOG][StudentDashboard] Fetched and parsed quizzes data:", data);
        setQuizzes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[FRONTEND LOG][StudentDashboard] Network or JSON parsing error during fetchQuizzes:", err);
        setError(prev => (prev ? prev + " | " : "") + `An error occurred fetching quizzes: ${err.message}`);
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    // Clear previous global error before fetching
    setError(null);
    fetchClassrooms();
    fetchQuizzes();

  }, []);

  if (error) {
    return (
      <div className="student-dashboard error-message" style={{ padding: '20px', color: 'red' }}>
        <h1>Student Dashboard</h1>
        <p>An error occurred: {error}</p>
        <p>Please try refreshing the page or logging out and back in. If the problem persists, contact support.</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <h1>Student Dashboard</h1>
      </header>
      <main className="student-main">
        <section className="classrooms">
          <h2>My Classrooms</h2>
          {loadingClassrooms ? (
            <p>Loading classrooms...</p>
          ) : classrooms.length > 0 ? (
            <div className="classroom-list">
              {classrooms.map((classroom) => ( // Use classroom._id for key
                <div className="classroom-item" key={classroom._id}>
                  {classroom.name || 'Unnamed Classroom'}
                </div>
              ))}
            </div>
          ) : (
            <p>No classrooms available.</p>
          )}
        </section>

        <section className="quizzes">
          <h2>Available Quizzes</h2>
          {loadingQuizzes ? (
            <p>Loading quizzes...</p>
          ) : quizzes.length > 0 ? (
            <ul className="quiz-list">
              {quizzes.map((quiz) => ( // Use quiz._id for key
                <li key={quiz._id}>
                  {quiz.title || 'Unnamed Quiz'} {/* Assuming quiz has 'title' not 'name' */}
                  <button className="start-quiz-btn" onClick={() => alert(`Start quiz: ${quiz.title} (ID: ${quiz._id})`)}>
                    Start
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No quizzes available.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;