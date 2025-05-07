// Eduquizz/src/frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
 import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  // State for listing users
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false); // Use a single loading state for simplicity
  const [userError, setUserError] = useState(null); // Combined user error state

  // State for creating users
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('teacher');

  // State for feedback/modals
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- Fetch Users Function ---
  const fetchUsers = async () => {
    console.log("[AdminDashboard] Fetching users...");
    setIsLoadingUsers(true);
    setUserError(null); // Clear previous errors
    const token = localStorage.getItem('token');
    if (!token) {
        setUserError("Admin token not found.");
        setIsLoadingUsers(false);
        return;
    }

    try {
      // Fetch Teachers
      const teacherResponse = await fetch('/api/users?role=teacher', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!teacherResponse.ok) throw new Error(`Failed to fetch teachers: ${teacherResponse.statusText}`);
      const teacherData = await teacherResponse.json();
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      console.log("[AdminDashboard] Fetched teachers:", teacherData);

      // Fetch Students
      const studentResponse = await fetch('/api/users?role=student', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!studentResponse.ok) throw new Error(`Failed to fetch students: ${studentResponse.statusText}`);
      const studentData = await studentResponse.json();
      setStudents(Array.isArray(studentData) ? studentData : []);
      console.log("[AdminDashboard] Fetched students:", studentData);

    } catch (err) {
      console.error("[AdminDashboard] Error fetching users:", err);
      setUserError(err.message);
      setTeachers([]); // Clear on error
      setStudents([]); // Clear on error
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // --- useEffect to fetch users on mount ---
  useEffect(() => {
    fetchUsers(); // Call the fetch function
  }, []); // Empty dependency array means run once on mount

  // --- Handle User Creation ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError(null); // Clear previous errors
    const token = localStorage.getItem('token');
    if (!token) {
        setUserError("Admin token not found.");
        return;
    }
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
        setModalMessage("Please fill in all user fields.");
        setShowModal(true);
        return;
    }

    console.log("Attempting to create user:", { name: newUserName, email: newUserEmail, role: newUserRole });

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: newUserName,
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole,
            }),
        });

        const result = await response.json(); // Always try to parse JSON

        if (!response.ok) {
            console.error("[AdminDashboard] Create User Error Response:", result);
            throw new Error(result.error || `Failed to create user: ${response.statusText}`);
        }

        console.log("[AdminDashboard] User created successfully:", result);
        setModalMessage(result.message || `${newUserRole} created successfully!`);
        setShowModal(true);

        // Reset form
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        // Optionally re-fetch users to update lists immediately
        fetchUsers();

    } catch (err) {
        console.error("[AdminDashboard] Error creating user:", err);
        setUserError(err.message); // Display error near the form
        setModalMessage(`Error: ${err.message}`); // Also show in modal
        setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalMessage('');
  };

  // --- JSX (Mostly the same as before) ---
  return (
    <div className="admin-dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
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
        {/* User Creation Section */}
        <section className="user-creation-section card">
          <h2>Create New User</h2>
          {userError && <p className="error-message">Error: {userError}</p>}
          <form onSubmit={handleCreateUser} className="create-user-form">
             {/* Form groups for name, email, password, role select */}
             <div className="form-group"> <label htmlFor="userName">Name:</label> <input id="userName" type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userEmail">Email:</label> <input id="userEmail" type="email" placeholder="Email Address" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userPassword">Password:</label> <input id="userPassword" type="password" placeholder="Temporary Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userRole">Role:</label> <select id="userRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}> <option value="teacher">Teacher</option> <option value="student">Student</option> </select> </div>
             <button type="submit" className="btn btn-primary">Create User</button>
          </form>
        </section>

        {/* User Lists Section */}
        <section className="user-lists-section card">
          <h2>Manage Users</h2>
          {/* Display combined user error or loading state */}
          {isLoadingUsers && <p>Loading users...</p>}
          {userError && !isLoadingUsers && <p className="error-message">Error loading users: {userError}</p>}

          {/* Teacher List */}
          <div className="teacher-list">
             <h3>Teachers ({teachers.length})</h3>
             {!isLoadingUsers && teachers.length > 0 ? (
                <ul>{teachers.map(t => <li key={t._id}>{t.name} ({t.email})</li>)}</ul>
             ) : !isLoadingUsers ? (<p>No teachers found.</p>) : null}
          </div>
           {/* Student List */}
           <div className="student-list">
             <h3>Students ({students.length})</h3>
              {!isLoadingUsers && students.length > 0 ? (
                <ul>{students.map(s => <li key={s._id}>{s.name} ({s.email})</li>)}</ul>
             ) : !isLoadingUsers ? (<p>No students found.</p>) : null}
           </div>
        </section>

        {/* Placeholder for Classroom Management (Phase 2b) */}
        <section className="classroom-management-section card">
            <h2>Manage Classrooms (Phase 2b)</h2>
            <p>Classroom creation and management UI will go here.</p>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;