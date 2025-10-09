// src/pages/admin/Dashboard.jsx
import { useState } from 'react';

const Dashboard = () => {
  // Mock data examples
  const [users] = useState([
    { id: 1, name: 'User One', email: 'one@example.com', active: true },
    { id: 2, name: 'User Two', email: 'two@example.com', active: false },
    { id: 3, name: 'User Three', email: 'three@example.com', active: true },
    { id: 4, name: 'User Four', email: 'four@example.com', active: true },
  ]);
  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.length - activeCount;

  const [reports] = useState([
    { id: 1, user: 'Anonymous', content: 'Inappropriate post in community forum' },
    { id: 2, user: 'Anonymous', content: 'Spam content' },
  ]);

  const [appointments] = useState([
    { id: 1, user: 'User One', datetime: 'Oct 5, 2025 10:00 AM', service: 'Psychosocial Support', status: 'Confirmed' },
    { id: 2, user: 'User Two', datetime: 'Oct 6, 2025 2:00 PM', service: 'HIV Testing', status: 'Pending' },
  ]);

  // Announcement state
  const [announcement, setAnnouncement] = useState({
    title: 'New Program Launch',
    content: 'We are launching a new community outreach program next week.',
  });

  // Community post state example
  const [communityPost, setCommunityPost] = useState({
    content: 'Remember to get tested regularly and stay safe!',
  });

  // User management summary (show sample few only)
  const [userSummaries] = useState(users.slice(0, 3));

  // Handlers (dummy)
  const deleteArticle = () => alert('Delete article clicked');
  const createAnnouncement = () => alert('Create announcement clicked');
  const postContent = () => alert('Create community post clicked');

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow flex flex-col items-center">
          <div className="text-lg font-bold text-green-700">{activeCount}</div>
          <div className="text-gray-600">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded shadow flex flex-col items-center">
          <div className="text-lg font-bold text-red-700">{inactiveCount}</div>
          <div className="text-gray-600">Inactive Users</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">Community Reports</div>
          <ul className="list-disc list-inside text-sm">
            {reports.map(r => (
              <li key={r.id}>{r.content}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">Upcoming Appointments</div>
          <ul className="text-sm">
            {appointments.map(a => (
              <li key={a.id}>
                {a.user} - {a.service} on {a.datetime} [{a.status}]
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Announcement + Community Post */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Announcement */}
        <div className="bg-white p-6 rounded shadow space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg">Announcement</h2>
            <button
              className="btn btn-sm btn-primary"
              onClick={createAnnouncement}
            >
              +
            </button>
          </div>
          <p className="font-bold">{announcement.title}</p>
          <p>{announcement.content}</p>
          <div className="flex space-x-4 text-sm text-blue-600 font-semibold cursor-pointer">
            <span>Post</span>
            <span>Delete</span>
          </div>
        </div>

        {/* Community Post */}
        <div className="bg-white p-6 rounded shadow space-y-3">
          <h2 className="font-bold text-lg">Community Post</h2>
          <p className="font-bold">TEXT</p>
          <p>{communityPost.content}</p>
          <div className="flex space-x-4 text-sm text-blue-600 font-semibold cursor-pointer">
            <span>Comment</span>
            <button
              className="btn btn-xs btn-success"
              onClick={() => alert('Approved')}
            >
              Approved
            </button>
            <button
              className="btn btn-xs btn-error"
              onClick={() => alert('Rejected')}
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* User Management Summary Table */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-bold text-lg mb-4">User Management</h2>
        <table className="table w-full">
          <thead>
            <tr className="bg-green-200">
              <th>User</th>
              <th>Email</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {userSummaries.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  {u.active ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-error">Inactive</span>
                  )}
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-error"
                    onClick={() => alert(`Delete user ${u.name}`)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;