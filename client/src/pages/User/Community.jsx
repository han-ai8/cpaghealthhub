import React, { useState, useEffect } from 'react';
import { User, Flag, Shield, Lock, Send, MessageCircle, Reply } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

// Extracted Community Guidelines component for reuse
const CommunityGuidelines = ({ className = '' }) => (
  <section className={`bg-white rounded-md shadow-md dark:bg-gray-800 p-4 sm:p-6 ${className}`}>
    <h3 className="font-semibold text-gray-900 dark:text-gray-300 mb-3 text-sm sm:text-base">Community Guidelines</h3>
    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-3">
      Our community is built on respect, confidentiality, and support.
    </p>
    <div className="mb-3">
      <p className="font-medium text-gray-800 dark:text-gray-300 mb-1 text-xs sm:text-sm">✅ Do:</p>
      <ul className="text-xs list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-300">
        <li>Share experiences respectfully</li>
        <li>Provide emotional support</li>
        <li>Respect others' privacy</li>
        <li>Use appropriate categories</li>
      </ul>
    </div>
    <div>
      <p className="font-medium text-gray-800 dark:text-gray-300 mb-1 text-xs sm:text-sm">❌ Don't:</p>
      <ul className="text-xs list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-300">
        <li>Share personal medical advice</li>
        <li>Post identifying information</li>
        <li>Use discriminatory language</li>
        <li>Spread misinformation</li>
      </ul>
    </div>
  </section>
);

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

  const generateAnonymousName = (userId) => {
    if (!userId) return 'Anonymous User';
    let idStr;
    if (typeof userId === 'object' && userId._id) {
      idStr = userId._id.toString();
    } else {
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

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.category === activeFilter));
    }
  }, [posts, activeFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    const commentId = params.get('comment');
    if (highlight && posts.length > 0) {
      setTimeout(() => {
        const postId = highlight.replace('post-', '').replace('comment-', '');
        const post = posts.find(p => p._id === postId);
        if (post) {
          setExpandedPost(post._id);
          setTimeout(() => {
            let elementId = highlight;
            if (commentId) elementId = `comment-${commentId}`;
            const element = document.getElementById(elementId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlight-flash');
              setTimeout(() => { element.classList.remove('highlight-flash'); }, 3000);
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
    if (!newPost.trim()) { toast.warning('Please write something before posting'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { toast.error('You must be logged in to post. Please log in first.'); setLoading(false); return; }
      await api.post('/community/posts', { content: newPost.trim(), category: selectedCategory });
      toast.success('Your post has been submitted for review. It will appear once approved by moderators.');
      setNewPost('');
      await fetchPosts();
    } catch (error) {
      console.error('Submit post error:', error);
      if (error.response?.status === 401) { toast.error('Session expired. Please log in again.'); }
      else { toast.error(error.response?.data?.message || 'Failed to submit post. Please try again.'); }
    } finally { setLoading(false); }
  };

  const handleAddComment = async (postId) => {
    const comment = commentText[postId];
    if (!comment || !comment.trim()) { toast.warning('Please write a comment'); return; }
    try {
      const response = await api.post(`/community/posts/${postId}/comments`, { body: comment.trim() });
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
    if (!reply || !reply.trim()) { toast.warning('Please write a reply'); return; }
    try {
      const response = await api.post(`/community/posts/${postId}/comments/${commentId}/replies`, { body: reply.trim() });
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
    if (!reportReason.trim() || !reportingPost) { toast.warning('Please provide a reason for reporting'); return; }
    try {
      await api.post(`/community/posts/${reportingPost}/report`, { reason: reportReason.trim() });
      toast.success('Report submitted. Thank you for helping maintain our community standards.');
      setReportingPost(null);
      setReportReason('');
    } catch (error) {
      console.error('Report error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleCategoryFilter = (category) => { setActiveFilter(category); };

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
    <div className="min-h-screen bg-blue-200  px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
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
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-md p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 shadow-sm text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Community Forum</h1>
        <p className="text-gray-700 text-xs sm:text-sm md:text-base dark:text-gray-300">
          Connect with others, share experiences, and find support in a safe space.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="max-w-6xl mx-auto bg-white dark:bg-green-800 rounded-md p-3 sm:p-4 flex items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 shadow-sm text-xs sm:text-sm">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
        <p className="flex-1 text-gray-800 dark:text-gray-300">
          Your data is protected under the Philippines Data Privacy Act of 2012 (RA 10173). We process your information with your explicit consent and ensure your privacy rights.
        </p>
      </div>

      {/* Mobile-only Community Guidelines - shown after Privacy Notice on mobile */}
      <div className="max-w-6xl mx-auto mb-4 sm:mb-6 lg:hidden">
        <CommunityGuidelines />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Share Your Thoughts */}
        <section className="lg:col-span-2 bg-white rounded-md shadow-md dark:bg-gray-800 p-4 sm:p-6">
          <div className="flex items-center mb-4 flex-wrap gap-2">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-300 text-base sm:text-lg">SHARE YOUR THOUGHTS</h2>
            <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full font-medium">
              Private & Anonymous
            </span>
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <select
                aria-label="Select Category"
                className="w-full mb-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-3 sm:p-4 resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 text-xs sm:text-sm"
                placeholder="Write something here..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
              ></textarea>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-2 text-gray-500 text-xs">
                <div className="flex items-center dark:text-gray-300 gap-1">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4"/>
                  <span className="text-xs">Your identity remains completely anonymous</span>
                </div>

                <button
                  onClick={handleSubmitPost}
                  disabled={loading}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 py-2 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      Share Anonymously
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="mb-6 pb-4 border-b dark:border-gray-700">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter by Category:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                  activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryFilter(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                    activeFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {activeFilter !== 'all' && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} in "{activeFilter}"
              </p>
            )}
          </div>

          {/* Posts */}
          <div className="space-y-4 sm:space-y-6 mt-6">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">{activeFilter === 'all' ? 'No posts yet. Be the first to share!' : `No posts in "${activeFilter}" category yet.`}</p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <article key={post._id} id={`post-${post._id}`} className="relative bg-white dark:bg-gray-700 rounded-md shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setReportingPost(post._id)}
                    title="Report this post"
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                  >
                    <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="flex items-center gap-2 sm:gap-3 mb-3 pr-8">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white select-none text-sm sm:text-base truncate">{generateAnonymousName(post.author)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(post.createdAt)}</p>
                    </div>
                    <span className="hidden sm:inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium select-none shrink-0">
                      {post.category}
                    </span>
                  </div>

                  {/* Category badge for mobile */}
                  <div className="sm:hidden mb-2">
                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium select-none">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap mb-3 text-sm sm:text-base">{post.content}</p>

                  <div className="border-t dark:border-gray-600 pt-3 mt-3">
                    <button
                      onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      {post.comments?.length || 0} Comments
                    </button>

                    {expandedPost === post._id && (
                      <div className="mt-3 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText[post._id] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                            className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => handleAddComment(post._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm transition"
                          >
                            Post
                          </button>
                        </div>

                        {post.comments?.map(comment => {
                          const isMyCommentFlag = isMyComment(comment.author);
                          return (
                            <div key={comment._id} id={`comment-${comment._id}`} className={`rounded-md p-2 sm:p-3 ${isMyCommentFlag ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-600'}`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${isMyCommentFlag ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`font-semibold text-xs sm:text-sm ${isMyCommentFlag ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'} truncate`}>
                                      {generateAnonymousName(comment.author)}
                                    </p>
                                    {isMyCommentFlag && (
                                      <span className="px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">You</span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 mt-1 break-words">{comment.body}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatTimestamp(comment.createdAt)}</p>

                                  {comment.replies?.length > 0 && (
                                    <div className="mt-2 ml-2 sm:ml-4 space-y-2">
                                      {comment.replies.map((reply, idx) => {
                                        const isMyReplyFlag = isMyComment(reply.author);
                                        return (
                                          <div key={idx} className={`rounded p-2 ${isMyReplyFlag ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-gray-500'}`}>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className={`font-semibold text-xs ${isMyReplyFlag ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'} truncate`}>
                                                {generateAnonymousName(reply.author)}
                                              </p>
                                              {isMyReplyFlag && (
                                                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">You</span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-gray-200 mt-1 break-words">{reply.body}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatTimestamp(reply.createdAt)}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="flex gap-2 mt-2">
                                    <input
                                      type="text"
                                      placeholder="Reply..."
                                      value={replyText[comment._id] || ''}
                                      onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                      onKeyPress={(e) => e.key === 'Enter' && handleAddReply(post._id, comment._id)}
                                      className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-500 dark:text-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                    <button
                                      onClick={() => handleAddReply(post._id, comment._id)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-1 rounded text-xs transition flex items-center gap-1"
                                    >
                                      <Reply className="w-3 h-3" />
                                      <span className="hidden sm:inline">Reply</span>
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
        <aside className="space-y-4 sm:space-y-6">
          {/* Community Guidelines - hidden on mobile (lg:block), shown on desktop */}
          <CommunityGuidelines className="hidden lg:block" />

          {/* Privacy Act Info */}
          <section className="bg-green-50 dark:bg-green-800 rounded-md p-4 sm:p-5">
            <h4 className="flex items-center font-semibold text-green-800 dark:text-gray-300 mb-2 text-sm sm:text-base">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Privacy Protection
            </h4>
            <p className="text-xs text-green-700 dark:text-gray-300">
              Under RA 10173 (Data Privacy Act of 2012), your personal information is protected. All posts are anonymous and we never store identifying data without explicit consent.
            </p>
          </section>
        </aside>
      </div>

      {/* Report Modal */}
      {reportingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-4">Report Post</h3>
            <textarea
              placeholder="Please describe why you're reporting this post..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-3 resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            ></textarea>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setReportingPost(null); setReportReason(''); }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-md transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition text-sm"
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