import React, { useState, useEffect } from "react";
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';

const Home = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  
  const [announcement, setAnnouncement] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [likedAnnouncementIds, setLikedAnnouncementIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [error, setError] = useState(null);

  const [announcementComments, setAnnouncementComments] = useState([]);
  const [postComments, setPostComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Get auth headers with token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'credentials': 'include'
    };
  };

  useEffect(() => {
    fetchData();
    fetchSavedPostIds();
    fetchLikedStatus();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const annRes = await fetch(`${API_URL}/announcements`, { credentials: 'include' });
      if (annRes.ok) {
        const annData = await annRes.json();
        const announcement = annData[0] || null;
        setAnnouncement(announcement);
        if (announcement) {
          setAnnouncementComments(announcement.comments || []);
        }
      }

      const postRes = await fetch(`${API_URL}/posts`, { credentials: 'include' });
      if (postRes.ok) {
        const postData = await postRes.json();
        setPosts(postData);
        const commentsMap = {};
        postData.forEach(post => {
          commentsMap[post._id] = post.comments || [];
        });
        setPostComments(commentsMap);
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError(err.message);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPostIds = async () => {
    try {
      setSavedLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/saved`, { 
        credentials: 'include',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (res.ok) {
        const savedPosts = await res.json();
        const ids = new Set(savedPosts.map(post => post._id));
        setSavedPostIds(ids);
      } else if (res.status === 401) {
        setSavedPostIds(new Set());
      }
    } catch (err) {
      console.error('fetchSavedPostIds error:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const fetchLikedStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/liked-status`, { 
        credentials: 'include',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (res.ok) {
        const data = await res.json();
        setLikedPostIds(new Set(data.likedPosts || []));
        setLikedAnnouncementIds(new Set(data.likedAnnouncements || []));
      } else if (res.status === 401) {
        setLikedPostIds(new Set());
        setLikedAnnouncementIds(new Set());
      }
    } catch (err) {
      console.error('fetchLikedStatus error:', err);
    }
  };

  const fetchAnnouncementComments = async (announcementId) => {
    try {
      const res = await fetch(`${API_URL}/announcements/${announcementId}/comments`, {
        credentials: 'include'
      });
      if (res.ok) {
        const comments = await res.json();
        setAnnouncementComments(comments);
      }
    } catch (err) {
      console.error('Fetch announcement comments error:', err);
    }
  };

  const fetchPostComments = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        credentials: 'include'
      });
      if (res.ok) {
        const comments = await res.json();
        setPostComments(prev => ({ ...prev, [postId]: comments }));
      }
    } catch (err) {
      console.error('Fetch post comments error:', err);
    }
  };

  const toggleComments = async (id, type = 'post') => {
    const isShowing = showComments[id];
    setShowComments(prev => ({ ...prev, [id]: !isShowing }));
    
    if (!isShowing) {
      if (type === 'announcement') {
        await fetchAnnouncementComments(id);
      } else {
        await fetchPostComments(id);
      }
    }
  };

  const submitAnnouncementComment = async (announcementId) => {
    const commentText = newComment[`announcement-${announcementId}`];
    if (!commentText || !commentText.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(prev => ({ ...prev, [`announcement-${announcementId}`]: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/announcements/${announcementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ body: commentText.trim() })
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to comment');
          return;
        }
        throw new Error('Failed to post comment');
      }

      const data = await res.json();
      setAnnouncementComments(data.announcement.comments || []);
      setNewComment(prev => ({ ...prev, [`announcement-${announcementId}`]: '' }));
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Submit announcement comment error:', err);
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [`announcement-${announcementId}`]: false }));
    }
  };

  const submitPostComment = async (postId) => {
    const commentText = newComment[`post-${postId}`];
    if (!commentText || !commentText.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(prev => ({ ...prev, [`post-${postId}`]: true }));
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ body: commentText.trim() })
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to comment');
          return;
        }
        throw new Error('Failed to post comment');
      }

      const data = await res.json();
      setPostComments(prev => ({ ...prev, [postId]: data.post.comments || [] }));
      setPosts(posts.map(p => p._id === postId ? { ...p, comments: data.post.comments } : p));
      setNewComment(prev => ({ ...prev, [`post-${postId}`]: '' }));
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Submit post comment error:', err);
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [`post-${postId}`]: false }));
    }
  };

  const handleAnnouncementLike = async (announcementId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/announcements/${announcementId}/like`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to like announcements');
          return;
        }
        throw new Error('Like failed');
      }
      
      const data = await res.json();
      const newLikedIds = new Set(likedAnnouncementIds);
      if (data.liked) {
        newLikedIds.add(announcementId);
      } else {
        newLikedIds.delete(announcementId);
      }
      setLikedAnnouncementIds(newLikedIds);
      setAnnouncement(data.announcement);
    } catch (err) {
      console.error('Like announcement error:', err);
      toast.error('Failed to like announcement');
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to like posts');
          return;
        }
        throw new Error('Like failed');
      }
      
      const data = await res.json();
      const newLikedIds = new Set(likedPostIds);
      if (data.liked) {
        newLikedIds.add(postId);
      } else {
        newLikedIds.delete(postId);
      }
      setLikedPostIds(newLikedIds);
      setPosts(posts.map(p => p._id === postId ? data.post : p));
    } catch (err) {
      console.error('Like error:', err);
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${postId}/save`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Please login to save posts');
          return;
        }
        throw new Error('Save failed');
      }
      
      const data = await res.json();
      const newSavedIds = new Set(savedPostIds);
      if (data.saved) {
        newSavedIds.add(postId);
        toast.success('Post saved!');
      } else {
        newSavedIds.delete(postId);
        toast.success('Post unsaved!');
      }
      setSavedPostIds(newSavedIds);
      setPosts(posts.map(p => p._id === postId ? { ...p, saved: data.saved } : p));
    } catch (err) {
      console.error('handleSave error:', err);
      toast.error(err.message || 'Save failed');
    }
  };

  if (loading || savedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-[#4C8DD8]"></div>
          <p className="mt-4 text-[#4C8DD8]">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="alert alert-error max-w-md bg-[#C62828] text-[#FFFFFF]">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen   space-y-8">
      {/* Announcement Post */}
      {announcement ? (
        <div className="card bg-[#FFFFFF] shadow-lg border border-[#4C8DD8]/20 max-w-6xl mx-auto">
          <div className="card-body">
            <h3 className="card-title text-[#4C8DD8] font-semibold text-lg">
              ANNOUNCEMENT
              <p className="text-xs text-[#4C8DD8]/60">
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </h3>
            <hr className="border-[#4C8DD8]/20" />
            
            <p className="font-semibold text-[#4C8DD8]">{announcement.title}</p>
            <p className="text-[#4C8DD8]/80">{announcement.content}</p>

            {announcement.image && (
              <div
                className="rounded-lg h-32 flex items-center justify-center text-[#FFFFFF] font-semibold mb-4 bg-cover bg-center"
                style={{ backgroundImage: `url(${API_URL.replace('/api', '')}/${announcement.image})` }}
              />
            )}

            <hr className="border-[#4C8DD8]/20" />
            <div className="flex space-x-6 text-[#4C8DD8]/80">
              <button
                className={`btn btn-ghost btn-sm gap-2 hover:text-[#4C8DD8] ${
                  likedAnnouncementIds.has(announcement._id) ? 'text-[#4C8DD8]' : ''
                }`}
                onClick={() => handleAnnouncementLike(announcement._id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${likedAnnouncementIds.has(announcement._id) ? 'fill-current' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                {announcement.likes || 0} {likedAnnouncementIds.has(announcement._id) ? 'Liked' : 'Like'}
              </button>
              
              <button
                className="btn btn-ghost btn-sm gap-2 hover:text-[#4C8DD8]"
                onClick={() => toggleComments(announcement._id, 'announcement')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6" />
                </svg>
                {announcementComments.length} Comment{announcementComments.length !== 1 ? 's' : ''}
              </button>
            </div>

            {showComments[announcement._id] && (
              <div className="mt-4 border-t border-[#4C8DD8]/20 pt-4">
                <h4 className="font-semibold text-[#4C8DD8]">Comments</h4>
                
                <div className="mb-4">
                  <textarea
                    className="textarea textarea-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8]"
                    placeholder="Write a comment..."
                    rows="2"
                    value={newComment[`announcement-${announcement._id}`] || ''}
                    onChange={(e) => setNewComment(prev => ({ 
                      ...prev, 
                      [`announcement-${announcement._id}`]: e.target.value 
                    }))}
                  />
                  <button
                    className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF] btn-sm mt-2"
                    onClick={() => submitAnnouncementComment(announcement._id)}
                    disabled={submittingComment[`announcement-${announcement._id}`]}
                  >
                    {submittingComment[`announcement-${announcement._id}`] ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>

                <div className="space-y-3">
                  {announcementComments.length > 0 ? (
                    announcementComments.map((comment) => (
                      <div key={comment._id} className="bg-[#4C8DD8]/5 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-[#4C8DD8]">{comment.author}</p>
                            <p className="text-xs text-[#4C8DD8]/60">{new Date(comment.createdAt).toLocaleString()}</p>
                            <p className="mt-2 text-[#4C8DD8]/80">{comment.body}</p>
                            
                            {comment.reply && (
                              <div className="mt-3 ml-6 bg-[#2E7D32]/10 p-3 rounded border-l-4 border-[#2E7D32]">
                                <p className="font-semibold text-sm text-[#2E7D32]">{comment.reply.author}</p>
                                <p className="text-xs text-[#2E7D32]/60">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                                <p className="mt-1 text-[#2E7D32]/80">{comment.reply.body}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[#4C8DD8]/60 text-sm">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
                <div className="text-center text-[#4C8DD8]/60 bg-[#FFFFFF] rounded-lg p-6 max-w-4xl mx-auto">
          No announcements available.
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 ? (
        posts.map((post) => {
          const isSaved = savedPostIds.has(post._id);
          const isLiked = likedPostIds.has(post._id);
          const comments = postComments[post._id] || [];
          
          return (
            <div key={post._id} className="card bg-[#FFFFFF] shadow-lg border border-[#4C8DD8]/20 max-w-6xl mx-auto">
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="avatar">
                    <div className="w-10 rounded-full bg-[#C62828] flex justify-center items-center text-[#FFFFFF] font-bold">
                      <img
                        src="/src/assets/cpag.jpg"
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-[#4C8DD8]">Cavite Positive Action Group The JCH Advocacy Inc.</p>
                    <p className="text-xs text-blue-500">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <p className="mb-4 text-[#4C8DD8]/80">{post.content}</p>

                {post.image && (
                  <img
                    src={`${API_URL.replace('/api', '')}${post.image}`}
                    alt="Post"
                    className="rounded-lg w-full h-auto object-cover mb-4"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                )}

                <div className="flex space-x-6 text-[#4C8DD8]/80">
                  <button
                    className={`btn btn-ghost btn-sm gap-2 hover:text-[#4C8DD8] ${isLiked ? 'text-[#4C8DD8]' : ''}`}
                    onClick={() => handleLike(post._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {post.likes || 0} {isLiked ? 'Liked' : 'Like'}
                  </button>
                  
                  <button 
                    className="btn btn-ghost btn-sm gap-2 hover:text-[#4C8DD8]"
                    onClick={() => toggleComments(post._id, 'post')}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6" />
                    </svg>
                    {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                  </button>
                  
                  <button 
                    className={`btn btn-ghost btn-sm gap-2 hover:text-[#4C8DD8] ${isSaved ? 'text-[#2E7D32]' : ''}`} 
                    onClick={() => handleSave(post._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${isSaved ? 'fill-current' : 'fill-none'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v14l7-7 7 7V5H5z" />
                    </svg>
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-4 border-t border-[#4C8DD8]/20 pt-4">
                    <h4 className="font-semibold text-[#4C8DD8]">Comments</h4>
                    
                    <div className="mb-4">
                      <textarea
                        className="textarea textarea-bordered w-full border-[#4C8DD8]/20 focus:border-[#4C8DD8]"
                        placeholder="Write a comment..."
                        rows="2"
                        value={newComment[`post-${post._id}`] || ''}
                        onChange={(e) => setNewComment(prev => ({ 
                          ...prev, 
                          [`post-${post._id}`]: e.target.value 
                        }))}
                      />
                      <button
                        className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 text-[#FFFFFF] btn-sm mt-2"
                        onClick={() => submitPostComment(post._id)}
                        disabled={submittingComment[`post-${post._id}`]}
                      >
                        {submittingComment[`post-${post._id}`] ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment._id} className="bg-[#4C8DD8]/5 p-3 rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-[#4C8DD8]">{comment.author}</p>
                                <p className="text-xs text-[#4C8DD8]/60">{new Date(comment.createdAt).toLocaleString()}</p>
                                <p className="mt-2 text-[#4C8DD8]/80">{comment.body}</p>
                                
                                {comment.reply && (
                                  <div className="mt-3 ml-6 bg-[#2E7D32]/10 p-3 rounded border-l-4 border-[#2E7D32]">
                                    <p className="font-semibold text-sm text-[#2E7D32]">{comment.reply.author}</p>
                                    <p className="text-xs text-[#2E7D32]/60">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                                    <p className="mt-1 text-[#2E7D32]/80">{comment.reply.body}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#4C8DD8]/60 text-sm">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-[#4C8DD8]/60 bg-[#FFFFFF] rounded-lg p-6 max-w-4xl mx-auto">
          No posts available.
        </div>
      )}
    </div>
  );
};

export default Home;