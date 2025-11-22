import React, { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/api';
import cpag from '../../assets/cpag.jpg';

const Home = () => {
  const location = useLocation();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  
  const postRefs = useRef({});
  
  const generateAnonymousName = (userId) => {
    if (!userId) return 'Anonymous User';
    
    const idStr = userId.toString();
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
  
  const isMyComment = (commentAuthor) => {
    if (!user || !commentAuthor) {
      return false;
    }
    
    if (user.id && commentAuthor.toString() === user.id.toString()) {
      return true;
    }
    
    if (user.username && commentAuthor === user.username) {
      return true;
    }
    
    if (user.name && commentAuthor === user.name) {
      return true;
    }
    
    return false;
  };
  
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

  useEffect(() => {
    if (location.state?.scrollToPost && posts.length > 0) {
      const postId = location.state.scrollToPost;
      
      setTimeout(() => {
        const postElement = postRefs.current[postId];
        if (postElement) {
          postElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          postElement.style.transition = 'background-color 0.3s ease';
          postElement.style.backgroundColor = '#E3F2FD';
          
          setTimeout(() => {
            postElement.style.backgroundColor = 'transparent';
          }, 2000);
          
          toast.success('Scrolled to saved post');
        } else {
          toast.warning('Post not found on current page');
        }
      }, 300);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, posts]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] dark:bg-gray-900 px-4">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-[#4C8DD8] dark:text-blue-400"></div>
          <p className="mt-4 text-[#4C8DD8] dark:text-blue-400 text-sm md:text-base">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] dark:bg-gray-900 px-4">
        <div className="alert alert-error max-w-md bg-[#C62828] dark:bg-red-900 text-[#FFFFFF] text-sm md:text-base">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 md:space-y-6 lg:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Announcement Post */}
      {announcement ? (
        <div className="card bg-[#FFFFFF] dark:bg-gray-800 shadow-lg border border-[#4C8DD8]/20 dark:border-gray-700 w-full max-w-6xl mx-auto">
          <div className="card-body p-4 md:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="card-title text-[#4C8DD8] dark:text-blue-400 font-semibold text-base md:text-lg lg:text-xl">
                ANNOUNCEMENT
              </h3>
              <p className="text-xs md:text-sm text-[#4C8DD8]/60 dark:text-gray-400">
                {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </div>
            <hr className="border-[#4C8DD8]/20 dark:border-gray-700" />
            
            <p className="font-semibold text-[#4C8DD8] dark:text-blue-400 text-sm md:text-base lg:text-lg mt-4">{announcement.title}</p>
            <p className="text-[#4C8DD8]/80 dark:text-gray-300 text-sm md:text-base break-words">{announcement.content}</p>

            {/* ✅ OPTIMIZED ANNOUNCEMENT IMAGE */}
            {announcement.image && (
              <div className="relative w-full my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={getImageUrl(announcement.image)}
                  alt="Announcement"
                  className="w-full h-auto object-contain max-h-[250px] sm:max-h-[300px] md:max-h-[400px] lg:max-h-[500px]"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('hidden');
                  }}
                />
              </div>
            )}

            <hr className="border-[#4C8DD8]/20 dark:border-gray-700" />
            <div className="flex flex-wrap gap-3 md:gap-6 text-[#4C8DD8]/80 dark:text-gray-400 mt-4">
              <button
                className={`btn btn-ghost btn-sm gap-1 md:gap-2 hover:text-[#4C8DD8] dark:hover:text-blue-400 text-xs md:text-sm transition-colors ${
                  likedAnnouncementIds.has(announcement._id) ? 'text-red-500 dark:text-red-400' : ''
                }`}
                onClick={() => handleAnnouncementLike(announcement._id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 md:h-6 md:w-6`}
                  fill={likedAnnouncementIds.has(announcement._id) ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="hidden sm:inline">{announcement.likes || 0} {likedAnnouncementIds.has(announcement._id) ? 'Liked' : 'Like'}</span>
                <span className="sm:hidden">{announcement.likes || 0}</span>
              </button>
              
              <button
                className="btn btn-ghost btn-sm gap-1 md:gap-2 hover:text-[#4C8DD8] dark:hover:text-blue-400 text-xs md:text-sm transition-colors"
                onClick={() => toggleComments(announcement._id, 'announcement')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden sm:inline">{announcementComments.length} Comment{announcementComments.length !== 1 ? 's' : ''}</span>
                <span className="sm:hidden">{announcementComments.length}</span>
              </button>
            </div>

            {showComments[announcement._id] && (
              <div className="mt-4 border-t border-[#4C8DD8]/20 dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-[#4C8DD8] dark:text-blue-400 text-sm md:text-base mb-3">Comments</h4>
                
                <div className="mb-4">
                  <textarea
                    className="textarea textarea-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 text-sm md:text-base"
                    placeholder="Write a comment..."
                    rows="2"
                    value={newComment[`announcement-${announcement._id}`] || ''}
                    onChange={(e) => setNewComment(prev => ({ 
                      ...prev, 
                      [`announcement-${announcement._id}`]: e.target.value 
                    }))}
                  />
                  <button
                    className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 dark:bg-blue-600 dark:hover:bg-blue-700 text-[#FFFFFF] btn-sm mt-2 text-xs md:text-sm"
                    onClick={() => submitAnnouncementComment(announcement._id)}
                    disabled={submittingComment[`announcement-${announcement._id}`]}
                  >
                    {submittingComment[`announcement-${announcement._id}`] ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>

                <div className="space-y-3">
                  {announcementComments.length > 0 ? (
                    announcementComments.map((comment) => {
                      const isMyCommentFlag = isMyComment(comment.author);
                      
                      return (
                        <div 
                          key={comment._id} 
                          className={`p-3 rounded ${
                            isMyCommentFlag 
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600' 
                              : 'bg-[#4C8DD8]/5 dark:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`font-semibold text-xs md:text-sm ${
                                  isMyCommentFlag ? 'text-blue-700 dark:text-blue-300' : 'text-[#4C8DD8] dark:text-blue-400'
                                }`}>
                                  {generateAnonymousName(comment.author)}
                                </p>
                                {isMyCommentFlag && (
                                  <span className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#4C8DD8]/60 dark:text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                              <p className="mt-2 text-[#4C8DD8]/80 dark:text-gray-300 text-sm md:text-base break-words">{comment.body}</p>
                              
                              {comment.reply && (
                                <div className="mt-3 ml-3 md:ml-6 bg-[#2E7D32]/10 dark:bg-green-900/20 p-3 rounded border-l-4 border-[#2E7D32] dark:border-green-600">
                                  <p className="font-semibold text-xs md:text-sm text-[#2E7D32] dark:text-green-400">{comment.reply.author}</p>
                                  <p className="text-xs text-[#2E7D32]/60 dark:text-green-500/60">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                                  <p className="mt-1 text-[#2E7D32]/80 dark:text-green-300 text-sm md:text-base break-words">{comment.reply.body}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[#4C8DD8]/60 dark:text-gray-400 text-xs md:text-sm">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-[#4C8DD8]/60 dark:text-gray-400 bg-[#FFFFFF] dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto text-sm md:text-base">
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
            <div 
              key={post._id} 
              ref={(el) => postRefs.current[post._id] = el}
              className="card bg-[#FFFFFF] dark:bg-gray-800 shadow-lg border border-[#4C8DD8]/20 dark:border-gray-700 w-full max-w-6xl mx-auto"
            >
              <div className="card-body p-4 md:p-6 lg:p-8">
                <div className="flex items-center mb-4">
                  <div className="avatar">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#C62828] flex justify-center items-center text-[#FFFFFF] font-bold">
                      <img
                        src={cpag}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-semibold text-[#4C8DD8] dark:text-blue-400 text-xs md:text-sm lg:text-base break-words">Cavite Positive Action Group The JCH Advocacy Inc.</p>
                    <p className="text-xs text-blue-500 dark:text-blue-400">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <p className="mb-4 text-[#4C8DD8]/80 dark:text-gray-300 text-sm md:text-base break-words">{post.content}</p>

                {/* ✅ OPTIMIZED POST IMAGE */}
                {post.image && (
                  <div className="relative w-full mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={getImageUrl(post.image)}
                      alt="Post"
                      className="w-full h-auto object-contain max-h-[250px] sm:max-h-[300px] md:max-h-[400px] lg:max-h-[500px]"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('hidden');
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3 md:gap-6 text-[#4C8DD8]/80 dark:text-gray-400">
                  <button
                    className={`btn btn-ghost btn-sm gap-1 md:gap-2 hover:text-[#4C8DD8] dark:hover:text-blue-400 text-xs md:text-sm transition-colors ${isLiked ? 'text-red-500 dark:text-red-400' : ''}`}
                    onClick={() => handleLike(post._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 md:h-6 md:w-6`}
                      fill={isLiked ? 'currentColor' : 'none'}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden sm:inline">{post.likes || 0} {isLiked ? 'Liked' : 'Like'}</span>
                    <span className="sm:hidden">{post.likes || 0}</span>
                  </button>
                  
                  <button 
                    className="btn btn-ghost btn-sm gap-1 md:gap-2 hover:text-[#4C8DD8] dark:hover:text-blue-400 text-xs md:text-sm transition-colors"
                    onClick={() => toggleComments(post._id, 'post')}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 md:h-6 md:w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="hidden sm:inline">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</span>
                    <span className="sm:hidden">{comments.length}</span>
                  </button>
                  
                  <button 
                    className={`btn btn-ghost btn-sm gap-1 md:gap-2 hover:text-[#4C8DD8] dark:hover:text-blue-400 text-xs md:text-sm transition-colors ${isSaved ? 'text-[#2E7D32] dark:text-green-400' : ''}`} 
                    onClick={() => handleSave(post._id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 md:h-6 md:w-6 ${isSaved ? 'fill-current' : 'fill-none'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5v14l7-7 7 7V5H5z" />
                    </svg>
                    <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    <span className="sm:hidden">{isSaved ? '✓' : 'Save'}</span>
                  </button>
                </div>

                {showComments[post._id] && (
                  <div className="mt-4 border-t border-[#4C8DD8]/20 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-[#4C8DD8] dark:text-blue-400 text-sm md:text-base mb-3">Comments</h4>
                    
                    <div className="mb-4">
                      <textarea
                        className="textarea textarea-bordered w-full border-[#4C8DD8]/20 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-[#4C8DD8] dark:focus:border-blue-400 text-sm md:text-base"
                        placeholder="Write a comment..."
                        rows="2"
                        value={newComment[`post-${post._id}`] || ''}
                        onChange={(e) => setNewComment(prev => ({ 
                          ...prev, 
                          [`post-${post._id}`]: e.target.value 
                        }))}
                      />
                      <button
                        className="btn btn-primary bg-[#4C8DD8] hover:bg-[#4C8DD8]/90 dark:bg-blue-600 dark:hover:bg-blue-700 text-[#FFFFFF] btn-sm mt-2 text-xs md:text-sm"
                        onClick={() => submitPostComment(post._id)}
                        disabled={submittingComment[`post-${post._id}`]}
                      >
                        {submittingComment[`post-${post._id}`] ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {comments.length > 0 ? (
                        comments.map((comment) => {
                          const isMyCommentFlag = isMyComment(comment.author);
                          
                          return (
                            <div 
                              key={comment._id} 
                              className={`p-3 rounded ${
                                isMyCommentFlag 
                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600' 
                                  : 'bg-[#4C8DD8]/5 dark:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className={`font-semibold text-xs md:text-sm ${
                                      isMyCommentFlag ? 'text-blue-700 dark:text-blue-300' : 'text-[#4C8DD8] dark:text-blue-400'
                                    }`}>
                                      {generateAnonymousName(comment.author)}
                                    </p>
                                    {isMyCommentFlag && (
                                      <span className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#4C8DD8]/60 dark:text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                                  <p className="mt-2 text-[#4C8DD8]/80 dark:text-gray-300 text-sm md:text-base break-words">{comment.body}</p>
                                  
                                  {comment.reply && (
                                    <div className="mt-3 ml-3 md:ml-6 bg-[#2E7D32]/10 dark:bg-green-900/20 p-3 rounded border-l-4 border-[#2E7D32] dark:border-green-600">
                                      <p className="font-semibold text-xs md:text-sm text-[#2E7D32] dark:text-green-400">{comment.reply.author}</p>
                                      <p className="text-xs text-[#2E7D32]/60 dark:text-green-500/60">{new Date(comment.reply.createdAt).toLocaleString()}</p>
                                      <p className="mt-1 text-[#2E7D32]/80 dark:text-green-300 text-sm md:text-base break-words">{comment.reply.body}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[#4C8DD8]/60 dark:text-gray-400 text-xs md:text-sm">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-[#4C8DD8]/60 dark:text-gray-400 bg-[#FFFFFF] dark:bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto text-sm md:text-base">
          No posts available.
        </div>
      )}
    </div>
  );
};

export default Home;