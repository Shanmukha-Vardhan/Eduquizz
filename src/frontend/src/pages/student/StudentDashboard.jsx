// src/frontend/src/pages/student/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import '../../styles/StudentDashboard.css'; // Assuming you have this file and it's correctly styled

function StudentDashboard() {
  const [classrooms, setClassrooms] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [error, setError] = useState(null); // For general errors or specific fetch errors

  console.log("StudentDashboard: Component rendering/re-rendering");

  useEffect(() => {
    console.log("StudentDashboard: useEffect triggered to fetch data.");
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoadingClassrooms(false);
      setLoadingQuizzes(false);
      // Optionally, you could redirect to login here if no token
      // import { useNavigate } from 'react-router-dom';
      // const navigate = useNavigate(); navigate('/login');
      return;
    }

    // --- Fetch Classrooms ---
 // In src/pages/student/StudentDashboard.jsx
const fetchClassrooms = async () => {
  console.log("[FRONTEND LOG] Attempting to fetch classrooms...");
  setLoadingClassrooms(true);
  setError(null);
  const token = localStorage.getItem('token'); // Make sure token is fetched here
  if (!token) {
    setError("Auth token not found in fetchClassrooms");
    setLoadingClassrooms(false);
    return;
  }

  try {
    const response = await fetch('/api/classroom', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("[FRONTEND LOG] Fetch classrooms API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text(); // Get error text if not ok
      console.error("[FRONTEND LOG] Error fetching classrooms:", response.status, response.statusText, "Error body:", errorText);
      setError(`Error fetching classrooms: ${response.statusText} - ${errorText.substring(0,100)}`);
      setClassrooms([]);
      return;
    }

    // Try to parse JSON directly
    const data = await response.json();
    console.log("[FRONTEND LOG] Fetched and parsed classrooms data:", data);
    setClassrooms(Array.isArray(data) ? data : []);

  } catch (err) {
    // This catch block will now primarily catch network errors or if response.json() itself fails
    console.error("[FRONTEND LOG] Network or JSON parsing error during fetchClassrooms:", err);
    setError(`An error occurred: ${err.message}`);
    setClassrooms([]);
  } finally {
    setLoadingClassrooms(false);
  }
};
// Make similar focused changes to fetchQuizzes if you are testing that too

    // --- Fetch Quizzes ---
    const fetchQuizzes = async () => {
      console.log("Attempting to fetch quizzes...");
      setLoadingQuizzes(true);
      // setError(null); // Clear previous errors for this fetch - or use separate error states
      try {
        const response = await fetch('/api/quiz', {
          headers: {
            'Authorization': `Bearer ${token}`, // IMPORTANT: Send the token
            'Content-Type': 'application/json',
          },
        });

        console.log("Fetch quizzes API response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to fetch quizzes and couldn't parse error." }));
          console.error("Error fetching quizzes:", response.status, response.statusText, errorData);
          setError(prevError => `${prevError || ''} Error fetching quizzes: ${errorData.message || response.statusText}`);
          setQuizzes([]);
          return;
        }

        const data = await response.json();
        console.log("Fetched quizzes data:", data);
        setQuizzes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Network or other error during fetchQuizzes:", err);
        setError(prevError => `${prevError || ''} An error occurred: ${err.message}`);
        setQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchClassrooms();
    fetchQuizzes();

  }, []); // Empty dependency array means this runs once on mount

  // --- Render Logic ---

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
          ) : (
            <div className="classroom-list">
              {classrooms.length > 0 ? (
                classrooms.map((classroom, index) => (
                  // Ensure classroom object has a unique 'id' or use index if names can repeat
                  <div className="classroom-item" key={classroom.id || index}>
                    {classroom.name || 'Unnamed Classroom'}
                  </div>
                ))
              ) : (
                <p>No classrooms available.</p>
              )}
            </div>
          )}
        </section>

        <section className="quizzes">
          <h2>Available Quizzes</h2>
          {loadingQuizzes ? (
            <p>Loading quizzes...</p>
          ) : (
            <ul className="quiz-list">
              {quizzes.length > 0 ? (
                quizzes.map((quiz, index) => (
                  <li key={quiz.id || index}> {/* Ensure quiz object has a unique 'id' */}
                    {quiz.name || 'Unnamed Quiz'}
                    {/* You'll need to implement navigation to the quiz */}
                    <button className="start-quiz-btn" onClick={() => alert(`Start quiz: ${quiz.name} (ID: ${quiz.id || 'N/A'})`)}>
                      Start
                    </button>
                  </li>
                ))
              ) : (
                <p>No quizzes available.</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;