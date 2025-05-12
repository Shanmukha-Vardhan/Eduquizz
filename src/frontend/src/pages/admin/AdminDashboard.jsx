// Eduquizz/src/frontend/src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming you use axios for consistency
import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  // --- State for User Management (REMOVED - Moved to ManageUsersPage & CreateUserPage) ---
  // const [teachers, setTeachers] = useState([]); // REMOVED
  // const [students, setStudents] = useState([]); // REMOVED
  // const [isLoadingUsers, setIsLoadingUsers] = useState(true); // REMOVED
  // const [userError, setUserError] = useState(null); // REMOVED
  // const [newUserName, setNewUserName] = useState(''); // REMOVED
  // const [newUserEmail, setNewUserEmail] = useState(''); // REMOVED
  // const [newUserPassword, setNewUserPassword] = useState(''); // REMOVED
  // const [newUserRole, setNewUserRole] = useState(''); // REMOVED

  // --- State for Classroom Management (KEPT) ---
  const [classrooms, setClassrooms] = useState([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [classroomError, setClassroomError] = useState(null);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [studentEmailToEnroll, setStudentEmailToEnroll] = useState({});
  const [teacherToAssign, setTeacherToAssign] = useState({});
  
  // --- Teachers list for dropdowns (NEW - needed for classroom creation/assignment) ---
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [isLoadingTeachersForSelect, setIsLoadingTeachersForSelect] = useState(true);


  // --- Modal State (KEPT - for classroom actions) ---
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- Fetch Users Function (MODIFIED - to only fetch teachers for dropdowns) ---
  const fetchTeachersForSelect = async () => {
    console.log("[AdminDashboard] Fetching teachers for select dropdowns...");
    setIsLoadingTeachersForSelect(true);
    // Not setting userError here as it's classroom focused now
    const token = localStorage.getItem('token');
    if (!token) { 
        // Handle error appropriately, maybe set a specific error for teacher fetching
        console.error("Admin token not found for fetching teachers.");
        setIsLoadingTeachersForSelect(false); 
        return; 
    }
    try {
      const response = await axios.get('/api/users?role=teacher', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      setAvailableTeachers(Array.isArray(response.data) ? response.data : []);
      console.log("[AdminDashboard] Fetched available teachers:", response.data);
    } catch (err) {
      console.error("[AdminDashboard] Error fetching teachers for select:", err);
      setAvailableTeachers([]);
      // Set a specific error state if needed for this fetch
    } finally {
      setIsLoadingTeachersForSelect(false);
    }
  };


  const fetchClassrooms = async () => {
    console.log("[AdminDashboard] Fetching classrooms...");
    setIsLoadingClassrooms(true);
    setClassroomError(null);
    const token = localStorage.getItem('token');
    if (!token) { setClassroomError("Admin token not found."); setIsLoadingClassrooms(false); return; }
    try {
        const response = await axios.get('/api/classrooms', { headers: { 'Authorization': `Bearer ${token}` } });
        setClassrooms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
        setClassroomError(err.response?.data?.error || err.message || "Failed to fetch classrooms.");
        setClassrooms([]);
    } finally {
        setIsLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    // fetchUsers(); // REMOVED - User listing is on ManageUsersPage
    fetchTeachersForSelect(); // Fetch teachers for dropdowns
    fetchClassrooms();
  }, []);

  // handleCreateUser function (REMOVED - Moved to CreateUserPage)

  const handleCreateClassroom = async (e) => {
      e.preventDefault();
      setClassroomError(null);
      const token = localStorage.getItem('token');
      if (!token) { setClassroomError("Admin token not found."); return; }
      if (!newClassroomName.trim() || !selectedTeacherId) {
          setModalMessage("Please enter a classroom name and select a teacher."); setShowModal(true); return;
      }
      try {
          const response = await axios.post('/api/classrooms/create', 
            { name: newClassroomName, teacherId: selectedTeacherId },
            { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
          );
          setModalMessage("Classroom created successfully!"); setShowModal(true);
          setNewClassroomName(''); setSelectedTeacherId('');
          fetchClassrooms(); // Refresh classroom list
      } catch (err) {
          setClassroomError(err.response?.data?.error || err.message || "Failed to create classroom.");
          setModalMessage(`Error: ${err.response?.data?.error || err.message}`); setShowModal(true);
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
      try {
          const response = await axios.post(`/api/classrooms/${classroomId}/enroll`, 
            { studentEmail: studentEmail },
            { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
          );
          setModalMessage(response.data.message || "Student enrolled successfully!"); setShowModal(true);
          setStudentEmailToEnroll(prev => ({ ...prev, [classroomId]: '' }));
          fetchClassrooms();
      } catch (err) {
          setClassroomError(err.response?.data?.error || err.message || "Failed to enroll student.");
          setModalMessage(`Error: ${err.response?.data?.error || err.message}`); setShowModal(true);
      }
  };

  const handleEnrollInputChange = (classroomId, value) => { /* ... (Kept) ... */ };
  const handleAssignTeacher = async (classroomId) => { /* ... (Kept, ensure it uses availableTeachers for dropdown) ... */ };
  const handleAssignTeacherChange = (classroomId, value) => { /* ... (Kept) ... */ };
  const handleDeleteClassroom = async (classroomId, classroomName) => { /* ... (Kept) ... */ };
  const closeModal = () => { setShowModal(false); setModalMessage(''); };


  return (
    <div className="admin-dashboard-container">
      {/* The main h1 for "Admin Dashboard" is now in AdminOverviewDashboard.jsx for the /admin route */}
      {/* This component will be rendered by /admin/classrooms (or similar specific route) */}
      {/* So, it should have its own specific title if needed, or rely on Navbar context */}
      
      {/* If this component is for a specific page like "/admin/classrooms-management", add a title */}
      <header className="dashboard-header">
          <h1>Classroom Management</h1> 
      </header>


      {showModal && ( <div className="modal-backdrop"><div className="modal-content"><p>{modalMessage}</p><button onClick={closeModal} className="btn btn-primary">Close</button></div></div> )}

      <div className="dashboard-content">
        {/* User Creation Section (REMOVED - Moved to CreateUserPage) */}
        {/* User Lists Section (REMOVED - Moved to ManageUsersPage) */}

        {/* Classroom Management Section (KEPT) */}
        <section className="classroom-management-section card">
            {/* Title can be more specific if this component is solely for classroom management */}
            {/* <h2>Manage Classrooms</h2> */} 
            {classroomError && <p className="error-message">Classroom Operation Error: {classroomError}</p>}
            
            <div className="create-classroom-form">
                <h3>Create New Classroom</h3>
                <form onSubmit={handleCreateClassroom}>
                    <div className="form-group">
                        <label htmlFor="newClassroomName">Classroom Name:</label>
                        <input id="newClassroomName" type="text" placeholder="e.g., Biology 101" value={newClassroomName} onChange={(e) => setNewClassroomName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="assignTeacherSelect">Assign Teacher:</label>
                        <select id="assignTeacherSelect" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} required>
                            <option value="" disabled>-- Select Teacher --</option>
                            {isLoadingTeachersForSelect ? ( <option disabled>Loading teachers...</option> )
                             : availableTeachers.length > 0 ? ( availableTeachers.map(teacher => ( <option key={teacher._id} value={teacher._id}> {teacher.name} ({teacher.email}) </option> )) )
                             : ( <option disabled>No teachers available. Create one first.</option> )}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Create Classroom</button>
                </form>
            </div>

            <div className="classrooms-list-section">
                <h3>Existing Classrooms { !isLoadingClassrooms && !classroomError ? `(${classrooms.length})` : ''}</h3>
                {isLoadingClassrooms ? ( <p>Loading classrooms...</p>
                ) : classroomError && classrooms.length === 0 ? ( <p className="error-message">Failed to load classrooms: {classroomError}</p>
                ) : classrooms.length > 0 ? (
                    <ul className="classrooms-list">
                        {classrooms.map(classroom => (
                            <li key={classroom._id} className="classroom-item">
                                <div className="classroom-info">
                                    <strong>{classroom.name}</strong>
                                    <small>Teacher: {classroom.teacher?.name ? `${classroom.teacher.name} (${classroom.teacher.email || ''})` : 'Not Assigned'}</small>
                                    <small>Students Enrolled: {classroom.students?.length || 0}</small>
                                </div>
                                <div className="classroom-actions">
                                     <div className="assign-teacher-section form-group">
                                         <label htmlFor={`assign-teacher-${classroom._id}`} className="small-label">Assign Teacher:</label>
                                         <select id={`assign-teacher-${classroom._id}`} value={teacherToAssign[classroom._id] || classroom.teacher?._id || ''} onChange={(e) => handleAssignTeacherChange(classroom._id, e.target.value)}>
                                             <option value="" disabled={!classroom.teacher}> {classroom.teacher ? '-- Change Teacher --' : '-- Select Teacher --'} </option>
                                             {!isLoadingTeachersForSelect && availableTeachers.length > 0 ? ( availableTeachers.map(teacher => ( <option key={teacher._id} value={teacher._id}> {teacher.name} ({teacher.email}) </option> )) )
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
                ) : ( <p>No classrooms created yet.</p> )}
            </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;