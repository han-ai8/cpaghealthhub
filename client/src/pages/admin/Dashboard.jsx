import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/api';
import {
  User,
  CheckCircle,
  XCircle,
  MessageCircle,
  RefreshCw,
  ImageIcon,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  // data
  const [users, setUsers] = useState([]); // still used for stats
  const [announcement, setAnnouncement] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [adminPosts, setAdminPosts] = useState([]);
  const [allComments, setAllComments] = useState([]);

  // UI + loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // announcement / post creation
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [postContent, setPostContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  // reply controls
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [expandedComments, setExpandedComments] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // --- Sorting / selection / search state for Comments, Pending, Admin ---
  // Comments
  const [commentsSortBy, setCommentsSortBy] = useState('createdAt');
  const [commentsSortAsc, setCommentsSortAsc] = useState(false);
  const [selectedComments, setSelectedComments] = useState({}); // { commentId: { postId, postType } }
  const [commentsSearch, setCommentsSearch] = useState('');

  // Pending posts
  const [pendingSortBy, setPendingSortBy] = useState('createdAt');
  const [pendingSortAsc, setPendingSortAsc] = useState(false);
  const [selectedPendingPosts, setSelectedPendingPosts] = useState(() => new Set());
  const [pendingSearch, setPendingSearch] = useState('');

  // Admin posts
  const [adminSortBy, setAdminSortBy] = useState('createdAt');
  const [adminSortAsc, setAdminSortAsc] = useState(false);
  const [selectedAdminPosts, setSelectedAdminPosts] = useState(() => new Set());
  const [adminSearch, setAdminSearch] = useState('');

  useEffect(() => {
    if (user?.role && ['admin', 'content_moderator', 'case_manager'].includes(user.role)) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userData = await api.get('/auth/users');
      setUsers(userData.users || []);

      const annData = await api.get('/announcements');
      setAnnouncement((annData && annData.length > 0) ? annData[0] : null);

      const postData = await api.get('/posts/all');
      setAdminPosts(postData.adminPosts || []);
      setPendingPosts(postData.pendingPosts || []);

      await fetchAllComments();
    } catch (err) {
      console.error('Fetch data error:', err);
      setError(err.message || 'Unknown error');
      toast.error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllComments = async () => {
    try {
      const comments = [];

      const announcements = await api.get('/announcements');
      (announcements || []).forEach(ann => {
        if (ann.comments && ann.comments.length > 0) {
          ann.comments.forEach(comment => {
            comments.push({
              ...comment,
              postId: ann._id,
              postTitle: ann.title,
              postContent: (ann.content || '').substring(0, 50) + '...',
              postType: 'announcement'
            });
          });
        }
      });

      const postData = await api.get('/posts/all');
      const adminPostsLocal = postData.adminPosts || [];
      adminPostsLocal.forEach(post => {
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            comments.push({
              ...comment,
              postId: post._id,
              postTitle: 'Post',
              postContent: (post.content || '').substring(0, 50) + '...',
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

  // Reply handling (unchanged)
  const submitReply = async (commentId, postId, postType) => {
    const reply = replyText[commentId];
    if (!reply || !reply.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    try {
      setSubmittingReply(prev => ({ ...prev, [commentId]: true }));

      const endpoint = postType === 'announcement'
        ? `/announcements/${postId}/comments/${commentId}/reply`
        : `/posts/${postId}/comments/${commentId}/reply`;

      await api.put(endpoint, { reply: reply.trim() });

      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      toast.success('Reply posted successfully!');
      await fetchAllComments();
    } catch (err) {
      console.error('Reply error:', err);
      toast.error('Failed to post reply: ' + (err.message || ''));
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
      const endpoint = postType === 'announcement'
        ? `/announcements/${postId}/comments/${commentId}`
        : `/posts/${postId}/comments/${commentId}`;

      await api.delete(endpoint);

      toast.success('Comment deleted successfully');
      await fetchAllComments();
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Failed to delete comment: ' + (err.message || ''));
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
      toast.error('Create failed: ' + (err.message || ''));
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
      await api.delete(`/announcements/${announcement._id}`);
      setAnnouncement(null);
      toast.success('Announcement deleted');
    } catch (err) {
      console.error('Delete announcement error:', err);
      toast.error('Delete failed: ' + (err.message || ''));
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
      toast.error('Operation failed: ' + (err.message || ''));
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
      await api.delete(`/posts/${postId}`);
      fetchData();
      toast.success('Post deleted');
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Delete failed: ' + (err.message || ''));
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
      await api.put(`/posts/${postId}/approve`, { status });
      fetchData();
      toast.success(`${status.charAt(0).toUpperCase() + status.slice(1)} successfully`);
    } catch (err) {
      console.error('Update post status error:', err);
      toast.error('Update failed: ' + (err.message || ''));
    }
  };

  // ---------------------------
  // Sorting & filtering helpers
  // ---------------------------
  const sortItems = (items = [], sortBy, asc = true) => {
    const sorted = [...items].sort((a, b) => {
      const aVal = a?.[sortBy] ?? '';
      const bVal = b?.[sortBy] ?? '';

      // try date
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return asc ? aDate - bDate : bDate - aDate;
      }

      // booleans
      if (typeof aVal === 'boolean' || typeof bVal === 'boolean') {
        const aa = aVal ? 1 : 0;
        const bb = bVal ? 1 : 0;
        return asc ? aa - bb : bb - aa;
      }

      // numbers
      if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
        return asc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }

      // fallback string
      const sa = String(aVal).toLowerCase();
      const sb = String(bVal).toLowerCase();
      if (sa < sb) return asc ? -1 : 1;
      if (sa > sb) return asc ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // Apply search filters then sort for each list.
  const filteredComments = allComments.filter(c => {
    if (!commentsSearch || commentsSearch.trim() === '') return true;
    const q = commentsSearch.toLowerCase();
    return (
      String(c.author || '').toLowerCase().includes(q) ||
      String(c.body || '').toLowerCase().includes(q) ||
      String(c.postTitle || '').toLowerCase().includes(q)
    );
  });

  const displayedComments = (() => {
    if (commentsSortBy === 'hasReply') {
      const arr = [...filteredComments].sort((a, b) => {
        const aa = a.reply ? 1 : 0;
        const bb = b.reply ? 1 : 0;
        return commentsSortAsc ? aa - bb : bb - aa;
      });
      return arr;
    }
    if (commentsSortBy === 'author') {
      return sortItems(filteredComments, 'author', commentsSortAsc);
    }
    return sortItems(filteredComments, 'createdAt', commentsSortAsc);
  })();

  const filteredPending = pendingPosts.filter(p => {
    if (!pendingSearch || pendingSearch.trim() === '') return true;
    const q = pendingSearch.toLowerCase();
    return String(p.content || '').toLowerCase().includes(q);
  });

  const displayedPending = (() => {
    if (pendingSortBy === 'contentLength') {
      return [...filteredPending].sort((a, b) => pendingSortAsc ? a.content.length - b.content.length : b.content.length - a.content.length);
    }
    return sortItems(filteredPending, pendingSortBy, pendingSortAsc);
  })();

  const filteredAdmin = adminPosts.filter(p => {
    if (!adminSearch || adminSearch.trim() === '') return true;
    const q = adminSearch.toLowerCase();
    return String(p.content || '').toLowerCase().includes(q);
  });

  const displayedAdmin = (() => {
    if (adminSortBy === 'contentLength') {
      return [...filteredAdmin].sort((a, b) => adminSortAsc ? a.content.length - b.content.length : b.content.length - a.content.length);
    }
    return sortItems(filteredAdmin, adminSortBy, adminSortAsc);
  })();

  // ---------------------------
  // Selection handlers
  // ---------------------------

  // Comments selection: store mapping { commentId: { postId, postType } }
  const toggleCommentSelect = (comment) => {
    setSelectedComments(prev => {
      const copy = { ...prev };
      if (copy[comment._id]) {
        delete copy[comment._id];
      } else {
        copy[comment._id] = { postId: comment.postId, postType: comment.postType };
      }
      return copy;
    });
  };
  const toggleSelectAllComments = () => {
    if (Object.keys(selectedComments).length === displayedComments.length && displayedComments.length > 0) {
      setSelectedComments({});
    } else {
      const map = {};
      displayedComments.forEach(c => { map[c._id] = { postId: c.postId, postType: c.postType }; });
      setSelectedComments(map);
    }
  };

  // Pending posts selection
  const togglePendingSelect = (id) => {
    setSelectedPendingPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAllPending = () => {
    if (selectedPendingPosts.size === displayedPending.length && displayedPending.length > 0) {
      setSelectedPendingPosts(new Set());
    } else {
      setSelectedPendingPosts(new Set(displayedPending.map(p => p._id)));
    }
  };

  // Admin posts selection
  const toggleAdminSelect = (id) => {
    setSelectedAdminPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAllAdmin = () => {
    if (selectedAdminPosts.size === displayedAdmin.length && displayedAdmin.length > 0) {
      setSelectedAdminPosts(new Set());
    } else {
      setSelectedAdminPosts(new Set(displayedAdmin.map(p => p._id)));
    }
  };

  // ---------------------------
  // Bulk actions
  // ---------------------------

  // Bulk delete comments
  const bulkDeleteComments = async () => {
    const keys = Object.keys(selectedComments);
    if (keys.length === 0) return;
    const confirmed = await confirm({
      title: 'Delete Comments',
      message: `Delete ${keys.length} selected comment(s)? This cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await Promise.all(keys.map(commentId => {
        const { postId, postType } = selectedComments[commentId];
        const endpoint = postType === 'announcement'
          ? `/announcements/${postId}/comments/${commentId}`
          : `/posts/${postId}/comments/${commentId}`;
        return api.delete(endpoint);
      }));
      toast.success(`${keys.length} comment(s) deleted`);
      setSelectedComments({});
      await fetchAllComments();
    } catch (err) {
      console.error('Bulk delete comments error:', err);
      toast.error('Failed to delete comments: ' + (err.message || ''));
    }
  };

  // Bulk approve / reject pending posts
  const bulkUpdatePendingStatus = async (status) => {
    if (selectedPendingPosts.size === 0) return;
    const confirmed = await confirm({
      title: `${status === 'approved' ? 'Approve' : 'Reject'} Posts`,
      message: `${status === 'approved' ? 'Approve' : 'Reject'} ${selectedPendingPosts.size} selected post(s)?`,
      confirmText: status === 'approved' ? 'Approve' : 'Reject',
      type: status === 'approved' ? 'info' : 'danger'
    });
    if (!confirmed) return;
    try {
      const ids = Array.from(selectedPendingPosts);
      await Promise.all(ids.map(id => api.put(`/posts/${id}/approve`, { status })));
      toast.success(`${ids.length} post(s) ${status === 'approved' ? 'approved' : 'rejected'}`);
      setSelectedPendingPosts(new Set());
      fetchData();
    } catch (err) {
      console.error('Bulk update pending posts error:', err);
      toast.error('Failed to update posts: ' + (err.message || ''));
    }
  };

  // Bulk delete admin posts
  const bulkDeleteAdminPosts = async () => {
    if (selectedAdminPosts.size === 0) return;
    const confirmed = await confirm({
      title: 'Delete Posts',
      message: `Delete ${selectedAdminPosts.size} selected admin post(s)? This cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      const ids = Array.from(selectedAdminPosts);
      await Promise.all(ids.map(id => api.delete(`/posts/${id}`)));
      toast.success(`${ids.length} post(s) deleted`);
      setSelectedAdminPosts(new Set());
      fetchData();
    } catch (err) {
      console.error('Bulk delete admin posts error:', err);
      toast.error('Failed to delete posts: ' + (err.message || ''));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <div className="animate-spin inline-block p-4 bg-white rounded-full shadow-md">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <p className="mt-4 text-sm text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-600 text-white text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stats still use users (we didn't remove fetching since stats are part of the original layout)
  const activeCount = users.filter(u => u.active !== false).length;
  const inactiveCount = users.length - activeCount;
  const unrespondedComments = allComments.filter(c => !c.reply).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">Admin Dashboard</h1>
          <p className="text-xs md:text-sm text-slate-500">Manage announcements, posts and replies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button onClick={fetchData} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 text-white text-xs md:text-sm shadow-sm">
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> Refresh
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-slate-600">
            Signed in as <span className="ml-2 font-medium truncate max-w-[150px]">{user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Stats cards remain same but adjust padding */}
        <article className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-md bg-green-50">
            <User className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-500">Active Users</p>
            <p className="text-lg md:text-xl font-semibold text-green-700">{activeCount}</p>
          </div>
        </article>

        <article className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-md bg-red-50">
            <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-500">Inactive Users</p>
            <p className="text-lg md:text-xl font-semibold text-red-700">{inactiveCount}</p>
          </div>
        </article>

        <article className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-md bg-blue-50">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-500">Pending Posts</p>
            <p className="text-lg md:text-xl font-semibold text-slate-800">{pendingPosts.length}</p>
          </div>
        </article>

        <article className="bg-white p-3 md:p-4 rounded-lg shadow-sm flex items-center gap-3 md:gap-4">
          <div className="p-2 rounded-md bg-amber-50">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-500">Pending Replies</p>
            <p className="text-lg md:text-xl font-semibold text-amber-700">{unrespondedComments}</p>
          </div>
        </article>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Comments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-800">Comments & Replies</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search comments (author, body, post)..."
                  value={commentsSearch}
                  onChange={(e) => setCommentsSearch(e.target.value)}
                  className="text-sm p-1 border rounded"
                />
                <select value={commentsSortBy} onChange={(e) => setCommentsSortBy(e.target.value)} className="text-sm p-1 border rounded">
                  <option value="createdAt">Sort: Date</option>
                  <option value="author">Sort: Author</option>
                  <option value="hasReply">Sort: Has Reply</option>
                </select>
                <button onClick={() => setCommentsSortAsc(prev => !prev)} className="p-1 rounded border text-sm inline-flex items-center gap-1">
                  {commentsSortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {commentsSortAsc ? 'Asc' : 'Desc'}
                </button>
                <button onClick={() => fetchAllComments()} className="text-sm inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-100 text-blue-700">
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            {/* Select All + Bulk Actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Object.keys(selectedComments).length > 0 && Object.keys(selectedComments).length === displayedComments.length && displayedComments.length > 0}
                    onChange={toggleSelectAllComments}
                  />
                  <span>Select All</span>
                </label>
                {Object.keys(selectedComments).length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={bulkDeleteComments} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-sm">
                      <Trash2 className="w-4 h-4" /> Delete Selected ({Object.keys(selectedComments).length})
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-500">{allComments.length} total</div>
            </div>

            {displayedComments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {displayedComments.map(comment => (
                  <li key={comment._id} className="border rounded p-3 bg-slate-50">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!selectedComments[comment._id]}
                              onChange={() => toggleCommentSelect(comment)}
                            />
                          </label>
                          <p className="font-medium text-slate-800">{comment.author}</p>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">{comment.postType}</span>
                          {!comment.reply && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">Needs Reply</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                        <p className="text-sm text-slate-600 italic mt-1">On: {comment.postTitle} — {comment.postContent}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <button onClick={() => deleteComment(comment._id, comment.postId, comment.postType)} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 bg-white rounded p-3 border">
                      <p className="text-sm text-slate-700">{comment.body}</p>
                    </div>

                    {comment.reply && !expandedComments[comment._id] && (
                      <div className="mt-3 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm font-semibold text-blue-800">{comment.reply.author}</p>
                        <p className="text-xs text-slate-500">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                        <p className="text-sm text-slate-700 mt-1">{comment.reply.body}</p>
                        <div className="mt-2">
                          <button onClick={() => toggleCommentExpansion(comment._id)} className="text-sm text-blue-700">Edit Reply</button>
                        </div>
                      </div>
                    )}

                    {(expandedComments[comment._id] || !comment.reply) && (
                      <div className="mt-3">
                        <label className="sr-only">Reply</label>
                        <textarea
                          rows={3}
                          value={replyText[comment._id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [comment._id]: e.target.value }))}
                          placeholder={comment.reply ? 'Edit your reply...' : 'Write your reply...'}
                          className="w-full border rounded p-2 text-sm"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => submitReply(comment._id, comment.postId, comment.postType)} disabled={submittingReply[comment._id]} className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-green-600 text-white text-sm">
                            {submittingReply[comment._id] ? 'Submitting...' : (comment.reply ? 'Update Reply' : 'Post Reply')}
                          </button>
                          {comment.reply && (
                            <button onClick={() => toggleCommentExpansion(comment._id)} className="text-sm text-slate-600">Cancel</button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>

        {/* Right column: Announcement + Create Post + Posts lists */}
        <aside className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Announcement</h3>
              {announcement ? (
                <button onClick={deleteAnnouncement} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-sm">Delete</button>
              ) : null}
            </div>

            {announcement ? (
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">{announcement.title}</p>
                <p className="text-sm text-slate-700">{announcement.content}</p>
                {announcement.image && (
                  <img src={getImageUrl(announcement.image)} alt="Announcement" className="w-full mt-2 rounded" />
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No announcement yet.</p>
            )}

            <form onSubmit={createAnnouncement} className="mt-3 space-y-2">
              <input type="text" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded text-sm" required />
              <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} rows={3} placeholder="Content" className="w-full p-2 border rounded text-sm" required />
              <div className="flex gap-2">
                <button type="submit" className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Create Announcement</button>
                <button type="button" onClick={() => { setAnnTitle(''); setAnnContent(''); toast.info('Cleared'); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 text-slate-700 text-sm">Clear</button>
              </div>
            </form>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Create Post</h3>
            <form onSubmit={handlePostSubmit} className="space-y-2">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={4} placeholder={editingPostId ? 'Edit post content' : 'Post content (will be directly approved)'} className="w-full p-2 border rounded text-sm" required />
              <label className="flex items-center gap-2 text-sm">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="text-sm" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-white text-sm ${editingPostId ? 'bg-amber-500' : 'bg-green-600'}`}>
                  {editingPostId ? 'Update Post' : 'Create & Post'}
                </button>
                {editingPostId && (
                  <button type="button" onClick={() => { setPostContent(''); setImageFile(null); setEditingPostId(null); toast.info('Edit cancelled'); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 text-slate-700 text-sm">Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Pending Posts list - MOBILE RESPONSIVE */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-medium text-slate-800 mb-3">Pending Posts</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="text-sm p-2 border rounded w-full sm:flex-1"
                />
                <div className="flex items-center gap-2">
                  <select 
                    value={pendingSortBy} 
                    onChange={(e) => setPendingSortBy(e.target.value)} 
                    className="text-sm p-2 border rounded flex-1 sm:flex-none"
                  >
                    <option value="createdAt">Date</option>
                    <option value="contentLength">Length</option>
                  </select>
                  <button 
                    onClick={() => setPendingSortAsc(prev => !prev)} 
                    className="p-2 rounded border text-sm inline-flex items-center gap-1 whitespace-nowrap"
                    aria-label={pendingSortAsc ? 'Sort ascending' : 'Sort descending'}
                  >
                    {pendingSortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="hidden sm:inline">{pendingSortAsc ? 'Asc' : 'Desc'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPendingPosts.size > 0 && selectedPendingPosts.size === displayedPending.length && displayedPending.length > 0}
                    onChange={toggleSelectAllPending}
                  />
                  <span>Select All</span>
                </label>
                {selectedPendingPosts.size > 0 && (
                  <>
                    <button 
                      onClick={() => bulkUpdatePendingStatus('approved')} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white text-xs sm:text-sm"
                    >
                      Approve ({selectedPendingPosts.size})
                    </button>
                    <button 
                      onClick={() => bulkUpdatePendingStatus('rejected')} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs sm:text-sm"
                    >
                      Reject ({selectedPendingPosts.size})
                    </button>
                  </>
                )}
              </div>
              <div className="text-sm text-slate-500">{pendingPosts.length} total</div>
            </div>

            {displayedPending.length === 0 ? (
              <p className="text-sm text-slate-500">No pending posts.</p>
            ) : (
              <ul className="space-y-3">
                {displayedPending.map(post => (
                  <li key={post._id} className="border rounded p-3 bg-slate-50">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <label className="inline-flex items-center gap-2 mt-1">
                            <input
                              type="checkbox"
                              checked={selectedPendingPosts.has(post._id)}
                              onChange={() => togglePendingSelect(post._id)}
                            />
                          </label>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm">{(post.content || '').substring(0, 120)}{(post.content || '').length > 120 ? '...' : ''}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(post.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col sm:items-end">
                        <button 
                          onClick={() => updatePostStatus(post._id, 'approved')} 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-600 text-white text-xs flex-1 sm:flex-none justify-center"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updatePostStatus(post._id, 'rejected')} 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs flex-1 sm:flex-none justify-center"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Admin Posts list - MOBILE RESPONSIVE */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="mb-3">
              <h2 className="text-lg font-medium text-slate-800 mb-3">Admin Posts</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="text-sm p-2 border rounded w-full sm:flex-1"
                />
                <div className="flex items-center gap-2">
                  <select 
                    value={adminSortBy} 
                    onChange={(e) => setAdminSortBy(e.target.value)} 
                    className="text-sm p-2 border rounded flex-1 sm:flex-none"
                  >
                    <option value="createdAt">Date</option>
                    <option value="contentLength">Length</option>
                  </select>
                  <button 
                    onClick={() => setAdminSortAsc(prev => !prev)} 
                    className="p-2 rounded border text-sm inline-flex items-center gap-1 whitespace-nowrap"
                    aria-label={adminSortAsc ? 'Sort ascending' : 'Sort descending'}
                  >
                    {adminSortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="hidden sm:inline">{adminSortAsc ? 'Asc' : 'Desc'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAdminPosts.size > 0 && selectedAdminPosts.size === displayedAdmin.length && displayedAdmin.length > 0}
                    onChange={toggleSelectAllAdmin}
                  />
                  <span>Select All</span>
                </label>
                {selectedAdminPosts.size > 0 && (
                  <button 
                    onClick={bulkDeleteAdminPosts} 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs sm:text-sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    Delete ({selectedAdminPosts.size})
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-500">{adminPosts.length} total</div>
            </div>

            {displayedAdmin.length === 0 ? (
              <p className="text-sm text-slate-500">You have no admin posts yet.</p>
            ) : (
              <ul className="space-y-3">
                {displayedAdmin.map(post => (
                  <li key={post._id} className="border rounded p-3 bg-slate-50">
                    <div className="flex items-start gap-2 mb-2">
                      <label className="inline-flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedAdminPosts.has(post._id)}
                          onChange={() => toggleAdminSelect(post._id)}
                        />
                      </label>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {(post.content || '').substring(0, 120)}{(post.content || '').length > 120 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                    {post.image && (
                      <img src={getImageUrl(post.image)} alt="post" className="max-w-xs mb-2 rounded" />
                    )}
                    <p className="text-xs text-slate-500 mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => editPost(post)} 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-white text-xs flex-1 sm:flex-none justify-center"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => deleteAdminPost(post._id)} 
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs flex-1 sm:flex-none justify-center"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;