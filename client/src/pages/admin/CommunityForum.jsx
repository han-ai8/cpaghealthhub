import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  User,
  CheckCircle,
  XCircle,
  Trash2,
  Flag,
  MessageCircle,
  AlertTriangle,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from "lucide-react";
import axios from "axios";

/**
 * CommunityForum.upgraded.jsx
 * Upgraded admin UI/UX (mobile responsive)
 * Color theory: white, blue, green, red
 *
 * Notes:
 * - Uses Tailwind utility classes (assumes tailwind is available)
 * - Keeps original API endpoints and business logic
 * - Accessible toasts and modals (Escape to close)
 */

const cn = (...args) => args.filter(Boolean).join(" ");

const generateAnonymousName = (userId) => {
  if (!userId) return "Anonymous User";
  const idStr = userId.toString();
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const absHash = Math.abs(hash);
  const uniqueNumber = (absHash % 90000) + 10000;
  return `Anonymous #${uniqueNumber}`;
};

const formatTimestamp = (date) => {
  if (!date) return "Unknown";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
};

/* ---------------- UI components ---------------- */

const StatCard = ({ bg, value, label, icon }) => (
  <div
    className={cn(
      "rounded-2xl p-4 flex items-center gap-4 shadow-sm border",
      "min-h-[88px] sm:min-h-[96px]",
      bg
    )}
  >
    <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center shadow-inner">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-lg font-semibold text-gray-900 truncate">{value}</div>
      <div className="text-xs text-gray-600 truncate">{label}</div>
    </div>
  </div>
);

const Toast = ({ toasts, onClose }) => {
  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "px-4 py-2 rounded-md shadow-md flex items-start gap-3 max-w-sm",
            t.type === "error" ? "bg-red-50 border border-red-200" : "bg-white border"
          )}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === "error" ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800 truncate">{t.message}</div>
            {t.sub && <div className="text-xs text-gray-500 mt-0.5 truncate">{t.sub}</div>}
          </div>
          <button
            onClick={() => onClose(t.id)}
            className="text-gray-400 hover:text-gray-700 text-sm"
            aria-label="Close toast"
          >
            Close
          </button>
        </div>
      ))}
    </div>
  );
};

const Modal = ({ open, title, children, onClose, actions }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // lock scroll
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = orig;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 z-50">
        <div className="flex items-center justify-between mb-4">
          <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">{children}</div>
        {actions && <div className="mt-6 flex gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  );
};

const SkeletonPost = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-3/5 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
      </div>
    </div>
    <div className="h-3 bg-gray-200 rounded mb-2" />
    <div className="h-3 bg-gray-200 rounded w-4/5 mb-2" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
  </div>
);

/* ---------------- Main Component ---------------- */

