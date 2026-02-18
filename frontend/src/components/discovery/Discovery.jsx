import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  UserPlusIcon,
  HashtagIcon,
  PhotoIcon,
  PlayIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { authAPI, messageAPI, postAPI } from '../../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFollow } from '../../context/FollowContext';

const Discovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleFollow, isFollowing, isProcessing } = useFollow();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Data states
  const [allUsers, setAllUsers] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load users for search
      const usersResponse = await authAPI.getSuggestedUsers();
      const users = usersResponse.data.users || [];
      setAllUsers(users);
      setSuggestedUsers(users.slice(0, 10)); // Top 10 for suggestions

      // Load posts for explore
      const postsResponse = await postAPI.getAllPosts();
      const posts = postsResponse.data.posts || [];
      setExplorePosts(posts); // Show all posts to fill grid completely

      // Load user's following status
      if (user) {
        const followingResponse = await authAPI.getFollowing(user.id);
        const following = followingResponse.data.following || [];
        setFollowingUsers(new Set(following.map(f => f.id)));
      }

      // Generate trending hashtags
      generateTrendingHashtags();
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendingHashtags = () => {
    const hashtags = [
      { tag: '#photography', posts: 2340000, category: 'Creative' },
      { tag: '#travel', posts: 1890000, category: 'Lifestyle' },
      { tag: '#food', posts: 3210000, category: 'Lifestyle' },
      { tag: '#fitness', posts: 1560000, category: 'Health' },
      { tag: '#art', posts: 987000, category: 'Creative' },
      { tag: '#nature', posts: 2100000, category: 'Nature' },
      { tag: '#technology', posts: 876000, category: 'Tech' },
      { tag: '#fashion', posts: 1430000, category: 'Style' },
      { tag: '#music', posts: 1200000, category: 'Entertainment' },
      { tag: '#motivation', posts: 890000, category: 'Inspiration' }
    ];
    setTrendingHashtags(hashtags);
  };

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setSearchResults(filteredUsers);
  }, [searchTerm, allUsers]);

  const handleFollowToggle = async (targetUser) => {
    await toggleFollow(targetUser);
  };

  const handleStartChat = async (targetUser) => {
    try {
      // Send a simple greeting message to start the conversation
      const response = await messageAPI.sendMessage(targetUser.id, `Hi ${targetUser.username}! 👋`);
      if (response.data.success) {
        navigate('/messages');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      // Try to navigate to messages anyway - user can start chat manually
      navigate('/messages');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const PostModal = ({ post, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        <div className="flex-1">
          <img src={post.image || post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
        <div className="w-80 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${post.author?.username || post.user?.username}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {post.author?.username?.charAt(0).toUpperCase() || post.user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </Link>
              <div>
                <Link to={`/profile/${post.author?.username || post.user?.username}`}>
                  <span className="font-semibold hover:text-purple-600 transition-colors">{post.author?.username || post.user?.username}</span>
                </Link>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-sm">{post.caption || post.content}</p>
          </div>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <HeartIcon className="w-6 h-6 cursor-pointer hover:text-red-500 transition-colors" />
                <ChatBubbleOvalLeftIcon className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors" />
              </div>
            </div>
            <p className="text-sm font-semibold">{formatNumber(post.likes?.length || post.likes || 0)} likes</p>
            <p className="text-sm text-gray-500">{post.comments?.length || post.comments || 0} comments</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );

  const UserCard = ({ user, showActions = true }) => {
    const userId = user.id || user._id;
    const userIsFollowing = isFollowing(userId);
    const userIsProcessing = isProcessing(userId);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${user.username}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </Link>
            <div>
              <Link to={`/profile/${user.username}`}>
                <p className="font-semibold text-sm hover:text-purple-600 transition-colors">{user.username}</p>
              </Link>
              <p className="text-xs text-gray-500">{user.followers?.length || 0} followers</p>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStartChat(user)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                title="Send message"
              >
                <ChatBubbleOvalLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFollowToggle(user)}
                disabled={userIsProcessing}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${userIsFollowing
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                  } ${userIsProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {userIsProcessing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : userIsFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600">{user.bio || 'No bio available'}</p>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Discover</h1>
        <p className="text-gray-600">Find new people, posts, and trending content</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users, posts, or hashtags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white border border-transparent focus:border-purple-200 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        {[
          { id: 'discover', label: '🔍 Discover', icon: SparklesIcon },
          { id: 'posts', label: '📸 Posts', icon: PhotoIcon },
          { id: 'users', label: '👥 People', icon: UserPlusIcon },
          { id: 'trending', label: '🔥 Trending', icon: FireIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Search Results */}
      {searchTerm && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && !searchTerm && (
        <div className="space-y-8">
          {/* Suggested Users */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <UserPlusIcon className="w-5 h-5 mr-2 text-purple-600" />
              Suggested for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>

          {/* Trending Posts Preview */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FireIcon className="w-5 h-5 mr-2 text-red-600" />
              Trending Posts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {explorePosts.slice(0, 21).map((post) => (
                <div
                  key={post.id}
                  className="relative aspect-square cursor-pointer group rounded-lg overflow-hidden"
                  onClick={() => setSelectedPost(post)}
                >
                  <img
                    src={post.mediaUrl || post.image || '/placeholder-image.jpg'}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2 text-white">
                      <HeartIcon className="w-4 h-4" />
                      <span className="text-xs">{formatNumber(post.likes?.length || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="grid grid-cols-3 gap-1">
          {explorePosts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square cursor-pointer group"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.mediaUrl || post.image || '/placeholder-image.jpg'}
                alt="Post"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{formatNumber(post.likes?.length || 0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.slice(0, 10).map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <HashtagIcon className="w-5 h-5 mr-2 text-blue-600" />
              Trending Hashtags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingHashtags.map((hashtag, index) => (
                <div key={hashtag.tag} className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">#{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{hashtag.tag}</p>
                    <p className="text-sm text-gray-500">{hashtag.category} • {formatNumber(hashtag.posts)} posts</p>
                  </div>
                  <FireIcon className="w-5 h-5 text-red-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty States */}
      {searchTerm && searchResults.length === 0 && !loading && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No results found for "{searchTerm}"</p>
          <p className="text-gray-400 text-sm">Try searching for something else</p>
        </div>
      )}

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Discovery;
