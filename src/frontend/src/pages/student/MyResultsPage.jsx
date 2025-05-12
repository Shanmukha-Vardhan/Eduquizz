// Eduquizz/src/frontend/src/pages/student/MyResultsPage.jsx
import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // If you add "View Details" buttons later
import axios from 'axios';
import '../../styles/StudentDashboard.css'; // Share styles

function MyResultsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [error, setError] = useState(null);
  // const navigate = useNavigate(); // For future "View Details" button

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoadingSubmissions(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found.");
        setIsLoadingSubmissions(false);
        return;
      }
      try {
        const response = await axios.get('/api/submissions/mystats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSubmissions(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to fetch submission history.");
        setSubmissions([]);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };
    fetchSubmissions();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return dateString; }
  };

  return (
    <div className="my-results-page student-dashboard-container">
      <header className="dashboard-header">
        <h1>My Quiz Results</h1>
      </header>

      <section className="submissions-history card">
        {/* Removed h2 as page title serves this role */}
        {isLoadingSubmissions ? (
            <p>Loading submission history...</p>
        ) : error ? (
            <p className="error-message">{error}</p>
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
                            {/* <td><button onClick={() => navigate(`/quiz/results/attempt/${sub._id}`)} className="btn btn-info btn-extra-small">View Details</button></td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <p>You have not attempted any quizzes yet.</p>
        )}
      </section>
    </div>
  );
}

export default MyResultsPage;