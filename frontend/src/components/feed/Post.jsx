import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { postAPI } from '../../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useFollow } from '../../context/FollowContext';
import PostReactions from '../reactions/PostReactions';
import { Clock, MapPin, MoreHorizontal, Send, MessageCircle } from 'lucide-react';

const Post = ({ post, onPostUpdate }) => {
  const { user } = useAuth();
  const { socket } = useNotifications();
  const { toggleFollow, isFollowing, isProcessing } = useFollow();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if current user has liked this post
  useEffect(() => {
    if (post.likes && user) {
      const userLiked = post.likes.some(like =>
        like.id === user.id || like._id === user.id || like === user.id
      );
      setLiked(userLiked);
    }
  }, [post.likes, user]);

  const handleLike = async () => {
    try {
      if (liked) {
        await postAPI.dislikePost(post.id || post._id);
        setLikesCount(prev => prev - 1);
      } else {
        await postAPI.likePost(post.id || post._id);
        setLikesCount(prev => prev + 1);

        // Send notification to post owner if it's not the current user's post
        if (post.author?.id !== user.id && socket) {
          socket.emit('likeNotification', {
            postId: post.id || post._id,
            postOwnerId: post.author?.id,
            likerName: user.username,
            postImage: post.image
          });
        }
      }
      setLiked(!liked);

      // Update parent component if callback provided
      if (onPostUpdate) {
        onPostUpdate({
          ...post,
          likes: liked
            ? post.likes?.filter(like => like !== user.id)
            : [...(post.likes || []), user.id]
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await postAPI.addComment(post.id || post._id, comment);
      const newComment = response.data.comment || {
        id: Date.now(),
        text: comment,
        author: { username: user.username, id: user.id },
        createdAt: new Date()
      };
      setComments([...comments, newComment]);
      setComment('');

      // Send notification to post owner if it's not the current user's post
      if (post.author?.id !== user.id && socket) {
        socket.emit('commentNotification', {
          postId: post.id || post._id,
          postOwnerId: post.author?.id,
          commenterName: user.username,
          commentText: comment,
          postImage: post.image
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <Link to={`/profile/${post.author.username}`}>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {post.author.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </Link>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${post.author.username}`}>
                <h3 className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors">
                  {post.author.username}
                </h3>
              </Link>
              <span className="text-blue-600 text-sm">•</span>
              {post.author.id !== user?.id && (
                <button
                  onClick={() => toggleFollow(post.author)}
                  disabled={isProcessing(post.author.id || post.author._id)}
                  className={`text-sm font-medium transition-colors ${isFollowing(post.author.id || post.author._id)
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-blue-600 hover:text-blue-700'
                    }`}
                >
                  {isProcessing(post.author.id || post.author._id)
                    ? '...'
                    : isFollowing(post.author.id || post.author._id) ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <MapPin className="w-3 h-3" />
                <span>New York</span>
              </div>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      {post.caption && (
        <div className="px-6 pb-4">
          <p className="text-gray-800 leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* Post Image */}
      {post.image && (
        <div className="relative group bg-gray-50 w-full h-80 sm:h-96 overflow-hidden">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
        </div>
      )}

      {/* Post Actions */}
      <div className="p-6 border-t border-gray-50">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
            >
              {liked ? (
                <HeartIconSolid className="h-6 w-6 animate-pulse" />
              ) : (
                <HeartIcon className="h-6 w-6" />
              )}
              <span className="font-medium text-sm">{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="font-medium text-sm">{comments.length}</span>
            </button>

            <button className="text-gray-600 hover:text-green-500 transition-colors">
              <Send className="h-6 w-6" />
            </button>
          </div>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`transition-colors ${isBookmarked ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-500'
              }`}
          >
            <BookmarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Post Reactions */}
        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
          <PostReactions
            postId={post.id}
            initialReactions={post.reactions || []}
            onReactionUpdate={(reactions, userReaction) => {
              if (onPostUpdate) {
                onPostUpdate({ ...post, reactions });
              }
            }}
          />
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {!showComments && comments.length > 2 ? (
              <button
                onClick={() => setShowComments(true)}
                className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
              >
                View all {comments.length} comments
              </button>
            ) : null}

            {(showComments ? comments : comments.slice(-2)).map((comment, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Link to={`/profile/${comment.author?.username}`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {comment.author?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
                <div className="flex-1 bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link to={`/profile/${comment.author?.username}`}>
                      <span className="font-semibold text-sm text-gray-900 hover:text-purple-600 transition-colors">
                        {comment.author?.username}
                      </span>
                    </Link>
                    <span className="text-xs text-gray-500">2m</span>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <form onSubmit={handleComment} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">Y</span>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
            />
            {comment.trim() && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 text-white rounded-full p-2 hover:bg-purple-600 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            )}
          </div>
        </form>
      </div>
    </article>
  );
};

export default Post;