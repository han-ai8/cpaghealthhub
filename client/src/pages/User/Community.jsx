import React, { useState, useEffect } from 'react';
import { User, Flag, Shield, Lock, Send, MessageCircle, Reply } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Community = () => {
  const toast = useToast();
  const { user } = useAuth();
  const location = useLocation();
  
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General Support');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [replyText, setReplyText] = useState({});
  const [reportReason, setReportReason] = useState('');
  const [reportingPost, setReportingPost] = useState(null);

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

  // Anonymous name generator (client-side)
  const generateAnonymousName = (userId) => {
  if (!userId) return 'Anonymous User';
  
  // ✅ Handle both ObjectId and populated user object
  let idStr;
  if (typeof userId === 'object' && userId._id) {
    // If it's a populated object, use the _id
    idStr = userId._id.toString();
  } else {
    // If it's already an ObjectId string
    idStr = userId.toString();
  }
  
  let hash = 0;
  
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const absHash = Math.abs(hash);
  const uniqueNumber = (absHash % 90000) + 10000;
  
  return `Anonymous #${uniqueNumber}`;
};

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter posts based on active category
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === activeFilter));
    }
  }, [posts, activeFilter]);

  // Handle scroll to highlighted element from notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    const commentId = params.get('comment');

    if (highlight && posts.length > 0) {
      setTimeout(() => {
        // Extract post ID from highlight parameter
        const postId = highlight.replace('post-', '').replace('comment-', '');
        
        // Find and expand the post
        const post = posts.find(p => p._id === postId);
        if (post) {
          setExpandedPost(post._id);
          
          // Scroll to element after a short delay to ensure DOM is ready
          setTimeout(() => {
            let elementId = highlight;
            if (commentId) {
              elementId = `comment-${commentId}`;
            }
            
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlight-flash');
              
              // Remove highlight after animation
              setTimeout(() => {
                element.classList.remove('highlight-flash');
              }, 3000);
            }
          }, 300);
        }
      }, 500);
    }
  }, [location.search, posts]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/community/posts');
      setPosts(response.data || response);
    } catch (error) {
      console.error('Fetch posts error:', error);
      toast.error(error.response?.data?.message || 'Failed to load posts');
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim()) {
      toast.warning('Please write something before posting');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in to post. Please log in first.');
        setLoading(false);
        return;
      }

      await api.post('/community/posts', {
        content: newPost.trim(),
        category: selectedCategory
      });

      toast.success('Your post has been submitted for review. It will appear once approved by moderators.');
      setNewPost('');
      await fetchPosts();
    } catch (error) {
      console.error('Submit post error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId) => {
    const comment = commentText[postId];
    if (!comment || !comment.trim()) {
      toast.warning('Please write a comment');
      return;
    }

    try {
      const response = await api.post(`/community/posts/${postId}/comments`, {
        body: comment.trim()
      });

      const updatedPost = response.data?.post || response.post || response;
      setPosts(posts.map(p => p._id === postId ? updatedPost : p));
      setCommentText({ ...commentText, [postId]: '' });
      toast.success('Comment added');
    } catch (error) {
      console.error('Add comment error:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleAddReply = async (postId, commentId) => {
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) {
      toast.warning('Please write a reply');
      return;
    }

    try {
      const response = await api.post(
        `/community/posts/${postId}/comments/${commentId}/replies`,
        { body: reply.trim() }
      );

      const updatedPost = response.data?.post || response.post || response;
      setPosts(posts.map(p => p._id === postId ? updatedPost : p));
      setReplyText({ ...replyText, [commentId]: '' });
      toast.success('Reply added');
    } catch (error) {
      console.error('Add reply error:', error);
      toast.error(error.response?.data?.message || 'Failed to add reply');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !reportingPost) {
      toast.warning('Please provide a reason for reporting');
      return;
    }

    try {
      await api.post(`/community/posts/${reportingPost}/report`, {
        reason: reportReason.trim()
      });

      toast.success('Report submitted. Thank you for helping maintain our community standards.');
      setReportingPost(null);
      setReportReason('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleCategoryFilter = (category) => {
    setActiveFilter(category);
  };

  const isMyComment = (commentAuthorId) => {
    return user && commentAuthorId && user.id === commentAuthorId.toString();
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-blue-200 sm:px-6 lg:px-8">
      {/* CSS for highlight animation */}
      <style>{`
        @keyframes highlight-pulse {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.3); }
        }
        
        .highlight-flash {
          animation: highlight-pulse 1s ease-in-out 3;
          border: 2px solid #3b82f6 !important;
          border-radius: 0.5rem;
        }
      `}</style>

      {/* Page Header */}
      <div className="max-w-6xl mx-auto bg-white rounded-md p-6 md:p-8 mb-6 shadow-sm text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Community Forum</h1>
        <p className="text-gray-700 text-sm md:text-base">
          Connect with others, share experiences, and find support in a safe space.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="max-w-6xl mx-auto bg-white rounded-md p-4 flex items-center gap-3 mb-8 shadow-sm text-xs sm:text-sm">
        <Shield className="w-5 h-5 text-red-600 flex-shrink-0" />
        <p className="flex-1 text-gray-800">
          Your data is protected under the Philippines Data Privacy Act of 2012 (RA 10173). We process your information with your explicit consent and ensure your privacy rights.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Share Your Thoughts */}
        <section className="lg:col-span-2 bg-white rounded-md shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="font-semibold text-gray-900 text-lg">SHARE YOUR THOUGHTS</h2>
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
              Private & Anonymous
            </span>
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
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Share Anonymously
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {activeFilter !== 'all' && (
              <p className="mt-3 text-xs text-gray-600">
                Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} in "{activeFilter}"
              </p>
            )}
          </div>

          {/* Posts */}
          <div className="space-y-6 mt-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  {activeFilter === 'all' 
                    ? 'No posts yet. Be the first to share!' 
                    : `No posts in "${activeFilter}" category yet.`}
                </p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <article 
                  key={post._id} 
                  id={`post-${post._id}`}
                  className="relative bg-white rounded-md shadow p-5 border border-gray-200"
                >
                  {/* Report button */}
                  <button
                    onClick={() => setReportingPost(post._id)}
                    title="Report this post"
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                  >
                    <Flag className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 select-none">
                        {generateAnonymousName(post.author)}
                      </p>
                      <p className="text-xs text-gray-500">{formatTimestamp(post.createdAt)}</p>
                    </div>
                    <span className="ml-auto bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium select-none">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

                  {/* Comments Section */}
                  <div className="border-t pt-3 mt-3">
                    <button
                      onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments?.length || 0} Comments
                    </button>

                    {expandedPost === post._id && (
                      <div className="mt-3 space-y-3">
                        {/* Add Comment */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText[post._id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition"
                          >
                            Post
                          </button>
                        </div>

                        {/* Display Comments */}
                        {post.comments?.map(comment => {
                          const isMyCommentFlag = isMyComment(comment.author);
                          
                          return (
                            <div 
                              key={comment._id}
                              id={`comment-${comment._id}`}
                              className={`rounded-md p-3 ${
                                isMyCommentFlag 
                                  ? 'bg-blue-50 border-2 border-blue-300' 
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  isMyCommentFlag ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-semibold text-sm ${
                                      isMyCommentFlag ? 'text-blue-700' : 'text-gray-900'
                                    }`}>
                                      {generateAnonymousName(comment.author)}
                                    </p>
                                    {isMyCommentFlag && (
                                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{comment.body}</p>
                                  <p className="text-xs text-gray-500 mt-1">{formatTimestamp(comment.createdAt)}</p>

                                  {/* Reply Section */}
                                  {comment.replies?.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2">
                                      {comment.replies.map((reply, idx) => {
                                        const isMyReplyFlag = isMyComment(reply.author);
                                        
                                        return (
                                          <div 
                                            key={idx} 
                                            className={`rounded p-2 ${
                                              isMyReplyFlag 
                                                ? 'bg-blue-100 border border-blue-300' 
                                                : 'bg-white'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <p className={`font-semibold text-xs ${
                                                isMyReplyFlag ? 'text-blue-700' : 'text-gray-900'
                                              }`}>
                                                {generateAnonymousName(reply.author)}
                                              </p>
                                              {isMyReplyFlag && (
                                                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                                  You
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-700 mt-1">{reply.body}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(reply.createdAt)}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Add Reply */}
                                  <div className="flex gap-2 mt-2">
                                    <input
                                      type="text"
                                      placeholder="Reply..."
                                      value={replyText[comment._id] || ''}
                                      onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddReply(post._id, comment._id)}
                                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                    <button
                                      onClick={() => handleAddReply(post._id, comment._id)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition flex items-center gap-1"
                                    >
                                      <Reply className="w-3 h-3" />
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Side Info */}
        <aside className="space-y-6">
          {/* Community Guidelines */}
          <section className="bg-white rounded-md shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Community Guidelines</h3>
            <p className="text-sm text-gray-700 mb-3">
              Our community is built on respect, confidentiality, and support.
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

          {/* Discussion Categories Info */}
          <section className="bg-white rounded-md shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Discussion Categories</h3>
            <p className="text-xs text-gray-600 mb-3">
              Browse topics by clicking the category buttons above the posts.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              {categories.map(cat => (
                <div key={cat} className="px-3 py-1 rounded hover:bg-gray-50 transition text-xs">
                  {cat}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Report Post</h3>
            <textarea
              placeholder="Please describe why you're reporting this post..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500"
            ></textarea>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setReportingPost(null); setReportReason(''); }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;