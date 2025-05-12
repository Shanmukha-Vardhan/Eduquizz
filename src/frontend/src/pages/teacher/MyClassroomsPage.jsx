// Eduquizz/src/frontend/src/pages/teacher/MyClassroomsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/TeacherDashboard.css'; 

function MyClassroomsPage() {
  const [assignedClassrooms, setAssignedClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);

  useEffect(() => {
    const fetchAssignedClassrooms = async () => {
      console.log("[MyClassroomsPage] Fetching assigned classrooms...");
      setIsLoadingClassrooms(true);
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setClassroomError("Authentication token missing. Please log in.");
        setIsLoadingClassrooms(false);
        return;
      }
      try {
        const response = await axios.get('/api/classrooms', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setAssignedClassrooms(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setClassroomError(err.response?.data?.error || err.message || "Failed to fetch classrooms.");
        setAssignedClassrooms([]);
      } finally {
        setIsLoadingClassrooms(false);
      }
    };
    fetchAssignedClassrooms();
  }, []);

  return (
    <div className="my-classrooms-page teacher-dashboard-container">
      <header className="dashboard-header">
        <h1>My Assigned Classrooms</h1>
      </header>

      <section className="assigned-classrooms-section card">
        {/* Removed h2 as page title serves this role */}
        {isLoadingClassrooms ? (
          <p>Loading classrooms...</p>
        ) : classroomError ? (
          <p className="error-message">Error: {classroomError}</p>
        ) : assignedClassrooms.length > 0 ? (
          <ul className="classrooms-list">
            {assignedClassrooms.map(classroom => (
              <li key={classroom._id} className="classroom-item">
                <div className="classroom-info">
                  <strong>{classroom.name}</strong>
                  <div className="enrolled-students">
                    <strong>Students ({classroom.students?.length || 0}):</strong>
                    {classroom.students && classroom.students.length > 0 ? (
                      <ul>
                        {classroom.students.map(student => (
                          <li key={student._id || student.email} className="student-item">
                            {student.name || 'N/A'} ({student.email || 'N/A'})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p><small>No students enrolled yet.</small></p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>You have not been assigned to any classrooms yet.</p>
        )}
      </section>
    </div>
  );
}

export default MyClassroomsPage;