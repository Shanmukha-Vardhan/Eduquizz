// Eduquizz/src/frontend/src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/TeacherDashboard.css'; 

function TeacherDashboard() {
  // --- State ---
  const [assignedClassrooms, setAssignedClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);
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

  // --- Unified Quiz Form State with questionType ---
  const initialQuestionState = {
    _id: null,
    questionText: '',
    questionType: 'multiple-choice', // Default type
    options: ['', '', '', ''],       // Default for MC
    correctAnswer: ''
  };
  const [quizForm, setQuizForm] = useState({
    _id: null,
    title: '',
    classroom: '',
    questions: [JSON.parse(JSON.stringify(initialQuestionState))], // Deep copy
  });
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [quizFormError, setQuizFormError] = useState(null);
  const [isProcessingReattempt, setIsProcessingReattempt] = useState(null);


  // --- Fetch Data ---
  const fetchAssignedClassrooms = async () => {
      console.log("[TeacherDashboard] Fetching assigned classrooms...");
      setIsLoadingClassrooms(true); setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) { setClassroomError("Auth token missing."); setIsLoadingClassrooms(false); return; }
      try {
        const response = await axios.get('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
        setAssignedClassrooms(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setClassroomError(err.response?.data?.error || err.message || "Failed to fetch classrooms.");
        setAssignedClassrooms([]);
      } finally { setIsLoadingClassrooms(false); }
    };

  const fetchTeacherQuizzes = async () => {
      console.log("[TeacherDashboard] Fetching teacher's quizzes...");
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

  useEffect(() => {
    fetchAssignedClassrooms();
    fetchTeacherQuizzes();
  }, []);

  // --- Quiz Form Input Handlers ---
  const handleQuizFormChange = (e) => {
    const { name, value } = e.target;
    setQuizForm(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionFormChange = (index, field, value) => {
     const newQuestions = quizForm.questions.map((q, i) => {
      if (i === index) {
        const updatedQuestion = { ...q, [field]: value };
        if (field === 'questionType') {
          updatedQuestion.options = value === 'true-false' ? ['', ''] : ['', '', '', ''];
          updatedQuestion.correctAnswer = '';
        }
        // Note: Direct option manipulation (like q.options[optIndex] = value) was removed
        // in favor of handleOptionChange for better state update traceability.
        // If you were relying on that here, ensure handleOptionChange is used for option inputs.
        return updatedQuestion;
      }
      return q;
    });
    setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };
  
  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = quizForm.questions.map((q, i) => {
        if (i === qIndex) {
            const newOptions = [...q.options];
            newOptions[optIndex] = value;
            return { ...q, options: newOptions };
        }
        return q;
    });
    setQuizForm(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleAddQuestionToForm = () => {
     setQuizForm(prev => ({ ...prev, questions: [...prev.questions, JSON.parse(JSON.stringify(initialQuestionState))] }));
  };

  const handleRemoveQuestionFromForm = (index) => {
    if (quizForm.questions.length <= 1) { setGeneralModalMessage("A quiz must have at least one question."); setShowGeneralModal(true); return; }
    setQuizForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  const resetQuizForm = () => {
    setQuizForm({ _id: null, title: '', classroom: '', questions: [JSON.parse(JSON.stringify(initialQuestionState))] });
    setIsEditingQuiz(false); setQuizFormError(null);
  };

  const handleSubmitQuizForm = async (e) => {
    e.preventDefault(); setQuizFormError(null);
    if (!quizForm.classroom) { setGeneralModalMessage("Please select a classroom."); setShowGeneralModal(true); return; }
    if (!quizForm.title.trim()) { setGeneralModalMessage("Please enter a quiz title."); setShowGeneralModal(true); return; }
    
    for (const q_form of quizForm.questions) {
        if (!q_form.questionText.trim() || !q_form.correctAnswer.trim()) {
            setGeneralModalMessage("All questions must have text and a correct answer selected/entered.");
            setShowGeneralModal(true); return;
        }
        const nonEmptyOptions = q_form.options.filter(opt => opt && opt.trim() !== "");
        if (q_form.questionType === 'multiple-choice' && nonEmptyOptions.length < 2) {
            setGeneralModalMessage(`Question "${q_form.questionText.substring(0,20)}..." (Multiple Choice) requires at least 2 non-empty options.`);
            setShowGeneralModal(true); return;
        }
        if (q_form.questionType === 'true-false' && nonEmptyOptions.length !== 2) {
            setGeneralModalMessage(`Question "${q_form.questionText.substring(0,20)}..." (True/False) requires exactly 2 non-empty options.`);
            setShowGeneralModal(true); return;
        }
        if (!nonEmptyOptions.includes(q_form.correctAnswer.trim())) {
            setGeneralModalMessage(`For question "${q_form.questionText.substring(0,20)}...", the correct answer must match one of the provided non-empty options.`);
            setShowGeneralModal(true); return;
        }
    }

    const token = localStorage.getItem('token');
    const quizPayload = {
      title: quizForm.title.trim(), classroom: quizForm.classroom,
      questions: quizForm.questions.map(q_form => ({
        _id: q_form._id, text: q_form.questionText.trim(),
        questionType: q_form.questionType,
        options: q_form.options.map(opt => opt.trim()).filter(opt => opt),
        answer: q_form.correctAnswer.trim(),
      })),
    };
    try {
      let response;
      if (isEditingQuiz && quizForm._id) {
        response = await axios.put(`/api/quizzes/${quizForm._id}`, quizPayload, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage("Quiz updated successfully!");
      } else {
        response = await axios.post('/api/quizzes/create', quizPayload, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage("Quiz created successfully!");
      }
      setShowGeneralModal(true); resetQuizForm(); fetchTeacherQuizzes();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || (isEditingQuiz ? "Failed to update quiz." : "Failed to create quiz.");
      setQuizFormError(errorMsg); setGeneralModalMessage(`Error: ${errorMsg}`); setShowGeneralModal(true);
    }
  };

  const handleStartEditQuiz = (quizToEdit) => {
    setIsEditingQuiz(true);
    setQuizForm({
        _id: quizToEdit._id, title: quizToEdit.title,
        classroom: quizToEdit.classroom?._id || quizToEdit.classroom,
        questions: quizToEdit.questions.map(q => ({
            _id: q._id, questionText: q.text,
            questionType: q.questionType || 'multiple-choice',
            options: q.questionType === 'true-false'
                ? [...(q.options || ['','']), ''].slice(0, 2)
                : [...(q.options || ['','','','']), '', '', '', ''].slice(0, 4),
            correctAnswer: q.answer
        }))
    });
    setQuizFormError(null);
    document.getElementById('quiz-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleViewResults = async (quizToView) => {
    console.log("[TeacherDashboard] Viewing results for quiz:", quizToView);
    setSelectedQuizForResults(quizToView); 
    setIsLoadingSubmissions(true);
    setSubmissionError(null); 
    setQuizSubmissions([]); 
    setShowResultsModal(true);
    const token = localStorage.getItem('token');
    if (!token) { setSubmissionError("Auth token missing."); setIsLoadingSubmissions(false); return; }
    try {
        const response = await axios.get(`/api/submissions/quiz/${quizToView._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setQuizSubmissions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
        setSubmissionError(err.response?.data?.error || err.message || "Failed to fetch submissions.");
    } finally { setIsLoadingSubmissions(false); }
  };

  const openDeleteConfirmModal = (quiz) => { 
    console.log("[TeacherDashboard] Opening delete confirm for quiz:", quiz);
    setQuizToDelete(quiz); 
    setShowConfirmDeleteModal(true); 
  };
  const closeDeleteConfirmModal = () => { setQuizToDelete(null); setShowConfirmDeleteModal(false); };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    const token = localStorage.getItem('token');
    if (!token) { setGeneralModalMessage("Auth error."); setShowGeneralModal(true); closeDeleteConfirmModal(); return; }
    try {
        await axios.delete(`/api/quizzes/${quizToDelete._id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage(`Quiz "${quizToDelete.title}" deleted.`); setShowGeneralModal(true);
        fetchTeacherQuizzes();
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

  return (
    <div className="teacher-dashboard-container">
      <header className="dashboard-header"><h1>Teacher Dashboard</h1></header>
      
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

      <div className="dashboard-content">
        <section className="assigned-classrooms-section card">
           <h2>My Assigned Classrooms</h2>
           {isLoadingClassrooms ? ( <p>Loading classrooms...</p> )
            : classroomError ? ( <p className="error-message">Error: {classroomError}</p> )
            : assignedClassrooms.length === 0 ? ( <p>You have not been assigned to any classrooms yet.</p> )
            : ( <ul className="classrooms-list">{assignedClassrooms.map(c => (
                <li key={c._id} className="classroom-item">
                    <strong>{c.name}</strong>
                    <div className="enrolled-students">
                        <strong>Students ({c.students?.length || 0}):</strong>
                        {c.students && c.students.length > 0 ? (
                            <ul>{c.students.map(s => <li key={s._id || s.email}>{s.name} ({s.email})</li>)}</ul>
                        ) : <p><small>No students.</small></p>}
                    </div>
                </li>))}
            </ul> )}
         </section>

        <section id="quiz-form-section" className="quiz-creation-section card">
           <h2>{isEditingQuiz ? `Edit Quiz: ${quizForm.title}` : 'Create New Quiz'}</h2>
          {quizFormError && <p className="error-message">Form Error: {quizFormError}</p>}
          <form onSubmit={handleSubmitQuizForm} className="create-quiz-form">
            <div className="form-group">
              <label htmlFor="quizFormTitle">Quiz Title:</label>
              <input id="quizFormTitle" name="title" type="text" value={quizForm.title} onChange={handleQuizFormChange} placeholder="e.g., Chapter 1 Review" required/>
            </div>
            <div className="form-group">
              <label htmlFor="quizFormClassroom">Select Classroom:</label>
              <select id="quizFormClassroom" name="classroom" value={quizForm.classroom} onChange={handleQuizFormChange} required>
                <option value="" disabled>-- Select Assigned Classroom --</option>
                {isLoadingClassrooms ? ( <option disabled>Loading...</option> )
                 : assignedClassrooms.map((c) => ( <option key={c._id} value={c._id}> {c.name} </option> ))}
              </select>
            </div>
            
            {quizForm.questions.map((q, index) => (
              <div key={q._id || `new-${index}`} className="question-editor">
                <div className="question-header">
                    <h4>Question {index + 1}</h4>
                    {quizForm.questions.length > 1 && (
                        <button type="button" onClick={() => handleRemoveQuestionFromForm(index)} className="btn btn-danger btn-small remove-question-btn" title="Remove Question">X</button>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor={`qType-${index}`}>Question Type:</label>
                    <select
                        id={`qType-${index}`}
                        name="questionType" // Added name attribute for consistency
                        value={q.questionType}
                        onChange={(e) => handleQuestionFormChange(index, 'questionType', e.target.value)}
                    >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                    </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`qText-${index}`}>Question Text:</label>
                  <input id={`qText-${index}`} name="questionText" type="text" value={q.questionText} onChange={(e) => handleQuestionFormChange(index, 'questionText', e.target.value)} placeholder="Enter question text" required/>
                </div>

                {q.questionType === 'multiple-choice' && (
                    [0, 1, 2, 3].map(optIndex => (
                      <div key={`mc-opt-${optIndex}`} className="form-group option-group">
                        <label htmlFor={`opt-mc-${index}-${optIndex}`}>Option {optIndex + 1}:</label>
                        <input id={`opt-mc-${index}-${optIndex}`} type="text" value={q.options[optIndex] || ''} 
                               onChange={(e) => handleOptionChange(index, optIndex, e.target.value)} 
                               placeholder={`Option ${optIndex + 1}`} />
                      </div>
                    ))
                )}
                {q.questionType === 'true-false' && (
                    [0, 1].map(optIndex => (
                      <div key={`tf-opt-${optIndex}`} className="form-group option-group">
                        <label htmlFor={`opt-tf-${index}-${optIndex}`}>Option {optIndex + 1}: </label>
                        <input id={`opt-tf-${index}-${optIndex}`} type="text" value={q.options[optIndex] || ''} 
                               onChange={(e) => handleOptionChange(index, optIndex, e.target.value)} 
                               placeholder={optIndex === 0 ? "e.g., True" : "e.g., False"} required/>
                      </div>
                    ))
                )}
                
                <div className="form-group">
                  <label htmlFor={`qAns-${index}`}>Correct Answer (text):</label>
                  <input id={`qAns-${index}`} name="correctAnswer" type="text" value={q.correctAnswer} onChange={(e) => handleQuestionFormChange(index, 'correctAnswer', e.target.value)} placeholder="Enter the text of the correct option" required/>
                </div>
              </div>
            ))}
            <div className="quiz-form-actions">
                <button type="button" onClick={handleAddQuestionToForm} className="btn btn-secondary">Add Question</button>
                <button type="submit" className="btn btn-primary">{isEditingQuiz ? 'Update Quiz' : 'Create Quiz'}</button>
                {isEditingQuiz && ( <button type="button" onClick={resetQuizForm} className="btn btn-light">Cancel Edit</button> )}
            </div>
          </form>
        </section>

        <section className="quiz-list-section card">
            <h2>My Created Quizzes</h2>
            {isLoadingQuizzes ? ( <p>Loading quizzes...</p> )
             : quizListError ? ( <p className="error-message">Error: {quizListError}</p> )
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
            ) : ( <p>You have not created any quizzes yet.</p> )}
        </section>
      </div>
    </div>
  );
}

export default TeacherDashboard;