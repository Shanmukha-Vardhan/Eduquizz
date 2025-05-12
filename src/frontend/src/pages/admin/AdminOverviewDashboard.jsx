// Eduquizz/src/frontend/src/pages/admin/AdminOverviewDashboard.jsx
import React from 'react';
import '../../styles/AdminDashboard.css'; // Can share styles with other admin pages

function AdminOverviewDashboard() {
  return (
    <div className="admin-overview-dashboard admin-dashboard-container"> {/* Added admin-dashboard-container for consistent padding etc. */}
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </header>
      
      <section className="card">
        <h2>Platform Overview</h2>
        <p>Welcome to the Admin Dashboard!</p>
        <p>Key platform statistics and quick actions will be displayed here in the future.</p>
        <p>Please use the navigation bar to manage users, classrooms, and other settings.</p>
      </section>
    </div>
  );
}

export default AdminOverviewDashboard;