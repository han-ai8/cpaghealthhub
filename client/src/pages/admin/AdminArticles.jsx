// Admin/pages/AdminArticles.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Health',
    author: '',
    published: true
  });

  // Fetch all articles
  const fetchArticles = async () => {
    try {
      const response = await axios.get('/api/articles/admin/all');
      setArticles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for create
  const handleCreate = () => {
    setEditMode(false);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'Health',
      author: '',
      published: true
    });
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (article) => {
    setEditMode(true);
    setCurrentArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      category: article.category,
      author: article.author,
      published: article.published
    });
    setShowModal(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/api/articles/admin/update/${currentArticle._id}`, formData);
        alert('✅ Article updated successfully!');
      } else {
        await axios.post('/api/articles/admin/create', formData);
        alert('✅ Article created successfully!');
      }
      setShowModal(false);
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      alert('❌ Error saving article!');
    }
  };

  // Delete article
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await axios.delete(`/api/articles/admin/delete/${id}`);
        alert('✅ Article deleted successfully!');
        fetchArticles();
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('❌ Error deleting article!');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-base-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">Manage Articles</h1>
            <p className="text-gray-600">Create, edit, and manage your articles</p>
          </div>
          <button className="btn btn-primary gap-2 shadow-lg" onClick={handleCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Article
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="stats shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="stat">
            <div className="stat-title text-blue-100">Total Articles</div>
            <div className="stat-value">{articles.length}</div>
            <div className="stat-desc text-blue-100">All time</div>
            </div>
        </div>
        <div className="stats shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="stat">
            <div className="stat-title text-green-100">Published</div>
            <div className="stat-value">{articles.filter(a => a.published).length}</div>
            <div className="stat-desc text-green-100">Live articles</div>
            </div>
        </div>
        </div>

        {/* Articles Table */}
        <div className="bg-base-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-300">
                <tr>
                    <th className="text-base">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Article
                    </div>
                    </th>
                    <th className="text-base">Category</th>
                    <th className="text-base">Author</th>
                    <th className="text-base">Status</th>
                    <th className="text-base">Created</th>
                    <th className="text-base">Actions</th>
                </tr>
                </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12"> {/* Updated colSpan to 6 since Views column removed */}
                      <div className="flex flex-col items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg text-gray-500">No articles yet</p>
                        <button className="btn btn-sm btn-primary" onClick={handleCreate}>
                          Create your first article
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article._id} className="hover">
                        <td>
                        <div className="font-bold text-base mb-1">{article.title}</div>
                        <div className="text-sm opacity-70 line-clamp-2 max-w-md">
                            {article.excerpt}
                        </div>
                        </td>
                        <td>
                        <span className="badge badge-primary badge-lg">{article.category}</span>
                        </td>
                        <td>
                        <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span className="text-xs">{article.author.charAt(0).toUpperCase()}</span>
                            </div>
                            </div>
                            <span className="font-medium">{article.author}</span>
                        </div>
                        </td>
                        <td>
                        {article.published ? (
                            <div className="badge badge-success gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Published
                            </div>
                        ) : (
                            <div className="badge badge-warning gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Draft
                            </div>
                        )}
                        </td>
                        <td className="text-sm">
                        {new Date(article.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                        </td>
                        <td>
                        <div className="flex gap-2">
                            <button
                            className="btn btn-sm btn-info gap-1"
                            onClick={() => handleEdit(article)}
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                            </button>
                            <button
                            className="btn btn-sm btn-error gap-1"
                            onClick={() => handleDelete(article._id)}
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Create/Edit */}
        {showModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-2xl flex items-center gap-2">
                  {editMode ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Article
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Article
                    </>
                  )}
                </h3>
                <button 
                  className="btn btn-sm btn-circle btn-ghost" 
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Article Title</span>
                      <span className="label-text-alt text-error">*Required</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="input input-bordered input-lg"
                      placeholder="Enter an engaging title..."
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Short Description (Excerpt)</span>
                      <span className="label-text-alt">
                        {formData.excerpt.length}/200
                      </span>
                    </label>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleChange}
                      className="textarea textarea-bordered h-20"
                      placeholder="Write a brief summary that will appear in the article list..."
                      maxLength="200"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Full Content</span>
                      <span className="label-text-alt text-error">*Required</span>
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      className="textarea textarea-bordered h-64"
                      placeholder="Write your full article content here..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Category</span>
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="select select-bordered select-lg"
                      >
                        <option value="Health">🏥 Health</option>
                        <option value="Technology">💻 Technology</option>
                        <option value="Lifestyle">🌟 Lifestyle</option>
                        <option value="News">📰 News</option>
                        <option value="Other">📌 Other</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Author Name</span>
                        <span className="label-text-alt text-error">*Required</span>
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                        className="input input-bordered input-lg"
                        placeholder="Your name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 bg-base-200 p-4 rounded-lg">
                      <input
                        type="checkbox"
                        name="published"
                        checked={formData.published}
                        onChange={handleChange}
                        className="checkbox checkbox-primary"
                      />
                      <div>
                        <span className="label-text font-semibold text-base">Publish this article immediately</span>
                        <p className="text-sm opacity-70">Users will be able to see this article right away</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="modal-action mt-6">
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary gap-2">
                    {editMode ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Update Article
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Article
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArticles;