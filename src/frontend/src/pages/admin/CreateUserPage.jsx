// Eduquizz/src/frontend/src/pages/admin/CreateUserPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/AdminDashboard.css'; // Shared styles

function CreateUserPage() {
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [formError, setFormError] = useState(null); // For form-specific errors
  const [successMessage, setSuccessMessage] = useState(''); // For success message
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage('');
    setIsLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setFormError("Admin token not found. Please log in again.");
      setIsLoading(false);
      return;
    }
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim() || !newUserRole) {
      setFormError("Please fill in all user fields, including selecting a role.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/register', 
        { name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole },
        { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
      );
      
      setSuccessMessage(response.data.message || `${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} created successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('');
      // Optionally navigate back to user list or show success inline
      // navigate('/admin/users'); 
    } catch (err) {
      console.error("[CreateUserPage] Error creating user:", err);
      setFormError(err.response?.data?.error || err.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-user-page admin-dashboard-container">
      <header className="dashboard-header">
        <h1>Create New User</h1>
      </header>

      <section className="user-creation-section card">
        {/* Removed h2 "Create New User" as page title serves this role */}
        {formError && <p className="error-message">{formError}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>} {/* Add a success message display */}
        
        <form onSubmit={handleCreateUser} className="create-user-form">
          <div className="form-group">
            <label htmlFor="userName">Name:</label>
            <input id="userName" type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="userEmail">Email:</label>
            <input id="userEmail" type="email" placeholder="Email Address" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="userPassword">Password:</label>
            <input id="userPassword" type="password" placeholder="Temporary Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="userRole">Role:</label>
            <select id="userRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} required>
              <option value="" disabled>-- Select Role --</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default CreateUserPage;