import React from 'react';
import Layout from '../../components/Layout';

const ClinicFinder = () => {
  return (
    <Layout>
      <section className="clinic-list">
        <h2>Available HIV Center in Cavite <button>Add clinic</button></h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Location</th><th>Contact</th><th>Action</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Text</td><td>Text</td><td>Text</td><td><button>Delete</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="clinic-map">
        <h2>Available HIV Center in Cavite</h2>
        <div className="map-placeholder">Map goes here</div>
      </section>
    </Layout>
  );
};

export default ClinicFinder;