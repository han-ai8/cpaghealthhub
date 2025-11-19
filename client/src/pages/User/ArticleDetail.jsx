// User/pages/ArticleDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/api/articles/${id}`);
      setArticle(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load article');
      setLoading(false);
      console.error('Error fetching article:', err);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Health: 'badge-success',
      Technology: 'badge-info',
      Lifestyle: 'badge-secondary',
      News: 'badge-warning',
      Other: 'badge-primary'
    };
    return colors[category] || colors.Other;
  };

  const handleBackToArticles = () => {
    navigate('/user/articles');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error || 'Article not found'}</span>
          </div>
          <div className="text-center mt-6">
            <button className="btn btn-primary gap-2" onClick={handleBackToArticles}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Articles
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button 
          className="btn btn-ghost gap-2 mb-6 hover:bg-white/50"
          onClick={handleBackToArticles}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Articles
        </button>

        {/* Article Card */}
        <article className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Category Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
            <div className="flex flex-wrap gap-3 items-center">
              <span className={`badge ${getCategoryColor(article.category)} badge-lg text-white border-0`}>
                {article.category}
              </span>
              <div className="flex items-center gap-4 text-white text-sm">
                <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-10 md:px-12 md:py-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>
            
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-8 pb-8 border-b-2 border-gray-100">
              <div className="avatar placeholder">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full w-12 h-12">
                  <span className="text-xl font-bold">{article.author.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">By {article.author}</p>
                <p className="text-sm text-gray-500">
                  Last updated: {new Date(article.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-10">
              <p className="text-xl text-gray-700 leading-relaxed font-medium italic">
                {article.excerpt}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-800 leading-loose whitespace-pre-wrap text-justify">
                {article.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="mb-6">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {article.category}
                  </span>
                </div>
                <button 
                  className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleBackToArticles}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Explore More Articles
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default ArticleDetail;