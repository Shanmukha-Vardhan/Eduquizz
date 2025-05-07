// Eduquizz/src/frontend/src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/TeacherDashboard.css';

function TeacherDashboard() {
  // --- State for Classroom Management ---
  const [newClassroomName, setNewClassroomName] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);
  // --- NEW STATE: Store student ID input for each classroom ---
  const [studentIdToEnroll, setStudentIdToEnroll] = useState({}); // e.g., { classroomId1: 'studentIdText', classroomId2: '...' }

  // --- State for Quiz Creation ---
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedClassroomForQuiz, setSelectedClassroomForQuiz] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [quizCreationError, setQuizCreationError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- Fetch Teacher's Classrooms (existing useEffect) ---
  useEffect(() => {
    const fetchTeacherClassrooms = async () => {
      // ... (your existing fetchTeacherClassrooms logic - no changes needed here) ...
       console.log("[TeacherDashboard] Fetching classrooms...");
      setIsLoadingClassrooms(true);
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setClassroomError("Authentication token not found. Please log in.");
        setIsLoadingClassrooms(false);
        return;
      }
      try {
        const response = await fetch('/api/classrooms', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        console.log("[TeacherDashboard] Fetch classrooms status:", response.status, "OK:", response.ok);
        if (!response.ok) {
          let errorText = "Could not retrieve error body.";
          try { errorText = await response.text(); } catch (e) {}
          console.error("[TeacherDashboard] Fetch classrooms !response.ok - Error Body:", errorText);
          throw new Error(`Server error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 150)}`);
        }
        const data = await response.json();
        console.log("[TeacherDashboard] Fetched classrooms:", data);
        setClassrooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[TeacherDashboard] Error in fetchTeacherClassrooms:", err);
        setClassroomError(err.message);
        setClassrooms([]);
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    fetchTeacherClassrooms();
  }, []);

  // --- Handle Classroom Creation (existing function) ---
  const handleCreateClassroom = async (e) => {
    // ... (your existing handleCreateClassroom logic - no changes needed here) ...
     e.preventDefault();
    if (!newClassroomName.trim()) {
      setModalMessage("Please enter a classroom name.");
      setShowModal(true);
      return;
    }
    setClassroomError(null);
    const token = localStorage.getItem('token');
    console.log("[TeacherDashboard] Creating classroom:", newClassroomName);
    try {
      const response = await fetch('/api/classrooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassroomName }),
      });
      console.log("[TeacherDashboard] Create classroom status:", response.status, "OK:", response.ok);
      if (!response.ok) {
        let errorText = "Could not retrieve error body.";
        try { errorText = await response.text(); } catch (e) {}
        console.error("[TeacherDashboard] Create classroom !response.ok - Error Body:", errorText);
        throw new Error(`Server error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 150)}`);
      }
      const createdClassroom = await response.json();
      console.log("[TeacherDashboard] Classroom created:", createdClassroom);
      setClassrooms(prevClassrooms => [...prevClassrooms, createdClassroom]);
      setNewClassroomName('');
      setModalMessage("Classroom created successfully!");
      setShowModal(true);
    } catch (err) {
      console.error("[TeacherDashboard] Error in handleCreateClassroom:", err);
      setClassroomError(err.message);
      setModalMessage(`Error creating classroom: ${err.message}`);
      setShowModal(true);
    }
  };

  // --- Quiz Creation Functions (existing functions) ---
  const handleQuestionChange = (index, field, value) => { /* ... no changes ... */
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
  const handleAddQuestionField = () => { /* ... no changes ... */
     setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };
  const handleAddQuiz = async (e) => { /* ... no changes ... */
     e.preventDefault();
    setQuizCreationError(null);
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
      const response = await fetch('/api/quizzes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });
       console.log("[TeacherDashboard] Create quiz status:", response.status, "OK:", response.ok);
      if (!response.ok) {
         let errorText = "Could not retrieve error body.";
         try { errorText = await response.text(); } catch (e) {}
         console.error("[TeacherDashboard] Create quiz !response.ok - Error Body:", errorText);
         throw new Error(`Server error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 150)}`);
      }
      await response.json();
      console.log("[TeacherDashboard] Quiz created successfully");
      setModalMessage("Quiz created successfully!");
      setShowModal(true);
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
  const closeModal = () => { /* ... no changes ... */
     setShowModal(false);
    setModalMessage('');
  };

  // --- NEW FUNCTION: Handle Student Enrollment ---
  const handleEnrollStudent = async (classroomId) => {
    const studentId = studentIdToEnroll[classroomId]?.trim(); // Get ID for this specific classroom
    if (!studentId) {
      setModalMessage("Please enter the Student ID to enroll.");
      setShowModal(true);
      return;
    }
    setClassroomError(null); // Clear previous errors
    const token = localStorage.getItem('token');
    console.log(`[TeacherDashboard] Enrolling student ${studentId} into classroom ${classroomId}`);

    try {
      const response = await fetch(`/api/classrooms/${classroomId}/enroll`, { // Note the template literal for URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: studentId }), // Send studentId in body
      });

      console.log(`[TeacherDashboard] Enroll student response status for classroom ${classroomId}:`, response.status, "OK:", response.ok);

      if (!response.ok) {
        let errorText = "Could not retrieve error body.";
        try { errorText = await response.text(); } catch (e) {}
        console.error(`[TeacherDashboard] Enroll student !response.ok for classroom ${classroomId} - Error Body:`, errorText);
        // Try parsing the error text as JSON in case the backend sent a JSON error
        let errorMessage = `Server error ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 150)}`;
        try {
            const errData = JSON.parse(errorText);
            if (errData.error) {
                errorMessage = errData.error; // Use specific error from backend if available
            }
        } catch(e) { /* Ignore if parsing fails */ }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log(`[TeacherDashboard] Student enrollment successful for classroom ${classroomId}:`, result);
      setModalMessage(result.message || "Student enrolled successfully!");
      setShowModal(true);
      // Optionally, update the specific classroom in the state to show the new student list,
      // or simply re-fetch all classrooms to update the list. Re-fetching is simpler for now.
      // fetchTeacherClassrooms(); // Uncomment to re-fetch after enrollment

      // Clear the input field for this classroom
      setStudentIdToEnroll(prev => ({ ...prev, [classroomId]: '' }));

    } catch (err) {
      console.error(`[TeacherDashboard] Error in handleEnrollStudent for classroom ${classroomId}:`, err);
      setClassroomError(err.message); // Show error
      setModalMessage(`Error enrolling student: ${err.message}`); // Show in modal
      setShowModal(true);
    }
  };

  // --- NEW FUNCTION: Handle input change for student ID ---
  const handleEnrollInputChange = (classroomId, value) => {
    setStudentIdToEnroll(prev => ({
      ...prev,
      [classroomId]: value,
    }));
  };


  // --- JSX Rendering ---
  return (
    <div className="teacher-dashboard-container">
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
      </header>

      {showModal && ( /* ... modal JSX ... */
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
          {/* Create Classroom Form (existing) */}
          <form onSubmit={handleCreateClassroom} className="create-classroom-form">
             {/* ... input and button ... */}
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
          {classroomError && <p className="error-message">Classroom Error: {classroomError}</p>}

          {/* Classrooms List */}
          <div className="classrooms-list-section">
            <h3>My Classrooms</h3>
            {isLoadingClassrooms ? (
              <p>Loading classrooms...</p>
            ) : classrooms.length > 0 ? (
              <ul className="classrooms-list">
                {classrooms.map(classroom => (
                  <li key={classroom._id} className="classroom-item">
                    <span>{classroom.name}</span>
                    {/* --- NEW: Enrollment UI --- */}
                    <div className="enroll-section">
                      <input
                        type="text"
                        placeholder="Enter Student ID to Enroll"
                        value={studentIdToEnroll[classroom._id] || ''}
                        onChange={(e) => handleEnrollInputChange(classroom._id, e.target.value)}
                        className="enroll-input"
                      />
                      <button
                        onClick={() => handleEnrollStudent(classroom._id)}
                        className="btn btn-secondary btn-small" // Add btn-small if you have it
                      >
                        Enroll Student
                      </button>
                    </div>
                    {/* Display enrolled students (optional enhancement) */}
                    {/* <div className="enrolled-students">
                      <strong>Students:</strong>
                      {classroom.students && classroom.students.length > 0
                        ? classroom.students.map(student => student.name || student._id).join(', ')
                        : ' None'}
                    </div> */}
                    {/* --- END: Enrollment UI --- */}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No classrooms found. Create one above!</p>
            )}
          </div>
        </section>

        {/* --- Quiz Creation Section (existing) --- */}
        <section className="quiz-creation-section card">
           {/* ... your existing quiz creation form JSX ... */}
           {/* Make sure the select dropdown uses 'classrooms' state */}
           <h2>Create Quiz</h2>
          {quizCreationError && <p className="error-message">Quiz Error: {quizCreationError}</p>}
          <form onSubmit={handleAddQuiz} className="create-quiz-form">
            <div className="form-group">
              <label htmlFor="quizTitle">Quiz Title:</label>
              <input id="quizTitle" type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="e.g., Chapter 1 Review"/>
            </div>
            <div className="form-group">
              <label htmlFor="selectedClassroomForQuiz">Select Classroom:</label>
              <select id="selectedClassroomForQuiz" value={selectedClassroomForQuiz} onChange={(e) => setSelectedClassroomForQuiz(e.target.value)}>
                <option value="" disabled>-- Select a Classroom --</option>
                {isLoadingClassrooms ? ( <option disabled>Loading...</option> )
                 : classrooms.length > 0 ? (
                  classrooms.map((classroom) => ( <option key={classroom._id} value={classroom._id}> {classroom.name} </option> ))
                 ) : ( <option disabled>No classrooms available</option> )}
              </select>
            </div>
            {questions.map((q, index) => (
              <div key={index} className="question-editor">
                <h4>Question {index + 1}</h4>
                <div className="form-group">
                  <label htmlFor={`questionText-${index}`}>Question Text:</label>
                  <input id={`questionText-${index}`} type="text" value={q.questionText} onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)} placeholder="Enter question text"/>
                </div>
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className="form-group option-group">
                    <label htmlFor={`option-${index}-${optIndex}`}>Option {optIndex + 1}:</label>
                    <input id={`option-${index}-${optIndex}`} type="text" value={option} onChange={(e) => handleQuestionChange(index, `option${optIndex}`, e.target.value)} placeholder={`Option ${optIndex + 1}`}/>
                  </div>
                ))}
                <div className="form-group">
                  <label htmlFor={`correctAnswer-${index}`}>Correct Answer (text):</label>
                  <input id={`correctAnswer-${index}`} type="text" value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} placeholder="Enter the text of the correct option"/>
                </div>
              </div>
            ))}
            <div className="quiz-actions">
                <button type="button" onClick={handleAddQuestionField} className="btn btn-secondary"> Add Another Question </button>
                <button type="submit" className="btn btn-primary">Add Quiz to Classroom</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default TeacherDashboard;