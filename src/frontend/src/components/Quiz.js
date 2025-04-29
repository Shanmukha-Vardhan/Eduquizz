import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const Quiz = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3000/api/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched quiz:', res.data);
        setQuiz(res.data);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        alert('Failed to load quiz');
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/quiz/${quizId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Quiz submitted successfully');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    }
  };

  if (!quiz) return <div>Loading...</div>;

  return (
    <div>
      <h1>{quiz.title}</h1>
      {quiz.questions.map((question, index) => (
        <div key={question._id}>
          <p>{index + 1}. {question.text}</p>
          {question.options.map((option, i) => (
            <label key={i}>
              <input
                type="radio"
                name={question._id}
                value={option}
                onChange={() => handleAnswerChange(question._id, option)}
              />
              {option}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
};

export default Quiz;