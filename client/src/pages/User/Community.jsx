import React, { useState } from 'react';
import { User, Flag, Shield, Lock, Send } from 'lucide-react';

const Community = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      category: 'HIV Testing',
      content: 'I recently got tested and I\'m waiting for results. How do you cope with the waiting period?',
      timestamp: '2 hours ago',
      replies: 5
    },
    {
      id: 2,
      category: 'Treatment Support',
      content: 'Starting medication next week. What should I expect in terms of side effects?',
      timestamp: '4 hours ago',
      replies: 12
    },
    {
      id: 3,
      category: 'General Support',
      content: 'Just wanted to share that I celebrated 1 year on treatment today. You\'re not alone in this.',
      timestamp: '6 hours ago',
      replies: 8
    }
  ]);

  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General Support');

  const categories = [
    'General Support',
    'HIV Testing',
    'Treatment Support',
    'Mental Health',
    'Relationships',
    'Prevention',
    'Living with HIV/AIDS',
    'Stigma & Discrimination'
  ];

  const handleSubmitPost = () => {
    if (newPost.trim()) {
      const post = {
        id: posts.length + 1,
        category: selectedCategory,
        content: newPost.trim(),
        timestamp: 'Just Now',
        replies: 0
      };
      setPosts([post, ...posts]);
      setNewPost('');
    }
  };

  const handleReport = (postId) => {
    alert(`Report submitted for post ${postId}. Thank you for helping maintain our community standards.`);
  };

  return (
    <div className="min-h-screen bg-blue-200 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto bg-white rounded-md p-6 md:p-8 mb-6 shadow-sm text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Community Forum</h1>
        <p className="text-gray-700 text-sm md:text-base">
          Connect with others, share experiences, and find support in a safe space.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="max-w-5xl mx-auto bg-white rounded-md p-4 flex items-center gap-3 mb-8 shadow-sm text-xs sm:text-sm">
        <Shield className="w-5 h-5 text-red-600" />
        <p className="flex-1 text-gray-800">
          Your data is protected under the Philippines Data Privacy Act of 2012 (RA 10173). We process your information with your explicit consent and ensure your privacy rights.
        </p>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-xs">
          I Understand
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Share Your Thoughts */}
        <section className="lg:col-span-2 bg-white rounded-md shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="font-semibold text-gray-900 text-lg">SHARE YOUR THOUGHTS</h2>
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Private & Anonymous</span>
          </div>

          <div className="flex space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <select
                aria-label="Select Category"
                className="w-full mb-3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <textarea
                className="w-full border border-gray-300 rounded-md p-4 resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
                placeholder="Write something here..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
              ></textarea>

              <div className="flex justify-between items-center mt-3 text-gray-500 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Your identity remains completely anonymous
                </div>

                <button
                  onClick={handleSubmitPost}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Share Anonymously
                </button>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {posts.map(post => (
              <article key={post.id} className="relative bg-white rounded-md shadow p-5">
                {/* Report button top right */}
                <button
                  onClick={() => handleReport(post.id)}
                  title="Report this post"
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                >
                  <Flag className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 select-none">Anonymous</p>
                    <p className="text-xs text-gray-500">{post.timestamp}</p>
                  </div>
                  <span className="ml-auto bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium select-none">
                    {post.category}
                  </span>
                </div>

                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Side Info: Community Guidelines & Privacy Act */}
        <aside className="space-y-6">
          {/* Community Guidelines */}
          <section className="bg-white rounded-md shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
            <p className="text-sm text-gray-700 mb-3">
              Our community is built on respect, confidentiality, and support. Please be kind to others and maintain anonymity as desired.
            </p>
            <div className="mb-3">
              <p className="font-medium text-gray-800 mb-1">✅ Do:</p>
              <ul className="text-xs list-disc list-inside space-y-0.5 text-gray-600">
                <li>Share experiences respectfully</li>
                <li>Provide emotional support</li>
                <li>Respect others' privacy</li>
                <li>Use appropriate categories</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-800 mb-1">❌ Don't:</p>
              <ul className="text-xs list-disc list-inside space-y-0.5 text-gray-600">
                <li>Share personal medical advice</li>
                <li>Post identifying information</li>
                <li>Use discriminatory language</li>
                <li>Spread misinformation</li>
              </ul>
            </div>
          </section>

          {/* Privacy Act Info */}
          <section className="bg-green-50 rounded-md p-5">
            <h4 className="flex items-center font-semibold text-green-800 mb-2">
              <Shield className="w-5 h-5 mr-2" />
              Privacy Protection
            </h4>
            <p className="text-xs text-green-700">
              Under RA 10173 (Data Privacy Act of 2012), your personal information is protected. All posts are anonymous and we never store identifying data without explicit consent.
            </p>
          </section>

          {/* Discussion Categories */}
          <section className="bg-white rounded-md shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Discussion Categories</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {categories.map(cat => (
                <div key={cat} className="cursor-default px-3 py-1 rounded hover:bg-gray-50">
                  {cat}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Community;