const CommunityForum = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [posts, setPosts] = useState({
    pendingPosts: [],
    approvedPosts: [],
    rejectedPosts: [],
    reportedPosts: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const pushToast = useCallback((message, type = "success", sub = "") => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast = { id, message, type, sub };
    setToasts((s) => [...s, newToast]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = (id) => setToasts((s) => s.filter((t) => t.id !== id));

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/admin/community/posts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error("Fetch admin posts error:", error);
      pushToast("Failed to fetch posts", "error", error?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (postId, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/admin/community/posts/${postId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      pushToast(`Post ${status}`);
      await fetchPosts();
    } catch (error) {
      console.error("Update post status error:", error);
      pushToast("Failed to update post", "error", error?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setConfirmAction({ type: "delete_post", payload: { postId } });
  };

  const confirmDeletePost = async (postId) => {
    setConfirmAction(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      pushToast("Post deleted successfully");
      await fetchPosts();
    } catch (error) {
      console.error("Delete post error:", error);
      pushToast("Failed to delete post", "error", error?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = (postId, reportId, action) => {
    setConfirmAction({ type: "report_action", payload: { postId, reportId, action } });
  };

  const confirmReportAction = async ({ postId, reportId, action }) => {
    setConfirmAction(null);
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      // ✅ Updated: Three different actions
      if (action === "delete") {
        // Delete the post entirely
        await axios.put(
          `/api/admin/community/posts/${postId}/reports/${reportId}`,
          { status: "resolved", deletePost: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        pushToast("Post deleted successfully");
      } else if (action === "reject_post") {
        // Reject the post (move to rejected status)
        await axios.put(
          `/api/admin/community/posts/${postId}/reports/${reportId}`,
          { status: "resolved", deletePost: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        pushToast("Post rejected successfully");
      } else {
        // Reject the report (keep post as is)
        await axios.put(
          `/api/admin/community/posts/${postId}/reports/${reportId}`,
          { status: "rejected", deletePost: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        pushToast("Report dismissed - Post kept");
      }
      
      await fetchPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error("Handle report error:", error);
      pushToast("Failed to process report", "error", error?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = (postId, commentId) => {
    setConfirmAction({ type: "delete_comment", payload: { postId, commentId } });
  };

  const confirmDeleteComment = async ({ postId, commentId }) => {
    setConfirmAction(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/community/posts/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      pushToast("Comment deleted successfully");
      await fetchPosts();
    } catch (error) {
      console.error("Delete comment error:", error);
      pushToast("Failed to delete comment", "error", error?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (post) => {
    const base = "px-3 py-1 rounded-full text-xs font-medium";
    if (post.status === "approved") return <span className={`${base} bg-green-100 text-green-800`}>APPROVED</span>;
    if (post.status === "rejected") return <span className={`${base} bg-red-100 text-red-800`}>REJECTED</span>;
    return <span className={`${base} bg-blue-50 text-blue-800`}>{(post.status || "PENDING").toUpperCase()}</span>;
  };

  const currentRaw = posts[`${activeTab}Posts`] || [];
  const filtered = useMemo(() => {
    if (!debouncedQuery) return currentRaw;
    const q = debouncedQuery.toLowerCase();
    return currentRaw.filter((p) => {
      return (
        (p.content || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.author?.name || "").toLowerCase().includes(q)
      );
    });
  }, [currentRaw, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [activeTab, debouncedQuery]);

  /* Post card component */
  const PostCard = ({ post, showActions = true }) => {
    return (
      <article
        className="bg-white rounded-xl shadow-sm p-5 mb-4 border"
        aria-labelledby={`post-${post._id}`}
        role="article"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p id={`post-${post._id}`} className="font-semibold text-gray-900 truncate">
                  {generateAnonymousName(post.author?._id || post.author)}
                </p>
                <span className="text-xs text-gray-500">{formatTimestamp(post.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1 truncate">
                Real User: {post.author?.name || post.author?.email || "Unknown User"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              {post.category || "General"}
            </span>
            {statusBadge(post)}
          </div>
        </div>

        <div className="mt-4 text-gray-800 leading-relaxed whitespace-pre-wrap mb-4 break-words">{post.content}</div>

        {post.comments?.length > 0 && (
          <section className="border-t pt-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                <MessageCircle className="w-4 h-4" />
                {post.comments.length} Comment{post.comments.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-2">
              {post.comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{generateAnonymousName(comment.author)}</p>
                    <p className="text-sm text-gray-700 truncate">{comment.body}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(comment.createdAt)}</p>

                    {comment.replies?.length > 0 && (
                      <div className="ml-3 mt-2 space-y-2">
                        {comment.replies.map((r, idx) => (
                          <div key={idx} className="bg-white rounded p-2">
                            <p className="font-semibold text-xs">{generateAnonymousName(r.author)}</p>
                            <p className="text-xs text-gray-700">{r.body}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatTimestamp(r.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteComment(post._id, comment._id)}
                    className="text-red-600 hover:text-red-800 ml-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-red-200"
                    title="Delete comment"
                    aria-label={`Delete comment ${comment._id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "reported" && post.reports?.length > 0 && (
          <div className="border-t pt-4 mb-4">
            <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Reports
            </p>

            <div className="space-y-2">
              {post.reports.filter((r) => r.status === "pending").map((report) => (
                <div key={report._id} className="bg-red-50 rounded p-3">
                  <p className="text-sm text-gray-700"><strong>Reason:</strong> {report.reason}</p>
                  <p className="text-xs text-gray-600">Reported by: {report.reportedBy?.name || "Unknown"}</p>
                  <p className="text-xs text-gray-500">{formatTimestamp(report.createdAt)}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleReportAction(post._id, report._id, "delete")}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                      aria-label="Delete post permanently"
                    >
                      Delete Post
                    </button>
                    <button
                      onClick={() => handleReportAction(post._id, report._id, "reject_post")}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs"
                      aria-label="Reject post"
                    >
                      Reject Post
                    </button>
                    <button
                      onClick={() => handleReportAction(post._id, report._id, "reject_report")}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
                      aria-label="Dismiss report"
                    >
                      Dismiss Report
                    </button>
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="ml-auto text-sm text-blue-700 hover:underline flex items-center gap-2"
                      aria-label="View report details"
                    >
                      <ZoomIn className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {post.status === "pending" && showActions && (
            <>
              <button
                onClick={() => handleApproveReject(post._id, "approved")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
                aria-label="Approve post"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleApproveReject(post._id, "rejected")}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
                aria-label="Reject post"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          <button
            onClick={() => handleDeletePost(post._id)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md ml-auto focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Delete post"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </article>
    );
  };

  /* Render */
  return (
    <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900">Community Forum Management</h2>
            <p className="text-sm text-gray-600 mt-1">Moderate posts, resolve reports, and manage comments.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, author, or category..."
                className="w-full border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                aria-label="Search posts"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
            </div>

            <div className="sm:hidden flex gap-2">
              {/* Mobile quick actions */}
              <button
                onClick={() => { setQuery(""); fetchPosts(); }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                aria-label="Refresh posts"
              >
                Refresh
              </button>
              <button
                onClick={() => { setQuery(""); setActiveTab("pending"); }}
                className="px-3 py-2 bg-white border rounded-md text-sm"
                aria-label="Reset filters"
              >
                Reset
              </button>
            </div>

            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => { setQuery(""); fetchPosts(); }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                aria-label="Refresh posts"
              >
                Refresh
              </button>
              <button
                onClick={() => { setQuery(""); setActiveTab("pending"); }}
                className="px-3 py-2 bg-white border rounded-md text-sm"
                aria-label="Reset filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            bg="bg-blue-50"
            value={posts.pendingPosts?.length || 0}
            label="Pending Posts"
            icon={<Loader2 className="w-5 h-5 text-blue-700" />}
          />
          <StatCard
            bg="bg-green-50"
            value={posts.approvedPosts?.length || 0}
            label="Approved Posts"
            icon={<CheckCircle className="w-5 h-5 text-green-700" />}
          />
          <StatCard
            bg="bg-red-50"
            value={posts.reportedPosts?.length || 0}
            label="Reported Posts"
            icon={<Flag className="w-5 h-5 text-red-700" />}
          />
          <StatCard
            bg="bg-white"
            value={posts.rejectedPosts?.length || 0}
            label="Rejected Posts"
            icon={<XCircle className="w-5 h-5 text-red-600" />}
          />
        </div>

        <div className="mb-4">
          <div className="flex overflow-auto gap-2 border-b pb-2 -mx-4 px-4">
            {['pending', 'approved', 'reported', 'rejected'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap",
                  activeTab === t
                    ? "bg-white border-t border-l border-r border-blue-600 text-blue-700 -mb-[1px]"
                    : "text-gray-600 hover:text-gray-900 bg-transparent"
                )}
                aria-pressed={activeTab === t}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (<SkeletonPost key={i} />))}
            </div>
          ) : (
            <>
              {visible.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-600">No {activeTab} posts</p>
                </div>
              ) : (
                visible.map((post) => (
                  <PostCard key={post._id} post={post} showActions={activeTab !== "approved"} />
                ))
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-md border disabled:opacity-50"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="hidden sm:flex items-center gap-2 px-3">
                    {/* show page buttons for wider screens up to few pages */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={cn(
                          "px-2 py-1 rounded",
                          n === page ? "bg-blue-600 text-white" : "bg-white border text-gray-700"
                        )}
                        aria-current={n === page ? "page" : undefined}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="text-sm px-3">
                    {page} / {totalPages}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-md border disabled:opacity-50"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected post modal */}
      <Modal
        open={!!selectedPost}
        title={selectedPost ? "Post details" : ""}
        onClose={() => setSelectedPost(null)}
        actions={<button onClick={() => setSelectedPost(null)} className="px-3 py-2 rounded-md bg-blue-600 text-white">Close</button>}
      >
        {selectedPost && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{generateAnonymousName(selectedPost.author?._id)}</div>
                <div className="text-xs text-gray-500">{formatTimestamp(selectedPost.createdAt)}</div>
                <div className="text-xs text-gray-600">Real User: {selectedPost.author?.name || "Unknown"}</div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Reports</p>
              {selectedPost.reports?.length ? (
                <div className="space-y-2">
                  {selectedPost.reports.map((r) => (
                    <div key={r._id} className="bg-red-50 p-3 rounded">
                      <p className="text-sm"><strong>Reason:</strong> {r.reason}</p>
                      <p className="text-xs text-gray-500">By: {r.reportedBy?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No reports</div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Confirm modal */}
      <Modal
        open={!!confirmAction}
        title={confirmAction ? "Confirm action" : ""}
        onClose={() => setConfirmAction(null)}
        actions={(
          <>
            <button onClick={() => setConfirmAction(null)} className="px-3 py-2 rounded-md border">Cancel</button>

            {confirmAction?.type === "delete_post" && (
              <button onClick={() => confirmDeletePost(confirmAction.payload.postId)} className="px-3 py-2 rounded-md bg-red-600 text-white">Delete Post</button>
            )}

            {confirmAction?.type === "delete_comment" && (
              <button onClick={() => confirmDeleteComment(confirmAction.payload)} className="px-3 py-2 rounded-md bg-red-600 text-white">Delete Comment</button>
            )}

            {confirmAction?.type === "report_action" && (
              <button onClick={() => confirmReportAction(confirmAction.payload)} className="px-3 py-2 rounded-md bg-red-600 text-white">Confirm</button>
            )}
          </>
        )}
      >
        {confirmAction?.type === "delete_post" && (<p>Are you sure you want to permanently delete this post?</p>)}
        {confirmAction?.type === "delete_comment" && (<p>Are you sure you want to delete this comment?</p>)}
        {confirmAction?.type === "report_action" && (
          <p>
            {confirmAction.payload.action === "delete" 
              ? "Are you sure you want to permanently delete this post?"
              : confirmAction.payload.action === "reject_post"
              ? "Are you sure you want to reject this post? It will be moved to the Rejected tab."
              : "Are you sure you want to dismiss this report? The post will remain active."}
          </p>
        )}
      </Modal>

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default CommunityForum;