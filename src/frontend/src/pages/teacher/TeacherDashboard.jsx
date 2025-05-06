// Eduquizz/src/frontend/src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/TeacherDashboard.css'; // Assuming you have this CSS file

function TeacherDashboard() {
  // --- State for Classroom Management ---
  const [newClassroomName, setNewClassroomName] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);

  // --- State for Quiz Creation (from your existing structure) ---
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedClassroomForQuiz, setSelectedClassroomForQuiz] = useState(''); // For the dropdown
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [quizCreationError, setQuizCreationError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


// ... other code ...

useEffect(() => {
  const fetchTeacherClassrooms = async () => {
    console.log("[TeacherDashboard] useEffect: Starting fetchTeacherClassrooms..."); // New log
    setIsLoadingClassrooms(true);
    setClassroomError(null);
    const token = localStorage.getItem('token');

    if (!token) {
      console.error("[TeacherDashboard] useEffect: No token found."); // New log
      setClassroomError("Authentication token not found. Please log in.");
      setIsLoadingClassrooms(false);
      return;
    }

    let response; // Declare response outside try block to access in finally if needed

    try {
      console.log("[TeacherDashboard] useEffect: About to call fetch for /api/classrooms"); // New log
      response = await fetch('/api/classrooms/test-direct', { // NEW - TEMPORARY TEST
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // --- LOG RESPONSE STATUS IMMEDIATELY ---
      console.log("[TeacherDashboard] useEffect: fetch /api/classrooms - Response Status:", response.status);
      console.log("[TeacherDashboard] useEffect: fetch /api/classrooms - Response OK?   :", response.ok);

      if (!response.ok) {
        // Try to get text first, as .json() might fail if body isn't JSON
        let errorText = "Could not retrieve error body.";
        try {
          errorText = await response.text();
          console.error("[TeacherDashboard] useEffect: !response.ok - Error Body Text:", errorText);
        } catch (textError) {
          console.error("[TeacherDashboard] useEffect: !response.ok - Could not get error body as text:", textError);
        }
        // Construct a more informative error message
        const errorMessage = `Server error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 150)}`;
        console.error("[TeacherDashboard] useEffect: !response.ok - Throwing error:", errorMessage);
        throw new Error(errorMessage);
      }

      // If response.ok is true, then try to parse JSON
      console.log("[TeacherDashboard] useEffect: response.ok is true. Attempting response.json()"); // New log
      const data = await response.json();
      console.log("[TeacherDashboard] useEffect: Fetched and parsed classrooms:", data);
      setClassrooms(Array.isArray(data) ? data : []);

    } catch (err) {
      // This catch block will now catch errors from fetch itself (network error),
      // errors thrown from the !response.ok block, or errors from response.json()
      console.error("[TeacherDashboard] useEffect: CATCH BLOCK - Error fetching/processing classrooms:", err);
      setClassroomError(err.message || "An unknown error occurred while fetching classrooms.");
      setClassrooms([]);
    } finally {
      console.log("[TeacherDashboard] useEffect: FINALLY BLOCK - Setting isLoadingClassrooms to false."); // New log
      setIsLoadingClassrooms(false);
    }
  };

  fetchTeacherClassrooms();
}, []);



  // --- Handle Classroom Creation ---
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newClassroomName.trim()) {
      setModalMessage("Please enter a classroom name.");
      setShowModal(true);
      return;
    }
    setClassroomError(null); // Clear previous classroom errors
    const token = localStorage.getItem('token');

    console.log("[TeacherDashboard] Creating classroom:", newClassroomName);

    try {
      const response = await fetch('/api/classrooms/create', { // POST /api/classrooms/create
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassroomName }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[TeacherDashboard] Error creating classroom response:", response.status, errData);
        throw new Error(errData.error || `Failed to create classroom: ${response.statusText}`);
      }

      const createdClassroom = await response.json();
      console.log("[TeacherDashboard] Classroom created:", createdClassroom);
      // Add to list optimistically or re-fetch
      setClassrooms(prevClassrooms => [...prevClassrooms, createdClassroom]);
      setNewClassroomName(''); // Clear input
      setModalMessage("Classroom created successfully!");
      setShowModal(true);
    } catch (err) {
      console.error("[TeacherDashboard] Error in handleCreateClassroom:", err);
      setClassroomError(err.message); // Show classroom-specific error
      setModalMessage(`Error creating classroom: ${err.message}`); // Also show in modal
      setShowModal(true);
    }
  };

  // --- Quiz Creation Functions (adapted from your structure) ---
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = questions.map((q, i) => {
      if (i === index) {
        if (field.startsWith('option')) {
          const optionIndex = parseInt(field.replace('option', ''), 10);
          const updatedOptions = [...q.options];
          updatedOptions[optionIndex] = value;
          return { ...q, options: updatedOptions };
        }
        return { ...q, [field]: value };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleAddQuestionField = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    setQuizCreationError(null); // Clear previous quiz errors

    if (!selectedClassroomForQuiz) {
      setModalMessage("Please select a classroom for the quiz.");
      setShowModal(true);
      return;
    }
    if (!quizTitle.trim()) {
        setModalMessage("Please enter a quiz title.");
        setShowModal(true);
        return;
    }
    // Basic validation for questions
    if (questions.some(q => !q.questionText.trim() || !q.correctAnswer.trim() || q.options.some(opt => !opt.trim()))) {
        setModalMessage("Please ensure all question fields, options, and correct answers are filled.");
        setShowModal(true);
        return;
    }


    const token = localStorage.getItem('token');
    const quizData = {
      title: quizTitle,
      classroom: selectedClassroomForQuiz,
      questions: questions.map(q => ({
        text: q.questionText,
        options: q.options,
        answer: q.correctAnswer,
      })),
    };

    console.log("[TeacherDashboard] Creating quiz with data:", quizData);

    try {
      const response = await fetch('/api/quizzes/create', { // Ensure this route exists on backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[TeacherDashboard] Error creating quiz response:", response.status, errData);
        throw new Error(errData.error || `Failed to create quiz: ${response.statusText}`);
      }

      await response.json(); // Or process the created quiz if needed
      console.log("[TeacherDashboard] Quiz created successfully");
      setModalMessage("Quiz created successfully!");
      setShowModal(true);
      // Reset quiz form
      setQuizTitle('');
      setSelectedClassroomForQuiz('');
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    } catch (err) {
      console.error("[TeacherDashboard] Error in handleAddQuiz:", err);
      setQuizCreationError(err.message);
      setModalMessage(`Error creating quiz: ${err.message}`);
      setShowModal(true);
    }
  };


  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };


  return (
    <div className="teacher-dashboard-container">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
      </header>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* --- Classroom Management Section --- */}
        <section className="classroom-management-section card">
          <h2>Classroom Management</h2>
          <form onSubmit={handleCreateClassroom} className="create-classroom-form">
            <h3>Create New Classroom</h3>
            <div className="form-group">
              <label htmlFor="classroomName">Classroom Name:</label>
              <input
                id="classroomName"
                type="text"
                placeholder="Enter classroom name"
                value={newClassroomName}
                onChange={(e) => setNewClassroomName(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">Create Classroom</button>
          </form>

          <div className="classrooms-list-section">
            <h3>My Classrooms</h3>
            {isLoadingClassrooms ? (
              <p>Loading classrooms...</p>
            ) : classroomError ? (
              <p className="error-message">Error loading classrooms: {classroomError}</p>
            ) : classrooms.length > 0 ? (
              <ul className="classrooms-list">
                {classrooms.map(classroom => (
                  <li key={classroom._id} className="classroom-item">
                    {classroom.name}
                    {/* Add buttons for view details, manage students, delete later */}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No classrooms found. Create one above!</p>
            )}
          </div>
        </section>

        {/* --- Quiz Creation Section (Adapted from your existing structure) --- */}
        <section className="quiz-creation-section card">
          <h2>Create Quiz</h2>
          {quizCreationError && <p className="error-message">Quiz Error: {quizCreationError}</p>}
          <form onSubmit={handleAddQuiz} className="create-quiz-form">
            <div className="form-group">
              <label htmlFor="quizTitle">Quiz Title:</label>
              <input
                id="quizTitle"
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g., Chapter 1 Review"
              />
            </div>

            <div className="form-group">
              <label htmlFor="selectedClassroomForQuiz">Select Classroom:</label>
              <select
                id="selectedClassroomForQuiz"
                value={selectedClassroomForQuiz}
                onChange={(e) => setSelectedClassroomForQuiz(e.target.value)}
              >
                <option value="" disabled>-- Select a Classroom --</option>
                {isLoadingClassrooms ? (
                    <option disabled>Loading classrooms...</option>
                ) : classrooms.length > 0 ? (
                  classrooms.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name}
                    </option>
                  ))
                ) : (
                    <option disabled>No classrooms available to select</option>
                )}
              </select>
            </div>

            {questions.map((q, index) => (
              <div key={index} className="question-editor">
                <h4>Question {index + 1}</h4>
                <div className="form-group">
                  <label htmlFor={`questionText-${index}`}>Question Text:</label>
                  <input
                    id={`questionText-${index}`}
                    type="text"
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                    placeholder="Enter question text"
                  />
                </div>
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="form-group option-group">
                    <label htmlFor={`option-${index}-${optIndex}`}>Option {optIndex + 1}:</label>
                    <input
                      id={`option-${index}-${optIndex}`}
                      type="text"
                      value={option}
                      onChange={(e) => handleQuestionChange(index, `option${optIndex}`, e.target.value)}
                      placeholder={`Option ${optIndex + 1}`}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor={`correctAnswer-${index}`}>Correct Answer (text):</label>
                  <input
                     id={`correctAnswer-${index}`}
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
                    placeholder="Enter the text of the correct option"
                  />
                </div>
              </div>
            ))}
            <div className="quiz-actions">
                <button type="button" onClick={handleAddQuestionField} className="btn btn-secondary">
                Add Another Question
                </button>
                <button type="submit" className="btn btn-primary">Add Quiz to Classroom</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default TeacherDashboard;