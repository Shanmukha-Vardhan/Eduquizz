// Eduquizz/src/frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/AdminDashboard.css'; // Make sure this CSS file exists and is styled

function AdminDashboard() {
  // --- State for User Management ---
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Start true for initial load
  const [userError, setUserError] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState(''); // Default empty to force selection

  // --- State for Classroom Management ---
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true); // Start true
  const [classroomError, setClassroomError] = useState(null);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(''); // For creating/assigning classroom
  const [studentEmailToEnroll, setStudentEmailToEnroll] = useState({}); // {classroomId: 'email@example.com'}
  const [teacherToAssign, setTeacherToAssign] = useState({}); // {classroomId: teacherId}

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- Fetch Users Function ---
  const fetchUsers = async () => {
    console.log("[AdminDashboard] Fetching users...");
    setIsLoadingUsers(true);
    setUserError(null);
    const token = localStorage.getItem('token');
    if (!token) { setUserError("Admin token not found."); setIsLoadingUsers(false); return; }

    let fetchedTeachers = [];
    let fetchedStudents = [];
    let fetchError = null;

    try {
      const teacherResponse = await fetch('/api/users?role=teacher', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!teacherResponse.ok) {
          const errText = await teacherResponse.text().catch(() => "Unknown error fetching teachers");
          console.error("Teacher fetch failed:", teacherResponse.status, errText);
          throw new Error(`Failed to fetch teachers: ${teacherResponse.statusText}. Server said: ${errText.substring(0,100)}`);
      }
      fetchedTeachers = await teacherResponse.json();
      setTeachers(Array.isArray(fetchedTeachers) ? fetchedTeachers : []);
      console.log("[AdminDashboard] Fetched teachers:", fetchedTeachers);

      const studentResponse = await fetch('/api/users?role=student', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!studentResponse.ok) {
          const errText = await studentResponse.text().catch(() => "Unknown error fetching students");
          console.error("Student fetch failed:", studentResponse.status, errText);
          throw new Error(`Failed to fetch students: ${studentResponse.statusText}. Server said: ${errText.substring(0,100)}`);
      }
      fetchedStudents = await studentResponse.json();
      setStudents(Array.isArray(fetchedStudents) ? fetchedStudents : []);
      console.log("[AdminDashboard] Fetched students:", fetchedStudents);

    } catch (err) {
      console.error("[AdminDashboard] Error fetching users:", err);
      fetchError = err.message;
      setTeachers([]);
      setStudents([]);
    } finally {
      setIsLoadingUsers(false);
      if (fetchError) { setUserError(fetchError); }
    }
  };

  // --- Fetch Classrooms Function ---
  const fetchClassrooms = async () => {
    console.log("[AdminDashboard] Fetching classrooms...");
    setIsLoadingClassrooms(true);
    setClassroomError(null);
    const token = localStorage.getItem('token');
    if (!token) { setClassroomError("Admin token not found."); setIsLoadingClassrooms(false); return; }

    try {
        const response = await fetch('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            let errorBodyText = "Could not retrieve error body from server.";
            try { errorBodyText = await response.text(); } catch (e) { /* ignore */ }
            console.error("[AdminDashboard] Fetch Classrooms !response.ok - Raw Error Body:", errorBodyText);
            let specificError = `Server error ${response.status}: ${response.statusText}.`;
            try { const errData = JSON.parse(errorBodyText); if (errData.error) specificError = errData.error; }
            catch (e) { specificError += ` Response: ${errorBodyText.substring(0, 150)}`;}
            throw new Error(specificError);
        }
        const data = await response.json();
        console.log("[AdminDashboard] Fetched classrooms:", data);
        setClassrooms(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error("[AdminDashboard] Error fetching classrooms:", err);
        setClassroomError(err.message);
        setClassrooms([]);
    } finally {
        setIsLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClassrooms();
  }, []);

  const handleCreateUser = async (e) => {
     e.preventDefault();
    setUserError(null);
    const token = localStorage.getItem('token');
    if (!token) { setUserError("Admin token not found."); return; }
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserRole) {
        setModalMessage("Please fill in all user fields, including selecting a role."); setShowModal(true); return;
    }
    console.log("Attempting to create user:", { name: newUserName, email: newUserEmail, role: newUserRole });
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole }),
        });
        const result = await response.json();
        if (!response.ok) { console.error("[AdminDashboard] Create User Error Response:", result); throw new Error(result.error || `Failed to create user: ${response.statusText}`); }
        console.log("[AdminDashboard] User created successfully:", result);
        setModalMessage(result.message || `${newUserRole} created successfully!`); setShowModal(true);
        setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole('');
        fetchUsers();
    } catch (err) {
        console.error("[AdminDashboard] Error creating user:", err);
        setUserError(err.message); setModalMessage(`Error: ${err.message}`); setShowModal(true);
    }
  };

  const handleCreateClassroom = async (e) => {
      e.preventDefault();
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) { setClassroomError("Admin token not found."); return; }
      if (!newClassroomName.trim() || !selectedTeacherId) {
          setModalMessage("Please enter a classroom name and select a teacher."); setShowModal(true); return;
      }
      console.log(`Creating classroom ${newClassroomName} with teacher ${selectedTeacherId}`);
      try {
          const response = await fetch('/api/classrooms/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name: newClassroomName, teacherId: selectedTeacherId }),
          });
          const result = await response.json();
          if (!response.ok) { console.error("[AdminDashboard] Create Classroom Error:", result); throw new Error(result.error || `Failed to create classroom: ${response.statusText}`); }
          console.log("[AdminDashboard] Classroom created:", result);
          setModalMessage("Classroom created successfully!"); setShowModal(true);
          setNewClassroomName(''); setSelectedTeacherId('');
          fetchClassrooms();
      } catch (err) {
          console.error("[AdminDashboard] Error creating classroom:", err);
          setClassroomError(err.message); setModalMessage(`Error: ${err.message}`); setShowModal(true);
      }
  };

  const handleEnrollStudent = async (classroomId) => {
      const studentEmail = studentEmailToEnroll[classroomId]?.trim();
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) { setClassroomError("Admin token not found."); return; }
      if (!studentEmail) {
          setModalMessage("Please enter the Student's Email to enroll."); setShowModal(true); return;
      }
      console.log(`Enrolling student with email ${studentEmail} into classroom ${classroomId}`);
      try {
          const response = await fetch(`/api/classrooms/${classroomId}/enroll`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ studentEmail: studentEmail }),
          });
          const result = await response.json();
          if (!response.ok) {
              console.error("[AdminDashboard] Enroll Student Error:", result);
              throw new Error(result.error || `Failed to enroll student: ${response.statusText}`);
          }
          console.log("[AdminDashboard] Student enrolled:", result);
          setModalMessage(result.message || "Student enrolled successfully!"); setShowModal(true);
          setStudentEmailToEnroll(prev => ({ ...prev, [classroomId]: '' }));
          fetchClassrooms();
      } catch (err) {
          console.error("[AdminDashboard] Error enrolling student:", err);
          setClassroomError(err.message); setModalMessage(`Error: ${err.message}`); setShowModal(true);
      }
  };

  const handleEnrollInputChange = (classroomId, value) => {
    setStudentEmailToEnroll(prev => ({ ...prev, [classroomId]: value }));
  };

   const handleAssignTeacher = async (classroomId) => {
      const teacherId = teacherToAssign[classroomId];
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) { setClassroomError("Admin token not found."); return; }
      if (!teacherId) { setModalMessage("Please select a teacher to assign."); setShowModal(true); return; }
      console.log(`Assigning teacher ${teacherId} to classroom ${classroomId}`);
      try {
          const response = await fetch(`/api/classrooms/${classroomId}/assign-teacher`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ teacherId: teacherId }),
          });
          const result = await response.json();
          if (!response.ok) { console.error("[AdminDashboard] Assign Teacher Error:", result); throw new Error(result.error || `Failed to assign teacher: ${response.statusText}`); }
          console.log("[AdminDashboard] Teacher assigned:", result);
          setModalMessage(result.message || "Teacher assigned successfully!"); setShowModal(true);
          setTeacherToAssign(prev => ({ ...prev, [classroomId]: '' }));
          fetchClassrooms();
      } catch (err) {
          console.error("[AdminDashboard] Error assigning teacher:", err);
          setClassroomError(err.message); setModalMessage(`Error: ${err.message}`); setShowModal(true);
      }
   };

   const handleAssignTeacherChange = (classroomId, value) => {
     setTeacherToAssign(prev => ({ ...prev, [classroomId]: value }));
   };

   const handleDeleteClassroom = async (classroomId, classroomName) => {
    if (!window.confirm(`Are you sure you want to delete the classroom "${classroomName}"? This action cannot be undone.`)) { return; }
    setClassroomError(null);
    const token = localStorage.getItem('token');
    if (!token) { setClassroomError("Admin token not found."); return; }
    console.log(`[AdminDashboard] Deleting classroom ${classroomId}`);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log(`[AdminDashboard] Delete classroom response status for ${classroomId}:`, response.status, "OK:", response.ok);
      if (!response.ok) {
        let errorBodyText = "Could not retrieve error body"; try { errorBodyText = await response.text(); } catch (e) {}
        console.error("[AdminDashboard] Delete Classroom !response.ok - Raw Error Body:", errorBodyText);
        let specificError = `Server error ${response.status}: ${response.statusText}.`;
        try { const errData = JSON.parse(errorBodyText); if (errData.error) specificError = errData.error; }
        catch (e) { specificError += ` Response: ${errorBodyText.substring(0, 150)}`;}
        throw new Error(specificError);
      }
      const result = await response.json();
      console.log("[AdminDashboard] Classroom deleted (parsed result):", result);
      setModalMessage(result.message || "Classroom deleted successfully!"); setShowModal(true);
      setClassrooms(prevClassrooms => prevClassrooms.filter(c => c._id !== classroomId));
    } catch (err) {
      console.error("[AdminDashboard] Error in handleDeleteClassroom:", err);
      setClassroomError(err.message); setModalMessage(`Error: ${err.message}`); setShowModal(true);
    }
  };

  const closeModal = () => { setShowModal(false); setModalMessage(''); };

  return (
    <div className="admin-dashboard-container">
      <header className="dashboard-header"><h1>Admin Dashboard</h1></header>

      {showModal && ( <div className="modal-backdrop"><div className="modal-content"><p>{modalMessage}</p><button onClick={closeModal} className="btn btn-primary">Close</button></div></div> )}

      <div className="dashboard-content">
        {/* User Creation Section */}
        <section className="user-creation-section card">
          <h2>Create New User</h2>
          {userError && <p className="error-message">User Operation Error: {userError}</p>}
          <form onSubmit={handleCreateUser} className="create-user-form">
             <div className="form-group"> <label htmlFor="userName">Name:</label> <input id="userName" type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userEmail">Email:</label> <input id="userEmail" type="email" placeholder="Email Address" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userPassword">Password:</label> <input id="userPassword" type="password" placeholder="Temporary Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required /> </div>
             <div className="form-group"> <label htmlFor="userRole">Role:</label> <select id="userRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} required> <option value="" disabled>-- Select Role --</option> <option value="teacher">Teacher</option> <option value="student">Student</option> </select> </div>
             <button type="submit" className="btn btn-primary">Create User</button>
          </form>
        </section>

        {/* User Lists Section */}
        <section className="user-lists-section card">
          <h2>Manage Users</h2>
          {isLoadingUsers ? (
            <p>Loading users...</p>
          ) : userError ? (
            <p className="error-message">Error loading users: {userError}</p>
          ) : (
            <> {/* Use Fragment to group lists if no error and not loading */}
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

        {/* Classroom Management Section */}
        <section className="classroom-management-section card">
            <h2>Manage Classrooms</h2>
            {classroomError && <p className="error-message">Classroom Operation Error: {classroomError}</p>}
            <div className="create-classroom-form">
                <h3>Create New Classroom</h3>
                <form onSubmit={handleCreateClassroom}>
                    <div className="form-group"> <label htmlFor="newClassroomName">Classroom Name:</label> <input id="newClassroomName" type="text" placeholder="e.g., Biology 101" value={newClassroomName} onChange={(e) => setNewClassroomName(e.target.value)} required /> </div>
                    <div className="form-group">
                        <label htmlFor="assignTeacherSelect">Assign Teacher:</label>
                        <select id="assignTeacherSelect" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} required>
                            <option value="" disabled>-- Select Teacher --</option>
                            {isLoadingUsers ? ( <option disabled>Loading teachers...</option> )
                             : teachers.length > 0 ? ( teachers.map(teacher => ( <option key={teacher._id} value={teacher._id}> {teacher.name} ({teacher.email}) </option> )) )
                             : ( <option disabled>No teachers found. Create one first.</option> )}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Create Classroom</button>
                </form>
            </div>

            <div className="classrooms-list-section">
                <h3>Existing Classrooms { !isLoadingClassrooms && !classroomError ? `(${classrooms.length})` : ''}</h3>
                {isLoadingClassrooms ? (
                    <p>Loading classrooms...</p>
                ) : classroomError && classrooms.length === 0 ? ( // Only show "Failed to load" if list is empty due to error
                    <p className="error-message">Failed to load classrooms: {classroomError}</p>
                ) : classrooms.length > 0 ? (
                    <ul className="classrooms-list">
                        {classrooms.map(classroom => (
                            <li key={classroom._id} className="classroom-item">
                                <div className="classroom-info">
                                    <strong>{classroom.name}</strong>
                                    <small>Teacher: {classroom.teacher && classroom.teacher.name ? `${classroom.teacher.name} (${classroom.teacher.email || ''})` : 'Not Assigned'}</small>
                                    <small>Students Enrolled: {classroom.students?.length || 0}</small>
                                </div>
                                <div className="classroom-actions">
                                     <div className="assign-teacher-section form-group">
                                         <label htmlFor={`assign-teacher-${classroom._id}`} className="small-label">Assign Teacher:</label>
                                         <select id={`assign-teacher-${classroom._id}`} value={teacherToAssign[classroom._id] || classroom.teacher?._id || ''} onChange={(e) => handleAssignTeacherChange(classroom._id, e.target.value)}>
                                             <option value="" disabled={!classroom.teacher}> {classroom.teacher ? '-- Change Teacher --' : '-- Select Teacher --'} </option>
                                             {!isLoadingUsers && teachers.length > 0 ? ( teachers.map(teacher => ( <option key={teacher._id} value={teacher._id}> {teacher.name} ({teacher.email}) </option> )) )
                                             : ( <option disabled>Loading or no teachers...</option> )}
                                         </select>
                                         <button onClick={() => handleAssignTeacher(classroom._id)} className="btn btn-secondary btn-small" disabled={!teacherToAssign[classroom._id] || teacherToAssign[classroom._id] === classroom.teacher?._id}>Assign</button>
                                     </div>
                                    <div className="enroll-section form-group">
                                        <label htmlFor={`enroll-student-${classroom._id}`} className="small-label">Enroll Student by Email:</label>
                                        <input id={`enroll-student-${classroom._id}`} type="email" placeholder="Enter Student's Email" value={studentEmailToEnroll[classroom._id] || ''} onChange={(e) => handleEnrollInputChange(classroom._id, e.target.value)} className="enroll-input" />
                                        <button onClick={() => handleEnrollStudent(classroom._id)} className="btn btn-secondary btn-small">Enroll</button>
                                    </div>
                                    <div className="delete-section">
                                        <button onClick={() => handleDeleteClassroom(classroom._id, classroom.name)} className="btn btn-danger btn-small"> Delete Classroom </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    // This shows if loading is done, no error, and classrooms array is empty
                    <p>No classrooms created yet.</p>
                )}
            </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;