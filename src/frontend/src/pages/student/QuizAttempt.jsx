// Eduquizz/src/frontend/src/pages/student/QuizAttempt.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/QuizAttempt.css';

function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedAnswersDetails, setSubmittedAnswersDetails] = useState([]); // For detailed results

  useEffect(() => {
    const fetchQuizDetails = async () => {
      console.log(`[QuizAttempt] Fetching details for quiz ID: ${quizId}`);
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log("[QuizAttempt] Fetched quiz data:", response.data);
        setQuiz(response.data);
        
        const initialAnswers = {};
        if (response.data && response.data.questions) {
            response.data.questions.forEach(q => {
                // q._id should be the unique identifier from the Quiz model's questions array
                initialAnswers[q._id] = ''; // Initialize with empty string for each question
            });
        }
        setSelectedAnswers(initialAnswers);

      } catch (err) {
        console.error("[QuizAttempt] Error fetching quiz details:", err);
        setError(err.response?.data?.error || err.message || "Failed to load quiz details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuizDetails();
    }
  }, [quizId]);

  const handleOptionChange = (questionId, optionValue) => {
    setSelectedAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: optionValue
    }));
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    console.log("[QuizAttempt] Submitting quiz. Selected answers:", selectedAnswers);
    const token = localStorage.getItem('token');
    if (!token || !quiz) {
        setError("Cannot submit quiz. Missing token or quiz data.");
        return;
    }

    const submissionAnswers = quiz.questions.map(q => ({
        questionId: q._id, // This is crucial. Your Quiz model's questions should have _id.
        selectedOption: selectedAnswers[q._id] || "" // Use q._id as the key
    }));

    try {
        setIsLoading(true);
        const response = await axios.post(`/api/quizzes/${quizId}/submit`,
            { answers: submissionAnswers },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log("[QuizAttempt] Quiz submission response:", response.data);
        setScore(response.data.score);
        setSubmittedAnswersDetails(response.data.answers || []); // Store detailed answers from backend
        setIsSubmitted(true);
    } catch (err) {
        console.error("[QuizAttempt] Error submitting quiz:", err);
        setError(err.response?.data?.error || err.message || "Failed to submit quiz.");
        // Keep isSubmitted false if error occurs during submission
        setIsSubmitted(false); 
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading && !isSubmitted) { // Show loading only if not yet submitted or during submission
    return <div className="quiz-attempt-container loading">Loading Quiz...</div>;
  }

  if (error) { // Display error if any occurred, even after submission attempt
    return <div className="quiz-attempt-container error-message">Error: {error}</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div className="quiz-attempt-container">Quiz data is not available or the quiz has no questions.</div>;
  }

  // Display results if submitted
  if (isSubmitted) {
    return (
        <div className="quiz-attempt-container quiz-results">
            <h2>Quiz Submitted!</h2>
            <h3>
              Your Score: {score !== null ? `${score} / ${quiz.questions.length}` : "Calculating..."} 
              {quiz.questions.length > 0 && score !== null ? ` (${((score / quiz.questions.length) * 100).toFixed(2)}%)` : ''}
            </h3>
            
            <h4>Detailed Results:</h4>
            {submittedAnswersDetails.length > 0 ? (
                <ul className="detailed-results-list">
                    {submittedAnswersDetails.map((ans, index) => (
                        <li key={ans.questionId || index} className={`result-item ${ans.isCorrect ? 'correct' : 'incorrect'}`}>
                            <p><strong>Question {index + 1}:</strong> {ans.questionText}</p>
                            <p>Your Answer: <span className={ans.isCorrect ? '' : 'incorrect-answer-text'}>{ans.selectedOption || "Not answered"}</span></p>
                            {!ans.isCorrect && (
                                <p>Correct Answer: <span className="correct-answer-text">{ans.correctAnswer}</span></p>
                            )}
                            {ans.isCorrect && <p className="correct-answer-text">✓ Correct</p>}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Detailed results are not available.</p>
            )}

            <button onClick={() => navigate('/student')} className="btn btn-primary btn-back-dashboard">Back to Dashboard</button>
        </div>
    );
  }

  // Display quiz questions if not submitted
  const currentQuestion = quiz.questions[currentQuestionIndex];
  // Ensure currentQuestion and currentQuestion._id exist before trying to access them
  const questionIdentifier = currentQuestion?._id; 

  return (
    <div className="quiz-attempt-container">
      <header className="quiz-header">
        <h2>{quiz.title}</h2>
        <p>Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
      </header>

      {currentQuestion && questionIdentifier ? ( // Check if currentQuestion and its identifier are valid
        <section className="question-section">
          <h3 className="question-text">{currentQuestion.text}</h3>
          <div className="options-list">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="radio"
                  id={`q${currentQuestionIndex}-option${index}`}
                  name={`question-${questionIdentifier}`} // Use unique questionIdentifier for name
                  value={option}
                  checked={selectedAnswers[questionIdentifier] === option}
                  onChange={() => handleOptionChange(questionIdentifier, option)}
                />
                <label htmlFor={`q${currentQuestionIndex}-option${index}`}>{option}</label>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p>Loading question...</p> // Fallback if question data isn't ready
      )}

      <footer className="quiz-navigation">
        <button 
          onClick={handlePreviousQuestion} 
          disabled={currentQuestionIndex === 0} 
          className="btn btn-secondary"
        >
          Previous
        </button>
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button onClick={handleNextQuestion} className="btn btn-primary">
            Next
          </button>
        ) : (
          <button onClick={handleSubmitQuiz} className="btn btn-success" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </footer>
    </div>
  );
}

export default QuizAttempt;
