// src/components/PostCard.jsx - Post Card Component with Image Fix
import React, { useState } from 'react';
import { getPostImageUrl, isValidImageUrl } from '../utils/imageHelper';

const PostCard = ({ post, onLike, onComment, currentUserId }) => {
  const [imageError, setImageError] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const hasValidImage = post.image && isValidImageUrl(post.image);
  const imageUrl = hasValidImage ? getPostImageUrl(post.image) : null;

  const handleImageError = () => {
    console.error('Failed to load image:', imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', imageUrl);
  };

  const isLikedByUser = post.likes?.some(like => 
    like._id === currentUserId || like === currentUserId
  );

  const handleLike = () => {
    if (onLike) {
      onLike(post._id);
    }
  };

  const handleComment = () => {
    if (onComment && commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          {post.author?.username?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="ml-3">
          <p className="font-semibold text-gray-800">
            {post.author?.username || 'Anonymous'}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Post Image - FIXED */}
      {hasValidImage && !imageError && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt="Post content"
            className="w-full h-auto object-cover max-h-96"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        </div>
      )}

      {/* Show error message if image failed to load */}
      {hasValidImage && imageError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-red-600 text-sm">
            Unable to load image
          </p>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-6">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 ${
              isLikedByUser ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            } transition-colors`}
          >
            <svg 
              className="w-6 h-6" 
              fill={isLikedByUser ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm font-medium">
              {post.likes?.length || 0}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">
              {post.comments?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {/* Existing Comments */}
          <div className="space-y-3 mb-4">
            {post.comments?.slice(0, 3).map((comment) => (
              <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {comment.author?.username?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {comment.author?.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-700 break-words">
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {post.comments?.length > 3 && (
              <p className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">
                View all {post.comments.length} comments
              </p>
            )}
          </div>

          {/* Add Comment */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;