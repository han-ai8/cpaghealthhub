import React from 'react';

import Layout from '../../components/AdminLayout';
const Appointments = () => {
  return (
    <Layout>
      <h2>Appointments</h2>
      <table className="appointments-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Date & Time</th>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Text</td>
            <td>Text</td>
            <td>Psychosocial Support and Assistance</td>
            <td>Text</td>
          </tr>
          <tr>
            <td>Text</td>
            <td>Text</td>
            <td>HIV Testing and Counseling</td>
            <td>Text</td>
          </tr>
        </tbody>
      </table>
    </Layout>
  );
};

export default Appointments;