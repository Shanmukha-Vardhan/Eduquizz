// Eduquizz/src/frontend/src/pages/teacher/QuizLibraryPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/TeacherDashboard.css'; // Share styles

function QuizLibraryPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizListError, setQuizListError] = useState(null);
  
  const [selectedQuizForResults, setSelectedQuizForResults] = useState(null);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [generalModalMessage, setGeneralModalMessage] = useState('');
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isProcessingReattempt, setIsProcessingReattempt] = useState(null);

  const navigate = useNavigate();

  const fetchTeacherQuizzes = async () => {
    setIsLoadingQuizzes(true); setQuizListError(null);
    const token = localStorage.getItem('token');
    if (!token) { setQuizListError("Auth token missing."); setIsLoadingQuizzes(false); return; }
    try {
        const response = await axios.get('/api/quizzes', { headers: { 'Authorization': `Bearer ${token}` } });
        setQuizzes(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
        setQuizListError(err.response?.data?.error || err.message || "Failed to fetch quizzes.");
        setQuizzes([]);
    } finally { setIsLoadingQuizzes(false); }
  };

  const handleViewResults = async (quizToView) => {
    setSelectedQuizForResults(quizToView); setIsLoadingSubmissions(true);
    setSubmissionError(null); setQuizSubmissions([]); setShowResultsModal(true);
    const token = localStorage.getItem('token');
    if (!token) { setSubmissionError("Auth token missing."); setIsLoadingSubmissions(false); return; }
    try {
        const response = await axios.get(`/api/submissions/quiz/${quizToView._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setQuizSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
        setSubmissionError(err.response?.data?.error || err.message || "Failed to fetch submissions.");
    } finally { setIsLoadingSubmissions(false); }
  };

  const openDeleteConfirmModal = (quiz) => { setQuizToDelete(quiz); setShowConfirmDeleteModal(true); };
  const closeDeleteConfirmModal = () => { setQuizToDelete(null); setShowConfirmDeleteModal(false); };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) { setGeneralModalMessage("Auth error."); setShowGeneralModal(true); closeDeleteConfirmModal(); return; }
    try {
        await axios.delete(`/api/quizzes/${quizToDelete._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage(`Quiz "${quizToDelete.title}" deleted.`); setShowGeneralModal(true);
        fetchTeacherQuizzes(); // Refresh quiz list
    } catch (err) {
        setGeneralModalMessage(`Error: ${err.response?.data?.error || err.message || "Failed to delete quiz."}`); setShowGeneralModal(true);
    } finally { closeDeleteConfirmModal(); }
  };

  const handleAllowReattempt = async (submissionId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}'s attempt? This will allow them to reattempt the quiz.`)) {
        return;
    }
    setIsProcessingReattempt(submissionId);
    const token = localStorage.getItem('token');
    if (!token) {
        setGeneralModalMessage("Authentication error."); setShowGeneralModal(true);
        setIsProcessingReattempt(null); return;
    }
    try {
        await axios.delete(`/api/submissions/${submissionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage(`${studentName}'s attempt deleted. They can now reattempt the quiz.`);
        setShowGeneralModal(true);
        if (selectedQuizForResults) { 
            const response = await axios.get(`/api/submissions/quiz/${selectedQuizForResults._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            setQuizSubmissions(Array.isArray(response.data) ? response.data : []);
        }
    } catch (err) {
        setGeneralModalMessage(`Error: ${err.response?.data?.error || err.message || "Failed to delete submission."}`); setShowGeneralModal(true);
    } finally { setIsProcessingReattempt(null); }
  };
  
  const closeResultsModal = () => { setShowResultsModal(false); setSelectedQuizForResults(null); setQuizSubmissions([]); setSubmissionError(null); };
  const closeGeneralModal = () => { setShowGeneralModal(false); setGeneralModalMessage(''); };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return dateString; }
  };

  useEffect(() => {
    fetchTeacherQuizzes();
  }, []);

  const handleStartEditQuiz = (quizToEdit) => {
    navigate('/teacher/create-quiz', { state: { quizToEdit: quizToEdit } });
  };

  return (
    <div className="quiz-library-page teacher-dashboard-container">
      <header className="dashboard-header">
        <h1>My Quiz Library</h1>
      </header>

      {/* --- ACTUAL MODAL JSX --- */}
      {showGeneralModal && ( 
        <div className="modal-backdrop">
          <div className="modal-content">
            <p>{generalModalMessage}</p>
            <button onClick={closeGeneralModal} className="btn btn-primary">Close</button>
          </div>
        </div> 
      )}

      {showResultsModal && selectedQuizForResults && (
          <div className="modal-backdrop results-modal-backdrop">
              <div className="modal-content results-modal-content">
                  <h2>Results for "{selectedQuizForResults.title}"</h2>
                  {isLoadingSubmissions ? <p>Loading results...</p>
                   : submissionError ? <p className="error-message">Error: {submissionError}</p>
                   : quizSubmissions.length > 0 ? (
                      <table className="results-table">
                          <thead><tr><th>Student Name</th><th>Student Email</th><th>Score</th><th>Percentage</th><th>Date Submitted</th><th>Actions</th></tr></thead>
                          <tbody>{quizSubmissions.map(sub => (
                              <tr key={sub._id}>
                                  <td>{sub.student?.name || 'N/A'}</td><td>{sub.student?.email || 'N/A'}</td>
                                  <td>{sub.score} / {sub.totalQuestions}</td><td>{sub.percentage}%</td><td>{formatDate(sub.submittedAt)}</td>
                                  <td>
                                      <button
                                          onClick={() => handleAllowReattempt(sub._id, sub.student?.name || 'Student')}
                                          className="btn btn-warning btn-extra-small"
                                          disabled={isProcessingReattempt === sub._id}
                                      >
                                          {isProcessingReattempt === sub._id ? 'Processing...' : 'Allow Reattempt'}
                                      </button>
                                  </td>
                              </tr>))}
                          </tbody>
                      </table>
                   ) : <p>No submissions yet for this quiz.</p>}
                  <button onClick={closeResultsModal} className="btn btn-secondary modal-close-btn">Close Results</button>
              </div>
          </div>
      )}

      {showConfirmDeleteModal && quizToDelete && ( 
        <div className="modal-backdrop confirm-delete-modal-backdrop">
          <div className="modal-content confirm-delete-modal-content">
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete the quiz "<strong>{quizToDelete.title}</strong>"?</p>
            <p><small>This action cannot be undone, and all associated student submissions will also be deleted.</small></p>
            <div className="modal-actions">
              <button onClick={closeDeleteConfirmModal} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeleteQuiz} className="btn btn-danger">Delete Quiz</button>
            </div>
          </div>
        </div> 
      )}
      {/* --- END ACTUAL MODAL JSX --- */}


      <section className="quiz-list-section card">
        {isLoadingQuizzes ? <p>Loading quizzes...</p>
         : quizListError ? <p className="error-message">{quizListError}</p>
         : quizzes.length > 0 ? (
            <ul className="quiz-list">
                {quizzes.map(quiz => (
                    <li key={quiz._id} className="quiz-item">
                        <div className="quiz-details">
                            <strong>{quiz.title}</strong>
                            <small>Classroom: {quiz.classroom?.name || 'N/A'}</small>
                            <small>Questions: {quiz.questions?.length || 0}</small>
                        </div>
                        <div className="quiz-item-actions">
                            <button onClick={() => handleViewResults(quiz)} className="btn btn-info btn-small">Results</button>
                            <button onClick={() => handleStartEditQuiz(quiz)} className="btn btn-warning btn-small">Edit</button>
                            <button onClick={() => openDeleteConfirmModal(quiz)} className="btn btn-danger btn-small">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : <p>You have not created any quizzes yet. Add some from the "Create Quiz" page!</p>}
      </section>
    </div>
  );
}

export default QuizLibraryPage;