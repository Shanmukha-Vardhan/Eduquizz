// Eduquizz/src/frontend/src/pages/admin/ManageUsersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/AdminDashboard.css'; // Shared styles

function ManageUsersPage() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);

  const fetchUsers = async () => {
    console.log("[ManageUsersPage] Fetching users...");
    setIsLoadingUsers(true);
    setUserError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setUserError("Admin token not found. Please log in.");
      setIsLoadingUsers(false);
      return;
    }

    try {
      const teacherResponse = await axios.get('/api/users?role=teacher', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setTeachers(Array.isArray(teacherResponse.data) ? teacherResponse.data : []);
      
      const studentResponse = await axios.get('/api/users?role=student', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);

    } catch (err) {
      console.error("[ManageUsersPage] Error fetching users:", err);
      const errMsg = err.response?.data?.error || err.message || "Error fetching users.";
      setUserError(errMsg);
      setTeachers([]);
      setStudents([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="manage-users-page admin-dashboard-container"> 
      <header className="dashboard-header">
          <h1>Manage Users</h1>
      </header>

      <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
        <Link to="/admin/users/create" className="btn btn-primary">
          + Create New User
        </Link>
      </div>

      <section className="user-lists-section card">
        {isLoadingUsers ? (
          <p>Loading users...</p>
        ) : userError ? (
          <p className="error-message">{userError}</p>
        ) : (
          <>
            <div className="teacher-list">
              <h3>Teachers ({teachers.length})</h3>
              {teachers.length > 0 ? (
                <ul>{teachers.map(t => <li key={t._id}>{t.name} ({t.email})</li>)}</ul>
              ) : (
                <p>No teachers found.</p>
              )}
            </div>
            <div className="student-list">
              <h3>Students ({students.length})</h3>
              {students.length > 0 ? (
                <ul>{students.map(s => <li key={s._id}>{s.name} ({s.email})</li>)}</ul>
              ) : (
                <p>No students found.</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default ManageUsersPage;