import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/classroom', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        console.log('Fetched classrooms:', data);
        setClassrooms(data);
        if (data.length > 0) setSelectedClassroom(data[0]._id);
      } catch (error) {
        console.error('Error fetching classrooms:', error);
      }
    };
    fetchClassrooms();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const handleQuestionChange = (index, field, value, optionIndex = null) => {
    const newQuestions = [...questions];
    if (field === 'questionText') {
      newQuestions[index].questionText = value;
    } else if (field === 'option') {
      newQuestions[index].options[optionIndex] = value;
    } else if (field === 'correctAnswer') {
      newQuestions[index].correctAnswer = value;
    }
    setQuestions(newQuestions);
    console.log('Updated questions:', newQuestions);
  };

  const handleCreateQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!selectedClassroom) {
        alert('Please select a classroom');
        return;
      }
      const response = await fetch('http://localhost:3000/api/quiz/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, questions, classroom: selectedClassroom }),
      });
      const data = await response.json();
      console.log('Quiz creation response:', data);
      if (response.ok) {
        alert('Quiz created successfully');
        setTitle('');
        setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
      } else {
        alert('Failed to create quiz: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz: ' + error.message);
    }
  };

  return (
    <div className="teacher-dashboard">
      <h2>Teacher Dashboard</h2>
      <div className="create-quiz">
        <h3>Create Quiz</h3>
        <input
          type="text"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
        >
          <option value="">Select Classroom</option>
          {classrooms.map((classroom) => (
            <option key={classroom._id} value={classroom._id}>
              {classroom.name}
            </option>
          ))}
        </select>
        {questions.map((question, index) => (
          <div key={index} className="question">
            <input
              type="text"
              placeholder={`Question ${index + 1}`}
              value={question.questionText}
              onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
            />
            {question.options.map((option, optIndex) => (
              <input
                key={optIndex}
                type="text"
                placeholder={`Option ${optIndex + 1}`}
                value={option}
                onChange={(e) => handleQuestionChange(index, 'option', e.target.value, optIndex)}
              />
            ))}
            <input
              type="text"
              placeholder="Correct Answer"
              value={question.correctAnswer}
              onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)}
            />
          </div>
        ))}
        <button onClick={handleAddQuestion}>Add Question</button>
        <button onClick={handleCreateQuiz}>Add Quiz</button>
      </div>
      <div className="classrooms">
        <h3>Classrooms</h3>
        {classrooms.length > 0 ? (
          classrooms.map((classroom) => (
            <div key={classroom._id} className="classroom-card">
              <p>{classroom.name}</p>
              <p>{classroom.students.length} Students</p>
            </div>
          ))
        ) : (
          <p>No classrooms found</p>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;