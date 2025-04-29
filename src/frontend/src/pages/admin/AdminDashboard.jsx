import React from 'react';
import '../../styles/AdminDashboard.css';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
      </header>
      <div className="admin-content">
        <nav className="admin-sidebar">
          <ul>
            <li><a href="#users">User Management</a></li>
            <li><a href="#classrooms">Classroom Overview</a></li>
            <li><a href="#settings">Settings</a></li>
          </ul>
        </nav>
        <main className="admin-main">
          <section className="user-management">
            <h2>Users</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>New Admin</td>
                  <td>newadmin@example.com</td>
                  <td>Admin</td>
                  <td>
                    <button className="edit-btn">Edit</button>
                    <button className="delete-btn">Delete</button>
                  </td>
                </tr>
                {/* Add more rows dynamically later */}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
