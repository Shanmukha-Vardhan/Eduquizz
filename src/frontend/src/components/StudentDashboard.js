import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }
        const res = await axios.get('http://localhost:3000/api/classroom', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched classrooms:', res.data);
        setClassrooms(res.data);
      } catch (error) {
        console.error('Error fetching classrooms:', error.response?.data || error.message);
        navigate('/login');
      }
    };

    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }
        const res = await axios.get('http://localhost:3000/api/quiz', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched quizzes:', res.data);
        setQuizzes(res.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error.response?.data || error.message);
        navigate('/login');
      }
    };

    fetchClassrooms();
    fetchQuizzes();
  }, [navigate]);

  const handleStartQuiz = (quizId) => {
    console.log('Start button clicked for quiz:', quizId);
    navigate(`/quiz/${quizId}`);
  };

  const handleHover = (quizId) => {
    console.log('Hovering over Start button for quiz:', quizId);
  };

  const handleTestClick = () => {
    console.log('Test button clicked');
  };

  console.log('Rendering StudentDashboard with quizzes:', quizzes);

  return (
    <div style={{ padding: '20px' }}>
      <h1>EduQuiz</h1>
      <button
        onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
        style={{ marginBottom: '20px' }}
      >
        Logout
      </button>
      <button
        onClick={() => navigate('/quiz/test123')}
        onMouseEnter={() => console.log('Hovering over Test Navigation button')}
        style={{ marginBottom: '20px', marginLeft: '10px', background: 'blue', color: 'white', padding: '10px', cursor: 'pointer' }}
      >
        Test Navigation
      </button>
      <button
        onClick={handleTestClick}
        onMouseEnter={() => console.log('Hovering over Test Click button')}
        style={{ marginBottom: '20px', marginLeft: '10px', background: 'orange', color: 'white', padding: '10px', cursor: 'pointer' }}
      >
        Test Click
      </button>
      <h2>Student Dashboard</h2>
      <h3>My Classrooms</h3>
      {classrooms.length === 0 ? (
        <p>No classrooms found</p>
      ) : (
        classrooms.map(classroom => (
          <div key={classroom._id} style={{ marginBottom: '10px' }}>
            {classroom.name}
          </div>
        ))
      )}
      <h3>Available Quizzes</h3>
      {quizzes.length === 0 ? (
        <p>No quizzes available</p>
      ) : (
        quizzes.map(quiz => (
          <div key={quiz._id} style={{ marginBottom: '10px' }}>
            <span>{quiz.title}</span>
            <button
              className="start-quiz-btn"
              onClick={() => handleStartQuiz(quiz._id)}
              onMouseEnter={() => handleHover(quiz._id)}
              disabled={false}
              style={{
                marginLeft: '10px',
                background: 'green',
                color: 'white',
                padding: '5px 10px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '5px',
                position: 'relative',
                zIndex: 10,
              }}
            >
              Start
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default StudentDashboard;