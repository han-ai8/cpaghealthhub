import React from 'react';
import Layout from '../../components/Layout';

const CommunityForum = () => {
  return (
    <Layout>
      <h2>Community Post</h2>
      <section className="community-post">
        <p><strong>TEXT</strong></p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...</p>
        <div>
          <input placeholder="Comment" />
          <button>Approved</button>
          <button>Reject</button>
        </div>
      </section>
    </Layout>
  );
};

export default CommunityForum;