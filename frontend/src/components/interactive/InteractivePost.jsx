import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, ChatBubbleOvalLeftIcon, PaperAirplaneIcon, BookmarkIcon, EllipsisHorizontalIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { postAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ProfilePicture from '../profile/ProfilePicture';

const InteractivePost = React.memo(({ post, onPostUpdate }) => {
  const { user } = useAuth();
  const { socket } = useNotifications();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user has liked this post
  useEffect(() => {
    if (post.likes && user) {
      const userLiked = post.likes.some(like =>
        like.userId === user.id || like.user?.id === user.id
      );
      setIsLiked(userLiked);
    }
  }, [post.likes, user]);

  // Close delete menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDeleteMenu && !event.target.closest('.delete-menu-container')) {
        setShowDeleteMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteMenu]);

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      // Call the actual API
      await postAPI.likePost(post.id);

      // Send notification to post owner if it's not the current user's post
      if (newLikedState && post.author?.id !== user.id && socket) {
        socket.emit('likeNotification', {
          postId: post.id,
          postOwnerId: post.author?.id,
          likerName: user.username,
          postImage: post.image
        });
      }

      console.log(`${newLikedState ? 'Liked' : 'Unliked'} post ${post.id}`);
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const newBookmarkedState = !isBookmarked;
      setIsBookmarked(newBookmarkedState);

      // Call the actual API
      await postAPI.bookmarkPost(post.id);
      console.log(`${newBookmarkedState ? 'Bookmarked' : 'Unbookmarked'} post ${post.id}`);
    } catch (error) {
      // Revert on error
      setIsBookmarked(!isBookmarked);
      console.error('Error bookmarking post:', error);
    }
  };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      // Call the actual API
      const response = await postAPI.addComment(post.id, newComment);
      const comment = response.data.comment || {
        id: Date.now(),
        text: newComment,
        author: { username: user.username, id: user.id },
        createdAt: new Date()
      };

      setComments([...comments, comment]);
      setNewComment('');

      // Send notification to post owner if it's not the current user's post
      if (post.author?.id !== user.id && socket) {
        socket.emit('commentNotification', {
          postId: post.id,
          postOwnerId: post.author?.id,
          commenterName: user.username,
          commentText: newComment,
          postImage: post.image
        });
      }

      console.log('Added comment:', newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await postAPI.deletePost(post.id);
      console.log('Delete response:', response.data);

      // Notify parent component to remove this post from the list
      if (onPostUpdate) {
        onPostUpdate(null, 'delete', post.id);
      }

      // Show success message
      console.log('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete post. Please try again.';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author?.username}`}>
            <ProfilePicture user={post.author} size="small" />
          </Link>
          <div>
            <Link to={`/profile/${post.author?.username}`}>
              <p className="font-semibold text-sm hover:text-purple-600 transition-colors">{post.author?.username || 'Unknown User'}</p>
            </Link>
            <p className="text-xs text-gray-500">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Just now'}
            </p>
          </div>
        </div>
        <div className="relative delete-menu-container">
          <button
            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>

          {showDeleteMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={handleImageClick}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>View Image</span>
              </button>
              {post.author?.id === user?.id && (
                <button
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Image */}
      <div className="relative bg-gray-50 w-full h-80 sm:h-96 overflow-hidden">
        {imageLoading && (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        )}
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <p>Image failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={post.image}
            alt="Post"
            className={`w-full h-full object-cover transition-opacity duration-300 cursor-pointer ${imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            onClick={handleImageClick}
            onDoubleClick={handleLike}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        )}
        {/* Double-tap heart animation could go here */}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button onClick={handleLike} className="hover:text-gray-500">
              {isLiked ? (
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:text-gray-500"
            >
              <ChatBubbleOvalLeftIcon className="w-6 h-6" />
            </button>
            <button className="hover:text-gray-500">
              <PaperAirplaneIcon className="w-6 h-6" />
            </button>
          </div>
          <button onClick={handleBookmark} className="hover:text-gray-500">
            {isBookmarked ? (
              <BookmarkSolidIcon className="w-6 h-6" />
            ) : (
              <BookmarkIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm mb-2">
          {likesCount.toLocaleString()} likes
        </p>

        {/* Caption */}
        <div className="mb-2">
          <Link to={`/profile/${post.author?.username}`}>
            <span className="font-semibold text-sm mr-2 hover:text-purple-600 transition-colors">{post.author?.username}</span>
          </Link>
          <span className="text-sm">{post.caption}</span>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4">
            <div className="space-y-2 mb-3">
              {comments.map((comment) => (
                <div key={comment.id || comment._id} className="flex items-start space-x-2">
                  <Link to={`/profile/${comment.author?.username || comment.user?.username}`}>
                    <ProfilePicture
                      user={comment.author || comment.user}
                      size="small"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link to={`/profile/${comment.author?.username || comment.user?.username}`}>
                      <span className="font-semibold text-sm mr-2 hover:text-purple-600 transition-colors">{comment.author?.username || comment.user?.username || 'Unknown'}</span>
                    </Link>
                    <span className="text-sm">{comment.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleComment} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 text-sm border-none outline-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="text-instagram-blue font-semibold text-sm disabled:text-gray-400"
              >
                Post
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          {/* Single close button - top right */}
          <button
            onClick={() => setShowImageModal(false)}
            className="fixed top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-70 rounded-full p-3 border border-gray-600 transition-all duration-200"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={post.image}
              alt="Post"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Close instruction */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              Click outside or press ESC to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InteractivePost;
