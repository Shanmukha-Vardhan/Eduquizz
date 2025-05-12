// Eduquizz/src/frontend/src/pages/teacher/CreateQuizPageTeacher.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../styles/TeacherDashboard.css'; 

const initialQuestionState = {
  _id: null,
  questionText: '',
  questionType: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: ''
};

function CreateQuizPageTeacher() {
  const [assignedClassrooms, setAssignedClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [quizForm, setQuizForm] = useState({
    _id: null,
    title: '',
    classroom: '',
    questions: [JSON.parse(JSON.stringify(initialQuestionState))],
  });
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);
  const [quizFormError, setQuizFormError] = useState(null);
  const [generalModalMessage, setGeneralModalMessage] = useState('');
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false); // Now used

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAssignedClassrooms = async () => {
      setIsLoadingClassrooms(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setQuizFormError("Authentication token missing.");
        setIsLoadingClassrooms(false);
        return;
      }
      try {
        const response = await axios.get('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
        setAssignedClassrooms(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setQuizFormError(err.response?.data?.error || err.message || "Failed to fetch classrooms.");
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    fetchAssignedClassrooms();
  }, []);

  useEffect(() => {
    if (location.state && location.state.quizToEdit) {
      const quizToEdit = location.state.quizToEdit;
      setIsEditingQuiz(true);
      setQuizForm({
        _id: quizToEdit._id,
        title: quizToEdit.title,
        classroom: quizToEdit.classroom?._id || quizToEdit.classroom,
        questions: quizToEdit.questions.map(q => ({
          _id: q._id,
          questionText: q.text,
          questionType: q.questionType || 'multiple-choice',
          options: q.questionType === 'true-false'
            ? [...(q.options || ['','']), ''].slice(0, 2)
            : [...(q.options || ['','','','']), '', '', '', ''].slice(0, 4),
          correctAnswer: q.answer
        }))
      });
    }
  }, [location.state]);

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
    setIsEditingQuiz(false); 
    setQuizFormError(null);
    if (isEditingQuiz) { 
        navigate('/teacher/quiz-library');
    }
  };

  const handleSubmitQuizForm = async (e) => {
    e.preventDefault(); setQuizFormError(null); setIsLoadingSubmit(true);
    if (!quizForm.classroom) { 
        setGeneralModalMessage("Please select a classroom."); setShowGeneralModal(true); setIsLoadingSubmit(false); return; 
    }
    if (!quizForm.title.trim()) { 
        setGeneralModalMessage("Please enter a quiz title."); setShowGeneralModal(true); setIsLoadingSubmit(false); return; 
    }
    for (const q_form of quizForm.questions) {
        if (!q_form.questionText.trim() || !q_form.correctAnswer.trim()) {
            setGeneralModalMessage("All questions must have text and a correct answer."); setShowGeneralModal(true); setIsLoadingSubmit(false); return;
        }
        const nonEmptyOptions = q_form.options.filter(opt => opt && opt.trim() !== "");
        if (q_form.questionType === 'multiple-choice' && nonEmptyOptions.length < 2) {
            setGeneralModalMessage(`Q: "${q_form.questionText.substring(0,20)}..." (MC) requires at least 2 non-empty options.`); setShowGeneralModal(true); setIsLoadingSubmit(false); return;
        }
        if (q_form.questionType === 'true-false' && nonEmptyOptions.length !== 2) {
            setGeneralModalMessage(`Q: "${q_form.questionText.substring(0,20)}..." (T/F) requires exactly 2 non-empty options.`); setShowGeneralModal(true); setIsLoadingSubmit(false); return;
        }
        if (!nonEmptyOptions.includes(q_form.correctAnswer.trim())) {
            setGeneralModalMessage(`For Q: "${q_form.questionText.substring(0,20)}...", answer must match an option.`); setShowGeneralModal(true); setIsLoadingSubmit(false); return;
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
      if (isEditingQuiz && quizForm._id) {
        await axios.put(`/api/quizzes/${quizForm._id}`, quizPayload, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage("Quiz updated successfully!");
      } else {
        await axios.post('/api/quizzes/create', quizPayload, { headers: { 'Authorization': `Bearer ${token}` } });
        setGeneralModalMessage("Quiz created successfully!");
      }
      setShowGeneralModal(true);
      resetQuizForm(); 
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Operation failed.";
      setQuizFormError(errorMsg); setGeneralModalMessage(`Error: ${errorMsg}`); setShowGeneralModal(true);
    } finally {
      setIsLoadingSubmit(false);
    }
  };
  
  const closeGeneralModal = () => { setShowGeneralModal(false); setGeneralModalMessage(''); };

  return (
    <div className="create-quiz-page teacher-dashboard-container">
      <header className="dashboard-header">
        <h1>{isEditingQuiz ? `Edit Quiz: ${quizForm.title || ''}` : 'Create New Quiz'}</h1>
      </header>

      {showGeneralModal && ( <div className="modal-backdrop"><div className="modal-content"><p>{generalModalMessage}</p><button onClick={closeGeneralModal} className="btn btn-primary">Close</button></div></div> )}

      <section id="quiz-form-section" className="quiz-creation-section card">
        {quizFormError && <p className="error-message">{quizFormError}</p>}
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
                        name="questionType"
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
                <button type="submit" className="btn btn-primary" disabled={isLoadingSubmit}>
                    {isLoadingSubmit ? 'Saving...' : (isEditingQuiz ? 'Update Quiz' : 'Create Quiz')}
                </button>
                {isEditingQuiz && ( <button type="button" onClick={resetQuizForm} className="btn btn-light">Cancel Edit</button> )}
            </div>
          </form>
      </section>
    </div>
  );
}

export default CreateQuizPageTeacher;