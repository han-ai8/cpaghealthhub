import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Trash2, Flag, MessageCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const CommunityForum = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [posts, setPosts] = useState({
    pendingPosts: [],
    approvedPosts: [],
    rejectedPosts: [],
    reportedPosts: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Anonymous name generator (same as user-side)
  const generateAnonymousName = (userId) => {
    if (!userId) return 'Anonymous User';
    
    // Convert userId to string and create a hash
    const idStr = userId.toString();
    let hash = 0;
    
    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Use absolute value and generate a unique 5-digit number (10000-99999)
    const absHash = Math.abs(hash);
    const uniqueNumber = (absHash % 90000) + 10000;
    
    return `Anonymous #${uniqueNumber}`;
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/community/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Fetch admin posts error:', error);
      alert('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (postId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/community/posts/${postId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Post ${status} successfully`);
      fetchPosts();
    } catch (error) {
      console.error('Update post status error:', error);
      alert('Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };

  const handleReportAction = async (postId, reportId, action) => {
    const deletePost = action === 'delete';
    const status = deletePost ? 'resolved' : 'rejected';

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/community/posts/${postId}/reports/${reportId}`,
        { status, deletePost },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(deletePost ? 'Post deleted' : 'Report rejected');
      fetchPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error('Handle report error:', error);
      alert('Failed to process report');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/community/posts/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Comment deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Failed to delete comment');
    }
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString();
  };

  const renderPost = (post, showActions = true) => (
    <div key={post._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {generateAnonymousName(post.author?._id || post.author)}
            </p>
            <p className="text-xs text-gray-500">{formatTimestamp(post.createdAt)}</p>
            <p className="text-xs text-gray-600">
              Real User: {post.author?.name || post.author?.email || 'Unknown User'}
            </p>
          </div>
        </div>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
          {post.category}
        </span>
      </div>

      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          post.status === 'approved' ? 'bg-green-100 text-green-800' :
          post.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {post.status.toUpperCase()}
        </span>
        {post.reports?.length > 0 && (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Flag className="w-3 h-3" />
            {post.reports.length} Report{post.reports.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Comments */}
      {post.comments?.length > 0 && (
        <div className="border-t pt-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.comments.length} Comment{post.comments.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {post.comments.map(comment => (
              <div key={comment._id} className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {generateAnonymousName(comment.author)}
                    </p>
                    <p className="text-sm text-gray-700">{comment.body}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(comment.createdAt)}</p>
                    
                    {/* Replies */}
                    {comment.replies?.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1">
                        {comment.replies.map((reply, idx) => (
                          <div key={idx} className="bg-white rounded p-2">
                            <p className="font-semibold text-xs">
                              {generateAnonymousName(reply.author)}
                            </p>
                            <p className="text-xs text-gray-700">{reply.body}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(reply.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(post._id, comment._id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {post.reports?.length > 0 && activeTab === 'reported' && (
        <div className="border-t pt-4 mb-4">
          <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Reports
          </p>
          {post.reports.filter(r => r.status === 'pending').map(report => (
            <div key={report._id} className="bg-red-50 rounded p-3 mb-2">
              <p className="text-sm text-gray-700"><strong>Reason:</strong> {report.reason}</p>
              <p className="text-xs text-gray-600">Reported by: {report.reportedBy?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500">{formatTimestamp(report.createdAt)}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleReportAction(post._id, report._id, 'delete')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                >
                  Delete Post
                </button>
                <button
                  onClick={() => handleReportAction(post._id, report._id, 'reject')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
                >
                  Reject Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2">
          {post.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveReject(post._id, 'approved')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleApproveReject(post._id, 'rejected')}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => handleDeletePost(post._id)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return <p className="text-center text-gray-600">Loading...</p>;
    }

    const currentPosts = posts[`${activeTab}Posts`] || [];

    if (currentPosts.length === 0) {
      return <p className="text-center text-gray-600">No {activeTab} posts</p>;
    }

    return currentPosts.map(post => renderPost(post, activeTab !== 'approved'));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Community Forum Management</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-100 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-800">{posts.pendingPosts?.length || 0}</p>
          <p className="text-sm text-yellow-700">Pending Posts</p>
        </div>
        <div className="bg-green-100 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-800">{posts.approvedPosts?.length || 0}</p>
          <p className="text-sm text-green-700">Approved Posts</p>
        </div>
        <div className="bg-red-100 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-800">{posts.reportedPosts?.length || 0}</p>
          <p className="text-sm text-red-700">Reported Posts</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-800">{posts.rejectedPosts?.length || 0}</p>
          <p className="text-sm text-gray-700">Rejected Posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['pending', 'approved', 'reported', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CommunityForum;