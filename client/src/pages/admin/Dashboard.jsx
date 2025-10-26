import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../utils/api'; // ✅ Import API client

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  
  const [users, setUsers] = useState([]);
  const [announcement, setAnnouncement] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postContent, setPostContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  const [allComments, setAllComments] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // ✅ Removed getAuthHeaders() - api client handles this automatically

  useEffect(() => {
    if (user?.role && ['admin', 'content_moderator', 'case_manager'].includes(user.role)) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Updated: Use api client instead of fetch
      const userData = await api.get('/auth/users');
      setUsers(userData.users || []);

      const annData = await api.get('/announcements');
      setAnnouncement(annData[0] || null);

      const postData = await api.get('/posts/all');
      setAdminPosts(postData.adminPosts || []);
      setPendingPosts(postData.pendingPosts || []);

      await fetchAllComments();
    } catch (err) {
      console.error('Fetch data error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllComments = async () => {
    try {
      const comments = [];

      // ✅ Updated: Use api client
      const announcements = await api.get('/announcements');
      announcements.forEach(ann => {
        if (ann.comments && ann.comments.length > 0) {
          ann.comments.forEach(comment => {
            comments.push({
              ...comment,
              postId: ann._id,
              postTitle: ann.title,
              postContent: ann.content.substring(0, 50) + '...',
              postType: 'announcement'
            });
          });
        }
      });

      const postData = await api.get('/posts/all');
      const adminPosts = postData.adminPosts || [];
      adminPosts.forEach(post => {
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            comments.push({
              ...comment,
              postId: post._id,
              postTitle: 'Post',
              postContent: post.content.substring(0, 50) + '...',
              postType: 'post'
            });
          });
        }
      });

      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllComments(comments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const submitReply = async (commentId, postId, postType) => {
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    try {
      setSubmittingReply(prev => ({ ...prev, [commentId]: true }));
      
      // ✅ Updated: Use api client
      const endpoint = postType === 'announcement' 
        ? `/announcements/${postId}/comments/${commentId}/reply`
        : `/posts/${postId}/comments/${commentId}/reply`;

      await api.put(endpoint, { reply: reply.trim() });

      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      toast.success('Reply posted successfully!');
      await fetchAllComments();
    } catch (err) {
      console.error('Reply error:', err);
      toast.error('Failed to post reply: ' + err.message);
    } finally {
      setSubmittingReply(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const deleteComment = async (commentId, postId, postType) => {
    const confirmed = await confirm({
      title: 'Delete Comment',
      message: 'Delete this comment? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // ✅ Updated: Use api client
      const endpoint = postType === 'announcement'
        ? `/announcements/${postId}/comments/${commentId}`
        : `/posts/${postId}/comments/${commentId}`;

      await api.delete(endpoint);

      toast.success('Comment deleted successfully');
      await fetchAllComments();
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Failed to delete comment: ' + err.message);
    }
  };

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const createAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      toast.warning('Fill in title and content');
      return;
    }

    try {
      // ✅ Updated: Use api client
      await api.post('/announcements', { 
        title: annTitle, 
        content: annContent 
      });

      setAnnTitle('');
      setAnnContent('');
      fetchData();
      toast.success('Announcement created!');
    } catch (err) {
      console.error('Create announcement error:', err);
      toast.error('Create failed: ' + err.message);
    }
  };

  const deleteAnnouncement = async () => {
    if (!announcement) return;

    const confirmed = await confirm({
      title: 'Delete Announcement',
      message: 'Delete this announcement?',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // ✅ Updated: Use api client
      await api.delete(`/announcements/${announcement._id}`);
      setAnnouncement(null);
      toast.success('Announcement deleted');
    } catch (err) {
      console.error('Delete announcement error:', err);
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent) {
      toast.warning('Enter post content');
      return;
    }

    const formData = new FormData();
    formData.append('content', postContent);
    formData.append('status', 'approved');
    if (imageFile) formData.append('image', imageFile);

    try {
      // ✅ Updated: Use api client with upload for FormData
      if (editingPostId) {
        await api.upload(`/posts/${editingPostId}`, formData);
        toast.success('Post updated!');
      } else {
        await api.upload('/posts', formData);
        toast.success('Post created and approved!');
      }

      setPostContent('');
      setImageFile(null);
      setEditingPostId(null);
      fetchData();
    } catch (err) {
      console.error('Post submit error:', err);
      toast.error('Operation failed: ' + err.message);
    }
  };

  const editPost = (post) => {
    setPostContent(post.content);
    setEditingPostId(post._id);
    setImageFile(null);
    toast.info('Editing post. Update form and submit.');
  };

  const deleteAdminPost = async (postId) => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: 'Delete this admin post? It will be removed from user homepages.',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // ✅ Updated: Use api client
      await api.delete(`/posts/${postId}`);
      fetchData();
      toast.success('Post deleted');
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Delete failed: ' + err.message);
    }
  };

  const updatePostStatus = async (postId, status) => {
    const confirmed = await confirm({
      message: `${status === 'approved' ? 'Approve' : 'Reject'} this post?`,
      confirmText: status === 'approved' ? 'Approve' : 'Reject',
      type: status === 'approved' ? 'info' : 'danger'
    });

    if (!confirmed) return;

    try {
      // ✅ Updated: Use api client
      await api.put(`/posts/${postId}/approve`, { status });
      fetchData();
      toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} successfully`);
    } catch (err) {
      console.error('Update post status error:', err);
      toast.error('Update failed: ' + err.message);
    }
  };

  const deleteUser = async (userId) => {
    const confirmed = await confirm({
      title: 'Delete User',
      message: 'Delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      // ✅ Updated: Use api client
      await api.delete(`/auth/users/${userId}`);
      fetchData();
      toast.success('User deleted');
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="alert alert-error max-w-2xl mx-auto">
          <span>{error}</span>
          <button onClick={fetchData} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  const activeCount = users.filter(u => u.active !== false).length;
  const inactiveCount = users.length - activeCount;
  const userSummaries = users.slice(0, 3);
  const unrespondedComments = allComments.filter(c => !c.reply).length;

  return (
    <div className="space-y-6 p-8">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded shadow flex flex-col items-center">
          <div className="text-lg font-bold text-green-700">{activeCount}</div>
          <div className="text-gray-600 text-sm">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded shadow flex flex-col items-center">
          <div className="text-lg font-bold text-red-700">{inactiveCount}</div>
          <div className="text-gray-600 text-sm">Inactive Users</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">Pending Posts</div>
          <p className="text-sm">{pendingPosts.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">Admin Posts</div>
          <p className="text-sm">{adminPosts.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="font-semibold mb-2">Pending Replies</div>
          <p className="text-sm text-orange-600 font-bold">{unrespondedComments}</p>
        </div>
      </div>

      {/* Comment Management Section */}
      <div className="bg-white p-6 rounded shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">User Comments & Replies</h2>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={() => fetchAllComments()}
          >
            Refresh Comments
          </button>
        </div>

        {allComments.length > 0 ? (
          <div className="space-y-4">
            {/* ✅ FIXED: Added key prop */}
            {allComments.map((comment) => (
              <div key={comment._id} className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-900">{comment.author}</span>
                      <span className={`badge badge-sm ${comment.postType === 'announcement' ? 'badge-primary' : 'badge-secondary'}`}>
                        {comment.postType}
                      </span>
                      {!comment.reply && (
                        <span className="badge badge-warning badge-sm">Needs Reply</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 italic">
                      On: {comment.postTitle} - {comment.postContent}
                    </p>
                  </div>
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => deleteComment(comment._id, comment.postId, comment.postType)}
                  >
                    Delete
                  </button>
                </div>

                <div className="bg-white p-3 rounded mb-3">
                  <p className="text-gray-800">{comment.body}</p>
                </div>

                {comment.reply && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500 mb-3">
                    <p className="font-semibold text-sm text-blue-800">{comment.reply.author}</p>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(comment.reply.createdAt).toLocaleString()}
                    </p>
                    <p className="text-gray-700">{comment.reply.body}</p>
                  </div>
                )}

                {(!comment.reply || expandedComments[comment._id]) && (
                  <div className="mt-3">
                    {comment.reply && (
                      <button
                        className="btn btn-xs btn-ghost mb-2"
                        onClick={() => toggleCommentExpansion(comment._id)}
                      >
                        {expandedComments[comment._id] ? 'Cancel Edit Reply' : 'Edit Reply'}
                      </button>
                    )}
                    <textarea
                      className="textarea textarea-bordered w-full mb-2"
                      placeholder={comment.reply ? "Edit your reply..." : "Write your reply..."}
                      rows="2"
                      value={replyText[comment._id] || ''}
                      onChange={(e) => setReplyText(prev => ({
                        ...prev,
                        [comment._id]: e.target.value
                      }))}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => submitReply(comment._id, comment.postId, comment.postType)}
                      disabled={submittingReply[comment._id]}
                    >
                      {submittingReply[comment._id] 
                        ? 'Submitting...' 
                        : comment.reply ? 'Update Reply' : 'Post Reply'
                      }
                    </button>
                  </div>
                )}

                {comment.reply && !expandedComments[comment._id] && (
                  <button
                    className="btn btn-xs btn-ghost mt-2"
                    onClick={() => toggleCommentExpansion(comment._id)}
                  >
                    Edit Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No comments yet.</p>
        )}
      </div>

      {/* Announcement Management */}
      <div className="bg-white p-6 rounded shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Announcement</h2>
          <button className="btn btn-sm btn-primary" onClick={() => fetchData()}>
            Refresh
          </button>
        </div>

        {announcement ? (
          <>
            <p className="font-bold">{announcement.title}</p>
            <p>{announcement.content}</p>
            {announcement.image && (
              <img 
                src={`${API_URL.replace('/api', '')}${announcement.image}`} 
                alt="Announcement" 
                className="max-w-xs mt-2" 
              />
            )}
            <button 
              onClick={deleteAnnouncement} 
              className="btn btn-sm btn-error"
            >
              Delete
            </button>
          </>
        ) : (
          <p className="text-gray-500">No announcement yet.</p>
        )}

        <form onSubmit={createAnnouncement} className="space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            className="input input-bordered w-full"
            required
          />
          <textarea
            placeholder="Content"
            value={annContent}
            onChange={(e) => setAnnContent(e.target.value)}
            className="textarea textarea-bordered w-full"
            rows={3}
            required
          />
          <button type="submit" className="btn btn-primary">
            Create Announcement
          </button>
        </form>
      </div>

      {/* Create Post Section */}
      <div className="bg-white p-6 rounded shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Create Post</h2>
          <button className="btn btn-sm btn-primary" onClick={() => fetchData()}>
            Refresh
          </button>
        </div>

        <form onSubmit={handlePostSubmit} className="space-y-2">
          <textarea
            placeholder={editingPostId ? "Edit post content" : "Post content (will be directly approved)"}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="textarea textarea-bordered w-full"
            rows={3}
            required
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="file-input file-input-bordered w-full"
          />
          <div className="flex gap-2">
            <button type="submit" className={`btn ${editingPostId ? 'btn-warning' : 'btn-success'}`}>
              {editingPostId ? 'Update Post' : 'Create & Post'}
            </button>
            {editingPostId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setPostContent('');
                  setImageFile(null);
                  setEditingPostId(null);
                  toast.info('Edit cancelled');
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {adminPosts.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Your Admin Posts</h3>
            {/* ✅ FIXED: Added key prop */}
            {adminPosts.map((post) => (
              <div key={post._id} className="border p-3 rounded mb-2">
                <p className="font-semibold mb-1">{post.content.substring(0, 100)}...</p>
                {post.image && (
                  <img 
                    src={`${API_URL.replace('/api', '')}${post.image}`} 
                    alt="Post" 
                    className="max-w-xs mt-2" 
                  />
                )}
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
                <div className="flex space-x-2">
                  <button
                    className="btn btn-xs btn-warning"
                    onClick={() => editPost(post)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => deleteAdminPost(post._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Post Management */}
      <div className="bg-white p-6 rounded shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Community Posts (Pending)</h2>
          <button className="btn btn-sm btn-primary" onClick={() => fetchData()}>
            Refresh
          </button>
        </div>

        {pendingPosts.length > 0 ? (
          /* ✅ FIXED: Added key prop */
          pendingPosts.map((post) => (
            <div key={post._id} className="border p-3 rounded mb-2">
              <p className="font-semibold">{post.content}</p>
              {post.image && (
                <img 
                  src={`${API_URL.replace('/api', '')}${post.image}`} 
                  alt="Post" 
                  className="max-w-xs mt-2" 
                />
              )}
              <p className="text-xs text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </p>
              <div className="flex space-x-2 mt-2">
                <button
                  className="btn btn-xs btn-success"
                  onClick={() => updatePostStatus(post._id, 'approved')}
                >
                  Approve
                </button>
                <button
                  className="btn btn-xs btn-error"
                  onClick={() => updatePostStatus(post._id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No pending community posts.</p>
        )}
      </div>

      {/* User Management */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="font-bold text-lg mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-green-200">
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ FIXED: Added key prop */}
              {userSummaries.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.active !== false ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-error">Inactive</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => deleteUser(u._id)}
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
    </div>
  );
};

export default Dashboard;