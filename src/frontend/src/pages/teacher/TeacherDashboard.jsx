// Eduquizz/src/frontend/src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/TeacherDashboard.css';

function TeacherDashboard() {
  // --- State (existing) ---
  const [assignedClassrooms, setAssignedClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedClassroomForQuiz, setSelectedClassroomForQuiz] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [quizCreationError, setQuizCreationError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  // --- NEW STATE for listing quizzes ---
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [quizListError, setQuizListError] = useState(null);


  // --- Fetch Assigned Classrooms (existing useEffect) ---
  const fetchAssignedClassrooms = async () => { /* ... existing code ... */ };
  // --- NEW Fetch Quizzes Function ---
  const fetchTeacherQuizzes = async () => {
      console.log("[TeacherDashboard] Fetching teacher's quizzes...");
      setIsLoadingQuizzes(true);
      setQuizListError(null);
      const token = localStorage.getItem('token');
      if (!token) { setQuizListError("Auth token not found."); setIsLoadingQuizzes(false); return; }

      try {
          // Use GET /api/quizzes - backend logic filters for teacher/student
          const response = await fetch('/api/quizzes', {
              headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) {
              const errText = await response.text().catch(() => "Unknown error");
              throw new Error(`Failed to fetch quizzes: ${response.statusText}. Server said: ${errText.substring(0,100)}`);
          }
          const data = await response.json();
          console.log("[TeacherDashboard] Fetched quizzes:", data);
          setQuizzes(Array.isArray(data) ? data : []);
      } catch (err) {
          console.error("[TeacherDashboard] Error fetching quizzes:", err);
          setQuizListError(err.message);
          setQuizzes([]);
      } finally {
          setIsLoadingQuizzes(false);
      }
  };

  useEffect(() => {
    fetchAssignedClassrooms();
    fetchTeacherQuizzes(); // <-- Fetch quizzes on mount as well
  }, []);

  // --- Quiz Creation Functions (existing) ---
  const handleQuestionChange = (index, field, value) => { /* ... existing code ... */ };
  const handleAddQuestionField = () => { /* ... existing code ... */ };

  // --- MODIFIED: Implement handleAddQuiz API Call ---
  const handleAddQuiz = async (e) => {
     e.preventDefault();
    setQuizCreationError(null); // Clear previous quiz creation errors

    if (!selectedClassroomForQuiz) {
      setModalMessage("Please select one of your assigned classrooms for the quiz.");
      setShowModal(true);
      return;
    }
     if (!quizTitle.trim()) {
        setModalMessage("Please enter a quiz title.");
        setShowModal(true);
        return;
    }
    // More robust validation
    if (questions.some(q => !q.questionText?.trim() || !q.correctAnswer?.trim() || !Array.isArray(q.options) || q.options.length === 0 || q.options.some(opt => !opt?.trim()))) {
        setModalMessage("Please ensure all question fields, options (at least one), and correct answers are filled for every question.");
        setShowModal(true);
        return;
    }
    // Optional: Validate that correctAnswer matches one of the options
    for (const q of questions) {
        if (!q.options.includes(q.correctAnswer.trim())) {
             setModalMessage(`For question "${q.questionText.substring(0,20)}...", the correct answer "${q.correctAnswer}" must exactly match one of the provided options.`);
             setShowModal(true);
             return;
        }
    }

    if (!assignedClassrooms.some(c => c._id === selectedClassroomForQuiz)) {
        setModalMessage("Error: Selected classroom is not assigned to you.");
        setShowModal(true);
        return;
    }

    const token = localStorage.getItem('token');
    // Prepare data matching backend Quiz model structure (text, options, answer)
    const quizData = {
      title: quizTitle.trim(),
      classroom: selectedClassroomForQuiz,
      questions: questions.map(q => ({
        text: q.questionText.trim(),
        options: q.options.map(opt => opt.trim()).filter(opt => opt), // Send trimmed, non-empty options
        answer: q.correctAnswer.trim(),
      })),
    };
    console.log("[TeacherDashboard] Creating quiz with data:", JSON.stringify(quizData, null, 2)); // Log formatted data

    try {
      const response = await fetch('/api/quizzes/create', { // POST /api/quizzes/create
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(quizData),
      });
       console.log("[TeacherDashboard] Create quiz status:", response.status, "OK:", response.ok);

      const result = await response.json(); // Try to parse response regardless of status

      if (!response.ok) {
         console.error("[TeacherDashboard] Create quiz !response.ok - Response Body:", result);
         throw new Error(result.error || `Failed to create quiz: ${response.statusText}`);
      }

      console.log("[TeacherDashboard] Quiz created successfully:", result);
      setModalMessage("Quiz created successfully!");
      setShowModal(true);
      // Reset quiz form
      setQuizTitle('');
      setSelectedClassroomForQuiz('');
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
      // Re-fetch quizzes to update the list
      fetchTeacherQuizzes();
    } catch (err) {
      console.error("[TeacherDashboard] Error in handleAddQuiz:", err);
      setQuizCreationError(err.message); // Set specific error for quiz creation section
      setModalMessage(`Error creating quiz: ${err.message}`);
      setShowModal(true);
    }
  };
  // --- END MODIFIED handleAddQuiz ---

  const closeModal = () => { setShowModal(false); setModalMessage(''); };

  // --- JSX Rendering ---
  return (
    <div className="teacher-dashboard-container">
      <header className="dashboard-header"><h1>Teacher Dashboard</h1></header>
      {showModal && ( <div className="modal-backdrop"><div className="modal-content"><p>{modalMessage}</p><button onClick={closeModal} className="btn btn-primary">Close</button></div></div> )}

      <div className="dashboard-content">
        {/* Assigned Classrooms & Students Section (existing) */}
        <section className="assigned-classrooms-section card"> {/* ... existing JSX ... */} </section>

        {/* Quiz Creation Section (existing form, connected function) */}
        <section className="quiz-creation-section card"> {/* ... existing JSX ... */} </section>

        {/* --- NEW: Quiz Listing Section --- */}
         <section className="quiz-list-section card">
            <h2>My Created Quizzes</h2>
            {isLoadingQuizzes ? (
                <p>Loading quizzes...</p>
            ) : quizListError ? (
                <p className="error-message">Error loading quizzes: {quizListError}</p>
            ) : quizzes.length > 0 ? (
                <ul className="quiz-list">
                    {quizzes.map(quiz => (
                        <li key={quiz._id} className="quiz-item">
                            <strong>{quiz.title}</strong>
                            <small>Classroom: {quiz.classroom?.name || 'N/A'}</small> {/* Assumes classroom is populated */}
                            <small>Questions: {quiz.questions?.length || 0}</small>
                            {/* Add buttons later for View Results, Edit, Delete */}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have not created any quizzes yet.</p>
            )}
        </section>
        {/* --- END NEW Quiz Listing Section --- */}

      </div>
    </div>
  );
}

export default TeacherDashboard;